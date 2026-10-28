import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Trash2,
  Check,
  AlertCircle,
  Volume2,
  RefreshCw,
  Sparkles,
  Info,
} from 'lucide-react';
import { VoiceRecordingData } from '../../types';
import {
  getSupportedMimeType,
  blobToDataURL,
  formatDuration,
} from '../../utils/audioRecorder';
import { AudioPlayer } from './AudioPlayer';
import { toPersianDigits } from '../../utils/formatters';

interface VoiceMessageRecorderProps {
  voiceRecording?: VoiceRecordingData | null;
  onRecordingComplete: (recording: VoiceRecordingData) => void;
  onRecordingDeleted: () => void;
  label?: string;
  helperText?: string;
  maxDurationSeconds?: number; // Default 180 (3 minutes)
  className?: string;
  compact?: boolean;
}

export const VoiceMessageRecorder: React.FC<VoiceMessageRecorderProps> = ({
  voiceRecording,
  onRecordingComplete,
  onRecordingDeleted,
  label = 'ضبط پیام یا توضیحات صوتی (اختیاری)',
  helperText = 'می‌توانید نیازمندی‌ها، سلیقه یا پیام تبریک خود را به صورت صوتی برای کارشناسان یادمان ضبط فرمایید.',
  maxDurationSeconds = 180,
  className = '',
  compact = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracks();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    setErrorMessage(null);

    // Check browser support
    if (
      typeof window === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia ||
      typeof window.MediaRecorder === 'undefined'
    ) {
      setErrorMessage(
        'مرورگر شما یا محیط فعلی از قابلیت ضبط صدا پشتیبانی نمی‌کند.'
      );
      return;
    }

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const options: MediaRecorderOptions = {};
      if (mimeType) {
        options.mimeType = mimeType;
      }
      // Compress voice recording (32 kbps mono is crisp for speech and very lightweight)
      options.audioBitsPerSecond = 32000;

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        try {
          const finalMime = mediaRecorder.mimeType || mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: finalMime });
          const duration = Math.max(1, recordingSeconds);
          const dataUrl = await blobToDataURL(audioBlob);

          const result: VoiceRecordingData = {
            dataUrl,
            duration,
            mimeType: finalMime,
            sizeBytes: audioBlob.size,
            createdAt: new Date().toISOString(),
          };

          onRecordingComplete(result);
        } catch (err) {
          console.error('Error processing audio recording:', err);
          setErrorMessage('خطایی در پردازش فایل صوتی رخ داد. لطفاً مجدداً تلاش کنید.');
        } finally {
          setIsProcessing(false);
          setIsRecording(false);
          stopTracks();
        }
      };

      mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event);
        setErrorMessage('خطایی حین ضبط صدا پیش آمد.');
        cancelRecording();
      };

      // Start recording with 200ms timeslices
      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);
      startTimeRef.current = Date.now();

      // Start timer
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingSeconds(elapsed);

        // Check if reached max duration
        if (elapsed >= maxDurationSeconds) {
          stopRecording();
        }
      }, 500);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      stopTracks();
      setIsRecording(false);

      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError'
      ) {
        setErrorMessage(
          'دسترسی به میکروفون مسدود شده است. لطفاً در نوار آدرس مرورگر روی علامت قفل یا میکروفون کلیک کرده و اجازه دسترسی (Allow) را فعال نمایید.'
        );
      } else if (
        err.name === 'NotFoundError' ||
        err.name === 'DevicesNotFoundError'
      ) {
        setErrorMessage('میکروفونی بر روی دستگاه شما شناسایی نشد.');
      } else {
        setErrorMessage(
          'امکان برقراری ارتباط با میکروفون فراهم نشد. لطفاً دسترسی‌های مرورگر را بررسی فرمایید.'
        );
      }
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      // Remove stop handler to avoid saving
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }

    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingSeconds(0);
    stopTracks();
  };

  // If a voice recording already exists, display preview player with option to delete/record again
  if (voiceRecording && voiceRecording.dataUrl) {
    return (
      <div className={`space-y-2 text-right ${className}`} dir="rtl">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-[#0F4C3A] flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>پیام صوتی ضمیمه شده</span>
          </label>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200 flex items-center gap-1">
            <Check className="w-3 h-3" />
            <span>آماده ارسال</span>
          </span>
        </div>

        <AudioPlayer
          src={voiceRecording.dataUrl}
          duration={voiceRecording.duration}
          title="پیام صوتی شما"
          subtitle={`مدت زمان: ${formatDuration(voiceRecording.duration)}`}
          onDelete={onRecordingDeleted}
          showDownload={false}
          compact={compact}
        />
      </div>
    );
  }

  // Active Recording state UI
  if (isRecording) {
    return (
      <div
        className={`bg-gradient-to-r from-[#FAF8F5] via-[#FFF9F2] to-[#FAF8F5] border-2 border-red-400/80 p-4 rounded-2xl shadow-sm text-right space-y-3 animate-fadeIn ${className}`}
        dir="rtl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
            </span>
            <span className="text-xs font-bold text-red-700 animate-pulse">
              در حال ضبط صدای شما...
            </span>
          </div>

          <div className="text-xs font-mono font-bold text-[#0F4C3A] bg-white px-3 py-1 rounded-xl border border-[#E0D8C8]">
            {formatDuration(recordingSeconds)} / {formatDuration(maxDurationSeconds)}
          </div>
        </div>

        {/* Dynamic Voice Frequency Waves Simulation */}
        <div className="flex items-center justify-center gap-1 py-2 bg-white/60 rounded-xl border border-[#EAE6DF]">
          {[30, 60, 90, 45, 80, 100, 70, 50, 85, 40, 95, 60, 75, 45, 80].map(
            (val, idx) => (
              <span
                key={idx}
                className="w-1 bg-red-500 rounded-full transition-all duration-150 animate-pulse"
                style={{
                  height: `${Math.max(6, (val * ((idx % 3) + 1)) / 12)}px`,
                  animationDuration: `${0.3 + (idx % 5) * 0.15}s`,
                }}
              />
            )
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={cancelRecording}
            className="text-gray-500 hover:text-red-600 p-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 hover:bg-red-50"
            title="انصراف و حذف ضبط"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
            <span>لغو ضبط</span>
          </button>

          <button
            type="button"
            onClick={stopRecording}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 shadow-md active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>توقف و تایید ویس</span>
          </button>
        </div>
      </div>
    );
  }

  // Processing state
  if (isProcessing) {
    return (
      <div
        className={`bg-[#FAF8F5] border border-[#E0D8C8] p-4 rounded-2xl text-center text-xs text-[#0F4C3A] font-bold space-y-2 ${className}`}
        dir="rtl"
      >
        <RefreshCw className="w-5 h-5 mx-auto text-[#D4AF37] animate-spin" />
        <p>در حال آماده‌سازی و بهینه‌سازی فایل صوتی...</p>
      </div>
    );
  }

  // Initial / Idle state
  return (
    <div className={`space-y-2 text-right ${className}`} dir="rtl">
      {/* Microphone Trigger Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#FAF8F5] p-3 rounded-2xl border border-[#E0D8C8] hover:border-[#0F4C3A]/40 transition">
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#0F4C3A]/10 text-[#0F4C3A] flex items-center justify-center shrink-0 mt-0.5">
            <Mic className="w-4 h-4 text-[#0F4C3A]" />
          </div>
          <div>
            <span className="block text-xs font-bold text-[#0F4C3A]">
              {label}
            </span>
            <p className="text-[11px] text-[#6A7873] leading-relaxed mt-0.5">
              {helperText}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={startRecording}
          id="start-voice-recording-btn"
          className="bg-[#0F4C3A] hover:bg-[#0B3C2E] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 shadow-xs active:scale-95 group"
        >
          <Mic className="w-3.5 h-3.5 text-[#D4AF37] group-hover:scale-110 transition-transform" />
          <span>شروع ضبط صدا</span>
        </button>
      </div>

      {/* Persian Error Message Banner */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-bold">{errorMessage}</p>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-[11px] underline text-red-800 hover:text-red-950 font-bold"
            >
              بستن پیام
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
