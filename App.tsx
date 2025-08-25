
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchTracks, fetchArtistDetails, loginUser, registerUser, updateUserLikes, fetchPlaylistsForUser, incrementTrackStats, fetchBetaImage, fetchSimpleArtistsByIds, updateUserListeningTime } from './services/airtableService';
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

interface AppConfig {
  BETA_LOCK_MODE: 'on' | 'off';
}

const config: AppConfig = {
  BETA_LOCK_MODE: 'off', // 'on' or 'off'
};

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
  const [shuffledTracks, setShuffledTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ currentTime: 0, duration: 0 });

  const [view, setView] = useState<'library' | 'artist' | 'playlistDetail' | 'profile'>('library');
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isArtistLoading, setIsArtistLoading] = useState<boolean>(false);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedTrackId, setScannedTrackId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listenTimeTracker = useRef({ sessionSeconds: 0, lastSavedTotalMinutes: 0 });
  const currentTrack = currentTrackIndex !== null && shuffledTracks.length > 0 ? shuffledTracks[currentTrackIndex] : null;

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
    const savedUser = localStorage.getItem('joysicUser');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      listenTimeTracker.current.lastSavedTotalMinutes = parsedUser.totalListeningMinutes || 0;
    }
    setIsAuthLoading(false);
  }, [isCheckingBeta, isBetaLocked]);
  
    // Effect for tracking listening time
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPlaying && user) {
      interval = setInterval(() => {
        listenTimeTracker.current.sessionSeconds += 1;

        // Save to Airtable every minute (60 seconds)
        if (listenTimeTracker.current.sessionSeconds % 60 === 0) {
          const newTotalMinutes = listenTimeTracker.current.lastSavedTotalMinutes + (listenTimeTracker.current.sessionSeconds / 60);
          
          setUser(currentUser => {
              if (!currentUser) return null;
              const updatedUser = { ...currentUser, totalListeningMinutes: newTotalMinutes };
              localStorage.setItem('joysicUser', JSON.stringify(updatedUser));
              return updatedUser;
          });
          
          updateUserListeningTime(user.id, newTotalMinutes).catch(err => {
            console.error("Failed to update listening time:", err);
            // In case of failure, we can add retry logic or just wait for the next interval
          });
        }
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, user]);

  const loadAppData = useCallback(async (currentUser: User) => {
    try {
      setIsLoading(true);
      const [fetchedTracks, { playlists: fetchedPlaylists, likedAlbums: fetchedLikedAlbums, favoritesPlaylistId: favId }, fetchedLikedArtists] = await Promise.all([
        fetchTracks(),
        fetchPlaylistsForUser(currentUser),
        fetchSimpleArtistsByIds(currentUser.likedArtistIds),
      ]);
      
      setFavoritesPlaylistId(favId);
      setTracks(fetchedTracks);
      setLikedArtists(fetchedLikedArtists);
      
      const populateCollectionTracks = (collection: Playlist) => ({
        ...collection,
        tracks: collection.trackIds.map(tid => fetchedTracks.find(t => t.id === tid)).filter((t): t is Track => t !== undefined),
      });

      const playlistsWithTracks = fetchedPlaylists.map(p => ({
        ...populateCollectionTracks(p),
        isFavorites: p.id === favId,
      })).sort((a, b) => (a.isFavorites === b.isFavorites) ? 0 : a.isFavorites ? -1 : 1);
      
      const likedAlbumsWithTracks = fetchedLikedAlbums.map(populateCollectionTracks);

      setPlaylists(playlistsWithTracks);
      setLikedAlbums(likedAlbumsWithTracks);
      setError(null);
    } catch (err) {
      setError('Failed to load data. Please check your connection and Airtable configuration.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (user && tracks.length === 0) {
      loadAppData(user);
    }
  }, [user, tracks.length, loadAppData]);

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

  const handleLogin = async (email: string, pass: string) => {
    const loggedInUser = await loginUser(email, pass);
    setUser(loggedInUser);
    localStorage.setItem('joysicUser', JSON.stringify(loggedInUser));
    listenTimeTracker.current.lastSavedTotalMinutes = loggedInUser.totalListeningMinutes || 0;
  };
  
  const handleRegister = async (email: string, pass: string, name: string) => {
    const newUser = await registerUser(email, pass, name);
    setUser(newUser);
    localStorage.setItem('joysicUser', JSON.stringify(newUser));
     listenTimeTracker.current.lastSavedTotalMinutes = 0;
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('joysicUser');
    setTracks([]);
    setPlaylists([]);
    setLikedAlbums([]);
    setLikedArtists([]);
    setShuffledTracks([]);
    setCurrentTrackIndex(null);
    setIsPlaying(false);
    setView('library');
    setFavoritesPlaylistId(undefined);
  };

  const handleToggleLike = async (type: 'track' | 'artist' | 'album', id: string) => {
    if (!user) return;

    const originalUser = { ...user };
    let updates: { likedTrackIds?: string[], likedArtistIds?: string[], favoriteCollectionIds?: string[] } = {};
    let updatedUser: User;

    if (type === 'track') {
        const isLiked = user.likedTrackIds.includes(id);
        const updatedLikedIds = isLiked ? user.likedTrackIds.filter(likedId => likedId !== id) : [...user.likedTrackIds, id];
        updatedUser = { ...user, likedTrackIds: updatedLikedIds };
        updates.likedTrackIds = updatedLikedIds;
        
        // Optimistic UI update for track likes
        const trackToUpdate = tracks.find(t => t.id === id);
        if (trackToUpdate) {
            const newLikeCount = (trackToUpdate.likes || 0) + (isLiked ? -1 : 1);
            const updatedTrack = { ...trackToUpdate, likes: newLikeCount };
            const newTracks = tracks.map(t => t.id === id ? updatedTrack : t);
            setTracks(newTracks);
            const updateCollections = (collections: Playlist[]) => collections.map(p => ({
                ...p,
                tracks: p.tracks.map(t => t.id === id ? updatedTrack : t)
            }));
            setPlaylists(updateCollections);
            setLikedAlbums(updateCollections);
        }
    } else if (type === 'artist') {
        const isLiked = user.likedArtistIds.includes(id);
        const updatedLikedIds = isLiked ? user.likedArtistIds.filter(likedId => likedId !== id) : [...user.likedArtistIds, id];
        updatedUser = { ...user, likedArtistIds: updatedLikedIds };
        updates.likedArtistIds = updatedLikedIds;
    } else { // album
        const isLiked = user.favoriteCollectionIds.includes(id);
        const updatedCollectionIds = isLiked ? user.favoriteCollectionIds.filter(cid => cid !== id) : [...user.favoriteCollectionIds, id];
        updatedUser = { ...user, favoriteCollectionIds: updatedCollectionIds };
        updates.favoriteCollectionIds = updatedCollectionIds;
        
        // Optimistic UI update for album likes
        if (isLiked) {
          setLikedAlbums(prev => prev.filter(a => a.id !== id));
        } else {
          let albumToAdd: Playlist | undefined;
          if (selectedArtist) {
            albumToAdd = selectedArtist.albums.find(a => a.id === id);
          }
          if (!albumToAdd) {
            const allCollections = [...playlists, ...likedAlbums];
            albumToAdd = allCollections.find(c => c.id === id);
          }
          if (albumToAdd) {
            setLikedAlbums(prev => [...prev, albumToAdd!]);
          }
        }
    }

    setUser(updatedUser);
    localStorage.setItem('joysicUser', JSON.stringify(updatedUser));

    try {
      const promises: Promise<any>[] = [];
      if (type === 'track') {
          const trackToUpdate = tracks.find(t => t.id === id);
          if (trackToUpdate) {
            const isLiked = originalUser.likedTrackIds.includes(id);
            promises.push(incrementTrackStats(id, 'Лайки', trackToUpdate.likes || 0, isLiked ? -1 : 1));
          }
      }
      
      await Promise.all([
        ...promises,
        updateUserLikes(user, updates, favoritesPlaylistId)
      ]);

      if (type === 'artist') {
        // Re-fetch liked artists to update the library page
        const fetchedLikedArtists = await fetchSimpleArtistsByIds(updatedUser.likedArtistIds);
        setLikedArtists(fetchedLikedArtists);
      }

    } catch (error) {
      console.error('Failed to update likes:', error);
      setUser(originalUser);
      localStorage.setItem('joysicUser', JSON.stringify(originalUser));
      // Revert UI changes on failure
      loadAppData(originalUser);
    }
  };

  const handlePlayPause = useCallback(() => {
    if (currentTrackIndex === null && shuffledTracks.length > 0) setCurrentTrackIndex(0);
    setIsPlaying(prev => !prev);
  }, [currentTrackIndex, shuffledTracks]);

  const handleNextTrack = useCallback(() => {
    if (shuffledTracks.length === 0) return;
    setCurrentTrackIndex(prev => (prev === null || prev === shuffledTracks.length - 1) ? 0 : prev + 1);
    setIsPlaying(true);
  }, [shuffledTracks]);

  const handlePrevTrack = useCallback(() => {
    if (shuffledTracks.length === 0) return;
    setCurrentTrackIndex(prev => (prev === null || prev === 0) ? shuffledTracks.length - 1 : prev - 1);
    setIsPlaying(true);
  }, [shuffledTracks]);

  useEffect(() => {
    const { mediaSession } = navigator;
    if (!mediaSession) return;

    if (currentTrack) {
      mediaSession.metadata = new window.MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: 'Joysic',
        artwork: currentTrack.artwork,
      });
      mediaSession.setActionHandler('play', handlePlayPause);
      mediaSession.setActionHandler('pause', handlePlayPause);
      mediaSession.setActionHandler('previoustrack', handlePrevTrack);
      mediaSession.setActionHandler('nexttrack', handleNextTrack);
    }
    
    return () => {
      mediaSession.setActionHandler('play', null);
      mediaSession.setActionHandler('pause', null);
      mediaSession.setActionHandler('previoustrack', null);
      mediaSession.setActionHandler('nexttrack', null);
    };
  }, [currentTrack, handlePlayPause, handlePrevTrack, handleNextTrack]);

  useEffect(() => {
    const { mediaSession } = navigator;
    if (!mediaSession) return;
    mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);
  
  const handleTimeUpdate = () => {
    if (audioRef.current) setProgress({ currentTime: audioRef.current.currentTime, duration: audioRef.current.duration || 0 });
  };
  
  const handleSeek = (newTime: number) => {
    if (audioRef.current) audioRef.current.currentTime = newTime;
  };

  const handleSelectArtist = async (artistId: string) => {
    setIsArtistLoading(true);
    setView('artist');
    setIsPlayerExpanded(false);
    try {
      const artistDetails = await fetchArtistDetails(artistId);
      // Populate artist tracks with full track data from state for accurate stats
      artistDetails.tracks = artistDetails.tracks.map(t => tracks.find(fullTrack => fullTrack.id === t.id) || t);
      artistDetails.albums.forEach(album => {
        album.tracks = album.tracks.map(t => tracks.find(fullTrack => fullTrack.id === t.id) || t);
      });
      setSelectedArtist(artistDetails);
    } catch (err) {
      setError(`Failed to load artist details.`);
      console.error(err);
    } finally {
      setIsArtistLoading(false);
    }
  };

  const handlePlayTrack = useCallback((trackId: string, trackList: Track[]) => {
    const newIndex = trackList.findIndex(t => t.id === trackId);
    if (newIndex !== -1) {
      const newShuffledList = [...trackList];
      const currentTrackInNewList = newShuffledList[newIndex];
      newShuffledList.splice(newIndex, 1);
      newShuffledList.sort(() => Math.random() - 0.5);
      newShuffledList.unshift(currentTrackInNewList);
      
      setShuffledTracks(newShuffledList);

      const isSameTrack = currentTrack?.id === trackId;
      if (isSameTrack) {
        handlePlayPause();
      } else {
        setCurrentTrackIndex(0);
        setIsPlaying(true);
        
        // Increment listen count
        const trackToUpdate = tracks.find(t => t.id === trackId);
        if (trackToUpdate) {
            const updatedTrack = { ...trackToUpdate, listens: (trackToUpdate.listens || 0) + 1 };
            const newTracks = tracks.map(t => t.id === trackId ? updatedTrack : t);
            setTracks(newTracks);

            const updateCollections = (collections: Playlist[]) => collections.map(p => ({
                ...p,
                tracks: p.tracks.map(t => t.id === trackId ? updatedTrack : t)
            }));
            setPlaylists(updateCollections);
            setLikedAlbums(updateCollections);

            incrementTrackStats(trackId, 'Прослушивания', trackToUpdate.listens || 0).catch(err => {
                console.error("Failed to update listen count:", err);
            });
        }
      }
    }
    setIsPlayerExpanded(false);
  }, [currentTrack, handlePlayPause, tracks]);
  
  const handleScanSuccess = useCallback((trackId: string) => {
    setScannedTrackId(trackId);
    setIsScannerOpen(false);
  }, []);

  useEffect(() => {
    if (scannedTrackId) {
      const trackExists = tracks.some(t => t.id === scannedTrackId);
      if (trackExists) {
        handlePlayTrack(scannedTrackId, tracks);
        setIsPlayerExpanded(true);
      } else {
        console.warn(`Track with ID ${scannedTrackId} not found from scan.`);
      }
      setScannedTrackId(null); // Reset after handling
    }
  }, [scannedTrackId, tracks, handlePlayTrack]);

  const handleSelectPlaylist = (playlist: Playlist) => {
    // Ensure playlist tracks have the latest stats
    const updatedPlaylist = {
      ...playlist,
      tracks: playlist.trackIds.map(tid => tracks.find(t => t.id === tid)).filter((t): t is Track => !!t)
    };
    setSelectedPlaylist(updatedPlaylist);
    setView('playlistDetail');
  }

  const handleShufflePlayAll = () => {
    if (tracks.length === 0) return;
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    setShuffledTracks(shuffled);
    setCurrentTrackIndex(0);
    setIsPlaying(true);
  };

  const handleExpandPlayer = () => setIsPlayerExpanded(true);
  const handleMinimizePlayer = () => setIsPlayerExpanded(false);

  if (isCheckingBeta) return <SplashScreen />;
  if (isBetaLocked) return <BetaLockScreen imageUrl={betaImageUrl} />;
  if (isAuthLoading) return <SplashScreen />;
  if (!user) return <AuthPage onLogin={handleLogin} onRegister={handleRegister} />;
  if (isLoading) return <SplashScreen />;
  if (error) return <div className="min-h-screen bg-background text-text flex justify-center items-center p-4"><p className="text-center text-red-400 bg-red-500/10 p-4 rounded-lg">{error}</p></div>;

  const mainContent = () => {
    switch(view) {
        case 'profile':
            return <ProfilePage 
                user={user}
                stats={{
                    likedTracksCount: user.likedTrackIds.length,
                    likedArtistsCount: user.likedArtistIds.length,
                    likedAlbumsCount: likedAlbums.length,
                }}
                onBack={() => setView('library')}
                onLogout={handleLogout}
            />;
        case 'artist':
            return isArtistLoading || !selectedArtist ? (
                <div className="min-h-screen flex justify-center items-center"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-surface-light"></div></div>
            ) : (
                <ArtistPage 
                    artist={selectedArtist} 
                    onBack={() => setView('library')}
                    onPlayTrack={(trackId) => handlePlayTrack(trackId, selectedArtist.tracks)}
                    currentTrackId={currentTrack?.id}
                    isPlaying={isPlaying}
                    likedArtistIds={user.likedArtistIds}
                    onSelectPlaylist={handleSelectPlaylist}
                    likedTrackIds={user.likedTrackIds}
                    favoriteCollectionIds={user.favoriteCollectionIds}
                    onToggleLike={handleToggleLike}
                />
            );
        case 'playlistDetail':
            return selectedPlaylist && (
                <PlaylistDetailPage 
                    playlist={selectedPlaylist}
                    onBack={() => setView('library')}
                    onPlayTrack={(trackId) => handlePlayTrack(trackId, selectedPlaylist.tracks)}
                    currentTrackId={currentTrack?.id}
                    isPlaying={isPlaying}
                    onPlayPause={handlePlayPause}
                    likedTrackIds={user.likedTrackIds}
                    favoriteCollectionIds={user.favoriteCollectionIds}
                    onToggleLike={handleToggleLike}
                />
            );
        case 'library':
        default:
            return <LibraryPage 
                user={user} 
                playlists={playlists} 
                likedAlbums={likedAlbums} 
                likedArtists={likedArtists}
                tracks={tracks}
                onSelectPlaylist={handleSelectPlaylist} 
                onSelectArtist={handleSelectArtist}
                onPlayTrack={(trackId) => handlePlayTrack(trackId, tracks)}
                onShufflePlayAll={handleShufflePlayAll} 
                onNavigateToProfile={() => setView('profile')} 
                onOpenScanner={() => setIsScannerOpen(true)}
                currentTrackId={currentTrack?.id}
                isPlaying={isPlaying}
            />;
    }
  }

  return (
    <div className="min-h-screen bg-background text-text font-sans">
      <main className={`transition-all duration-500 ${currentTrack ? 'pb-20' : ''}`}>
        {mainContent()}
      </main>

      {currentTrack && (
        <>
          <div className={`fixed z-50 inset-0 transition-transform duration-700 ease-in-out ${isPlayerExpanded ? 'translate-y-0' : 'translate-y-full'}`}>
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
              isLiked={user.likedTrackIds.includes(currentTrack.id)}
              onToggleLike={() => handleToggleLike('track', currentTrack.id)}
            />
          </div>
          <div className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-500 ease-in-out ${isPlayerExpanded ? 'translate-y-full' : 'translate-y-0'}`}>
             <MiniPlayer track={currentTrack} isPlaying={isPlaying} onPlayPause={handlePlayPause} onExpand={handleExpandPlayer} progress={progress.duration > 0 ? (progress.currentTime / progress.duration) * 100 : 0}/>
          </div>
        </>
      )}
      
      {isScannerOpen && <ScannerModal onClose={() => setIsScannerOpen(false)} onScanSuccess={handleScanSuccess} />}

      <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onLoadedData={handleTimeUpdate} onEnded={handleNextTrack} className="hidden"/>
    </div>
  );
};

export default App;
