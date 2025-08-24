import type { Track, Artist, AirtableTrackRecord, AirtableArtistRecord, User, AirtableUserRecord, Playlist, AirtablePlaylistRecord, Artwork } from '../types';

const AIRTABLE_BASE_ID = 'appuGObKAO57IqWRN';
const MUSIC_TABLE_NAME = 'music';
const ARTISTS_TABLE_NAME = 'исполнители';
const USERS_TABLE_NAME = 'пользователи';
const PLAYLISTS_TABLE_NAME = 'плейлисты';
const PHOTOS_TABLE_NAME = 'фото';
const AIRTABLE_API_KEY = 'patZi9FoyhVvaJGnt.fdefebefbc59c7f41ff1bbf09d80f9a2da8f35dcc24c98e9766dba336053487d';

const fetchFromAirtable = async (tableName: string, options: RequestInit = {}, path: string = '') => {
  const API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}${path}`;
  const response = await fetch(API_URL, {
    ...options,
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Airtable API error (table: ${tableName}): ${errorData.error && errorData.error.message || response.statusText}`);
  }

  return response.json();
};

const mapAirtableRecordToUser = (record: AirtableUserRecord): User => {
    return {
        id: record.id,
        email: record.fields['Почта'],
        name: record.fields['Имя'],
        likedTrackIds: record.fields['Лайки песен'] || [],
        likedArtistIds: record.fields['Любимые исполнители'] || [],
        favoritesPlaylistId: record.fields['Любимый плейлист']?.[0],
    };
};

export const loginUser = async (email: string, password: string): Promise<User> => {
    const formula = `AND({Почта} = '${email}', {Пароль} = '${password}')`;
    const response = await fetchFromAirtable(USERS_TABLE_NAME, {
        method: 'GET'
    }, `?filterByFormula=${encodeURIComponent(formula)}`);

    if (response.records.length === 0) {
        throw new Error('Неверный email или пароль');
    }
    return mapAirtableRecordToUser(response.records[0]);
};

export const registerUser = async (email: string, password: string, name: string): Promise<User> => {
    // 1. Check if user already exists
    const checkFormula = `{Почта} = '${email}'`;
    const checkResponse = await fetchFromAirtable(USERS_TABLE_NAME, {}, `?filterByFormula=${encodeURIComponent(checkFormula)}`);
    if (checkResponse.records.length > 0) {
        throw new Error('Пользователь с таким email уже существует');
    }

    // 2. Create user record
    const userCreateResponse = await fetchFromAirtable(USERS_TABLE_NAME, {
        method: 'POST',
        body: JSON.stringify({
            records: [{ fields: { 'Почта': email, 'Пароль': password, 'Имя': name } }]
        })
    });

    if (!userCreateResponse.records || userCreateResponse.records.length === 0) {
        throw new Error('Не удалось создать пользователя.');
    }
    const newUserId = userCreateResponse.records[0].id;

    // Fetch cover photo for "Любимое" playlist from the "фото" table
    const photoFormula = `{Название} = 'Любимое плейлист'`;
    const photoResponse = await fetchFromAirtable(PHOTOS_TABLE_NAME, {}, `?filterByFormula=${encodeURIComponent(photoFormula)}`);
    
    // Use the fetched URL, or a fallback if not found
    let coverUrl = 'https://i.postimg.cc/FKncyR8c/24d35647-7d57-43ae-8dd6-82e5f299ecc7.png'; // Fallback
    if (photoResponse.records.length > 0 && photoResponse.records[0].fields['Фото']?.[0]?.url) {
        coverUrl = photoResponse.records[0].fields['Фото'][0].url;
    }

    // 3. Create "Любимое" playlist
    const playlistCreateResponse = await fetchFromAirtable(PLAYLISTS_TABLE_NAME, {
        method: 'POST',
        body: JSON.stringify({
            records: [{
                fields: {
                    'Название': 'Любимое',
                    'Описание': 'Ваши любимые треки',
                    'Обложка': [{ url: coverUrl }],
                    'пользователи': [newUserId],
                    'Тип': 'встроенный'
                }
            }]
        })
    });

    if (!playlistCreateResponse.records || playlistCreateResponse.records.length === 0) {
        // In a real app, we should delete the created user here for transactional integrity.
        throw new Error('Не удалось создать плейлист "Любимое".');
    }
    const newPlaylistId = playlistCreateResponse.records[0].id;

    // Link user to the shared "Новые артисты" playlist
    try {
        const newArtistsPlaylistFormula = `{Название} = 'Новые артисты'`;
        const newArtistsPlaylistResponse = await fetchFromAirtable(PLAYLISTS_TABLE_NAME, {}, `?filterByFormula=${encodeURIComponent(newArtistsPlaylistFormula)}`);

        if (newArtistsPlaylistResponse.records.length > 0) {
            const playlistRecord = newArtistsPlaylistResponse.records[0];
            const playlistId = playlistRecord.id;
            const existingUsers = playlistRecord.fields['пользователи'] || [];
            
            const updatedUsers = [...new Set([...existingUsers, newUserId])];
            
            await fetchFromAirtable(PLAYLISTS_TABLE_NAME, {
                method: 'PATCH',
                body: JSON.stringify({
                    records: [{
                        id: playlistId,
                        fields: { 'пользователи': updatedUsers }
                    }]
                })
            });
        }
    } catch (e) {
        console.error('Failed to link new user to "Новые артисты" playlist:', e);
        // Do not block registration for this optional step
    }

    // 4. Update user with the ID of the new "Любимое" playlist
    await fetchFromAirtable(USERS_TABLE_NAME, {
        method: 'PATCH',
        body: JSON.stringify({
            records: [{
                id: newUserId,
                fields: { 'Любимый плейлист': [newPlaylistId] }
            }]
        })
    });

    // 5. Fetch the full, updated user record to ensure all data is present for the app state
    const fullUserRecord = await fetchFromAirtable(USERS_TABLE_NAME, {}, `/${newUserId}`);
    if (!fullUserRecord) {
        throw new Error('Не удалось получить данные нового пользователя после регистрации.');
    }
    
    return mapAirtableRecordToUser(fullUserRecord);
};

export const updateUserLikes = async (user: User, likedTrackIds: string[], likedArtistIds: string[]): Promise<void> => {
    const promises: Promise<any>[] = [];
    
    // Update user's liked lists
    promises.push(fetchFromAirtable(USERS_TABLE_NAME, {
        method: 'PATCH',
        body: JSON.stringify({
            records: [{
                id: user.id,
                fields: {
                    'Лайки песен': likedTrackIds,
                    'Любимые исполнители': likedArtistIds,
                }
            }]
        })
    }));

    // Update the "Favorites" playlist with the liked tracks
    if (user.favoritesPlaylistId) {
        promises.push(fetchFromAirtable(PLAYLISTS_TABLE_NAME, {
            method: 'PATCH',
            body: JSON.stringify({
                records: [{
                    id: user.favoritesPlaylistId,
                    fields: { 'Песни': likedTrackIds }
                }]
            })
        }));
    }

    await Promise.all(promises);
};


const mapAirtableRecordToTrack = (record: AirtableTrackRecord, artistMap: Map<string, string>): Track | null => {
    const fields = record.fields;
    const coverAttachment = fields['Обложка трека']?.[0];

    if (!fields['Название'] || !(fields['Аудио']?.[0]?.url) || !coverAttachment?.url || !(fields['Исполнитель']?.[0])) {
        return null;
    }
    const artistId = fields['Исполнитель'][0];
    const artistName = artistMap.get(artistId) || 'Unknown Artist';
    
    const coverUrlType = coverAttachment.type || 'image/jpeg';
    
    const artwork: Artwork[] = [];

    if (coverAttachment.thumbnails?.large) {
        artwork.push({
            src: coverAttachment.thumbnails.large.url,
            sizes: `${coverAttachment.thumbnails.large.width}x${coverAttachment.thumbnails.large.height}`,
            type: coverUrlType
        });
    }
    if (coverAttachment.thumbnails?.small) {
        artwork.push({
            src: coverAttachment.thumbnails.small.url,
            sizes: `${coverAttachment.thumbnails.small.width}x${coverAttachment.thumbnails.small.height}`,
            type: coverUrlType
        });
    }

    artwork.push({
        src: coverAttachment.url,
        sizes: '512x512', // A sensible default for the original image whose size is unknown.
        type: coverUrlType,
    });
    
    const coverUrl = coverAttachment.thumbnails?.large?.url || coverAttachment.url;

    return { 
        id: record.id, 
        title: fields['Название'], 
        artist: artistName, 
        artistId: artistId, 
        lyrics: fields['Слова'] || '', 
        audioUrl: fields['Аудио'][0].url, 
        artwork,
        coverUrl,
        coverUrlType,
    };
};

export const fetchTracks = async (): Promise<Track[]> => {
  const [artistsResponse, tracksResponse] = await Promise.all([
    fetchFromAirtable(ARTISTS_TABLE_NAME, {}, ''),
    fetchFromAirtable(MUSIC_TABLE_NAME, {}, '')
  ]);
  const artistsData: { records: { id: string; fields: { 'Имя'?: string } }[] } = artistsResponse;
  const tracksData: { records: AirtableTrackRecord[] } = tracksResponse;

  const artistMap = new Map<string, string>();
  artistsData.records.forEach(record => {
    if (record.fields['Имя']) artistMap.set(record.id, record.fields['Имя']);
  });

  return tracksData.records.map(record => mapAirtableRecordToTrack(record, artistMap)).filter((track): track is Track => track !== null);
};

export const fetchArtistDetails = async (artistId: string): Promise<Artist> => {
    const artistRecord: AirtableArtistRecord = await fetchFromAirtable(ARTISTS_TABLE_NAME, {}, `/${artistId}`);
    const artistName = artistRecord.fields['Имя'] || 'Unknown Artist';
    const trackIds = artistRecord.fields['Треки'];
    let tracks: Track[] = [];

    if (trackIds && trackIds.length > 0) {
        const formula = "OR(" + trackIds.map(id => `RECORD_ID() = '${id}'`).join(',') + ")";
        const tracksResponse = await fetchFromAirtable(MUSIC_TABLE_NAME, {}, `?filterByFormula=${encodeURIComponent(formula)}`);
        const artistTracksRecords: { records: AirtableTrackRecord[] } = tracksResponse;
        const artistMap = new Map<string, string>([[artistId, artistName]]);
        tracks = artistTracksRecords.records.map(record => mapAirtableRecordToTrack(record, artistMap)).filter((track): track is Track => track !== null);
    }
    const photoAttachment = artistRecord.fields['Фото'] && artistRecord.fields['Фото'][0];
    const photoUrl = (photoAttachment && photoAttachment.thumbnails && photoAttachment.thumbnails.large && photoAttachment.thumbnails.large.url) || (photoAttachment && photoAttachment.url);

    return { id: artistRecord.id, name: artistName, description: artistRecord.fields['Описание'], status: artistRecord.fields['Status'], photoUrl: photoUrl, tracks: tracks };
};

const mapAirtableRecordToPlaylist = (record: AirtablePlaylistRecord): Playlist | null => {
    const fields = record.fields;
    if (!fields['Название'] || !fields['Обложка']?.[0]?.url) {
        return null;
    }
    return {
        id: record.id,
        name: fields['Название'],
        description: fields['Описание'] || '',
        coverUrl: fields['Обложка'][0].url,
        trackIds: fields['Песни'] || [],
        tracks: [], // to be populated later
        isFavorites: false, // will be set later
        type: fields['Тип'] || 'пользовательский',
    };
};

export const fetchPlaylistsForUser = async (userId: string): Promise<Playlist[]> => {
    const response = await fetchFromAirtable(PLAYLISTS_TABLE_NAME, {});
    const allPlaylistRecords: AirtablePlaylistRecord[] = response.records;

    const playlistsMap = new Map<string, AirtablePlaylistRecord>();

    // 1. Add all playlists the user is directly linked to
    allPlaylistRecords
        .filter(record => record.fields['пользователи']?.includes(userId))
        .forEach(record => playlistsMap.set(record.id, record));

    // 2. Find and add the shared "Новые артисты" playlist.
    // Also, link the user to it in Airtable if they aren't already.
    const newArtistsPlaylist = allPlaylistRecords.find(record => record.fields['Название'] === 'Новые артисты');
    if (newArtistsPlaylist) {
        const isUserAlreadyLinked = newArtistsPlaylist.fields['пользователи']?.includes(userId);

        // If the user isn't linked in Airtable, add them now.
        // This handles existing users who were registered before this playlist was created.
        if (!isUserAlreadyLinked) {
            try {
                const playlistId = newArtistsPlaylist.id;
                const existingUsers = newArtistsPlaylist.fields['пользователи'] || [];
                const updatedUsers = [...new Set([...existingUsers, userId])];
                
                // Asynchronously update the record in the background.
                // We don't await this so it doesn't slow down the initial load.
                fetchFromAirtable(PLAYLISTS_TABLE_NAME, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        records: [{
                            id: playlistId,
                            fields: { 'пользователи': updatedUsers }
                        }]
                    })
                }).catch(e => console.error('Background update of "Новые артисты" playlist failed:', e));

            } catch (e) {
                console.error('Failed to prepare update for "Новые артисты" playlist:', e);
            }
        }
        
        // Always add the playlist to the user's list for immediate UI visibility.
        playlistsMap.set(newArtistsPlaylist.id, newArtistsPlaylist);
    }
    
    return Array.from(playlistsMap.values())
        .map(mapAirtableRecordToPlaylist)
        .filter((p): p is Playlist => p !== null);
};