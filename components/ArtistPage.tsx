

import React, { useState, useEffect, useMemo } from 'react';
import type { Artist, Playlist, Track } from '../types';
import { PlayIcon, HeartIcon, ChevronLeftIcon, SoundWaveIcon, MatBadge } from './IconComponents';
import TrackCover from './TrackCover';

const AnimatedPlaceholder: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`bg-surface-light animate-pulse ${className}`} />
);

interface ArtistPageProps {
  artist: Artist;
  onBack: () => void;
  onPlayTrack: (trackId: string) => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  currentTrackId?: string | null;
  isPlaying: boolean;
  likedArtistIds: string[];
  likedTrackIds: string[];
  favoriteCollectionIds: string[];
  onToggleLike: (type: 'track' | 'artist' | 'album', id: string) => void;
  onOpenMatInfo: () => void;
}

const ArtistPage: React.FC<ArtistPageProps> = ({ artist, onBack, onPlayTrack, onSelectPlaylist, currentTrackId, isPlaying, likedArtistIds, likedTrackIds, favoriteCollectionIds, onToggleLike, onOpenMatInfo }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const isLiked = likedArtistIds.includes(artist.id);

  const sortedTracks = useMemo(() => 
    [...artist.tracks].sort((a, b) => (b.listens || 0) - (a.listens || 0)),
  [artist.tracks]);

  const sortedAlbums = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to the start of the day

    const upcoming = artist.albums
      .filter(album => album.releaseDate && new Date(album.releaseDate) >= today)
      .sort((a, b) => new Date(a.releaseDate!).getTime() - new Date(b.releaseDate!).getTime());

    const released = artist.albums
      .filter(album => !album.releaseDate || new Date(album.releaseDate) < today)
      .sort((a, b) => {
        if (!a.releaseDate || !b.releaseDate) return 0;
        return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      });
      
    return [...upcoming, ...released];
  }, [artist.albums]);


  useEffect(() => {
    setIsImageLoaded(false); 
    if (artist.photoUrl) {
      const img = new Image();
      img.src = artist.photoUrl;
      img.onload = () => setIsImageLoaded(true);
      img.onerror = () => setIsImageLoaded(true);
    } else {
      setIsImageLoaded(true); 
    }
  }, [artist.photoUrl]);

  return (
    <div className="min-h-screen bg-background text-text font-sans">
      <div className="absolute top-0 left-0 w-full h-72 md:h-96">
        {isImageLoaded && artist.photoUrl && (
          <>
            <img src={artist.photoUrl} alt="" className="w-full h-full object-cover opacity-30 blur-xl" aria-hidden="true"/>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
          </>
        )}
      </div>
      <main className="relative max-w-4xl mx-auto p-4 sm:p-6 z-10">
        <button 
            onClick={onBack} 
            className="absolute top-4 left-4 bg-surface/50 backdrop-blur-md text-primary rounded-full h-10 w-10 flex items-center justify-center hover:bg-surface-light transition-colors"
            aria-label="Back"
        >
            <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <header className="flex flex-col md:flex-row items-center gap-6 md:gap-10 mb-8 mt-16 md:mt-24">
            <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full bg-surface shadow-lg overflow-hidden flex-shrink-0 border-4 border-background">
                {!isImageLoaded && <AnimatedPlaceholder className="rounded-full w-full h-full" />}
                {artist.photoUrl && (
                     <img 
                        src={artist.photoUrl} 
                        alt={artist.name} 
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setIsImageLoaded(true)}
                    />
                )}
            </div>
            <div className="text-center md:text-left">
                <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-primary mb-2">
                    {artist.name}
                </h1>
                {artist.description && (
                    <p className="text-text-secondary whitespace-pre-wrap leading-relaxed max-w-prose mb-4">{artist.description}</p>
                )}
                <button 
                    onClick={() => onToggleLike('artist', artist.id)}
                    className={`px-6 py-2 rounded-full font-bold text-sm transition-colors duration-300 ${isLiked ? 'bg-accent text-background' : 'bg-surface-light text-text hover:bg-surface'}`}
                >
                    {isLiked ? 'Вы влюблены' : 'Влюбиться в исполнителя'}
                </button>
            </div>
        </header>
        
        {artist.status === 'иноагент' && (
          <div className="bg-surface border border-surface-light text-text-secondary text-sm p-4 rounded-xl mb-8">
            <p><strong>ВНИМАНИЕ:</strong> Данный исполнитель признан иностранным агентом на территории РФ.</p>
          </div>
        )}

        {sortedAlbums.length > 0 && (
            <div className="mt-12">
                <h2 className="text-2xl font-bold text-primary mb-4">Альбомы</h2>
                <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6">
                    {sortedAlbums.map(album => {
                        const isAlbumLiked = favoriteCollectionIds.includes(album.id);
                        const releaseDate = album.releaseDate ? new Date(album.releaseDate) : null;
                        const isUpcoming = releaseDate && releaseDate > new Date();
                        const releaseYear = releaseDate ? releaseDate.getFullYear() : null;
                        const formattedReleaseDate = releaseDate
                            ? releaseDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
                            : '';

                        const handleAlbumClick = () => {
                          if (!isUpcoming) {
                            onSelectPlaylist(album);
                          }
                        };

                        return (
                        <div key={album.id} className="group w-40 sm:w-48 flex-shrink-0">
                            <div className={`relative aspect-square w-full rounded-2xl shadow-lg overflow-hidden bg-surface ${isUpcoming ? 'cursor-default' : 'cursor-pointer'}`} onClick={handleAlbumClick}>
                                {album.coverType === 'video' && album.coverVideoUrl ? (
                                    <video src={album.coverVideoUrl} poster={album.coverUrl} autoPlay loop muted playsInline className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                ) : (
                                    <img src={album.coverUrl} alt={album.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                )}
                                {isUpcoming ? (
                                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-center p-2">
                                        <p className="font-bold text-primary text-lg">Скоро выйдет</p>
                                        <p className="text-sm text-text-secondary">{formattedReleaseDate}</p>
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                )}
                            </div>
                            <div className="mt-3 flex justify-between items-start">
                                <div className="overflow-hidden mr-2">
                                    <h3 className={`font-bold text-primary truncate ${isUpcoming ? '' : 'cursor-pointer'}`} onClick={handleAlbumClick}>{album.name}</h3>
                                    <p className="text-sm text-text-secondary">
                                      {releaseYear ? `${releaseYear} • ` : ''}{album.tracks.length} треков
                                    </p>
                                </div>
                                {!isUpcoming && (
                                    <button
                                      onClick={() => onToggleLike('album', album.id)}
                                      className={`${isAlbumLiked ? 'text-accent' : 'text-text-secondary'} hover:text-primary transition-colors p-1 -mr-1 flex-shrink-0`}
                                      aria-label={isAlbumLiked ? 'Убрать лайк с альбома' : 'Поставить лайк на альбом'}
                                    >
                                        <HeartIcon filled={isAlbumLiked} className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )})}
                </div>
            </div>
        )}

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-primary mb-4">Популярные треки</h2>
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
                <div className="flex-grow mx-4 flex justify-between items-start gap-4">
                  <div>
                    <p className={`font-semibold ${isActive ? 'text-accent' : 'text-text'}`}>{track.title}</p>
                    <p className="text-sm text-text-secondary">{track.artists.map(a => a.name).join(', ')}</p>
                  </div>
                  {track.mat && <div className="flex-shrink-0"><MatBadge onClick={onOpenMatInfo} /></div>}
                </div>
                <div className="flex items-center gap-4 text-text-secondary text-sm">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleLike('track', track.id); }} 
                      className={`${isTrackLiked ? 'text-accent' : 'text-text-secondary'} hover:text-primary transition-colors`}
                      aria-label={isTrackLiked ? 'Убрать лайк' : 'Поставить лайк'}
                    >
                        <HeartIcon filled={isTrackLiked} className="w-5 h-5" />
                    </button>
                </div>
              </div>
            )}) : (
                <p className="text-text-secondary">Треки этого исполнителя не найдены.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ArtistPage;