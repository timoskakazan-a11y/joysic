import React, { useMemo } from 'react';
import type { Playlist, Track } from '../types';
import { PlayIcon, PauseIcon, ChevronLeftIcon, SoundWaveIcon, HeartIcon } from './IconComponents';
import TrackCover from './TrackCover';

interface PlaylistDetailPageProps {
  playlist: Playlist;
  onBack: () => void;
  onPlayTrack: (trackId: string) => void;
  currentTrackId?: string | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  likedTrackIds: string[];
  onToggleLikeTrack: (trackId: string) => void;
}

const PlaylistDetailPage: React.FC<PlaylistDetailPageProps> = ({ playlist, onBack, onPlayTrack, currentTrackId, isPlaying, onPlayPause, likedTrackIds, onToggleLikeTrack }) => {
  
  const isPlaylistActive = playlist.trackIds.includes(currentTrackId || '');
  const isCurrentlyPlaying = isPlaylistActive && isPlaying;

  const sortedTracks = useMemo(() => 
    [...playlist.tracks].sort((a, b) => (b.listens || 0) - (a.listens || 0)),
  [playlist.tracks]);

  const handlePlayPauseClick = () => {
    if (isPlaylistActive) {
      onPlayPause();
    } else {
      if (sortedTracks.length > 0) {
        onPlayTrack(sortedTracks[0].id);
      }
    }
  };

  const ButtonIcon = isCurrentlyPlaying ? PauseIcon : PlayIcon;
  const buttonText = isCurrentlyPlaying ? 'Пауза' : 'Слушать';

  return (
    <div className="min-h-screen bg-background text-text font-sans">
       <div className="absolute top-0 left-0 w-full h-72 md:h-96">
          <img src={playlist.coverUrl} alt="" className="w-full h-full object-cover opacity-30 blur-xl" aria-hidden="true"/>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
      </div>
      <main className="relative max-w-4xl mx-auto p-4 sm:p-6 z-10">
        <button 
            onClick={onBack} 
            className="absolute top-4 left-4 bg-surface/50 backdrop-blur-md text-primary rounded-full h-10 w-10 flex items-center justify-center hover:bg-surface-light transition-colors"
            aria-label="Back"
        >
            <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <header className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 mb-8 mt-16 md:mt-24">
            <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-2xl bg-surface shadow-lg overflow-hidden flex-shrink-0 border-4 border-background">
                <TrackCover 
                    src={playlist.coverUrl} 
                    alt={playlist.name} 
                    className="absolute inset-0 w-full h-full"
                />
            </div>
            <div className="text-center md:text-left flex flex-col md:h-48">
                <div className="flex-grow overflow-hidden">
                    <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-primary mb-2">
                        {playlist.name}
                    </h1>
                    {playlist.description && (
                        <p className="text-text-secondary whitespace-pre-wrap leading-relaxed max-w-prose">{playlist.description}</p>
                    )}
                </div>
                <div className="flex-shrink-0 mt-4">
                     <button 
                        onClick={handlePlayPauseClick}
                        disabled={playlist.tracks.length === 0}
                        className={`font-bold px-8 py-3 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto md:mx-0 ${
                            isCurrentlyPlaying
                              ? 'bg-white text-background hover:bg-white/90 transform scale-105'
                              : 'bg-accent text-background hover:bg-opacity-80'
                          }`}
                    >
                        <ButtonIcon className="w-5 h-5"/>
                        <span>{buttonText}</span>
                    </button>
                </div>
            </div>
        </header>

        <div>
          <h2 className="text-2xl font-bold text-primary mb-4">Треки</h2>
          <div className="space-y-2">
            {sortedTracks.length > 0 ? sortedTracks.map((track, index) => {
              const isActive = track.id === currentTrackId;
              const isTrackLiked = likedTrackIds.includes(track.id);
              return (
              <div
                key={track.id}
                onClick={() => onPlayTrack(track.id)}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors duration-200 group ${isActive ? 'bg-surface-light' : 'hover:bg-surface'}`}
              >
                <div className="w-10 flex-shrink-0 text-center text-text-secondary mr-4">
                    {isActive ? (
                        <SoundWaveIcon isPlaying={isPlaying} className="w-5 h-5 mx-auto text-accent" />
                    ) : (
                       <div className="relative h-5 w-5 mx-auto">
                            <span className="absolute inset-0 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                                {index + 1}
                            </span>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <PlayIcon className="w-5 h-5 text-primary"/>
                            </div>
                        </div>
                    )}
                </div>
                <div className="relative w-12 h-12 rounded-md bg-surface overflow-hidden flex-shrink-0">
                  <TrackCover src={track.coverUrl} alt={track.title} className="w-full h-full" />
                </div>
                <div className="flex-grow mx-4">
                  <p className={`font-semibold ${isActive ? 'text-accent' : 'text-text'}`}>{track.title}</p>
                  <p className="text-sm text-text-secondary">{track.artist}</p>
                </div>
                <div className="flex items-center gap-4 text-text-secondary text-sm">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleLikeTrack(track.id); }} 
                      className={`${isTrackLiked ? 'text-accent' : 'text-text-secondary'} hover:text-primary transition-colors`}
                      aria-label={isTrackLiked ? 'Убрать лайк' : 'Поставить лайк'}
                    >
                        <HeartIcon filled={isTrackLiked} className="w-5 h-5" />
                    </button>
                </div>
              </div>
            )}) : (
                <div className="text-center text-text-secondary p-8 rounded-lg bg-surface/50">
                  {playlist.isFavorites ? (
                    <>
                      <p className="font-semibold">Здесь будут ваши любимые треки.</p>
                      <p className="text-sm mt-1">Нажмите на ♡ рядом с названием трека, чтобы добавить его.</p>
                    </>
                  ) : (
                    <p>В этом плейлисте пока нет треков.</p>
                  )}
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PlaylistDetailPage;