
export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  lyrics: string;
  audioUrl: string;
  coverUrl: string;
}

export interface Artist {
    id: string;
    name: string;
    description?: string;
    status?: string;
    photoUrl?: string;
    tracks: Track[];
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