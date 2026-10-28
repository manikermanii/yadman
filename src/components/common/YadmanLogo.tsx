import React from 'react';

export interface YadmanLogoProps {
  variant?: 'header' | 'footer' | 'admin' | 'full';
  className?: string;
  onClick?: () => void;
  alt?: string;
}

export const YadmanLogo: React.FC<YadmanLogoProps> = ({
  variant = 'header',
  className = '',
  onClick,
}) => {
  // Footer: Nastaliq style
  if (variant === 'footer') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center select-none ${
          onClick ? 'cursor-pointer' : ''
        } ${className}`}
        id="brand-footer-logo"
      >
        <span className="font-nastaliq text-3xl sm:text-4xl font-bold text-[#FAF8F5] leading-relaxed tracking-normal select-none">
          یادمان
        </span>
      </div>
    );
  }

  // Admin Header: Nastaliq style
  if (variant === 'admin') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center select-none ${
          onClick ? 'cursor-pointer' : ''
        } ${className}`}
        id="brand-admin-logo"
      >
        <span className="font-nastaliq text-2xl sm:text-3xl font-bold text-[#0F4C3A] leading-relaxed select-none">
          یادمان
        </span>
      </div>
    );
  }

  // Full Display
  if (variant === 'full') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center select-none ${
          onClick ? 'cursor-pointer' : ''
        } ${className}`}
      >
        <span className="font-nastaliq text-5xl sm:text-6xl font-bold text-[#0F4C3A] leading-relaxed select-none">
          یادمان
        </span>
      </div>
    );
  }

  // Header Logo: ONLY the Persian word «یادمان» in authentic Nastaliq calligraphy style with dark emerald green
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center justify-center select-none py-0.5 px-1 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      id="brand-header-logo-container"
    >
      <span className="font-nastaliq text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#0F4C3A] leading-relaxed tracking-normal transition-colors duration-200 hover:text-[#0B3C2E] select-none">
        یادمان
      </span>
    </div>
  );
};
