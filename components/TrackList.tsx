
import React from 'react';
import type { Track } from '../types';
import { SoundWaveIcon } from './IconComponents';

interface TrackListProps {
  tracks: Track[];
  currentTrackId?: string | null;
  isPlaying: boolean;
  onSelectTrack: (index: number) => void;
}

const TrackList: React.FC<TrackListProps> = ({ tracks, currentTrackId, isPlaying, onSelectTrack }) => {
  return (
    <div className="space-y-2">
      {tracks.map((track, index) => {
        const isActive = track.id === currentTrackId;
        return (
          <div
            key={track.id}
            onClick={() => onSelectTrack(index)}
            className={`flex items-center p-3 rounded-2xl cursor-pointer transition-all duration-300 ${
              isActive ? 'bg-primary-light/20 shadow-md' : 'hover:bg-surface'
            }`}
            aria-label={`Play ${track.title} by ${track.artist}`}
            role="button"
            tabIndex={0}
          >
            <div className="relative">
              <img src={track.coverUrl} alt={track.title} className="w-14 h-14 rounded-lg object-cover" />
            </div>
            <div className="flex-grow mx-4">
              <p className={`font-bold ${isActive ? 'text-primary' : 'text-text'}`}>
                {track.title}
              </p>
              <p className="text-sm text-text-secondary">{track.artist}</p>
            </div>
            {isActive && isPlaying && (
              <SoundWaveIcon isPlaying={isPlaying} className="w-6 h-6 text-primary" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TrackList;