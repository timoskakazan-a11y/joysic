
export interface ImageAsset {
  full: string;
  large?: string;
  small?: string;
}

export interface Track {
  id: string;
  title: string;
  artists: SimpleArtist[];
  lyrics: string;
  audioUrl: string;
  cover: ImageAsset;
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
    photo?: ImageAsset;
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
  avatar?: ImageAsset;
  totalListeningMinutes?: number;
}

export interface SimpleArtist {
  id: string;
  name: string;
  photo?: ImageAsset;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  cover: ImageAsset;
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