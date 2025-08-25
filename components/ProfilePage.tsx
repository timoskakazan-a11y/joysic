
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { ChevronLeftIcon, HeartIcon, UserIcon, MusicNoteIcon } from './IconComponents';
import { fetchMediaUrl } from '../services/airtableService';

interface ProfilePageProps {
  user: User;
  stats: {
    likedTracksCount: number;
    likedArtistsCount: number;
    likedAlbumsCount: number;
  };
  onBack: () => void;
  onLogout: () => void;
}

const formatListeningTime = (totalMinutes: number = 0) => {
    if (totalMinutes < 1) {
        return { hours: 0, minutes: 0 };
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return { hours, minutes };
};

const StatItem: React.FC<{ icon: React.ReactNode, value: number, label: string }> = ({ icon, value, label }) => (
    <div className="flex items-center gap-3">
        <div className="bg-accent/20 text-accent rounded-lg p-2">
            {icon}
        </div>
        <div>
            <p className="font-bold text-primary text-lg">{value}</p>
            <p className="text-text-secondary text-sm">{label}</p>
        </div>
    </div>
);

const ProfilePage: React.FC<ProfilePageProps> = ({ user, stats, onBack, onLogout }) => {
    const [monkeyImageUrl, setMonkeyImageUrl] = useState<string | null>(null);
    const { hours, minutes } = formatListeningTime(user.totalListeningMinutes);

    useEffect(() => {
        fetchMediaUrl('Обезьяна').then(setMonkeyImageUrl);
    }, []);

    return (
        <div className="min-h-screen bg-background text-text font-sans p-4 sm:p-6 animate-fadeInScaleUp">
             <header className="relative flex justify-center items-center mb-8 max-w-md md:max-w-2xl lg:max-w-3xl mx-auto">
                <button 
                    onClick={onBack} 
                    className="absolute left-0 bg-surface text-primary rounded-full h-10 w-10 flex items-center justify-center hover:bg-surface-light transition-colors"
                    aria-label="Back to Library"
                >
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold text-primary">Профиль</h1>
            </header>
            
            <main className="max-w-md md:max-w-2xl lg:max-w-3xl mx-auto">
                <div className="flex flex-col items-center mb-8">
                    <div className="relative w-32 h-32 rounded-full mb-4 shadow-lg">
                         <img 
                            src={user.avatarUrl || 'https://i.postimg.cc/G3K2BYkT/joysic.png'} 
                            alt="User Avatar" 
                            className="w-full h-full object-cover rounded-full border-4 border-surface-light" 
                        />
                    </div>
                    <h2 className="text-3xl font-black text-primary">{user.name}</h2>
                </div>

                {/* Time Card with GIF */}
                <div className="bg-surface rounded-2xl shadow-lg p-4 sm:p-6 flex items-center gap-4 sm:gap-6 mb-6">
                    {/* Left side: GIF */}
                    {monkeyImageUrl && (
                        <div className="w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0 rounded-2xl overflow-hidden bg-surface-light">
                            <img
                                src={monkeyImageUrl}
                                alt="Decorative animation"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                    
                    {/* Right side: Stats */}
                    <div className="text-left flex-grow">
                        <h3 className="font-bold text-primary text-base sm:text-lg mb-1 sm:mb-2">Время в Joysic</h3>
                        <div className="flex items-baseline justify-start gap-1 sm:gap-2">
                            <span className="text-3xl sm:text-5xl font-black text-accent">{hours}</span>
                            <span className="text-base sm:text-lg text-text-secondary">ч</span>
                            <span className="text-3xl sm:text-5xl font-black text-accent sm:ml-2">{minutes}</span>
                            <span className="text-base sm:text-lg text-text-secondary">м</span>
                        </div>
                        <p className="text-xs sm:text-sm text-text-secondary mt-1">общее время прослушивания</p>
                    </div>
                </div>

                <div className="bg-surface rounded-2xl shadow-lg p-6 mt-6">
                    <h3 className="font-bold text-primary text-lg mb-4">Статистика медиатеки</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <StatItem icon={<HeartIcon filled className="w-5 h-5"/>} value={stats.likedTracksCount} label="Лайков" />
                        <StatItem icon={<UserIcon className="w-5 h-5"/>} value={stats.likedArtistsCount} label="Артистов" />
                        <StatItem icon={<MusicNoteIcon className="w-5 h-5"/>} value={stats.likedAlbumsCount} label="Альбомов" />
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <button 
                        onClick={onLogout} 
                        className="bg-surface-light px-6 py-3 rounded-lg text-sm font-bold text-text hover:bg-surface transition-colors"
                    >
                        Выйти из аккаунта
                    </button>
                </div>

            </main>
        </div>
    );
};

export default ProfilePage;