import React from 'react';

interface GymFitLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const GymFitLogo: React.FC<GymFitLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const sizeMap = {
    sm: { circle: 'w-7 h-7 sm:w-8 sm:h-8', text: 'text-sm sm:text-base', sub: 'text-[9px]' },
    md: { circle: 'w-9 h-9 sm:w-10 sm:h-10', text: 'text-base sm:text-lg', sub: 'text-[10px]' },
    lg: { circle: 'w-12 h-12 sm:w-14 sm:h-14', text: 'text-xl sm:text-2xl', sub: 'text-xs' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 min-w-0 ${className}`}>
      {/* Emblema Circular con Fondo Blanco */}
      <div
        className={`relative ${currentSize.circle} rounded-full bg-white shadow-md shadow-black/40 flex items-center justify-center p-1.5 shrink-0 border border-slate-200/80 transition-transform hover:scale-105`}
        title="Gym Fit Manager"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="14" y="47" width="72" height="6" rx="2" fill="#13332E" />
          <rect x="18" y="32" width="6" height="36" rx="2" fill="#13332E" />
          <rect x="26" y="36" width="5" height="28" rx="1.5" fill="#13332E" />
          <rect x="69" y="36" width="5" height="28" rx="1.5" fill="#13332E" />
          <rect x="76" y="32" width="6" height="36" rx="2" fill="#13332E" />

          {/* Monograma GF Isométrico */}
          <path
            d="M 50 18 L 68 28.5 L 68 41 L 59 36 L 59 33 L 50 28 L 41 33 L 41 40 L 55 48 L 50 51 L 34 42 L 34 27 Z"
            fill="#13332E"
          />
          <path d="M 50 28 L 60 34 L 50 40 L 40 34 Z" fill="#1C4A42" />

          {/* Sección Inferior 'G' en Rojo */}
          <path
            d="M 32 44 L 50 54.5 L 68 44 L 68 57 L 50 67.5 L 32 57 Z"
            fill="#B91C1C"
          />
          <path d="M 41 54 L 50 59.5 L 59 54 L 59 49 L 50 54 L 45 51 Z" fill="#991B1B" />
          <path
            d="M 50 67.5 L 68 57 L 68 51 L 50 61.5 L 32 51 L 32 57 Z"
            fill="#7F1D1D"
          />
        </svg>
      </div>

      {/* Wordmark con Manager en Rojo */}
      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center leading-none">
            <span className={`font-display ${currentSize.text} font-black tracking-tight text-white leading-none whitespace-nowrap`}>
              GymFit
              <span className="text-[#B91C1C] font-black ml-1">Manager</span>
            </span>
          </div>
          <span className={`${currentSize.sub} text-slate-400 font-mono tracking-wider uppercase leading-tight mt-1 hidden sm:inline`}>
            Gestión de Sala & Rendimiento
          </span>
        </div>
      )}
    </div>
  );
};