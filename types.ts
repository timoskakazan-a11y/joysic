export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  lyrics: string;
  audioUrl: string;
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
}

export interface AirtableTrackRecord {
  id: string;
  createdTime: string;
  fields: {
    'Название'?: string;
    'Исполнитель'?: string[];
    'Слова'?: string;
    'Аудио'?: { url: string }[];
    'Обложка трека'?: {
      url: string;
      type: string;
      thumbnails?: {
        large?: {
          url: string;
        };
      };
    }[];
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
    }
}