export interface Artwork {
    src: string;
    sizes: string;
    type: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  lyrics: string;
  audioUrl: string;
  artwork: Artwork[];
  coverUrl: string;
  coverUrlType: string;
}

export interface Artist {
    id: string;
    name: string;
    description?: string;
    status?: string;
    photoUrl?: string;
    tracks: Track[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  likedTrackIds: string[];
  likedArtistIds: string[];
  favoritesPlaylistId?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  trackIds: string[];
  tracks: Track[];
  isFavorites: boolean;
  type: 'встроенный' | 'пользовательский';
}

export interface AirtableThumbnail {
    url: string;
    width: number;
    height: number;
}

export interface AirtableAttachment {
    url: string;
    type: string;
    thumbnails?: {
        small?: AirtableThumbnail;
        large?: AirtableThumbnail;
    };
}

export interface AirtableTrackRecord {
  id: string;
  createdTime: string;
  fields: {
    'Название'?: string;
    'Исполнитель'?: string[];
    'Слова'?: string;
    'Аудио'?: { url: string }[];
    'Обложка трека'?: AirtableAttachment[];
  };
}

export interface AirtableArtistRecord {
    id:string;
    createdTime: string;
    fields: {
        'Имя'?: string;
        'Описание'?: string;
        'Status'?: string;
        'Фото'?: {
            url: string;
            thumbnails?: {
                large?: {
                    url: string;
                };
            };
        }[];
        'Треки'?: string[];
    };
}

export interface AirtableUserRecord {
    id: string;
    fields: {
        'Почта': string;
        'Пароль': string;
        'Имя': string;
        'Лайки песен'?: string[];
        'Любимые исполнители'?: string[];
        'Любимый плейлист'?: string[];
    }
}

export interface AirtablePlaylistRecord {
  id: string;
  fields: {
    'Название'?: string;
    'Описание'?: string;
    'Обложка'?: { url: string }[];
    'Песни'?: string[];
    'пользователи'?: string[];
    'Тип'?: 'встроенный' | 'пользовательский';
  }
}