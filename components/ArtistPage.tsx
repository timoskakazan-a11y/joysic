import React, { useState, useEffect } from 'react';
import type { Artist } from '../types';
import { PlayIcon, PauseIcon, ChevronLeftIcon, SoundWaveIcon } from './IconComponents';

const AnimatedPlaceholder: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`bg-surface-light animate-pulse ${className}`} />
);

interface ArtistPageProps {
  artist: Artist;
  onBack: () => void;
  onPlayTrack: (trackId: string) => void;
  currentTrackId?: string;
  isPlaying: boolean;
  likedArtistIds: string[];
  onToggleLikeArtist: (artistId: string) => void;
}

const ArtistPage: React.FC<ArtistPageProps> = ({ artist, onBack, onPlayTrack, currentTrackId, isPlaying, likedArtistIds, onToggleLikeArtist }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const isLiked = likedArtistIds.includes(artist.id);

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
      <main className="max-w-4xl mx-auto p-4 sm:p-6">
        <header className="flex flex-col md:flex-row items-center gap-6 md:gap-10 mb-8 mt-4">
            <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full bg-surface shadow-lg overflow-hidden flex-shrink-0">
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
                    onClick={() => onToggleLikeArtist(artist.id)}
                    className={`px-6 py-2 rounded-full font-bold text-sm transition-colors duration-300 ${isLiked ? 'bg-accent text-background' : 'bg-surface-light text-text hover:bg-surface'}`}
                >
                    {isLiked ? 'Вы влюблены' : 'Влюбиться в исполнителя'}
                </button>
            </div>
        </header>
        
        <button 
            onClick={onBack} 
            className="absolute top-4 left-4 bg-surface/50 backdrop-blur-md text-primary rounded-full h-10 w-10 flex items-center justify-center hover:bg-surface-light transition-colors"
            aria-label="Back"
        >
            <ChevronLeftIcon className="w-6 h-6" />
        </button>
      
        {artist.status === 'иноагент' && (
          <div className="bg-surface border border-surface-light text-text-secondary text-sm p-4 rounded-xl mb-8">
            <p><strong>ВНИМАНИЕ:</strong> Данный исполнитель признан иностранным агентом на территории РФ.</p>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold text-primary mb-4">Треки</h2>
          <div className="space-y-2">
            {artist.tracks.length > 0 ? artist.tracks.map((track, index) => {
              const isActive = track.id === currentTrackId;
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
                        <>
                            <span className="group-hover:hidden transition-opacity">{index + 1}</span>
                            <div className="hidden group-hover:block">
                                <PlayIcon className="w-5 h-5 mx-auto text-primary"/>
                            </div>
                        </>
                    )}
                </div>
                <div className="relative w-12 h-12 rounded-md bg-surface overflow-hidden flex-shrink-0">
                  <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow mx-4">
                  <p className={`font-black ${isActive ? 'text-accent' : 'text-text'}`}>{track.title}</p>
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