import React from 'react';
import type { User, Playlist } from '../types';
import { ShuffleIcon } from './IconComponents';

interface LibraryPageProps {
  user: User;
  playlists: Playlist[];
  likedAlbums: Playlist[];
  onSelectPlaylist: (playlist: Playlist) => void;
  onShufflePlayAll: () => void;
  onLogout: () => void;
}

const PlaylistCard: React.FC<{ playlist: Playlist; onSelect: () => void }> = ({ playlist, onSelect }) => (
  <div onClick={onSelect} className="group cursor-pointer">
    <div className="relative aspect-square w-full rounded-2xl shadow-lg overflow-hidden bg-surface">
      {playlist.coverType === 'video' && playlist.coverVideoUrl ? (
        <video src={playlist.coverVideoUrl} poster={playlist.coverUrl} autoPlay loop muted playsInline className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
      ) : (
        <img src={playlist.coverUrl} alt={playlist.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
      )}
    </div>
    <div className="mt-3">
      <h3 className="font-bold text-primary truncate">{playlist.name}</h3>
      <p className="text-sm text-text-secondary">{playlist.tracks.length} треков</p>
    </div>
  </div>
);

const LibraryPage: React.FC<LibraryPageProps> = ({ user, playlists, likedAlbums, onSelectPlaylist, onShufflePlayAll, onLogout }) => {
  return (
    <div className="min-h-screen p-4 sm:p-6">
      <header className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl sm:text-4xl font-black text-primary">Медиатека</h1>
            <p className="text-text-secondary">Добро пожаловать, {user.name}!</p>
        </div>
        <button onClick={onLogout} className="bg-surface-light px-4 py-2 rounded-lg text-sm font-bold text-text hover:bg-surface transition-colors">
            Выйти
        </button>
      </header>

      {playlists.length === 0 && likedAlbums.length === 0 ? (
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
              <PlaylistCard key={playlist.id} playlist={playlist} onSelect={() => onSelectPlaylist(playlist)} />
            ))}
          </div>

          {likedAlbums.length > 0 && (
            <div className="mt-12">
              <h2 className="text-3xl sm:text-4xl font-black text-primary mb-8">Лайкнутые альбомы</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {likedAlbums.map(album => (
                  <PlaylistCard key={album.id} playlist={album} onSelect={() => onSelectPlaylist(album)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LibraryPage;