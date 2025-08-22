import type { Track, Artist, AirtableTrackRecord, AirtableArtistRecord } from '../types';

const AIRTABLE_BASE_ID = 'appuGObKAO57IqWRN';
const MUSIC_TABLE_NAME = 'music';
const ARTISTS_TABLE_NAME = 'исполнители';
const AIRTABLE_API_KEY = 'patZi9FoyhVvaJGnt.fdefebefbc59c7f41ff1bbf09d80f9a2da8f35dcc24c98e9766dba336053487d';

const fetchFromAirtable = async (tableName: string, options: string = '') => {
  const API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}?${options}`;
  const response = await fetch(API_URL, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Airtable API error (table: ${tableName}): ${errorData.error?.message || 'Unknown error'}`);
  }

  return response.json();
};


const mapAirtableRecordToTrack = (record: AirtableTrackRecord, artistMap: Map<string, string>): Track | null => {
    const fields = record.fields;
    if (
        !fields['Название'] ||
        !fields['Аудио']?.[0]?.url ||
        !fields['Обложка трека']?.[0]?.url ||
        !fields['Исполнитель']?.[0]
    ) {
        return null;
    }

    const artistId = fields['Исполнитель'][0];
    const artistName = artistMap.get(artistId) || 'Unknown Artist';
    const coverAttachment = fields['Обложка трека'][0];
    const coverUrl = coverAttachment.thumbnails?.large?.url || coverAttachment.url;

    return {
        id: record.id,
        title: fields['Название'] || 'Untitled',
        artist: artistName,
        artistId: artistId,
        lyrics: fields['Слова'] || '',
        audioUrl: fields['Аудио'][0].url,
        coverUrl: coverUrl,
    };
};

export const fetchTracks = async (): Promise<Track[]> => {
  const [artistsResponse, tracksResponse] = await Promise.all([
    fetchFromAirtable(ARTISTS_TABLE_NAME),
    fetchFromAirtable(MUSIC_TABLE_NAME)
  ]);

  const artistsData: { records: { id: string; fields: { 'Имя'?: string } }[] } = artistsResponse;
  const tracksData: { records: AirtableTrackRecord[] } = tracksResponse;

  const artistMap = new Map<string, string>();
  artistsData.records.forEach(record => {
    if (record.fields['Имя']) {
      artistMap.set(record.id, record.fields['Имя']);
    }
  });

  return tracksData.records
    .map(record => mapAirtableRecordToTrack(record, artistMap))
    .filter((track): track is Track => track !== null);
};


export const fetchArtistDetails = async (artistId: string): Promise<Artist> => {
    const artistRecord: AirtableArtistRecord = await fetchFromAirtable(`${ARTISTS_TABLE_NAME}/${artistId}`);
    
    const artistName = artistRecord.fields['Имя'] || 'Unknown Artist';
    const trackIds = artistRecord.fields['Треки'];

    let tracks: Track[] = [];

    if (trackIds && trackIds.length > 0) {
        const formula = "OR(" + trackIds.map(id => `RECORD_ID() = '${id}'`).join(',') + ")";
        const tracksResponse = await fetchFromAirtable(MUSIC_TABLE_NAME, `filterByFormula=${encodeURIComponent(formula)}`);
        const artistTracksRecords: { records: AirtableTrackRecord[] } = tracksResponse;
        
        const artistMap = new Map<string, string>([[artistId, artistName]]);

        tracks = artistTracksRecords.records
            .map(record => mapAirtableRecordToTrack(record, artistMap))
            .filter((track): track is Track => track !== null);
    }

    const photoAttachment = artistRecord.fields['Фото']?.[0];
    const photoUrl = photoAttachment?.thumbnails?.large?.url || photoAttachment?.url;

    return {
        id: artistRecord.id,
        name: artistName,
        description: artistRecord.fields['Описание'],
        status: artistRecord.fields['Status'],
        photoUrl: photoUrl,
        tracks: tracks,
    };
};