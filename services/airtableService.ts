
// =================================================================================
// UNIFIED AIRTABLE API SERVICE
// To definitively solve the "not authorized" error and improve reliability, this
// service has been completely rewritten to use direct `fetch` calls for ALL
// Airtable API interactions (both reading and writing data).
// This removes the `airtable.js` library dependency, ensuring consistent and
// correct `Authorization: Bearer ...` header usage for modern Personal Access Tokens.
//
// FINAL FIX: All table and field names have been translated to Russian to match
// the schema of the new Airtable base, which was the root cause of the error.
// Table names have been updated to match the user's screenshot exactly.
// =================================================================================
import type { Track, Artist, User, Playlist, SimpleArtist, ImageAsset } from '../types';

// =================================================================================
// AIRTABLE CONFIGURATION
// =================================================================================
const airtableConfig = {
  apiKey: "patn6qZ3IrVpyAKDb.a2ad6cea613ceef15b6f5ca4109c0b18d6d247542b07de7cd0e63e86ab856c53",
  baseId: "appuGObKAO57IqWRN"
};

const T = {
    TRACKS: 'music',
    ARTISTS: 'исполнители',
    USERS: 'пользователи',
    PLAYLISTS: 'плейлисты',
    MEDIA: 'фото',
};

const fallbackImageAsset: ImageAsset = { full: 'https://i.postimg.cc/G3K2BYkT/joysic.png' };


// =================================================================================
// DIRECT FETCH HELPERS (for all API operations)
// =================================================================================

const apiCall = async (method: 'GET' | 'POST' | 'PATCH', path: string, body?: object) => {
    const url = `https://api.airtable.com/v0/${airtableConfig.baseId}/${path}`;
    const response = await fetch(url, {
        method,
        headers: {
            'Authorization': `Bearer ${airtableConfig.apiKey}`,
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Airtable API Error:', errorData);
        throw new Error(errorData.error?.message || `Airtable API error: ${response.statusText}`);
    }
    return response.json();
};

const getRecordsDirect = async (table: string, options: any = {}) => {
    let allRecords: any[] = [];
    let offset: string | undefined = undefined;

    const params = new URLSearchParams();
    if (options.view) params.append('view', options.view);
    if (options.filterByFormula) params.append('filterByFormula', options.filterByFormula);
    if (options.sort) {
        options.sort.forEach((sort: any, index: number) => {
            params.append(`sort[${index}][field]`, sort.field);
            params.append(`sort[${index}][direction]`, sort.direction);
        });
    }

    do {
        if (offset) {
            params.set('offset', offset);
        }
        const path = `${encodeURIComponent(table)}?${params.toString()}`;
        const data = await apiCall('GET', path);
        allRecords = allRecords.concat(data.records);
        offset = data.offset;
    } while (offset);

    return allRecords;
};

const getRecordByIdDirect = async (table: string, id: string) => {
    const record = await apiCall('GET', `${encodeURIComponent(table)}/${id}`);
    return { id: record.id, fields: record.fields };
};

const createRecordsDirect = async (table: string, records: { fields: any }[]) => {
    const data = await apiCall('POST', encodeURIComponent(table), { records });
    return data.records;
};

const updateRecordsDirect = async (table: string, records: { id: string, fields: any }[]) => {
    const data = await apiCall('PATCH', encodeURIComponent(table), { records });
    return data.records;
};


// =================================================================================
// MAPPERS
// =================================================================================

const mapAttachmentToImageAsset = (attachment: any): ImageAsset | null => {
    if (!attachment?.url) return null;
    return {
        full: attachment.url,
        large: attachment.thumbnails?.large?.url,
        small: attachment.thumbnails?.small?.url,
    };
};

const mapRecordToSimpleArtist = (record: any): SimpleArtist => ({
    id: record.id,
    name: record.fields.Имя,
    photo: mapAttachmentToImageAsset(record.fields.Фото?.[0]),
});

const mapRecordToUser = (record: any): User => ({
    id: record.id,
    email: record.fields.Почта,
    name: record.fields.Имя,
    likedTrackIds: record.fields['Лайки песен'] || [],
    likedArtistIds: record.fields['Любимые исполнители'] || [],
    favoriteCollectionIds: record.fields['Любимый плейлист'] || [],
    avatar: mapAttachmentToImageAsset(record.fields.Аватар?.[0]),
    totalListeningMinutes: record.fields['Время прослушивания'] || 0,
});

const mapRecordToPlaylist = (record: any): Playlist => ({
    id: record.id,
    name: record.fields.Название,
    description: record.fields.Описание,
    cover: mapAttachmentToImageAsset(record.fields['Обложка']?.[0]) || fallbackImageAsset,
    coverVideoUrl: record.fields['Видео-обложка']?.[0]?.url,
    coverType: record.fields['Видео-обложка'] ? 'video' : 'image',
    trackIds: record.fields.Песни || [],
    tracks: [], // Populated on demand
    isFavorites: record.fields.Избранное || false,
    type: record.fields.Тип,
    collectionType: (record.fields['Альбом/Плейлист'] || '').toLowerCase() as 'альбом' | 'плейлист',
    artistId: record.fields.Исполнитель?.[0],
    releaseDate: record.fields['Дата выхода'],
});

const mapRecordToTrack = (record: any): Track => {
    return {
        id: record.id,
        title: record.fields.Название,
        artistIds: record.fields.Исполнитель || [],
        lyrics: record.fields.Слова || '',
        audioUrl: record.fields.Аудио?.[0]?.url,
        cover: mapAttachmentToImageAsset(record.fields['Обложка трека']?.[0]) || fallbackImageAsset,
        likes: record.fields.Лайки || 0,
        listens: record.fields.Прослушивания || 0,
        youtubeClipUrl: record.fields.клип,
        mat: record.fields.MAT || false,
    };
};

// =================================================================================
// PUBLIC API
// =================================================================================

export const fetchAllTracks = async (): Promise<Track[]> => {
    const trackRecords = await getRecordsDirect(T.TRACKS, { sort: [{ field: 'Название', direction: 'asc' }] });
    return trackRecords.map(mapRecordToTrack);
};

export const fetchTracksByIds = async (trackIds: string[]): Promise<Track[]> => {
    if (trackIds.length === 0) return [];
    
    const BATCH_SIZE = 90; // Airtable URL length limit is around 8KB, 90 record IDs is safe.
    const fetchedTracks: Track[] = [];

    for (let i = 0; i < trackIds.length; i += BATCH_SIZE) {
        const batchIds = trackIds.slice(i, i + BATCH_SIZE);
        const formula = `OR(${batchIds.map(id => `RECORD_ID()='${id}'`).join(',')})`;
        try {
            const records = await getRecordsDirect(T.TRACKS, { filterByFormula: formula });
            fetchedTracks.push(...records.map(mapRecordToTrack));
        } catch (error) {
            console.error(`Failed to fetch batch of tracks:`, error);
        }
    }
    
    return fetchedTracks;
};

export const fetchPlaylistsByIds = async (playlistIds: string[]): Promise<Playlist[]> => {
    if (playlistIds.length === 0) return [];
    const formula = `OR(${playlistIds.map(id => `RECORD_ID()='${id}'`).join(',')})`;
    const records = await getRecordsDirect(T.PLAYLISTS, { filterByFormula: formula });
    return records.map(mapRecordToPlaylist);
};


export const fetchAllArtists = async (): Promise<SimpleArtist[]> => {
    const records = await getRecordsDirect(T.ARTISTS, { sort: [{ field: 'Имя', direction: 'asc' }] });
    return records.map(mapRecordToSimpleArtist);
};

export const fetchAllCollections = async (): Promise<Playlist[]> => {
    const records = await getRecordsDirect(T.PLAYLISTS);
    return records.map(mapRecordToPlaylist);
};

export const fetchSimpleArtistsByIds = async (artistIds: string[] = []): Promise<SimpleArtist[]> => {
    if (artistIds.length === 0) return [];
    const formula = `OR(${artistIds.map(id => `RECORD_ID()='${id}'`).join(',')})`;
    const records = await getRecordsDirect(T.ARTISTS, { filterByFormula: formula });
    return records.map(mapRecordToSimpleArtist);
};

export const fetchArtistDetails = async (artistId: string): Promise<Artist> => {
    const artistRecord = await getRecordByIdDirect(T.ARTISTS, artistId);

    // Directly use linked record IDs for massive performance gain.
    const trackIds = artistRecord.fields.Треки || [];
    const playlistIds = artistRecord.fields.плейлисты || [];

    // Fetch tracks and playlists in parallel
    const [artistTracks, allPlaylists] = await Promise.all([
        fetchTracksByIds(trackIds),
        fetchPlaylistsByIds(playlistIds),
    ]);
    
    // Filter playlists to only include albums
    const artistAlbums = allPlaylists.filter(p => p.collectionType === 'альбом');
    
    return {
        id: artistRecord.id,
        name: artistRecord.fields.Имя,
        description: artistRecord.fields.Описание,
        status: artistRecord.fields.Status,
        photo: mapAttachmentToImageAsset(artistRecord.fields.Фото?.[0]),
        tracks: artistTracks,
        albums: artistAlbums
    };
};

export const fetchPlaylistsForUser = async (user: User) => {
    if (!user.favoriteCollectionIds || user.favoriteCollectionIds.length === 0) {
      return { playlists: [], likedAlbums: [] };
    }
    const userPlaylistsFormula = `OR(${user.favoriteCollectionIds.map(id => `RECORD_ID() = '${id}'`).join(',')})`;
    const allPlaylists = await getRecordsDirect(T.PLAYLISTS, { filterByFormula: userPlaylistsFormula });
    const playlists = allPlaylists.filter(p => (p.fields['Альбом/Плейлист'] || '').toLowerCase() === 'плейлист');
    const likedAlbums = allPlaylists.filter(p => (p.fields['Альбом/Плейлист'] || '').toLowerCase() === 'альбом');
    return {
        playlists: playlists.map(mapRecordToPlaylist),
        likedAlbums: likedAlbums.map(mapRecordToPlaylist),
    };
};

export const loginUser = async (email: string, pass: string): Promise<User> => {
    const formula = `AND({Почта} = "${email.replace(/"/g, '""')}", {Пароль} = "${pass.replace(/"/g, '""')}")`;
    const records = await getRecordsDirect(T.USERS, { filterByFormula: formula });
    if (records.length === 0) throw new Error('Неверный email или пароль.');
    return mapRecordToUser(records[0]);
};

export const fetchMediaAsset = async (name: string): Promise<ImageAsset | null> => {
    const records = await getRecordsDirect(T.MEDIA, { filterByFormula: `{Название} = '${name}'` });
    return mapAttachmentToImageAsset(records[0]?.fields?.Вложение?.[0]);
}

export const registerUser = async (email: string, pass: string, name: string): Promise<User> => {
    const existingUsers = await getRecordsDirect(T.USERS, { filterByFormula: `{Почта} = "${email.replace(/"/g, '""')}"` });
    if (existingUsers.length > 0) throw new Error('Пользователь с таким email уже существует.');
    
    const newUserRecords = await createRecordsDirect(T.USERS, [{
        fields: {
            'Почта': email,
            'Пароль': pass,
            'Имя': name,
        }
    }]);
    const newUserRecord = newUserRecords[0];
    return mapRecordToUser({ id: newUserRecord.id, fields: newUserRecord.fields });
};

export const updateUserLikes = async (user: User, updates: { likedTrackIds?: string[], likedArtistIds?: string[], favoriteCollectionIds?: string[] }): Promise<void> => {
    const airtableUpdates: any = {};
    if (updates.likedTrackIds) airtableUpdates['Лайки песен'] = updates.likedTrackIds;
    if (updates.likedArtistIds) airtableUpdates['Любимые исполнители'] = updates.likedArtistIds;
    if (updates.favoriteCollectionIds) airtableUpdates['Любимый плейлист'] = updates.favoriteCollectionIds;
    
    if (Object.keys(airtableUpdates).length > 0) {
        await updateRecordsDirect(T.USERS, [{ id: user.id, fields: airtableUpdates }]);
    }
};

export const incrementTrackStats = async (trackId: string, field: 'Лайки' | 'Прослушивания', currentValue: number, increment: number): Promise<void> => {
    await updateRecordsDirect(T.TRACKS, [{
        id: trackId,
        fields: { [field]: (currentValue || 0) + increment }
    }]);
};

export const updateUserListeningTime = async (userId: string, totalMinutes: number): Promise<void> => {
    await updateRecordsDirect(T.USERS, [{
        id: userId,
        fields: { 'Время прослушивания': totalMinutes }
    }]);
};