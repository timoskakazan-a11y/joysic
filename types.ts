
export interface Artwork {
    src: string;
    sizes: string;
    type: string;
}

export interface Track {
  id: string;
  title: string;
  artists: SimpleArtist[];
  lyrics: string;
  audioUrl: string;
  artwork: Artwork[];
  coverUrl: string;
  coverUrlType: string;
  likes: number;
  listens: number;
  youtubeClipUrl?: string;
  mat?: boolean;
}

export interface Artist {
    id: string;
    name: string;
    description?: string;
    status?: string;
    photoUrl?: string;
    tracks: Track[];
    albums: Playlist[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  likedTrackIds: string[];
  likedArtistIds: string[];
  favoriteCollectionIds: string[];
  avatarUrl?: string;
  totalListeningMinutes?: number;
}

export interface SimpleArtist {
  id: string;
  name: string;
  photoUrl?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  coverVideoUrl?: string;
  coverType: 'image' | 'video';
  trackIds: string[];
  tracks: Track[];
  isFavorites: boolean;
  type: 'встроенный' | 'пользовательский';
  collectionType: 'альбом' | 'плейлист';
  artistId?: string;
  releaseDate?: string;
}
