
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { fetchAllArtists, createTrack } from './services/airtableService';
import type { SimpleArtist } from './types';

// jsmediatags is loaded from CDN
declare const jsmediatags: any;

const UploaderApp: React.FC = () => {
    const [title, setTitle] = useState('');
    const [artistId, setArtistId] = useState('');
    const [audioUrl, setAudioUrl] = useState('');
    const [coverUrl, setCoverUrl] = useState('');
    const [mat, setMat] = useState(false);

    const [artists, setArtists] = useState<SimpleArtist[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    useEffect(() => {
        const loadArtists = async () => {
            try {
                const fetchedArtists = await fetchAllArtists();
                setArtists(fetchedArtists);
            } catch (error) {
                console.error("Failed to fetch artists", error);
                setStatus({ message: 'Не удалось загрузить список исполнителей.', type: 'error' });
            } finally {
                setIsLoading(false);
            }
        };
        loadArtists();
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setStatus(null);

        jsmediatags.read(file, {
            onSuccess: (tag: any) => {
                const { title, artist } = tag.tags;
                if (title) {
                    setTitle(title);
                }
                if (artist) {
                    const foundArtist = artists.find(a => a.name.toLowerCase() === artist.toLowerCase());
                    if (foundArtist) {
                        setArtistId(foundArtist.id);
                    }
                }
            },
            onError: (error: any) => {
                console.error('Error reading MP3 tags:', error);
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !artistId || !audioUrl || !coverUrl) {
            setStatus({ message: 'Пожалуйста, заполните все поля.', type: 'error' });
            return;
        }

        setIsUploading(true);
        setStatus(null);

        try {
            await createTrack({ title, artistId, audioUrl, coverUrl, mat });
            setStatus({ message: 'Трек успешно добавлен!', type: 'success' });
            // Reset form
            setTitle('');
            setArtistId('');
            setAudioUrl('');
            setCoverUrl('');
            setMat(false);
            setFileName(null);
            const fileInput = document.getElementById('mp3-file') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

        } catch (error) {
            console.error("Failed to upload track", error);
            setStatus({ message: 'Ошибка при добавлении трека.', type: 'error' });
        } finally {
            setIsUploading(false);
        }
    };

    const formStyles = {
        label: "block text-sm font-bold text-text-secondary mb-2",
        input: "w-full bg-surface-light text-text px-4 py-3 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-accent transition-colors",
        button: "w-full bg-accent text-background font-bold py-3 px-4 rounded-lg hover:bg-opacity-80 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-2xl">
                <h1 className="text-4xl font-black text-primary text-center mb-8 -tracking-tighter">
                    Joysic Uploader
                </h1>
                <div className="bg-surface p-8 rounded-2xl shadow-lg">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className={formStyles.label} htmlFor="mp3-file">
                                MP3 Файл
                            </label>
                            <div className="relative">
                                <input
                                    id="mp3-file"
                                    type="file"
                                    accept=".mp3"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className={`${formStyles.input} text-text-secondary flex items-center justify-between`}>
                                    <span>{fileName || 'Выберите файл...'}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                </div>
                            </div>
                            <p className="text-xs text-text-secondary mt-2">Метаданные (название, исполнитель) будут извлечены автоматически.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={formStyles.label} htmlFor="title">
                                    Название трека
                                </label>
                                <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} required className={formStyles.input} />
                            </div>
                            <div>
                                <label className={formStyles.label} htmlFor="artist">
                                    Исполнитель
                                </label>
                                <select id="artist" value={artistId} onChange={e => setArtistId(e.target.value)} required className={`${formStyles.input} appearance-none`} disabled={isLoading}>
                                    <option value="" disabled>{isLoading ? 'Загрузка...' : 'Выберите исполнителя'}</option>
                                    {artists.map(artist => (
                                        <option key={artist.id} value={artist.id}>{artist.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={formStyles.label} htmlFor="audioUrl">
                                    URL аудио (public)
                                </label>
                                <input id="audioUrl" type="url" value={audioUrl} onChange={e => setAudioUrl(e.target.value)} required className={formStyles.input} placeholder="https://..." />
                            </div>
                            <div>
                                <label className={formStyles.label} htmlFor="coverUrl">
                                    URL обложки (public)
                                </label>
                                <input id="coverUrl" type="url" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} required className={formStyles.input} placeholder="https://..." />
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input type="checkbox" id="mat" checked={mat} onChange={e => setMat(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent" />
                            <label htmlFor="mat" className="ml-2 block text-sm text-text">
                                МАТ (Содержит ненормативную лексику)
                            </label>
                        </div>
                        
                        <button type="submit" disabled={isUploading} className={formStyles.button}>
                            {isUploading ? 'Добавление...' : 'Добавить трек'}
                        </button>

                        {status && (
                            <div className={`p-3 rounded-lg text-center text-sm ${status.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                {status.message}
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <UploaderApp />
  </React.StrictMode>
);

export default UploaderApp;
