
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchTracks, fetchArtistDetails, loginUser, registerUser, updateUserLikes, fetchPlaylistsForUser } from './services/airtableService';
import type { Track, Artist, User, Playlist } from './types';
import Player from './components/Player';
import ArtistPage from './components/ArtistPage';
import MiniPlayer from './components/MiniPlayer';
import SplashScreen from './components/SplashScreen';
import AuthPage from './components/AuthPage';
import LibraryPage from './components/LibraryPage';
import PlaylistDetailPage from './components/PlaylistDetailPage';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [shuffledTracks, setShuffledTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ currentTime: 0, duration: 0 });

  const [view, setView] = useState<'library' | 'artist' | 'playlistDetail'>('library');
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isArtistLoading, setIsArtistLoading] = useState<boolean>(false);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrack = currentTrackIndex !== null && shuffledTracks.length > 0 ? shuffledTracks[currentTrackIndex] : null;

  useEffect(() => {
    const savedUser = localStorage.getItem('joysicUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsAuthLoading(false);
  }, []);

  const loadAppData = useCallback(async (currentUser: User) => {
    try {
      setIsLoading(true);
      const [fetchedTracks, fetchedPlaylists] = await Promise.all([
        fetchTracks(),
        fetchPlaylistsForUser(currentUser.id)
      ]);
      
      setTracks(fetchedTracks);
      
      const playlistsWithTracks = fetchedPlaylists.map(p => ({
        ...p,
        tracks: p.trackIds.map(tid => fetchedTracks.find(t => t.id === tid)).filter((t): t is Track => t !== undefined),
        isFavorites: p.id === currentUser.favoritesPlaylistId,
      })).sort((a, b) => (a.isFavorites === b.isFavorites) ? 0 : a.isFavorites ? -1 : 1);
      
      setPlaylists(playlistsWithTracks);
      setError(null);
    } catch (err) {
      setError('Failed to load data. Please check your connection and Airtable configuration.');
      console.error(err);
    } finally {
      setTimeout(() => setIsLoading(false), 1500);
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
    setShuffledTracks([]);
    setCurrentTrackIndex(null);
    setIsPlaying(false);
    setView('library');
  };

    const handleToggleLike = async (type: 'track' | 'artist', id: string) => {
    if (!user) return;

    const originalUser = { ...user };
    const originalPlaylists = JSON.parse(JSON.stringify(playlists)); // Deep copy for reliable revert

    let updatedLikedIds: string[];
    let userKey: 'likedTrackIds' | 'likedArtistIds';
    
    if (type === 'track') {
        userKey = 'likedTrackIds';
        const isLiked = user.likedTrackIds.includes(id);
        updatedLikedIds = isLiked ? user.likedTrackIds.filter(likedId => likedId !== id) : [...user.likedTrackIds, id];

        // Optimistically update playlists state without reloading all data
        const trackToUpdate = tracks.find(t => t.id === id);
        if (trackToUpdate && user.favoritesPlaylistId) {
            setPlaylists(currentPlaylists =>
                currentPlaylists.map(p => {
                    if (p.id === user.favoritesPlaylistId) {
                        let newTracks = p.tracks;
                        let newTrackIds = p.trackIds;
                        
                        if (isLiked) { // Unliking
                            newTracks = p.tracks.filter(t => t.id !== id);
                            newTrackIds = p.trackIds.filter(tid => tid !== id);
                        } else { // Liking
                            // Only add if not already present
                            if (!p.trackIds.includes(id)) {
                                newTracks = [...p.tracks, trackToUpdate];
                                newTrackIds = [...p.trackIds, id];
                            }
                        }
                        return { ...p, tracks: newTracks, trackIds: newTrackIds };
                    }
                    return p;
                })
            );
        }
    } else {
        userKey = 'likedArtistIds';
        const isLiked = user.likedArtistIds.includes(id);
        updatedLikedIds = isLiked ? user.likedArtistIds.filter(likedId => likedId !== id) : [...user.likedArtistIds, id];
    }

    const updatedUser = { ...user, [userKey]: updatedLikedIds };
    setUser(updatedUser);
    localStorage.setItem('joysicUser', JSON.stringify(updatedUser));

    try {
      // Sync with backend
      await updateUserLikes(user, updatedUser.likedTrackIds, updatedUser.likedArtistIds);
    } catch (error) {
      console.error('Failed to update likes:', error);
      // Revert state on failure
      setUser(originalUser);
      setPlaylists(originalPlaylists);
      localStorage.setItem('joysicUser', JSON.stringify(originalUser));
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
      setSelectedArtist(artistDetails);
    } catch (err) {
      setError(`Failed to load artist details.`);
      console.error(err);
    } finally {
      setIsArtistLoading(false);
    }
  };

  const handlePlayTrack = (trackId: string, trackList: Track[]) => {
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
      }
    }
    setIsPlayerExpanded(false);
  };
  
  const handleSelectPlaylist = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
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

  if (isAuthLoading) return <SplashScreen />;
  if (!user) return <AuthPage onLogin={handleLogin} onRegister={handleRegister} />;
  if (isLoading) return <SplashScreen />;
  if (error) return <div className="min-h-screen bg-background text-text flex justify-center items-center p-4"><p className="text-center text-red-400 bg-red-500/10 p-4 rounded-lg">{error}</p></div>;

  const mainContent = () => {
    switch(view) {
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
                    onToggleLikeArtist={(artistId) => handleToggleLike('artist', artistId)}
                    onSelectPlaylist={handleSelectPlaylist}
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
                />
            );
        case 'library':
        default:
            return <LibraryPage user={user} playlists={playlists} onSelectPlaylist={handleSelectPlaylist} onShufflePlayAll={handleShufflePlayAll} onLogout={handleLogout} />;
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

      <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onLoadedData={handleTimeUpdate} onEnded={handleNextTrack} className="hidden"/>
    </div>
  );
};

export default App;