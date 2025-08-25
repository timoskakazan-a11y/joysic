
import React, { useState, useEffect, useRef } from 'react';
import type { Track } from '../types';
import { PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon, ChevronDownIcon, HeartIcon, YouTubeIcon, MoreOptionsIcon, MatBadge } from './IconComponents';
import TrackCover from './TrackCover';
import JoycodeModal from './JoycodeModal';

interface PlayerProps {
  track: Track;
  isPlaying: boolean;
  progress: {
    currentTime: number;
    duration: number;
  };
  isLiked: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (newTime: number) => void;
  onSelectArtist: (artistId: string) => void;
  onMinimize: () => void;
  onToggleLike: () => void;
  onOpenMatInfo: () => void;
}

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const Player: React.FC<PlayerProps> = ({ track, isPlaying, progress, onPlayPause, onNext, onPrev, onSeek, onSelectArtist, onMinimize, isLiked, onToggleLike, onOpenMatInfo }) => {
  const [bgOpacity, setBgOpacity] = useState(0.5);
  const progressPercentage = (progress.duration > 0) ? (progress.currentTime / progress.duration) * 100 : 0;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isJoycodeModalOpen, setIsJoycodeModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    // Fade effect for background on track change
    setBgOpacity(0);
    const timer = setTimeout(() => setBgOpacity(0.5), 500);
    return () => clearTimeout(timer);
  }, [track.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(Number(event.target.value));
  };
  
  const handleArtistClick = () => {
      if (track.artistId) {
          onSelectArtist(track.artistId);
      }
  };

  const handleShowJoycode = () => {
    setIsJoycodeModalOpen(true);
    setIsMenuOpen(false);
  };

  return (
    <>
    <div
      className="relative w-full h-full overflow-hidden bg-background"
    >
       <div 
        key={track.id}
        className="absolute inset-[-40px] bg-cover bg-center transition-opacity duration-1000 ease-in-out"
        style={{
          backgroundImage: `url(${track.coverUrl})`,
          filter: 'blur(32px)',
          opacity: bgOpacity,
        }}
      />
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative w-full h-full flex flex-col text-text p-4 sm:p-6 md:p-8">
        
        <header className="w-full flex justify-between items-center flex-shrink-0">
            <button onClick={onMinimize} className="text-text-secondary hover:text-primary transition-colors z-10" aria-label="Minimize player">
                <ChevronDownIcon className="w-8 h-8"/>
            </button>
             {/* Header on small screens */}
            <div className="md:hidden flex items-center gap-2">
                <button onClick={onToggleLike} className={`${isLiked ? 'text-accent' : 'text-text-secondary'} hover:text-primary transition-colors p-2`} aria-label="Like track">
                    <HeartIcon filled={isLiked} className="w-7 h-7" />
                </button>
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-text-secondary hover:text-primary transition-colors p-2" aria-label="More options">
                        <MoreOptionsIcon className="w-7 h-7" />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-surface-light rounded-lg shadow-lg z-10 animate-fadeInScaleUp py-1 origin-top-right">
                            <button
                                onClick={handleShowJoycode}
                                className="w-full text-left px-4 py-2 text-sm text-text hover:bg-surface transition-colors flex items-center gap-3"
                            >
                                Показать Joycode
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>

        {/* Main Content Area */}
        <div key={track.id} className="flex-grow w-full flex flex-col md:flex-row items-center justify-center md:gap-12 lg:gap-20 animate-fadeInScaleUp">
          
          {/* Left Side: Cover Art (Tablet and up) */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 flex-shrink-0 rounded-2xl bg-surface shadow-2xl shadow-black/30 my-8 md:my-0 overflow-hidden">
            <TrackCover
              src={track.coverUrl} 
              alt={track.title} 
              className="absolute inset-0 w-full h-full"
            />
          </div>
          
          {/* Right Side: Details and Controls (Tablet and up) / Bottom part on Mobile */}
          <div className="w-full max-w-md flex flex-col text-center md:text-left md:justify-between h-full md:h-auto md:max-h-[384px] lg:max-h-[480px]">

            {/* Track Info */}
            <div className="md:mt-auto">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-primary flex items-start justify-center md:justify-start gap-2">
                <span>{track.title}</span>
                {track.mat && <MatBadge onClick={onOpenMatInfo} />}
              </h1>
              <button onClick={handleArtistClick} className="text-lg sm:text-xl font-medium text-text-secondary hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-md">
                {track.artist}
              </button>
              {track.youtubeClipUrl && (
                <a
                  href={track.youtubeClipUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 bg-surface/50 backdrop-blur-sm text-text-secondary hover:text-primary hover:bg-surface transition-all duration-300 rounded-full px-4 py-2 text-sm font-semibold flex items-center justify-center md:justify-start gap-2 max-w-xs mx-auto md:mx-0"
                >
                  <YouTubeIcon className="w-5 h-5" />
                  <span>Смотреть клип</span>
                </a>
              )}
            </div>

            <div className="w-full mt-auto">
              {/* Progress Bar */}
              <div className="w-full mt-8 md:mt-4">
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
              
              {/* Controls */}
              <div className="flex items-center justify-center md:justify-between gap-6 mt-4">
                <button onClick={onPrev} aria-label="Previous track" className="text-text-secondary hover:text-primary transition-all duration-300 hover:scale-110">
                  <SkipBackIcon className="w-8 h-8" />
                </button>
                <button
                  onClick={onPlayPause}
                  aria-label={isPlaying ? "Pause" : "Play"}
                  className="bg-primary text-background rounded-full w-20 h-20 flex items-center justify-center shadow-lg hover:bg-white/80 transition-all transform hover:scale-110"
                >
                  {isPlaying ? <PauseIcon className="w-10 h-10" /> : <PlayIcon className="w-10 h-10 pl-1" />}
                </button>
                <button onClick={onNext} aria-label="Next track" className="text-text-secondary hover:text-primary transition-all duration-300 hover:scale-110">
                  <SkipForwardIcon className="w-8 h-8" />
                </button>
                {/* Options on large screens */}
                <div className="hidden md:flex items-center gap-2">
                    <button onClick={onToggleLike} className={`${isLiked ? 'text-accent' : 'text-text-secondary'} hover:text-primary transition-colors p-2`} aria-label="Like track">
                        <HeartIcon filled={isLiked} className="w-7 h-7" />
                    </button>
                    <div className="relative" ref={menuRef}>
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-text-secondary hover:text-primary transition-colors p-2" aria-label="More options">
                            <MoreOptionsIcon className="w-7 h-7" />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 bottom-full mb-2 w-48 bg-surface-light rounded-lg shadow-lg z-10 animate-fadeInScaleUp py-1 origin-bottom-right">
                                <button
                                    onClick={handleShowJoycode}
                                    className="w-full text-left px-4 py-2 text-sm text-text hover:bg-surface transition-colors flex items-center gap-3"
                                >
                                    Показать Joycode
                                </button>
                            </div>
                        )}
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .range-slider-full {
          -webkit-appearance: none; appearance: none;
          background-color: transparent;
        }
        .range-slider-full::-webkit-slider-runnable-track {
          height: 6px;
          background: linear-gradient(to right, #bb86fc var(--progress-percentage), #2c2c2c var(--progress-percentage));
          border-radius: 9999px;
          transition: height 0.2s ease-in-out;
        }
        .range-slider-full:hover::-webkit-slider-runnable-track { height: 8px; }
        .range-slider-full::-moz-range-track {
           height: 6px;
           background: linear-gradient(to right, #bb86fc var(--progress-percentage), #2c2c2c var(--progress-percentage));
           border-radius: 9999px;
        }
        .range-slider-full::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 16px; height: 16px; border-radius: 9999px;
          background-color: #ffffff;
          margin-top: -5px;
          transform: scale(0);
          transition: transform 0.2s ease-in-out;
        }
        .range-slider-full:hover::-webkit-slider-thumb, .range-slider-full:active::-webkit-slider-thumb {
            transform: scale(1);
        }
        .range-slider-full::-moz-range-thumb {
            width: 16px; height: 16px; border-radius: 9999px;
            background-color: #ffffff;
            border: none;
            transform: scale(0);
            transition: transform 0.2s ease-in-out;
        }
        .range-slider-full:hover::-moz-range-thumb, .range-slider-full:active::-moz-range-thumb {
            transform: scale(1);
        }
      `}</style>
    </div>
    {isJoycodeModalOpen && <JoycodeModal track={track} onClose={() => setIsJoycodeModalOpen(false)} />}
    </>
  );
};

export default Player;
