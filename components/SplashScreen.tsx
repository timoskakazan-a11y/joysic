import React from 'react';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-background flex flex-col justify-center items-center z-[100] font-sans">
      <h1 className="text-7xl md:text-8xl font-black text-primary -tracking-tighter animate-breathing">
        Joysic
      </h1>
    </div>
  );
};

export default SplashScreen;