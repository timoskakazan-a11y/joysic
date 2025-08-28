
import type { Track, Artist, User, Playlist, Artwork, SimpleArtist } from '../types';

// =================================================================================
// ВНИМАНИЕ: По вашему требованию, эта версия кода выполняет прямые запросы 
// к API Notion из браузера. Этот подход НЕ РЕКОМЕНДУЕТСЯ, так как:
// 1. Ваш секретный API-ключ виден любому, кто откроет код сайта.
// 2. Браузеры почти наверняка заблокируют эти запросы из-за политики
//    безопасности CORS, что приведет к ошибке "Failed to fetch".
// =================================================================================

const NOTION_API_KEY = 'secret_n688DxMZicBXMyTkkN1AWCMQwcPPraWdFb4HLLW8pzh';
const NOTION_API_VERSION = '2022-06-28';
const NOTION_BASE_URL = 'https://api.notion.com/v1';

// ВАЖНО: Укажите здесь настоящие ID ваших баз данных Notion.
const MUSIC_DATABASE_ID = '25d0d1b6cd918059a82accc1c0675eea';
const ARTISTS_DATABASE_ID = '25d0d1b6cd918062a52ecc5004fee897';
const USERS_DATABASE_ID = '25d0d1b6cd91800babc2c0650dfa49b9';
const PLAYLISTS_DATABASE_ID = '25d0d1b6cd9180de8014e3e84cebc0a3';
const PHOTOS_DATABASE_ID = '25d0d1b6cd91809598c3d34307782169';

const fetchFromNotion = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${NOTION_BASE_URL}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${NOTION_API_KEY}`,
    'Notion-Version': NOTION_API_VERSION,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response from Notion' }));
        console.error('Error from Notion API:', errorData);
        throw new Error(errorData.message || `Ошибка API Notion (${response.status})`);
    }
    return response.json();

  } catch (error: any) {
    console.error(`Error during fetchFromNotion for endpoint [${endpoint}]:`, error);
    // Эта ошибка, скорее всего, будет вызвана CORS
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Сетевая ошибка или CORS. Браузер заблокировал прямой запрос к API Notion. Это ожидаемое поведение. Для решения проблемы требуется серверный прокси.');
    }
    throw new Error(error.message || `Произошла неизвестная сетевая ошибка.`);
  }
};


const queryDatabase = async (databaseId: string, body: any = {}): Promise<any[]> => {
    let results: any[] = [];
    let has_more = true;
    let start_cursor: string | undefined = undefined;

    const requestBody = { ...body };

    while (has_more) {
        if (start_cursor) {
            requestBody.start_cursor = start_cursor;
        }

        const response = await fetchFromNotion(`/databases/${databaseId}/query`, {
            method: 'POST',
            body: JSON.stringify(requestBody),
        });
        
        if (response && response.results) {
          results = results.concat(response.results);
          has_more = response.has_more;
          start_cursor = response.next_cursor;
        } else {
          has_more = false;
        }
    }
    return results;
};

const fetchPage = (pageId: string) => fetchFromNotion(`/pages/${pageId}`, { method: 'GET' });
const createPage = (body: any) => fetchFromNotion('/pages', { method: 'POST', body: JSON.stringify({ ...body }) });
const updatePage = (pageId: string, body: any) => fetchFromNotion(`/pages/${pageId}`, { method: 'PATCH', body: JSON.stringify({ ...body }) });

// --- Notion Property Extractor Helpers ---
const getTitle = (page: any, propName: string): string => page.properties[propName]?.title[0]?.plain_text || '';
const getRichText = (page: any, propName: string): string => page.properties[propName]?.rich_text[0]?.plain_text || '';
const getNumber = (page: any, propName: string): number => page.properties[propName]?.number || 0;
const getCheckbox = (page: any, propName: string): boolean => page.properties[propName]?.checkbox || false;
const getUrl = (page: any, propName: string): string | undefined => page.properties[propName]?.url || undefined;
const getRelationIds = (page: any, propName: string): string[] => (page.properties[propName]?.relation || []).map((r: any) => r.id);
const getFiles = (page: any, propName: string): any[] => page.properties[propName]?.files || [];
const getEmail = (page: any, propName: string): string => page.properties[propName]?.email || '';
const getFileUrl = (page: any, propName: string): string | undefined => {
    const file = getFiles(page, propName)[0];
    if (!file) return undefined;
    return file.type === 'external' ? file.external.url : file.file.url;
};
const getSelect = (page: any, propName: string): string | undefined => page.properties[propName]?.select?.name;
const getDate = (page: any, propName: string): string | undefined => page.properties[propName]?.date?.start;


// --- Mappers from Notion Page to App Types ---
const mapNotionPageToUser = (page: any): User => ({
    id: page.id,
    email: getEmail(page, 'Почта'),
    name: getTitle(page, 'Имя'),
    likedTrackIds: getRelationIds(page, 'Лайки песен'),
    likedArtistIds: getRelationIds(page, 'Любимые исполнители'),
    favoriteCollectionIds: getRelationIds(page, 'Любимый плейлист'),
    avatarUrl: getFileUrl(page, 'Аватар'),
    totalListeningMinutes: getNumber(page, 'Время прослушивания'),
});

const mapNotionPageToSimpleArtist = (page: any): SimpleArtist => ({
    id: page.id,
    name: getTitle(page, 'Имя'),
    photoUrl: getFileUrl(page, 'Фото'),
});

const mapNotionPageToTrack = (page: any, artistMap: Map<string, SimpleArtist>): Track | null => {
    try {
        const title = getTitle(page, 'Название');
        const audioUrl = getFileUrl(page, 'Аудио');
        const coverFile = getFiles(page, 'Обложка трека')[0];
        const artistIds = getRelationIds(page, 'Исполнитель');

        if (!title || !audioUrl || !coverFile || artistIds.length === 0) {
            console.warn(`Skipping track with ID ${page.id} due to missing essential data (title, audio, cover, or artist).`);
            return null;
        }

        const artists: SimpleArtist[] = artistIds
            .map(id => artistMap.get(id))
            .filter((a): a is SimpleArtist => a !== undefined);
        
        if (artists.length === 0) {
            console.warn(`Skipping track "${title}" (ID: ${page.id}) because its linked artist could not be found.`);
            return null;
        }

        const coverUrl = coverFile.type === 'external' ? coverFile.external.url : coverFile.file.url;
        const coverUrlType = coverFile.type;

        return {
            id: page.id,
            title,
            artists,
            lyrics: getRichText(page, 'Слова'),
            audioUrl,
            artwork: [{ src: coverUrl, sizes: '512x512', type: 'image/jpeg' }], // Placeholder artwork
            coverUrl,
            coverUrlType,
            likes: getNumber(page, 'Лайки'),
            listens: getNumber(page, 'Прослушивания'),
            youtubeClipUrl: getUrl(page, 'клип'),
            mat: getCheckbox(page, 'МАТ'),
        };
    } catch (error) {
        console.error(`Error mapping track with ID ${page.id}:`, error);
        return null;
    }
};

const mapNotionPageToPlaylist = (page: any): Playlist | null => {
    try {
        const name = getTitle(page, 'Название');
        const coverFile = getFiles(page, 'Обложка')[0];
        if (!name || !coverFile) {
            console.warn(`Skipping playlist with ID ${page.id} due to missing name or cover.`);
            return null;
        }

        const coverUrl = coverFile.type === 'external' ? coverFile.external.url : coverFile.file.url;
        const coverVideoUrl = getFiles(page, 'Обложка').find(f => f.name.includes('_video'))?.file?.url;
        const coverType = coverVideoUrl ? 'video' : 'image';

        return {
            id: page.id,
            name,
            description: getRichText(page, 'Описание'),
            coverUrl,
            coverVideoUrl,
            coverType,
            trackIds: getRelationIds(page, 'Песни'),
            tracks: [], // Will be populated later
            isFavorites: false, // Will be set later
            type: getSelect(page, 'Тип') as 'встроенный' | 'пользовательский' || 'пользовательский',
            collectionType: getSelect(page, 'Альбом/Плейлист') as 'альбом' | 'плейлист' || 'плейлист',
            artistId: getRelationIds(page, 'Исполнитель')[0],
            releaseDate: getDate(page, 'Дата выхода'),
        };
    } catch (error) {
        console.error(`Error mapping playlist with ID ${page.id}:`, error);
        return null;
    }
};

const fetchAllSimpleArtists = async (): Promise<Map<string, SimpleArtist>> => {
    const artistPages = await queryDatabase(ARTISTS_DATABASE_ID);
    const artistMap = new Map<string, SimpleArtist>();
    artistPages.forEach(page => {
        const simpleArtist = mapNotionPageToSimpleArtist(page);
        artistMap.set(simpleArtist.id, simpleArtist);
    });
    return artistMap;
};

export const fetchTracks = async (): Promise<Track[]> => {
    const artistMap = await fetchAllSimpleArtists();
    const trackPages = await queryDatabase(MUSIC_DATABASE_ID);
    return trackPages
        .map(page => mapNotionPageToTrack(page, artistMap))
        .filter((t): t is Track => t !== null);
};

export const fetchSimpleArtistsByIds = async (artistIds: string[]): Promise<SimpleArtist[]> => {
    if (!artistIds || artistIds.length === 0) return [];
    try {
        const artists = await Promise.all(
            artistIds.map(async id => {
                const page = await fetchPage(id);
                return mapNotionPageToSimpleArtist(page);
            })
        );
        return artists.filter(Boolean); // Filter out any nulls if a page fetch fails
    } catch (error) {
        console.error("Failed to fetch simple artists by IDs", error);
        return [];
    }
};

export const fetchAllArtists = async (): Promise<SimpleArtist[]> => {
    const artistPages = await queryDatabase(ARTISTS_DATABASE_ID);
    return artistPages.map(mapNotionPageToSimpleArtist);
};

export const fetchAllCollections = async (): Promise<Playlist[]> => {
    const playlistPages = await queryDatabase(PLAYLISTS_DATABASE_ID);
    return playlistPages
        .map(mapNotionPageToPlaylist)
        .filter((p): p is Playlist => p !== null);
};

export const fetchArtistDetails = async (artistId: string): Promise<Artist> => {
    const artistPage = await fetchPage(artistId);
    const artistMap = await fetchAllSimpleArtists(); 

    const trackPages = await queryDatabase(MUSIC_DATABASE_ID, {
        filter: {
            property: 'Исполнитель',
            relation: {
                contains: artistId,
            },
        },
    });

    const albumPages = await queryDatabase(PLAYLISTS_DATABASE_ID, {
        filter: {
            and: [
                {
                    property: 'Исполнитель',
                    relation: {
                        contains: artistId,
                    }
                },
                {
                    property: 'Альбом/Плейлист',
                    select: {
                        equals: 'альбом',
                    }
                }
            ]
        },
    });

    const tracks: Track[] = trackPages
        .map(page => mapNotionPageToTrack(page, artistMap))
        .filter((t): t is Track => t !== null);

    const albums: Playlist[] = albumPages
        .map(mapNotionPageToPlaylist)
        .filter((p): p is Playlist => p !== null)
        .map(album => ({
            ...album,
            tracks: album.trackIds.map(tid => tracks.find(t => t.id === tid)).filter((t): t is Track => !!t)
        }));

    return {
        id: artistPage.id,
        name: getTitle(artistPage, 'Имя'),
        description: getRichText(artistPage, 'Описание'),
        status: getSelect(artistPage, 'Status'),
        photoUrl: getFileUrl(artistPage, 'Фото'),
        tracks,
        albums,
    };
};

export const loginUser = async (email: string, pass: string): Promise<User> => {
    const users = await queryDatabase(USERS_DATABASE_ID, {
        filter: {
            property: 'Почта',
            email: {
                equals: email.toLowerCase(),
            },
        },
    });

    if (users.length === 0) {
        throw new Error('Пользователь с таким email не найден.');
    }
    const userPage = users[0];
    const storedPass = getRichText(userPage, 'Пароль');
    if (pass !== storedPass) {
        throw new Error('Неверный пароль.');
    }
    return mapNotionPageToUser(userPage);
};

export const registerUser = async (email: string, pass: string, name: string): Promise<User> => {
    const existingUsers = await queryDatabase(USERS_DATABASE_ID, {
        filter: {
            property: 'Почта',
            email: {
                equals: email.toLowerCase(),
            },
        },
    });

    if (existingUsers.length > 0) {
        throw new Error('Пользователь с таким email уже существует.');
    }

    const defaultAvatar = await fetchMediaUrl("Аватар стандартный");

    const newUserPage = await createPage({
        parent: { database_id: USERS_DATABASE_ID },
        properties: {
            'Имя': { title: [{ text: { content: name } }] },
            'Почта': { email: email.toLowerCase() },
            'Пароль': { rich_text: [{ text: { content: pass } }] },
            'Аватар': { files: [{ name: "default_avatar.png", type: "external", external: { url: defaultAvatar || 'https://i.postimg.cc/G3K2BYkT/joysic.png' } }] }
        }
    });

    const favoritesPlaylist = await createPage({
        parent: { database_id: PLAYLISTS_DATABASE_ID },
        properties: {
            'Название': { title: [{ text: { content: 'Любимое' } }] },
            'Тип': { select: { name: 'встроенный' } },
            'пользователи': { relation: [{ id: newUserPage.id }] }
        }
    });

    await updatePage(newUserPage.id, {
        properties: {
            'Любимый плейлист': {
                relation: [{ id: favoritesPlaylist.id }]
            }
        }
    });

    const finalUserPage = await fetchPage(newUserPage.id);
    return mapNotionPageToUser(finalUserPage);
};

export const updateUserLikes = async (user: User, updates: { likedTrackIds?: string[], likedArtistIds?: string[], favoriteCollectionIds?: string[] }, favoritesPlaylistId?: string) => {
    const properties: any = {};
    if (updates.likedTrackIds) {
        properties['Лайки песен'] = { relation: updates.likedTrackIds.map(id => ({ id })) };
        if (favoritesPlaylistId) {
             await updatePage(favoritesPlaylistId, {
                properties: {
                    'Песни': { relation: updates.likedTrackIds.map(id => ({ id })) }
                }
            });
        }
    }
    if (updates.likedArtistIds) {
        properties['Любимые исполнители'] = { relation: updates.likedArtistIds.map(id => ({ id })) };
    }
    if (updates.favoriteCollectionIds) {
        properties['Любимый плейлист'] = { relation: updates.favoriteCollectionIds.map(id => ({ id })) };
    }

    if (Object.keys(properties).length > 0) {
        await updatePage(user.id, { properties });
    }
};

export const incrementTrackStats = async (trackId: string, propertyName: 'Лайки' | 'Прослушивания', currentValue: number, incrementBy: number = 1) => {
    const newValue = Math.max(0, currentValue + incrementBy);
    await updatePage(trackId, {
        properties: {
            [propertyName]: { number: newValue }
        }
    });
};

export const updateUserListeningTime = async (userId: string, totalMinutes: number) => {
    await updatePage(userId, {
        properties: {
            'Время прослушивания': { number: totalMinutes }
        }
    });
};

export const fetchPlaylistsForUser = async (user: User) => {
    const userPlaylistsPages = await queryDatabase(PLAYLISTS_DATABASE_ID, {
        filter: {
            or: [
                {
                    property: 'Тип',
                    select: {
                        equals: 'встроенный'
                    }
                },
                {
                    property: 'пользователи',
                    relation: {
                        contains: user.id
                    }
                }
            ]
        }
    });

    const userPlaylists = userPlaylistsPages
      .map(mapNotionPageToPlaylist)
      .filter((p): p is Playlist => p !== null);
      
    const favoritesPlaylistId = userPlaylists.find(p => p.type === 'встроенный' && p.name === 'Любимое')?.id;

    const likedAlbumIds = user.favoriteCollectionIds.filter(id => id !== favoritesPlaylistId);
    let likedAlbums: Playlist[] = [];
    if (likedAlbumIds.length > 0) {
        const likedAlbumPages = await Promise.all(
            likedAlbumIds.map(id => fetchPage(id).catch(() => null))
        );
        likedAlbums = likedAlbumPages
            .filter(Boolean)
            .map(page => mapNotionPageToPlaylist(page as any))
            .filter((p): p is Playlist => p !== null);
    }
    
    return { playlists: userPlaylists, likedAlbums, favoritesPlaylistId };
};

export const fetchMediaUrl = async (name: string): Promise<string | null> => {
    const results = await queryDatabase(PHOTOS_DATABASE_ID, {
        filter: {
            property: 'Название',
            title: {
                equals: name
            }
        }
    });
    if (results.length > 0) {
        return getFileUrl(results[0], 'Фото') || null;
    }
    return null;
};

export const fetchBetaImage = async (): Promise<string | null> => {
    return fetchMediaUrl('Бета');
};
