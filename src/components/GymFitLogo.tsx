import React from 'react';

export const GymFitLogo: React.FC = () => {
  return (
    <div className="flex items-center gap-1.5">
      <img
        src="/GymFitLogo02.webp"
        alt="GymFit Logo"
        className="w-16 h-16 md:w-50 md:h-24 object-contain shrink-0"
      />     
    </div>
  );
};