import type { Track, Artist, AirtableTrackRecord, AirtableArtistRecord, User, AirtableUserRecord } from '../types';

const AIRTABLE_BASE_ID = 'appuGObKAO57IqWRN';
const MUSIC_TABLE_NAME = 'music';
const ARTISTS_TABLE_NAME = 'исполнители';
const USERS_TABLE_NAME = 'пользователи';
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
    throw new Error(`Airtable API error (table: ${tableName}): ${errorData.error?.message || response.statusText}`);
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
    // Check if user already exists
    const checkFormula = `{Почта} = '${email}'`;
    const checkResponse = await fetchFromAirtable(USERS_TABLE_NAME, {}, `?filterByFormula=${encodeURIComponent(checkFormula)}`);
    if (checkResponse.records.length > 0) {
        throw new Error('Пользователь с таким email уже существует');
    }

    const response = await fetchFromAirtable(USERS_TABLE_NAME, {
        method: 'POST',
        body: JSON.stringify({
            fields: {
                'Почта': email,
                'Пароль': password,
                'Имя': name,
            }
        })
    });
    return mapAirtableRecordToUser(response);
};

export const updateUserLikes = async (userId: string, likedTrackIds: string[], likedArtistIds: string[]): Promise<void> => {
    await fetchFromAirtable(USERS_TABLE_NAME, {
        method: 'PATCH',
        body: JSON.stringify({
            records: [{
                id: userId,
                fields: {
                    'Лайки песен': likedTrackIds,
                    'Любимые исполнители': likedArtistIds,
                }
            }]
        })
    });
};


const mapAirtableRecordToTrack = (record: AirtableTrackRecord, artistMap: Map<string, string>): Track | null => {
    const fields = record.fields;
    if (!fields['Название'] || !fields['Аудио']?.[0]?.url || !fields['Обложка трека']?.[0]?.url || !fields['Исполнитель']?.[0]) {
        return null;
    }
    const artistId = fields['Исполнитель'][0];
    const artistName = artistMap.get(artistId) || 'Unknown Artist';
    const coverAttachment = fields['Обложка трека'][0];
    const coverUrl = coverAttachment.thumbnails?.large?.url || coverAttachment.url;
    const coverUrlType = coverAttachment.type || 'image/jpeg';

    return { 
        id: record.id, 
        title: fields['Название'], 
        artist: artistName, 
        artistId: artistId, 
        lyrics: fields['Слова'] || '', 
        audioUrl: fields['Аудио'][0].url, 
        coverUrl: coverUrl,
        coverUrlType: coverUrlType,
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
    const photoAttachment = artistRecord.fields['Фото']?.[0];
    const photoUrl = photoAttachment?.thumbnails?.large?.url || photoAttachment?.url;

    return { id: artistRecord.id, name: artistName, description: artistRecord.fields['Описание'], status: artistRecord.fields['Status'], photoUrl: photoUrl, tracks: tracks };
};