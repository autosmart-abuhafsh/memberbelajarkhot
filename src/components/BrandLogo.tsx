import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  logoUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  className?: string;
  glassOnDark?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<BrandLogoProps['size']>, string> = {
  sm: 'h-8 w-8 rounded-lg',
  md: 'h-10 w-10 rounded-xl',
  lg: 'h-12 w-12 rounded-2xl',
  xl: 'h-16 w-16 rounded-2xl',
};

/**
 * Renders the official Belajar Khot institutional emblem:
 * - Octagonal Islamic geometry (Rub el Hizb) watermark
 * - Golden Qalam (calligraphy reed pen nib) + nuqta diamond
 * - Classical Arabic letter Kha (خ) monogram
 * - Automatically displays custom `logoUrl` if configured by Admin
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  logoUrl,
  primaryColor = '#19432D',
  secondaryColor = '#315B43',
  accentColor = '#A3D1B3',
  className = '',
  glassOnDark = false,
}) => {
  const uniqueId = React.useId().replace(/:/g, '');
  const sizeClass = SIZE_CLASSES[size];

  if (logoUrl && logoUrl.trim().length > 4) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden border border-white/20 bg-white shadow-xs flex items-center justify-center ${sizeClass} ${className}`}
      >
        <img
          src={logoUrl}
          alt="Logo Belajar Khot"
          className="h-full w-full object-contain p-0.5"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 overflow-hidden flex items-center justify-center shadow-xs ${sizeClass} ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
      >
        <defs>
          <linearGradient
            id={`bg-${uniqueId}`}
            x1="0"
            y1="0"
            x2="128"
            y2="128"
            gradientUnits="userSpaceOnUse"
          >
            <stop
              offset="0%"
              stopColor={glassOnDark ? '#FFFFFF' : primaryColor}
              stopOpacity={glassOnDark ? '0.18' : '1'}
            />
            <stop
              offset="100%"
              stopColor={glassOnDark ? '#FFFFFF' : secondaryColor}
              stopOpacity={glassOnDark ? '0.08' : '1'}
            />
          </linearGradient>
          <linearGradient
            id={`gold-${uniqueId}`}
            x1="24"
            y1="16"
            x2="104"
            y2="112"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#F7DF94" />
            <stop offset="55%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#B6861A" />
          </linearGradient>
        </defs>

        {/* Base Squircle */}
        <rect width="128" height="128" rx="26" fill={`url(#bg-${uniqueId})`} />
        <rect
          x="6"
          y="6"
          width="116"
          height="116"
          rx="22"
          stroke={`url(#gold-${uniqueId})`}
          strokeWidth="2.5"
          strokeOpacity="0.6"
        />

        {/* Subtle Rub el Hizb Octagram */}
        <g opacity="0.18" stroke={accentColor} strokeWidth="2.2">
          <rect x="28" y="28" width="72" height="72" rx="6" />
          <rect
            x="28"
            y="28"
            width="72"
            height="72"
            rx="6"
            transform="rotate(45 64 64)"
          />
        </g>

        {/* Qalam Reed Nib Outline */}
        <path
          d="M64 16L84 44L74 88H54L44 44L64 16Z"
          fill={`url(#gold-${uniqueId})`}
          fillOpacity="0.18"
          stroke={`url(#gold-${uniqueId})`}
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
        <line
          x1="64"
          y1="16"
          x2="64"
          y2="40"
          stroke={`url(#gold-${uniqueId})`}
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <circle cx="64" cy="43" r="3.5" fill={`url(#gold-${uniqueId})`} />

        {/* Calligraphic Nuqta Rhombus */}
        <rect
          x="60"
          y="26"
          width="8"
          height="8"
          rx="1.5"
          transform="rotate(45 64 30)"
          fill={`url(#gold-${uniqueId})`}
        />

        {/* Arabic Letter Kha (خ) */}
        <text
          x="64"
          y="85"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="serif"
          fontSize="48"
          fontWeight="700"
        >
          خ
        </text>

        {/* Rehal Book Ribbon Base */}
        <path
          d="M34 101C46 96 56 98 64 103C72 98 82 96 94 101"
          stroke={accentColor}
          strokeWidth="3.8"
          strokeLinecap="round"
        />
        <path
          d="M44 108C52 104 58 105 64 109C70 105 76 104 84 108"
          stroke={`url(#gold-${uniqueId})`}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};
