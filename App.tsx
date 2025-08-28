


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchTracks, fetchArtistDetails, loginUser, registerUser, updateUserLikes, fetchPlaylistsForUser, incrementTrackStats, fetchBetaImage, fetchSimpleArtistsByIds, updateUserListeningTime, fetchAllArtists, fetchAllCollections } from './services/airtableService';
import type { Track, Artist, User, Playlist, SimpleArtist } from './types';
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

interface AppConfig {
  BETA_LOCK_MODE: 'on' | 'off';
}

const config: AppConfig = {
  BETA_LOCK_MODE: 'off', // 'on' or 'off'
};

// FIX: Added a return statement with the application's JSX structure, resolving the error where the component was returning 'void'.
const App: React.FC = () => {
  const [isBetaLocked, setIsBetaLocked] = useState(false);
  const [betaImageUrl, setBetaImageUrl] = useState<string | null>(null);
  const [isCheckingBeta, setIsCheckingBeta] = useState(true);

  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  
  const [favoritesPlaylistId, setFavoritesPlaylistId] = useState<string | undefined>();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedAlbums, setLikedAlbums] = useState<Playlist[]>([]);
  const [likedArtists, setLikedArtists] = useState<SimpleArtist[]>([]);
  const [allArtists, setAllArtists] = useState<SimpleArtist[]>([]);
  const [allCollections, setAllCollections] = useState<Playlist[]>([]);
  const [shuffledTracks, setShuffledTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ currentTime: 0, duration: 0 });
  const [initialSeekTime, setInitialSeekTime] = useState<number | null>(null);

  const [view, setView] = useState<'library' | 'artist' | 'playlistDetail' | 'profile'>('library');
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isArtistLoading, setIsArtistLoading] = useState<boolean>(false);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedTrackId, setScannedTrackId] = useState<string | null>(null);
  const [isMatInfoModalOpen, setIsMatInfoModalOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerSyncInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const currentTrack = currentTrackIndex !== null && shuffledTracks.length > 0 ? shuffledTracks[currentTrackIndex] : null;

  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);


  useEffect(() => {
    const checkBetaStatus = async () => {
      if (config.BETA_LOCK_MODE === 'on' && window.location.hostname === 'joysic.netlify.app') {
        setIsBetaLocked(true);
        try {
          const url = await fetchBetaImage();
          setBetaImageUrl(url || 'https://i.postimg.cc/T3N3W0h1/beta-lock.png');
        } catch (error) {
          console.error("Failed to fetch beta image, using fallback.", error);
          setBetaImageUrl('https://i.postimg.cc/T3N3W0h1/beta-lock.png');
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
  
  // Effect for tracking listening time in the background
  useEffect(() => {
    if (playerSyncInterval.current) {
      clearInterval(playerSyncInterval.current);
    }

    if (isPlaying) {
      playerSyncInterval.current = setInterval(() => {
        const currentUser = userRef.current;

        if (!currentUser) return;

        // Increment time and update user ref without causing a re-render
        const newTotalMinutes = (currentUser.totalListeningMinutes || 0) + (5 / 60);
        const updatedUserForStorage: User = { ...currentUser, totalListeningMinutes: newTotalMinutes };
        userRef.current = updatedUserForStorage;
        localStorage.setItem('joysicUser', JSON.stringify(updatedUserForStorage));
        
        updateUserListeningTime(currentUser.id, newTotalMinutes).catch(err => {
          console.error("Failed to sync listening time:", err);
        });
      }, 5000); // Sync every 5 seconds
    }

    return () => {
      if (playerSyncInterval.current) {
        clearInterval(playerSyncInterval.current);
      }
    };
  }, [isPlaying]);

  const loadData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedTracks, fetchedPlaylistsData, fetchedLikedArtists, fetchedAllArtists, fetchedAllCollections] = await Promise.all([
        fetchTracks(),
        fetchPlaylistsForUser(user),
        fetchSimpleArtistsByIds(user.likedArtistIds),
        fetchAllArtists(),
        fetchAllCollections(),
      ]);

      setTracks(fetchedTracks);
      setAllArtists(fetchedAllArtists);
      setAllCollections(fetchedAllCollections);

      const trackMap = new Map(fetchedTracks.map(t => [t.id, t]));
      
      const populatedPlaylists = fetchedPlaylistsData.playlists.map(p => ({
          ...p,
          tracks: p.trackIds.map(id => trackMap.get(id)).filter((t): t is Track => t !== undefined)
      }));

      const populatedLikedAlbums = fetchedPlaylistsData.likedAlbums.map(p => ({
          ...p,
          tracks: p.trackIds.map(id => trackMap.get(id)).filter((t): t is Track => t !== undefined)
      }));

      setPlaylists(populatedPlaylists);
      setLikedAlbums(populatedLikedAlbums);
      setLikedArtists(fetchedLikedArtists);
      setFavoritesPlaylistId(fetchedPlaylistsData.favoritesPlaylistId);

      const favoritesPlaylist = populatedPlaylists.find(p => p.id === fetchedPlaylistsData.favoritesPlaylistId);
      if (favoritesPlaylist) {
        const updatedUser = { ...user, likedTrackIds: favoritesPlaylist.trackIds };
        setUser(updatedUser);
        localStorage.setItem('joysicUser', JSON.stringify(updatedUser));
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load data.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && !isAuthLoading) {
      loadData();
    }
  }, [user, isAuthLoading, loadData]);

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      const currentSrc = audioRef.current.currentSrc;
      const newSrc = currentTrack.audioUrl;
      
      if (!currentSrc || !currentSrc.endsWith(encodeURI(newSrc.substring(newSrc.lastIndexOf('/') + 1)))) {
          audioRef.current.src = newSrc;
      }
      
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Error auto-playing track:", e));
      }
    }
  }, [currentTrack, isPlaying]);

  useEffect(() => {
      if (audioRef.current && currentTrack) {
          if (isPlaying) {
              audioRef.current.play().catch(e => console.error("Error playing audio:", e));
          } else {
              audioRef.current.pause();
          }
      }
  }, [isPlaying, currentTrack?.id]);
  
  useEffect(() => {
      if (scannedTrackId) {
          playTrackById(scannedTrackId);
          setScannedTrackId(null); // Reset after playing
      }
  }, [scannedTrackId, tracks]);

  const playTrackById = (trackId: string, playlistContext?: Track[]) => {
      const sourceTracks = playlistContext || tracks;
      const trackIndex = sourceTracks.findIndex(t => t.id === trackId);
      if (trackIndex !== -1) {
          setShuffledTracks(sourceTracks);
          setCurrentTrackIndex(trackIndex);
          setIsPlaying(true);
          setInitialSeekTime(0); // Start from beginning

          // Increment listens count optimistically
          const track = sourceTracks[trackIndex];
          incrementTrackStats(track.id, 'Прослушивания', track.listens, 1).catch(err => console.error("Failed to increment listens", err));
          // Update local state to reflect change immediately
          setTracks(prev => prev.map(t => t.id === trackId ? {...t, listens: t.listens + 1} : t));
      } else {
          console.warn(`Track with id ${trackId} not found.`);
      }
  };

  const handleSelectPlaylist = (playlist: Playlist) => {
    const populatedPlaylist = {
        ...playlist,
        tracks: playlist.trackIds.map(id => tracks.find(t => t.id === id)).filter((t): t is Track => !!t)
    };
    setSelectedPlaylist(populatedPlaylist);
    setView('playlistDetail');
  };

  const handleSelectArtistById = async (artistId: string) => {
      setIsArtistLoading(true);
      setView('artist');
      try {
          const artistDetails = await fetchArtistDetails(artistId);
          setSelectedArtist(artistDetails);
      } catch (error) {
          console.error("Failed to fetch artist details", error);
          setView('library'); // Go back if artist fails to load
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

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setProgress({
        currentTime: 0,
        duration: audioRef.current.duration,
      });
      if (initialSeekTime !== null) {
        audioRef.current.currentTime = initialSeekTime;
        setInitialSeekTime(null);
      }
    }
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
        
        // Optimistically update like count
        const track = tracks.find(t => t.id === id);
        if (track) {
            const newLikes = track.likes + (isLiked ? -1 : 1);
            setTracks(prev => prev.map(t => t.id === id ? {...t, likes: newLikes} : t));
            incrementTrackStats(id, 'Лайки', track.likes, isLiked ? -1 : 1).catch(err => console.error("Failed to update likes", err));
        }

    } else if (type === 'artist') {
        const isLiked = user.likedArtistIds.includes(id);
        const newLikedArtistIds = isLiked ? user.likedArtistIds.filter(aid => aid !== id) : [...user.likedArtistIds, id];
        updatedUser = { ...user, likedArtistIds: newLikedArtistIds };
        updates.likedArtistIds = newLikedArtistIds;
        
        // Optimistically update local state for liked artists
        if (isLiked) {
            setLikedArtists(prev => prev.filter(a => a.id !== id));
        } else {
            const artist = allArtists.find(a => a.id === id);
            if (artist) setLikedArtists(prev => [...prev, artist]);
        }

    } else if (type === 'album') {
        const isLiked = user.favoriteCollectionIds.includes(id);
        const newFavoriteCollectionIds = isLiked ? user.favoriteCollectionIds.filter(cid => cid !== id) : [...user.favoriteCollectionIds, id];
        updatedUser = { ...user, favoriteCollectionIds: newFavoriteCollectionIds };
        updates.favoriteCollectionIds = newFavoriteCollectionIds;
        
        // Optimistically update local state for liked albums
        if (isLiked) {
            setLikedAlbums(prev => prev.filter(a => a.id !== id));
        } else {
            const album = allCollections.find(a => a.id === id);
            if (album) setLikedAlbums(prev => [...prev, album]);
        }
    }

    setUser(updatedUser);
    localStorage.setItem('joysicUser', JSON.stringify(updatedUser));
    await updateUserLikes(user, updates, favoritesPlaylistId).catch(err => {
      console.error("Failed to sync likes", err);
      // Revert optimistic update on failure
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
    if (tracks.length > 0) {
      const shuffled = [...tracks].sort(() => 0.5 - Math.random());
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
      setTracks([]);
      setPlaylists([]);
      setCurrentTrackIndex(null);
      setIsPlaying(false);
      setView('library');
  };

  const handleScanSuccess = (decodedText: string) => {
      setIsScannerOpen(false);
      const trackExists = tracks.some(t => t.id === decodedText);
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
    return <BetaLockScreen imageUrl={betaImageUrl} />;
  }

  if (isAuthLoading) {
    return <SplashScreen />;
  }
  
  if (!user) {
    return <AuthPage onLogin={handleLogin} onRegister={handleRegister} />;
  }

  if (isLoading && !tracks.length) {
    return <SplashScreen />;
  }

  return (
    <div className="bg-background min-h-screen font-sans text-text">
      <main className={`transition-all duration-500 ease-in-out ${currentTrack ? 'pb-20' : ''}`}>
        {view === 'library' && (
          <LibraryPage
            user={user}
            playlists={playlists}
            likedAlbums={likedAlbums}
            likedArtists={likedArtists}
            tracks={tracks}
            allArtists={allArtists}
            allCollections={allCollections}
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
        {view === 'artist' && selectedArtist && !isArtistLoading && (
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
        )}
        {view === 'playlistDetail' && selectedPlaylist && (
          <PlaylistDetailPage
            playlist={selectedPlaylist}
            onBack={() => setView('library')}
            onPlayTrack={(trackId) => playTrackById(trackId, selectedPlaylist.tracks)}
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
              likedAlbumsCount: likedAlbums.length,
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
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleNextTrack}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={(e) => console.error("Audio Error:", e)}
        crossOrigin="anonymous"
      />
    </div>
  );
};

// FIX: Added a default export for the App component.
export default App;
