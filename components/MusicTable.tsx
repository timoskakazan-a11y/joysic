
import React from 'react';
import type { Track } from '../types';
import { MusicNoteIcon, TextIcon, UserIcon, PlayIcon, PauseIcon, SoundWaveIcon } from './IconComponents';
import TrackCover from './TrackCover';

interface MusicTableProps {
  tracks: Track[];
  currentTrackId?: string | null;
  isPlaying: boolean;
  onSelectTrack: (index: number) => void;
}

const MusicTable: React.FC<MusicTableProps> = ({ tracks, currentTrackId, isPlaying, onSelectTrack }) => {
  return (
    <div className="overflow-x-auto bg-slate-800/50 rounded-lg shadow-lg">
      <div className="min-w-full">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-4 sm:px-6 py-3 border-b border-slate-700 text-sm font-medium text-slate-400 sticky top-0 bg-slate-800 z-10">
          <div className="col-span-1 flex items-center justify-center">#</div>
          <div className="col-span-4 flex items-center gap-2">
            <MusicNoteIcon className="w-4 h-4" /> Название
          </div>
          <div className="col-span-3 flex items-center gap-2">
            <UserIcon className="w-4 h-4" /> Имя исполнителя
          </div>
          <div className="col-span-4 flex items-center gap-2">
            <TextIcon className="w-4 h-4" /> Слова (начало)
          </div>
        </div>

        {/* Body */}
        <div>
          {tracks.map((track, index) => {
            const isActive = track.id === currentTrackId;
            return (
              <div
                key={track.id}
                onClick={() => onSelectTrack(index)}
                className={`grid grid-cols-12 gap-4 px-4 sm:px-6 py-3 text-sm items-center border-b border-slate-800 last:border-b-0 cursor-pointer group transition-colors duration-200 ${
                  isActive ? 'bg-surface-light' : 'hover:bg-slate-700/50'
                }`}
              >
                <div className="col-span-1 flex items-center justify-center">
                  {isActive ? (
                    <div className="relative w-6 h-6 flex items-center justify-center">
                        {isPlaying ? <SoundWaveIcon isPlaying={isPlaying} className="w-5 h-5 text-primary" /> : <PlayIcon className="w-5 h-5 text-primary" />}
                    </div>
                  ) : (
                    <span className="text-slate-400 group-hover:hidden">{index + 1}</span>
                  )}
                  <button onClick={() => onSelectTrack(index)} className="text-white hidden group-hover:block transition-opacity">
                    <PlayIcon className="w-6 h-6" />
                  </button>
                </div>
                <div className={`col-span-4 flex items-center gap-3 ${isActive ? 'text-primary font-semibold' : 'text-white'}`}>
                    <TrackCover asset={track.cover} alt={track.title} className="w-10 h-10 rounded-md" />
                    <span>{track.title}</span>
                </div>
                <div className="col-span-3 text-slate-300 truncate">{track.artists.map(a => a.name).join(', ')}</div>
                <div className="col-span-4 text-slate-400 truncate">{track.lyrics.substring(0, 50)}{track.lyrics.length > 50 ? '...' : ''}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MusicTable;