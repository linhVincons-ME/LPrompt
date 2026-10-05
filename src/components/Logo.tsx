import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  showBadge?: boolean;
  glow?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 36,
  className = '',
  showText = false,
  showBadge = false,
  glow = true
}) => {
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* SVG Icon */}
      <div
        className="relative flex items-center justify-center flex-shrink-0"
        style={{ width: size, height: size }}
      >
        {glow && (
          <div
            className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 opacity-40 blur-md pointer-events-none transition-opacity duration-300 group-hover:opacity-75"
          />
        )}
        <svg
          viewBox="0 0 128 128"
          width={size}
          height={size}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative drop-shadow-md"
        >
          <defs>
            {/* Background Gradient */}
            <linearGradient id="logo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0a0518" />
              <stop offset="50%" stopColor="#150a2b" />
              <stop offset="100%" stopColor="#220b38" />
            </linearGradient>

            {/* Border Gradient */}
            <linearGradient id="logo-border" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#d946ef" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.9" />
            </linearGradient>

            {/* Stylized L Gradient */}
            <linearGradient id="logo-l-grad" x1="15%" y1="10%" x2="90%" y2="90%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="35%" stopColor="#a855f7" />
              <stop offset="70%" stopColor="#d946ef" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>

            {/* Accent Prompt Gradient */}
            <linearGradient id="logo-prompt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="50%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#fda4af" />
            </linearGradient>

            {/* Core Glow Filter */}
            <filter id="logo-neon-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Squircle Background Badge */}
          <rect
            x="6"
            y="6"
            width="116"
            height="116"
            rx="28"
            fill="url(#logo-bg)"
            stroke="url(#logo-border)"
            strokeWidth="2.5"
          />

          {/* Inner subtle glow spot */}
          <circle cx="56" cy="68" r="32" fill="#d946ef" opacity="0.16" />

          {/* Glowing L backdrop */}
          <path
            d="M 43 24
               C 48 24 52 28 52 33
               L 52 68
               C 52 72 55 75 59 75
               L 89 75
               C 94 75 98 79 98 84
               C 98 89 94 93 89 93
               L 45 93
               C 38 93 33 88 33 81
               L 33 33
               C 33 28 37 24 43 24 Z"
            fill="url(#logo-l-grad)"
            opacity="0.35"
            filter="url(#logo-neon-filter)"
          />

          {/* Foreground Stylized "L" */}
          <path
            d="M 43 24
               C 48 24 52 28 52 33
               L 52 68
               C 52 72 55 75 59 75
               L 89 75
               C 94 75 98 79 98 84
               C 98 89 94 93 89 93
               L 45 93
               C 38 93 33 88 33 81
               L 33 33
               C 33 28 37 24 43 24 Z"
            fill="url(#logo-l-grad)"
          />

          {/* 3D Glass Light reflection */}
          <path
            d="M 36 33
               C 36 29 39 26 43 26
               C 46 26 48 28 49 31
               L 49 68
               C 47 67 44 67 42 67
               L 36 67 Z"
            fill="#ffffff"
            opacity="0.25"
          />

          {/* AI Terminal Prompt Chevron '>' */}
          <path
            d="M 65 42
               L 78 53
               L 65 64"
            fill="none"
            stroke="url(#logo-prompt-grad)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#logo-neon-filter)"
          />

          {/* Sparkle Star (✦) */}
          <path
            d="M 96 26
               C 96 32 99 35 105 35
               C 99 35 96 38 96 44
               C 96 38 93 35 87 35
               C 93 35 96 32 96 26 Z"
            fill="#fbcfe8"
            filter="url(#logo-neon-filter)"
          />

          {/* Micro sparkle accent */}
          <circle cx="72" cy="27" r="1.8" fill="#f472b6" opacity="0.85" />
        </svg>
      </div>

      {/* Optional Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-purple-200 via-pink-200 to-white bg-clip-text text-transparent">
              LPrompts<span className="text-fuchsia-400">.</span>
            </span>
            {showBadge && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30">
                PROMPTOPS
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400">Prompt Engineering & Evaluation IDE</span>
        </div>
      )}
    </div>
  );
};
