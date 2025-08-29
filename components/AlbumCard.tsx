import React, { useMemo } from 'react';
import type { Playlist } from '../types';
import { HeartIcon } from './IconComponents';
import TrackCover from './TrackCover';

interface AlbumCardProps {
    album: Playlist;
    isLiked: boolean;
    onSelect: (playlist: Playlist) => void;
    onToggleLike: () => void;
}

const AlbumCard = React.memo<AlbumCardProps>(({ album, isLiked, onSelect, onToggleLike }) => {
    const releaseDate = useMemo(() => album.releaseDate ? new Date(album.releaseDate) : null, [album.releaseDate]);
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const isUpcoming = useMemo(() => releaseDate && releaseDate >= today, [releaseDate, today]);
    const releaseYear = useMemo(() => releaseDate ? releaseDate.getFullYear() : null, [releaseDate]);

    const formattedReleaseDate = useMemo(() => releaseDate
        ? releaseDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '', [releaseDate]);

    const handleCardClick = () => {
        if (!isUpcoming) {
            onSelect(album);
        }
    };

    const handleLikeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleLike();
    };

    return (
        <div className="group w-40 sm:w-48 flex-shrink-0">
            <div 
                className={`relative aspect-square w-full rounded-2xl shadow-lg overflow-hidden bg-surface ${isUpcoming ? 'cursor-default' : 'cursor-pointer'}`} 
                onClick={handleCardClick}
            >
                {album.coverType === 'video' && album.coverVideoUrl ? (
                    <video src={album.coverVideoUrl} poster={album.cover.full} autoPlay loop muted playsInline className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 smooth-hover" />
                ) : (
                    <TrackCover 
                        asset={album.cover} 
                        alt={album.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 smooth-hover" 
                        sizes="(max-width: 640px) 160px, 192px" 
                    />
                )}
                {isUpcoming ? (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-center p-2">
                        <p className="font-bold text-primary text-lg">Скоро выйдет</p>
                        <p className="text-sm text-text-secondary">{formattedReleaseDate}</p>
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                )}
            </div>
            <div className="mt-3 flex justify-between items-start">
                <div className="overflow-hidden mr-2">
                    <h3 className={`font-bold text-primary truncate ${isUpcoming ? '' : 'cursor-pointer'}`} onClick={handleCardClick}>{album.name}</h3>
                    <p className="text-sm text-text-secondary">
                      {releaseYear ? `${releaseYear} • ` : ''}{album.tracks.length} треков
                    </p>
                </div>
                {!isUpcoming && (
                    <button
                      onClick={handleLikeClick}
                      className={`${isLiked ? 'text-accent' : 'text-text-secondary'} hover:text-primary transition-colors p-1 -mr-1 flex-shrink-0`}
                      aria-label={isLiked ? 'Убрать лайк с альбома' : 'Поставить лайк на альбом'}
                    >
                        <HeartIcon filled={isLiked} className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
});

export default AlbumCard;