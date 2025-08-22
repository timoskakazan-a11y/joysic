
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchTracks, fetchArtistDetails } from './services/airtableService';
import type { Track, Artist } from './types';
import Player from './components/Player';
import ArtistPage from './components/ArtistPage';
import MiniPlayer from './components/MiniPlayer';

const App: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [shuffledTracks, setShuffledTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ currentTime: 0, duration: 0 });

  const [view, setView] = useState<'player' | 'artist'>('player');
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [isArtistLoading, setIsArtistLoading] = useState<boolean>(false);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState<boolean>(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrack = currentTrackIndex !== null && shuffledTracks.length > 0 ? shuffledTracks[currentTrackIndex] : null;

  useEffect(() => {
    const loadTracks = async () => {
      try {
        setIsLoading(true);
        const fetchedTracks = await fetchTracks();
        setTracks(fetchedTracks);

        const shuffled = [...fetchedTracks].sort(() => Math.random() - 0.5);
        setShuffledTracks(shuffled);

        if (shuffled.length > 0) {
            setCurrentTrackIndex(0);
        }
        setError(null);
      } catch (err) {
        setError('Failed to load tracks. Please check your connection and Airtable configuration.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadTracks();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack) {
        if (audio.src !== currentTrack.audioUrl) {
            audio.src = currentTrack.audioUrl;
        }

        if (isPlaying) {
            audio.play().catch(error => {
                if (error.name !== 'AbortError') {
                    console.error("Audio playback error:", error);
                    setIsPlaying(false);
                }
            });
        } else {
            audio.pause();
        }
    }
  }, [currentTrack, isPlaying]);
  
  const handlePlayPause = useCallback(() => {
    if (currentTrackIndex === null && shuffledTracks.length > 0) {
        setCurrentTrackIndex(0);
    }
    setIsPlaying(prev => !prev);
  }, [currentTrackIndex, shuffledTracks]);

  const handleNextTrack = useCallback(() => {
    if (shuffledTracks.length === 0) return;
    setCurrentTrackIndex(prevIndex => {
      if (prevIndex === null || prevIndex === shuffledTracks.length - 1) {
        return 0;
      }
      return prevIndex + 1;
    });
    if (!isPlaying) {
      setIsPlaying(true);
    }
  }, [shuffledTracks, isPlaying]);

  const handlePrevTrack = useCallback(() => {
    if (shuffledTracks.length === 0) return;
    setCurrentTrackIndex(prevIndex => {
      if (prevIndex === null || prevIndex === 0) {
        return shuffledTracks.length - 1;
      }
      return prevIndex - 1;
    });
    if (!isPlaying) {
      setIsPlaying(true);
    }
  }, [shuffledTracks, isPlaying]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress({
        currentTime: audioRef.current.currentTime,
        duration: audioRef.current.duration || 0,
      });
    }
  };
  
  const handleSeek = (newTime: number) => {
    if (audioRef.current) {
        audioRef.current.currentTime = newTime;
        setProgress(prev => ({...prev, currentTime: newTime}));
    }
  };

  const handleSelectArtist = async (artistId: string) => {
    setIsArtistLoading(true);
    setView('artist');
    try {
      const artistDetails = await fetchArtistDetails(artistId);
      setSelectedArtist(artistDetails);
    } catch (err) {
      setError(`Failed to load artist details.`);
      console.error(err);
    } finally {
      setIsArtistLoading(false);
    }
  };

  const handleCloseArtistPage = () => {
    setView('player');
    setSelectedArtist(null);
    setIsPlayerExpanded(true);
  };
  
  const handlePlayTrackFromArtistPage = (trackId: string) => {
    const newShuffledIndex = shuffledTracks.findIndex(t => t.id === trackId);
    if (newShuffledIndex !== -1) {
        if (newShuffledIndex === currentTrackIndex) {
            handlePlayPause();
        } else {
            setCurrentTrackIndex(newShuffledIndex);
            setIsPlaying(true);
        }
    }
    setIsPlayerExpanded(false);
  };
  
  const handleExpandPlayer = () => setIsPlayerExpanded(true);
  const handleMinimizePlayer = () => setIsPlayerExpanded(false);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-text flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-surface-light"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-text flex justify-center items-center p-4">
        <p className="text-center text-red-400 bg-red-500/10 p-4 rounded-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text font-sans">
      <main className="transition-all duration-500">
        {view === 'artist' && (
          isArtistLoading || !selectedArtist ? (
            <div className="min-h-screen flex justify-center items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-surface-light"></div>
            </div>
          ) : (
            <ArtistPage 
              artist={selectedArtist} 
              onBack={handleCloseArtistPage} 
              onPlayTrack={handlePlayTrackFromArtistPage}
              currentTrackId={currentTrack?.id}
              isPlaying={isPlaying}
            />
          )
        )}
      </main>

      {currentTrack && (
        <>
          <div className={`fixed inset-0 z-50 transition-transform duration-500 ease-in-out ${isPlayerExpanded ? 'translate-y-0' : 'translate-y-full'}`}>
            <Player
              track={currentTrack}
              isPlaying={isPlaying}
              progress={progress}
              onPlayPause={handlePlayPause}
              onNext={handleNextTrack}
              onPrev={handlePrevTrack}
              onSeek={handleSeek}
              onSelectArtist={handleSelectArtist}
              onMinimize={handleMinimizePlayer}
            />
          </div>
          <div className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-500 ease-in-out ${!isPlayerExpanded && view === 'artist' ? 'translate-y-0' : 'translate-y-full'}`}>
             <MiniPlayer 
                track={currentTrack}
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                onExpand={handleExpandPlayer}
                progress={progress.duration > 0 ? (progress.currentTime / progress.duration) * 100 : 0}
             />
          </div>
        </>
      )}

      {!currentTrack && view === 'player' && (
         <div className="min-h-screen flex justify-center items-center p-4 text-center text-text-secondary">
            <div>
              <h2 className="text-2xl font-bold text-text mb-2">Треки не найдены</h2>
              <p>Убедитесь, что ваша база Airtable содержит треки.</p>
            </div>
          </div>
      )}

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedData={handleTimeUpdate}
        onEnded={handleNextTrack}
        className="hidden"
      />
    </div>
  );
};

export default App;