import React, { useState, useEffect } from 'react';
import type { Track } from '../types';
import { PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon, ChevronDownIcon } from './IconComponents';

interface PlayerProps {
  track: Track;
  isPlaying: boolean;
  progress: {
    currentTime: number;
    duration: number;
  };
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (newTime: number) => void;
  onSelectArtist: (artistId: string) => void;
  onMinimize: () => void;
}

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const AnimatedPlaceholder: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`w-full h-full bg-surface-light animate-pulse ${className}`} />
);

const Player: React.FC<PlayerProps> = ({ track, isPlaying, progress, onPlayPause, onNext, onPrev, onSeek, onSelectArtist, onMinimize }) => {
  const [isCoverLoaded, setIsCoverLoaded] = useState(false);
  const progressPercentage = (progress.duration > 0) ? (progress.currentTime / progress.duration) * 100 : 0;

  useEffect(() => {
    setIsCoverLoaded(false);
  }, [track.coverUrl]);

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(Number(event.target.value));
  };
  
  const handleArtistClick = () => {
      if (track.artistId) {
          onMinimize();
          onSelectArtist(track.artistId);
      }
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-background">
      <div className="relative w-full h-full flex flex-col items-center text-text p-4 sm:p-8">
        
        <header className="w-full max-w-md">
            <button onClick={onMinimize} className="text-text-secondary hover:text-primary transition-colors" aria-label="Minimize player">
                <ChevronDownIcon className="w-8 h-8"/>
            </button>
        </header>

        <main className="flex-grow w-full flex flex-col items-center justify-center text-center pt-4">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-2xl bg-surface shadow-2xl shadow-black/30 mb-8 overflow-hidden">
            {!isCoverLoaded && <AnimatedPlaceholder />}
            <img 
              src={track.coverUrl} 
              alt={track.title} 
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${isCoverLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setIsCoverLoaded(true)}
              onError={() => setIsCoverLoaded(true)} // Handle image load errors
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 text-primary">
            {track.title}
          </h1>
          <button onClick={handleArtistClick} className="text-lg sm:text-xl font-black text-text-secondary hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-md">
            {track.artist}
          </button>
        </main>

        <footer className="w-full max-w-md pb-4">
          <div className="w-full">
            <input
                type="range"
                min="0"
                max={progress.duration || 100}
                value={progress.currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-transparent cursor-pointer appearance-none range-slider-full"
                style={{'--progress-percentage': `${progressPercentage}%`} as React.CSSProperties}
                aria-label="Seek track"
            />
            <div className="flex justify-between text-xs font-medium text-text-secondary mt-1.5">
              <span>{formatTime(progress.currentTime)}</span>
              <span>{formatTime(progress.duration)}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-4">
            <button onClick={onPrev} aria-label="Previous track" className="text-text-secondary hover:text-primary transition-colors">
              <SkipBackIcon className="w-8 h-8" />
            </button>
            <button
              onClick={onPlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="bg-primary text-background rounded-full w-20 h-20 flex items-center justify-center shadow-lg hover:bg-white/80 transition-all transform hover:scale-105"
            >
              {isPlaying ? <PauseIcon className="w-10 h-10" /> : <PlayIcon className="w-10 h-10 pl-1" />}
            </button>
            <button onClick={onNext} aria-label="Next track" className="text-text-secondary hover:text-primary transition-colors">
              <SkipForwardIcon className="w-8 h-8" />
            </button>
          </div>
        </footer>
      </div>
      <style>{`
        .range-slider-full {
          -webkit-appearance: none; appearance: none;
          background-color: transparent;
        }
        .range-slider-full::-webkit-slider-runnable-track {
          height: 6px;
          background: linear-gradient(to right, var(--tw-color-primary) var(--progress-percentage), var(--tw-color-surface-light) var(--progress-percentage));
          border-radius: 9999px;
          transition: height 0.2s ease-in-out;
        }
        .range-slider-full:hover::-webkit-slider-runnable-track { height: 8px; }
        .range-slider-full::-moz-range-track {
           height: 6px;
           background: linear-gradient(to right, var(--tw-color-primary) var(--progress-percentage), var(--tw-color-surface-light) var(--progress-percentage));
           border-radius: 9999px;
        }
        .range-slider-full::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 16px; height: 16px; border-radius: 9999px;
          background-color: var(--tw-color-primary);
          margin-top: -5px;
          transform: scale(0);
          transition: transform 0.2s ease-in-out;
        }
        .range-slider-full:hover::-webkit-slider-thumb, .range-slider-full:active::-webkit-slider-thumb {
            transform: scale(1);
        }
        .range-slider-full::-moz-range-thumb {
            width: 16px; height: 16px; border-radius: 9999px;
            background-color: var(--tw-color-primary);
            border: none;
            transform: scale(0);
            transition: transform 0.2s ease-in-out;
        }
        .range-slider-full:hover::-moz-range-thumb, .range-slider-full:active::-moz-range-thumb {
            transform: scale(1);
        }
      `}</style>
    </div>
  );
};

export default Player;