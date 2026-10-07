import React from 'react';

export const GymFitLogo: React.FC = () => {
  return (
    <div className="flex items-center gap-1.5">
      <img
        src="/gymfit-logo.png"
        alt="GymFit Logo"
        className="w-16 h-16 md:w-24 md:h-24 object-contain shrink-0"
      />     
        <h1 className="text-[16px] sm:text-lg font-black text-white tracking-tight">
          GymFit <span className="text-emerald-400">Manager</span>
        </h1>
    </div>
  );
};