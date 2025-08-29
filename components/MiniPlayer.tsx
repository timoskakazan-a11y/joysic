import React from 'react';
import type { Track } from '../types';
import { PlayIcon, PauseIcon, MatBadgeStatic } from './IconComponents';
import TrackCover from './TrackCover';

interface MiniPlayerProps {
  track: Track;
  isPlaying: boolean;
  progress: number;
  onPlayPause: () => void;
  onExpand: () => void;
  onOpenMatInfo: () => void;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({ track, isPlaying, progress, onPlayPause, onExpand, onOpenMatInfo }) => {
  const handlePlayPauseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlayPause();
  };

  return (
    <div className="px-2 pb-2" onClick={onExpand} >
        <div 
            className="relative h-16 bg-surface rounded-xl flex items-center p-2 cursor-pointer border border-surface-light shadow-2xl backdrop-blur-lg bg-opacity-80 overflow-hidden"
            aria-label="Expand player"
            role="button"
        >
        <div className="absolute top-0 left-0 w-full h-0.5 bg-surface-light">
            <div className="h-full bg-accent" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="relative w-12 h-12 rounded-lg bg-surface-light overflow-hidden flex-shrink-0">
          <TrackCover asset={track.cover} alt={track.title} className="w-full h-full" sizes="48px" />
        </div>
        <div className="flex-grow mx-3 overflow-hidden">
            <div className="flex items-center">
              <p className="font-semibold text-primary truncate">{track.title}</p>
              {track.mat && <MatBadgeStatic className="ml-1.5 flex-shrink-0"/>}
            </div>
            <p className="text-sm text-text-secondary truncate">{track.artists?.map(a => a.name).join(', ')}</p>
        </div>
        <button
            onClick={handlePlayPauseClick}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="text-primary rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 hover:bg-surface-light transition-colors"
        >
            {isPlaying ? <PauseIcon className="w-7 h-7" /> : <PlayIcon className="w-7 h-7 pl-0.5" />}
        </button>
        </div>
    </div>
  );
};

export default MiniPlayer;