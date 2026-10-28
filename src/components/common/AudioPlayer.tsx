import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Trash2,
  Mic,
  Music,
} from 'lucide-react';
import { formatDuration } from '../../utils/audioRecorder';
import { toPersianDigits } from '../../utils/formatters';
import { VoiceRecordingData } from '../../types';

interface AudioPlayerProps {
  src?: string;
  recording?: VoiceRecordingData | null;
  duration?: number;
  title?: string;
  subtitle?: string;
  onDelete?: () => void;
  showDownload?: boolean;
  compact?: boolean;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src: rawSrc = '',
  recording,
  duration: initialDuration,
  title = 'پیام صوتی ضبط شده',
  subtitle,
  onDelete,
  showDownload = true,
  compact = false,
  className = '',
}) => {
  const src = recording?.dataUrl || rawSrc;
  const initialDur = recording?.duration || initialDuration;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDur || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [playbackError, setPlaybackError] = useState(false);

  useEffect(() => {
    if (initialDur && initialDur > 0) {
      setDuration(initialDur);
    }
  }, [initialDur]);

  // Sync audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
      setPlaybackError(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setHasEnded(true);
      setCurrentTime(0);
    };

    const handleError = () => {
      setPlaybackError(true);
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setPlaybackError(false);
      setHasEnded(false);
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error('Playback failed', err);
          setPlaybackError(true);
          setIsPlaying(false);
        });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = Number(e.target.value);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleDownload = () => {
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = `yadman-voice-message-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2.5 bg-[#FAF8F5] border border-[#EAE6DF] px-3 py-1.5 rounded-xl text-xs text-[#0F4C3A] font-medium shadow-2xs ${className}`}
        dir="rtl"
      >
        <audio ref={audioRef} src={src} preload="metadata" />
        <button
          type="button"
          onClick={togglePlay}
          className="w-7 h-7 rounded-lg bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white flex items-center justify-center transition shrink-0 shadow-xs"
          title={isPlaying ? 'توقف' : 'پخش'}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>

        {/* Wave indicator / Progress */}
        <div className="flex-1 flex flex-col justify-center min-w-[100px] gap-1">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-[#E0D8C8] rounded-lg appearance-none cursor-pointer accent-[#0F4C3A]"
          />
          <div className="flex items-center justify-between text-[10px] text-[#6A7873] font-mono leading-none">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 p-1 rounded-md transition hover:bg-red-50"
            title="حذف فایل صوتی"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`bg-gradient-to-br from-[#FAF8F5] to-[#F4EFE6] border border-[#D4AF37]/40 p-3.5 sm:p-4 rounded-2xl shadow-sm text-right space-y-3 ${className}`}
      dir="rtl"
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Header Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#0F4C3A] text-[#D4AF37] flex items-center justify-center shrink-0 shadow-xs">
            <Mic className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-xs text-[#0F4C3A] truncate">{title}</h4>
            {subtitle && (
              <p className="text-[10px] text-[#6A7873] truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Live Audio Visualizer Bars when playing */}
        <div className="flex items-center gap-0.5 px-2 py-1 bg-white/70 rounded-lg border border-[#EAE6DF] shrink-0">
          {[40, 75, 55, 90, 60, 80, 45, 70].map((h, i) => (
            <span
              key={i}
              className={`w-0.75 bg-[#0F4C3A] rounded-full transition-all duration-200 ${
                isPlaying
                  ? 'animate-pulse'
                  : 'opacity-40'
              }`}
              style={{
                height: isPlaying ? `${Math.max(6, (h * (i % 2 === 0 ? 1 : 0.7)) / 5)}px` : '6px',
                animationDelay: `${i * 100}ms`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Seeker / Controls Row */}
      <div className="space-y-1.5">
        <div className="relative flex items-center">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-[#E0D8C8] rounded-lg appearance-none cursor-pointer accent-[#0F4C3A]"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#6A7873] font-mono">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Actions Toolbar */}
      <div className="flex items-center justify-between pt-1 border-t border-[#EAE6DF]/70">
        <div className="flex items-center gap-2">
          {/* Main Play / Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            className="bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>توقف پخش</span>
              </>
            ) : hasEnded ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>پخش مجدد</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span>پخش صدا</span>
              </>
            )}
          </button>

          {/* Mute Toggle */}
          <button
            type="button"
            onClick={toggleMute}
            className="text-[#6A7873] hover:text-[#0F4C3A] p-1.5 rounded-lg hover:bg-white/80 transition"
            title={isMuted ? 'صدادار' : 'بی‌صدا'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-red-500" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {showDownload && (
            <button
              type="button"
              onClick={handleDownload}
              className="text-[#6A7873] hover:text-[#0F4C3A] p-1.5 rounded-lg hover:bg-white/80 transition text-xs flex items-center gap-1"
              title="دانلود فایل صوتی"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">دانلود</span>
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition text-xs flex items-center gap-1 font-bold"
              title="حذف و ضبط مجدد"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="text-[11px]">حذف صدا</span>
            </button>
          )}
        </div>
      </div>

      {playbackError && (
        <div className="text-[11px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-200 text-right">
          خطا در بارگذاری یا پخش فایل صوتی.
        </div>
      )}
    </div>
  );
};
