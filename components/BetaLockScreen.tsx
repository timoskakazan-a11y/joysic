
import React from 'react';
import type { ImageAsset } from '../types';
import TrackCover from './TrackCover';

interface BetaLockScreenProps {
  imageAsset: ImageAsset | null;
}

const BetaLockScreen: React.FC<BetaLockScreenProps> = ({ imageAsset }) => {
  return (
    <div className="min-h-screen bg-background text-text flex flex-col justify-center items-center p-6 text-center relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vh] bg-accent/10 rounded-full blur-3xl opacity-50" aria-hidden="true"></div>
      
      <div className="relative w-full max-w-md bg-surface/70 backdrop-blur-xl p-8 sm:p-12 rounded-2xl shadow-2xl shadow-black/30 border border-surface-light animate-fadeInScaleUp">
        <div className="flex flex-col items-center">
          {imageAsset ? (
            <TrackCover
              asset={imageAsset}
              alt="Бета-тест"
              className="w-56 h-56 mx-auto mb-8 drop-shadow-[0_10px_15px_rgba(187,134,252,0.15)] animate-breathing"
              sizes="224px"
            />
          ) : (
            <div className="w-56 h-56 mx-auto mb-8 bg-surface-light rounded-2xl animate-pulse"></div>
          )}
          <h1 className="text-3xl sm:text-4xl font-black text-primary mb-4">Бета-тест скоро начнется</h1>
          <p className="text-text-secondary leading-relaxed max-w-sm">
            Доступ к приложению временно ограничен.
            Спасибо за ваш интерес к Joysic!
          </p>
        </div>
      </div>
    </div>
  );
};

export default BetaLockScreen;