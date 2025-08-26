

import React, { useState, useMemo, useCallback } from 'react';
import type { User, Playlist, SimpleArtist, Track } from '../types';
import { ShuffleIcon, SearchIcon, QrCodeIcon, SoundWaveIcon, MatBadge } from './IconComponents';
import TrackCover from './TrackCover';

interface LibraryPageProps {
  user: User;
  playlists: Playlist[];
  likedAlbums: Playlist[];
  likedArtists: SimpleArtist[];
  tracks: Track[];
  allArtists: SimpleArtist[];
  allCollections: Playlist[];
  onSelectPlaylist: (playlist: Playlist) => void;
  onSelectArtist: (artistId: string) => void;
  onPlayTrack: (trackId: string) => void;
  onShufflePlayAll: () => void;
  onNavigateToProfile: () => void;
  onOpenScanner: () => void;
  currentTrackId?: string | null;
  isPlaying?: boolean;
  onOpenMatInfo: () => void;
}

const PlaylistCard = React.memo<{ playlist: Playlist; onSelect: (playlist: Playlist) => void }>(({ playlist, onSelect }) => {
  const releaseDate = playlist.releaseDate ? new Date(playlist.releaseDate) : null;
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const isUpcoming = releaseDate && releaseDate >= today;
  
  const formattedReleaseDate = releaseDate
    ? releaseDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

  const handleSelect = () => {
    if (!isUpcoming) {
      onSelect(playlist);
    }
  };
  
  return (
    <div onClick={handleSelect} className={`group ${isUpcoming ? 'cursor-default' : 'cursor-pointer'}`}>
      <div className="relative aspect-square w-full rounded-2xl shadow-lg overflow-hidden bg-surface">
        {playlist.coverType === 'video' && playlist.coverVideoUrl ? (
          <video src={playlist.coverVideoUrl} poster={playlist.coverUrl} autoPlay loop muted playsInline className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <img src={playlist.coverUrl} alt={playlist.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        )}
        {isUpcoming && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-center p-2">
                <p className="font-bold text-primary text-lg">Скоро выйдет</p>
                <p className="text-sm text-text-secondary">{formattedReleaseDate}</p>
            </div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="font-bold text-primary truncate">{playlist.name}</h3>
        <p className="text-sm text-text-secondary">{playlist.trackIds.length} треков</p>
      </div>
    </div>
  );
});

const ArtistCard = React.memo<{ artist: SimpleArtist; onSelect: (id: string) => void }>(({ artist, onSelect }) => {
  const handleSelect = useCallback(() => {
    onSelect(artist.id);
  }, [onSelect, artist.id]);

  return (
    <div onClick={handleSelect} className="group cursor-pointer flex-shrink-0 w-32 sm:w-36 md:w-40 text-center">
      <div className="relative aspect-square w-full rounded-full shadow-lg overflow-hidden bg-surface transition-transform duration-300 group-hover:scale-105">
        <img src={artist.photoUrl || 'https://i.postimg.cc/G3K2BYkT/joysic.png'} alt={artist.name} className="w-full h-full object-cover" />
      </div>
      <div className="mt-3">
        <h3 className="font-bold text-primary truncate">{artist.name}</h3>
      </div>
    </div>
  );
});


const SearchResultTrack = React.memo<{track: Track, isActive: boolean, isPlaying: boolean, onPlay: () => void, onOpenMatInfo: () => void}>(({ track, isActive, isPlaying, onPlay, onOpenMatInfo }) => {
    return (
      <div
        onClick={onPlay}
        className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors duration-200 group ${isActive ? 'bg-surface-light' : 'hover:bg-surface'}`}
      >
        <div className="relative w-12 h-12 rounded-md bg-surface overflow-hidden flex-shrink-0">
          <TrackCover src={track.coverUrl} alt={track.title} className="w-full h-full" />
        </div>
        <div className="flex-grow mx-4 overflow-hidden">
          <p className={`font-semibold ${isActive ? 'text-accent' : 'text-text'}`}>
              {track.title}
              {track.mat && <MatBadge onClick={onOpenMatInfo} className="inline-block align-baseline ml-1.5"/>}
          </p>
          <p className="text-sm text-text-secondary">{track.artists.map(a => a.name).join(', ')}</p>
        </div>
        {isActive && (
            <SoundWaveIcon isPlaying={!!isPlaying} className="w-5 h-5 mx-auto text-accent flex-shrink-0" />
        )}
      </div>
    );
});

const LibraryPage: React.FC<LibraryPageProps> = ({ user, playlists, likedAlbums, likedArtists, tracks, allArtists, allCollections, onSelectPlaylist, onSelectArtist, onPlayTrack, onShufflePlayAll, onNavigateToProfile, onOpenScanner, currentTrackId, isPlaying, onOpenMatInfo }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const searchResults = useMemo(() => {
    if (searchQuery.trim().length < 2) {
        return { tracks: [], artists: [], albums: [], playlists: [] };
    }
    const lowercasedQuery = searchQuery.toLowerCase();

    const filteredTracks = tracks.filter(t => 
        t.title.toLowerCase().includes(lowercasedQuery) ||
        t.artists.some(a => a.name.toLowerCase().includes(lowercasedQuery))
    );
    
    const filteredArtists = allArtists.filter(a => 
        a.name.toLowerCase().includes(lowercasedQuery)
    );

    const filteredCollections = allCollections.filter(c =>
        c.name.toLowerCase().includes(lowercasedQuery)
    );
    
    const filteredAlbums = filteredCollections.filter(c => c.collectionType === 'альбом');
    const filteredPlaylists = filteredCollections.filter(c => c.collectionType === 'плейлист');

    return { tracks: filteredTracks, artists: filteredArtists, albums: filteredAlbums, playlists: filteredPlaylists };
  }, [searchQuery, tracks, allArtists, allCollections]);


  const hasContent = playlists.length > 0 || likedAlbums.length > 0 || likedArtists.length > 0;
  
  const SearchResults = () => (
    <div className="animate-fadeInScaleUp space-y-8">
        {searchResults.tracks.length > 0 && (
            <div>
                <h2 className="text-2xl font-bold text-primary mb-4">Треки</h2>
                <div className="space-y-2">
                    {searchResults.tracks.map(track => (
                        <SearchResultTrack 
                            key={track.id} 
                            track={track}
                            isActive={currentTrackId === track.id}
                            isPlaying={currentTrackId === track.id && !!isPlaying}
                            onPlay={() => onPlayTrack(track.id)}
                            onOpenMatInfo={onOpenMatInfo}
                        />
                    ))}
                </div>
            </div>
        )}

        {searchResults.artists.length > 0 && (
             <div>
              <h2 className="text-2xl font-bold text-primary mb-4">Исполнители</h2>
              <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6">
                {searchResults.artists.map(artist => (
                  <ArtistCard key={artist.id} artist={artist} onSelect={onSelectArtist} />
                ))}
              </div>
            </div>
        )}

        {searchResults.albums.length > 0 && (
            <div>
                <h2 className="text-2xl font-bold text-primary mb-4">Альбомы</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {searchResults.albums.map(album => (
                        <PlaylistCard key={album.id} playlist={album} onSelect={onSelectPlaylist} />
                    ))}
                </div>
            </div>
        )}

        {searchResults.playlists.length > 0 && (
            <div>
                <h2 className="text-2xl font-bold text-primary mb-4">Плейлисты</h2>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {searchResults.playlists.map(playlist => (
                        <PlaylistCard key={playlist.id} playlist={playlist} onSelect={onSelectPlaylist} />
                    ))}
                </div>
            </div>
        )}

        {searchResults.tracks.length === 0 && searchResults.artists.length === 0 && searchResults.albums.length === 0 && searchResults.playlists.length === 0 && (
            <div className="text-center py-20">
                <p className="text-text-secondary">Ничего не найдено по запросу "{searchQuery}"</p>
            </div>
        )}
    </div>
  );

  const DefaultLibrary = () => (
    <>
      {!hasContent ? (
        <div className="text-center py-20">
          <p className="text-text-secondary">Ваша медиатека пуста.</p>
          <p className="text-text-secondary text-sm">Находите музыку и добавляйте ее в избранное!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            <div 
              onClick={onShufflePlayAll} 
              className="col-span-2 h-full cursor-pointer rounded-2xl shadow-lg bg-gradient-to-br from-accent to-purple-800 flex flex-col items-center justify-center text-center p-5 transition-all duration-300 ease-in-out hover:shadow-2xl hover:shadow-accent/40 hover:brightness-110"
              role="button"
              aria-label="Play all tracks on shuffle"
            >
              <ShuffleIcon className="w-12 h-12 text-primary opacity-80 mb-3" />
              <h3 className="font-black text-xl text-primary">Слушать вперемешку</h3>
              <p className="text-sm text-purple-200 mt-1">Вся ваша музыка</p>
            </div>
            {playlists.map(playlist => (
              <PlaylistCard key={playlist.id} playlist={playlist} onSelect={onSelectPlaylist} />
            ))}
          </div>

          {likedArtists.length > 0 && (
            <div className="mt-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-primary mb-8">Любимые исполнители</h2>
              <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6">
                {likedArtists.map(artist => (
                  <ArtistCard key={artist.id} artist={artist} onSelect={onSelectArtist} />
                ))}
              </div>
            </div>
          )}

          {likedAlbums.length > 0 && (
            <div className="mt-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-primary mb-8">Лайкнутые альбомы</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {likedAlbums.map(album => (
                  <PlaylistCard key={album.id} playlist={album} onSelect={onSelectPlaylist} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <header className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl sm:text-4xl font-black text-primary">Медиатека</h1>
            <p className="text-text-secondary">Добро пожаловать, {user.name}!</p>
        </div>
        <button 
          onClick={onNavigateToProfile} 
          className="w-12 h-12 rounded-full overflow-hidden bg-surface-light hover:ring-2 hover:ring-accent transition-all"
          aria-label="Open profile"
        >
            <img 
                src={user.avatarUrl || 'https://i.postimg.cc/G3K2BYkT/joysic.png'} 
                alt="User Avatar" 
                className="w-full h-full object-cover" 
            />
        </button>
      </header>

      <div className="relative mb-8">
        <input
            type="text"
            placeholder="Поиск по медиатеке"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface py-3 pl-12 pr-12 rounded-full border-2 border-transparent focus:border-accent focus:ring-0 focus:outline-none transition-colors"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
            <SearchIcon className="w-6 h-6" />
        </div>
        <button
            onClick={onOpenScanner}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary p-1 rounded-full transition-colors"
            aria-label="Scan Joycode"
        >
            <QrCodeIcon className="w-6 h-6" />
        </button>
      </div>

      {searchQuery ? <SearchResults /> : <DefaultLibrary />}
    </div>
  );
};

export default LibraryPage;