
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchAllTracks, fetchArtistDetails, loginUser, registerUser, updateUserLikes, fetchPlaylistsForUser, incrementTrackStats, fetchMediaAsset, fetchSimpleArtistsByIds, updateUserListeningTime, fetchAllArtists, fetchAllCollections, fetchTracksByIds, fetchPlaylistsByIds } from './services/airtableService';
import type { Track, Artist, User, Playlist, SimpleArtist, ImageAsset } from './types';
import Player from './components/Player';
import ArtistPage from './components/ArtistPage';
import MiniPlayer from './components/MiniPlayer';
import SplashScreen from './components/SplashScreen';
import AuthPage from './components/AuthPage';
import LibraryPage from './components/LibraryPage';
import PlaylistDetailPage from './components/PlaylistDetailPage';
import BetaLockScreen from './components/BetaLockScreen';
import ScannerModal from './components/ScannerModal';
import ProfilePage from './components/ProfilePage';
import MatInfoModal from './components/MatInfoModal';
import ArtistPageLoader from './components/ArtistPageLoader';

interface AppConfig {
  BETA_LOCK_MODE: 'on' | 'off';
}

const config: AppConfig = {
  BETA_LOCK_MODE: 'off', // 'on' or 'off'
};

const App: React.FC = () => {
  const [isBetaLocked, setIsBetaLocked] = useState(false);
  const [betaImageAsset, setBetaImageAsset] = useState<ImageAsset | null>(null);
  const [isCheckingBeta, setIsCheckingBeta] = useState(true);

  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  
  const [tracks, setTracks] = useState<Record<string, Track>>({});
  const [artists, setArtists] = useState<Record<string, SimpleArtist>>({});
  const [collections, setCollections] = useState<Record<string, Playlist>>({});

  const [userPlaylistIds, setUserPlaylistIds] = useState<string[]>([]);
  const [userLikedAlbumIds, setUserLikedAlbumIds] = useState<string[]>([]);
  const [userLikedArtistIds, setUserLikedArtistIds] = useState<string[]>([]);

  const [shuffledTracks, setShuffledTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCurrentTrackLoading, setIsCurrentTrackLoading] = useState(false);
  const [isLibraryHydrating, setIsLibraryHydrating] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ currentTime: 0, duration: 0 });
  const [initialSeekTime, setInitialSeekTime] = useState<number | null>(null);

  const [view, setView] = useState<'library' | 'artist' | 'playlistDetail' | 'profile'>('library');
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isArtistLoading, setIsArtistLoading] = useState<boolean>(false);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedTrackId, setScannedTrackId] = useState<string | null>(null);
  const [isMatInfoModalOpen, setIsMatInfoModalOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const currentTrack = currentTrackIndex !== null && shuffledTracks.length > 0 ? shuffledTracks[currentTrackIndex] : null;

  useEffect(() => {
    const checkBetaStatus = async () => {
      if (config.BETA_LOCK_MODE === 'on' && window.location.hostname === 'joysic.netlify.app') {
        setIsBetaLocked(true);
        try {
          const asset = await fetchMediaAsset('beta-lock');
          setBetaImageAsset(asset || { full: 'https://i.postimg.cc/T3N3W0h1/beta-lock.png' });
        } catch (error) {
          console.error("Failed to fetch beta image, using fallback.", error);
          setBetaImageAsset({ full: 'https://i.postimg.cc/T3N3W0h1/beta-lock.png' });
        }
      } else {
        setIsBetaLocked(false);
      }
      setIsCheckingBeta(false);
    };
    checkBetaStatus();
  }, []);

  useEffect(() => {
    if (isCheckingBeta || isBetaLocked) return;

    const authenticateUser = () => {
      const savedUserString = localStorage.getItem('joysicUser');
      if (savedUserString) {
        try {
          setUser(JSON.parse(savedUserString));
        } catch (error) {
          console.error("Failed to parse user from localStorage", error);
          localStorage.removeItem('joysicUser');
        }
      }
      setIsAuthLoading(false);
    };

    authenticateUser();
  }, [isCheckingBeta, isBetaLocked]);
  
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
        setUser(currentUser => {
            if (!currentUser) return null;
            const newTotalMinutes = (currentUser.totalListeningMinutes || 0) + (5 / 60);
            const updatedUser: User = { ...currentUser, totalListeningMinutes: newTotalMinutes };
            localStorage.setItem('joysicUser', JSON.stringify(updatedUser));
            updateUserListeningTime(updatedUser.id, newTotalMinutes).catch(err => console.error("Failed to sync listening time:", err));
            return updatedUser;
        });
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const loadData = useCallback(async () => {
    if (!user) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);

    try {
        // STAGE 1: Load essential user data for an instantly interactive app
        const [fetchedPlaylistsData, fetchedLikedArtists] = await Promise.all([
            fetchPlaylistsForUser(user),
            fetchSimpleArtistsByIds(user.likedArtistIds),
        ]);
        
        const essentialTrackIds = new Set<string>();
        user.likedTrackIds.forEach(id => essentialTrackIds.add(id));
        fetchedPlaylistsData.playlists.forEach(p => p.trackIds.forEach(id => essentialTrackIds.add(id)));
        fetchedPlaylistsData.likedAlbums.forEach(p => p.trackIds.forEach(id => essentialTrackIds.add(id)));
        
        const essentialTracks = await fetchTracksByIds(Array.from(essentialTrackIds));
        
        const essentialArtistIds = new Set<string>(user.likedArtistIds);
        essentialTracks.forEach(t => t.artistIds.forEach(id => essentialArtistIds.add(id)));
        
        const essentialArtists = await fetchSimpleArtistsByIds(Array.from(essentialArtistIds));
        
        const newArtists = { ...artists };
        essentialArtists.forEach(a => newArtists[a.id] = a);
        fetchedLikedArtists.forEach(a => newArtists[a.id] = a);

        const newTracks = { ...tracks };
        essentialTracks.forEach(t => {
            newTracks[t.id] = {
                ...t,
                artists: t.artistIds.map(id => newArtists[id]).filter(Boolean)
            };
        });
        
        const newCollections = { ...collections };
        fetchedPlaylistsData.playlists.forEach(p => newCollections[p.id] = { ...p, tracks: p.trackIds.map(id => newTracks[id]).filter(Boolean), isHydrated: true });
        fetchedPlaylistsData.likedAlbums.forEach(p => newCollections[p.id] = { ...p, tracks: p.trackIds.map(id => newTracks[id]).filter(Boolean), isHydrated: true });
        
        setArtists(newArtists);
        setTracks(newTracks);
        setCollections(newCollections);
        
        setUserPlaylistIds(fetchedPlaylistsData.playlists.map(p => p.id));
        setUserLikedAlbumIds(fetchedPlaylistsData.likedAlbums.map(p => p.id));
        setUserLikedArtistIds(fetchedLikedArtists.map(a => a.id));

        setIsLoading(false);

        // STAGE 2: Hydrate the full library in the background for search
        setIsLibraryHydrating(true);
        const [allArtistRecords, allFetchedTracks, fetchedAllCollections] = await Promise.all([
            fetchAllArtists(),
            fetchAllTracks(),
            fetchAllCollections(),
        ]);
        
        setArtists(prev => {
            const updated = { ...prev };
            allArtistRecords.forEach(a => updated[a.id] = a);
            return updated;
        });

        setCollections(prev => {
            const updated = { ...prev };
            fetchedAllCollections.forEach(c => {
                if (!updated[c.id]) updated[c.id] = c;
            });
            return updated;
        });

        setTracks(prev => {
            const updated = { ...prev };
            allFetchedTracks.forEach(t => {
                 updated[t.id] = {
                     ...t,
                     artists: t.artistIds.map(id => artists[id]).filter(Boolean)
                 };
            });
            return updated;
        });

        setIsLibraryHydrating(false);

    } catch (err: any) {
        setError(err.message || 'Failed to load data.');
        console.error(err);
        setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && !isAuthLoading) {
      loadData();
    }
  }, [user, isAuthLoading, loadData]);

  // Audio Preloading Effect
  useEffect(() => {
    if (!currentTrack || !shuffledTracks.length || currentTrackIndex === null) return;

    const nextIndex = (currentTrackIndex + 1) % shuffledTracks.length;
    if (nextIndex === currentTrackIndex) return; 

    const nextTrack = shuffledTracks[nextIndex];

    if (nextTrack && nextTrack.audioUrl) {
        if (!preloadAudioRef.current) {
            preloadAudioRef.current = new Audio();
            preloadAudioRef.current.crossOrigin = "anonymous";
        }
        if (preloadAudioRef.current.src !== nextTrack.audioUrl) {
            preloadAudioRef.current.src = nextTrack.audioUrl;
            preloadAudioRef.current.load();
        }
    }
  }, [currentTrack, currentTrackIndex, shuffledTracks]);

  // Reworked Audio Playback Logic for Reliability
  useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;

      if (currentTrack) {
          // Change source if different
          if (audio.src !== currentTrack.audioUrl) {
              setIsCurrentTrackLoading(true);
              audio.src = currentTrack.audioUrl;
              audio.load();
          }

          // Handle play/pause based on state, but only if not loading
          if (isPlaying && !isCurrentTrackLoading) {
              audio.play().catch(error => {
                  if (error.name !== 'AbortError') {
                      console.error("Error playing audio:", error);
                      setIsPlaying(false); // Sync state on failure
                  }
              });
          } else {
              audio.pause();
          }
      } else {
          // No track, ensure it's paused
          audio.pause();
          setIsPlaying(false);
      }
  }, [currentTrack, isPlaying, isCurrentTrackLoading]);


  useEffect(() => {
      if (scannedTrackId) {
          const allTracksArray = Object.values(tracks);
          playTrackById(scannedTrackId, allTracksArray);
          setScannedTrackId(null);
      }
  }, [scannedTrackId, tracks]);

  const playTrackById = (trackId: string, playlistContext?: Track[]) => {
      const sourceTracks = playlistContext || Object.values(tracks);
      const trackIndex = sourceTracks.findIndex(t => t.id === trackId);
      if (trackIndex !== -1) {
          setShuffledTracks(sourceTracks);
          setCurrentTrackIndex(trackIndex);
          setIsPlaying(true);
          setInitialSeekTime(0);

          const track = sourceTracks[trackIndex];
          incrementTrackStats(track.id, 'Прослушивания', track.listens, 1).catch(err => console.error("Failed to increment listens", err));
          setTracks(prev => ({...prev, [trackId]: {...prev[trackId], listens: prev[trackId].listens + 1}}));
      } else {
          console.warn(`Track with id ${trackId} not found.`);
      }
  };

  const handleSelectPlaylist = (playlist: Playlist) => {
    setSelectedPlaylistId(playlist.id);
    setView('playlistDetail');
  };

  const handleSelectArtistById = async (artistId: string) => {
      setIsArtistLoading(true);
      setView('artist');
      try {
          const artistDetails = await fetchArtistDetails(artistId);
          
          const hydratedTracks = artistDetails.tracks.map(t => ({
              ...t,
              artists: t.artistIds.map(id => artists[id]).filter(Boolean)
          }));
          const hydratedAlbums = artistDetails.albums.map(a => ({
            ...a,
            tracks: a.trackIds.map(id => tracks[id]).filter(Boolean)
          }));

          setSelectedArtist({
            ...artistDetails,
            tracks: hydratedTracks,
            albums: hydratedAlbums
          });

      } catch (error) {
          console.error("Failed to fetch artist details", error);
          setError(`Failed to fetch artist details: ${error instanceof Error ? error.message : String(error)}`);
          setView('library');
      } finally {
          setIsArtistLoading(false);
      }
  };

  const handlePlayPause = () => {
    if (currentTrack) {
      setIsPlaying(!isPlaying);
    }
  };

  const handleNextTrack = useCallback(() => {
    if (shuffledTracks.length > 0) {
      setCurrentTrackIndex(prev => (prev === null ? 0 : (prev + 1) % shuffledTracks.length));
      setIsPlaying(true);
    }
  }, [shuffledTracks.length]);

  const handlePrevTrack = () => {
    if (shuffledTracks.length > 0) {
        if (audioRef.current && audioRef.current.currentTime > 3) {
            audioRef.current.currentTime = 0;
        } else {
            setCurrentTrackIndex(prev => (prev === null ? 0 : (prev - 1 + shuffledTracks.length) % shuffledTracks.length));
        }
        setIsPlaying(true);
    }
  };

  const handleSeek = (newTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress({
        currentTime: audioRef.current.currentTime,
        duration: audioRef.current.duration,
      });
    }
  };

  const handleCanPlay = () => {
    setIsCurrentTrackLoading(false);
    if (audioRef.current && initialSeekTime !== null) {
      audioRef.current.currentTime = initialSeekTime;
      setInitialSeekTime(null);
    }
    if (isPlaying) {
      audioRef.current?.play().catch(e => console.error("Autoplay failed on CanPlay:", e));
    }
  };
  
  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error("Audio Error:", e.nativeEvent);
    setIsPlaying(false);
    setIsCurrentTrackLoading(false);
    setError("Ошибка воспроизведения трека. Он может быть поврежден или недоступен.");
  };

  const handleToggleLike = async (type: 'track' | 'artist' | 'album', id: string) => {
    if (!user) return;

    let updatedUser: User = user;
    let updates: { likedTrackIds?: string[], likedArtistIds?: string[], favoriteCollectionIds?: string[] } = {};

    if (type === 'track') {
        const isLiked = user.likedTrackIds.includes(id);
        const newLikedTrackIds = isLiked ? user.likedTrackIds.filter(tid => tid !== id) : [...user.likedTrackIds, id];
        updatedUser = { ...user, likedTrackIds: newLikedTrackIds };
        updates.likedTrackIds = newLikedTrackIds;
        
        const track = tracks[id];
        if (track) {
            const newLikes = track.likes + (isLiked ? -1 : 1);
            setTracks(prev => ({...prev, [id]: {...prev[id], likes: newLikes}}));
            incrementTrackStats(id, 'Лайки', track.likes, isLiked ? -1 : 1).catch(err => console.error("Failed to update likes", err));
        }

    } else if (type === 'artist') {
        const isLiked = user.likedArtistIds.includes(id);
        const newLikedArtistIds = isLiked ? user.likedArtistIds.filter(aid => aid !== id) : [...user.likedArtistIds, id];
        updatedUser = { ...user, likedArtistIds: newLikedArtistIds };
        updates.likedArtistIds = newLikedArtistIds;
        setUserLikedArtistIds(newLikedArtistIds);

    } else if (type === 'album') {
        const isLiked = user.favoriteCollectionIds.includes(id);
        const newFavoriteCollectionIds = isLiked ? user.favoriteCollectionIds.filter(cid => cid !== id) : [...user.favoriteCollectionIds, id];
        updatedUser = { ...user, favoriteCollectionIds: newFavoriteCollectionIds };
        updates.favoriteCollectionIds = newFavoriteCollectionIds;
        setUserLikedAlbumIds(newFavoriteCollectionIds.filter(cid => collections[cid]?.collectionType === 'альбом'));
    }

    setUser(updatedUser);
    localStorage.setItem('joysicUser', JSON.stringify(updatedUser));
    await updateUserLikes(user, updates).catch(err => {
      console.error("Failed to sync likes", err);
      setUser(user);
      localStorage.setItem('joysicUser', JSON.stringify(user));
    });
  };

  const isCurrentTrackLiked = () => {
      return !!user && !!currentTrack && user.likedTrackIds.includes(currentTrack.id);
  };
  
  const handleToggleLikeCurrentTrack = () => {
      if (currentTrack) {
          handleToggleLike('track', currentTrack.id);
      }
  };

  const handleShufflePlay = () => {
    const allTracksArray = Object.values(tracks);
    if (allTracksArray.length > 0) {
      const shuffled = [...allTracksArray].sort(() => 0.5 - Math.random());
      setShuffledTracks(shuffled);
      setCurrentTrackIndex(0);
      setIsPlaying(true);
      setInitialSeekTime(0);
    }
  };

  const handleLogin = async (email: string, pass: string) => {
    const loggedInUser = await loginUser(email, pass);
    setUser(loggedInUser);
    localStorage.setItem('joysicUser', JSON.stringify(loggedInUser));
  };

  const handleRegister = async (email: string, pass: string, name: string) => {
    const newUser = await registerUser(email, pass, name);
    setUser(newUser);
    localStorage.setItem('joysicUser', JSON.stringify(newUser));
  };
  
  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('joysicUser');
      setTracks({});
      setCollections({});
      setArtists({});
      setCurrentTrackIndex(null);
      setIsPlaying(false);
      setView('library');
  };

  const handleScanSuccess = (decodedText: string) => {
      setIsScannerOpen(false);
      const trackExists = !!tracks[decodedText];
      if (trackExists) {
          setScannedTrackId(decodedText);
      } else {
          alert("Отсканированный трек не найден в медиатеке.");
      }
  };
  
  if (isCheckingBeta) {
    return <SplashScreen />;
  }

  if (isBetaLocked) {
    return <BetaLockScreen imageAsset={betaImageAsset} />;
  }

  if (isAuthLoading) {
    return <SplashScreen />;
  }
  
  if (!user) {
    return <AuthPage onLogin={handleLogin} onRegister={handleRegister} />;
  }

  if (error && view !== 'library') {
    // If there's an error, force back to library view to show it
    setView('library');
  }
  
  if (error && view === 'library') {
    return (
      <div className="bg-background min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-4xl font-black text-primary mb-4">Что-то пошло не так</h1>
        <p className="text-text-secondary mb-8 max-w-sm">{error}</p>
        <button 
          onClick={() => {
            setError(null);
            loadData();
          }}
          className="bg-accent text-background font-bold py-3 px-6 rounded-full hover:bg-opacity-80 transition-colors"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <div className="bg-background min-h-screen font-sans text-text">
      <main className={`transition-all duration-500 ease-in-out ${currentTrack ? 'pb-20' : ''}`}>
        {view === 'library' && (
          <LibraryPage
            user={user}
            playlistIds={userPlaylistIds}
            likedAlbumIds={userLikedAlbumIds}
            likedArtistIds={userLikedArtistIds}
            tracks={tracks}
            artists={artists}
            collections={collections}
            isLibraryHydrating={isLibraryHydrating}
            onSelectPlaylist={handleSelectPlaylist}
            onSelectArtist={handleSelectArtistById}
            onPlayTrack={playTrackById}
            onShufflePlayAll={handleShufflePlay}
            onNavigateToProfile={() => setView('profile')}
            onOpenScanner={() => setIsScannerOpen(true)}
            currentTrackId={currentTrack?.id}
            isPlaying={isPlaying}
            onOpenMatInfo={() => setIsMatInfoModalOpen(true)}
          />
        )}
        {view === 'artist' && (
          isArtistLoading ? (
            <ArtistPageLoader />
          ) : selectedArtist ? (
            <ArtistPage
              artist={selectedArtist}
              onBack={() => setView('library')}
              onPlayTrack={(trackId) => playTrackById(trackId, selectedArtist.tracks)}
              onSelectPlaylist={handleSelectPlaylist}
              currentTrackId={currentTrack?.id}
              isPlaying={isPlaying}
              likedArtistIds={user.likedArtistIds}
              likedTrackIds={user.likedTrackIds}
              favoriteCollectionIds={user.favoriteCollectionIds}
              onToggleLike={handleToggleLike}
              onOpenMatInfo={() => setIsMatInfoModalOpen(true)}
            />
          ) : null
        )}
        {view === 'playlistDetail' && selectedPlaylistId && collections[selectedPlaylistId] && (
          <PlaylistDetailPage
            playlist={collections[selectedPlaylistId]}
            onBack={() => setView('library')}
            onPlayTrack={(trackId) => playTrackById(trackId, collections[selectedPlaylistId].tracks)}
            currentTrackId={currentTrack?.id}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            likedTrackIds={user.likedTrackIds}
            favoriteCollectionIds={user.favoriteCollectionIds}
            onToggleLike={handleToggleLike}
            onOpenMatInfo={() => setIsMatInfoModalOpen(true)}
          />
        )}
        {view === 'profile' && (
          <ProfilePage
            user={user}
            stats={{
              likedTracksCount: user.likedTrackIds.length,
              likedArtistsCount: user.likedArtistIds.length,
              likedAlbumsCount: userLikedAlbumIds.length,
            }}
            onBack={() => setView('library')}
            onLogout={handleLogout}
          />
        )}
      </main>

      {currentTrack && (
        isPlayerExpanded ? (
          <div className="fixed inset-0 z-50 animate-fadeInScaleUp">
            <Player
              track={currentTrack}
              isPlaying={isPlaying}
              progress={progress}
              isLiked={isCurrentTrackLiked()}
              onPlayPause={handlePlayPause}
              onNext={handleNextTrack}
              onPrev={handlePrevTrack}
              onSeek={handleSeek}
              onSelectArtist={handleSelectArtistById}
              onMinimize={() => setIsPlayerExpanded(false)}
              onToggleLike={handleToggleLikeCurrentTrack}
              onOpenMatInfo={() => setIsMatInfoModalOpen(true)}
            />
          </div>
        ) : (
          <div className="fixed bottom-0 left-0 right-0 z-40 animate-fadeInScaleUp">
            <MiniPlayer
              track={currentTrack}
              isPlaying={isPlaying}
              progress={(progress.duration > 0) ? (progress.currentTime / progress.duration) * 100 : 0}
              onPlayPause={handlePlayPause}
              onExpand={() => setIsPlayerExpanded(true)}
              onOpenMatInfo={() => setIsMatInfoModalOpen(true)}
            />
          </div>
        )
      )}

      {isScannerOpen && (
        <ScannerModal
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
        />
      )}
      
      {isMatInfoModalOpen && (
        <MatInfoModal onClose={() => setIsMatInfoModalOpen(false)} />
      )}

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onCanPlay={handleCanPlay}
        onLoadedData={handleCanPlay} // Fallback for some browsers
        onEnded={handleNextTrack}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={handleAudioError}
        crossOrigin="anonymous"
      />
    </div>
  );
};

export default App;