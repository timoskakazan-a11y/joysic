
import React from 'react';
import type { Track } from '../types';
import Barcode from './Barcode';
import { CloseIcon } from './IconComponents';
import TrackCover from './TrackCover';

interface JoycodeModalProps {
  track: Track;
  onClose: () => void;
}

const JoycodeModal: React.FC<JoycodeModalProps> = ({ track, onClose }) => {
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeInScaleUp"
      onClick={onClose}
    >
      {/* Blurred background */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
        style={{
          backgroundImage: `url(${track.cover.large || track.cover.full})`,
          filter: 'blur(24px)',
        }}
      />
      <div className="absolute inset-0 bg-black/60" />

      {/* Glassmorphism Card */}
      <div 
        className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-sm text-center border border-white/10 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-10 p-1"
          aria-label="Close"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        <div className="p-8 flex flex-col items-center gap-6">
            <TrackCover
              asset={track.cover}
              alt={track.title} 
              className="w-40 h-40 object-cover rounded-2xl mx-auto shadow-lg"
            />
            
            <div className="w-full">
                <h2 className="text-2xl font-bold text-primary truncate">{track.title}</h2>
                <p className="text-text-secondary">{track.artists.map(a => a.name).join(', ')}</p>
            </div>
            
            <div className="bg-white p-4 rounded-2xl">
                <Barcode 
                    value={track.id} 
                />
            </div>
        </div>
      </div>

      <p className="absolute bottom-6 left-0 right-0 text-center text-white/70 text-sm pointer-events-none px-4">
        Отсканируйте с другого устройства, чтобы поделиться
      </p>
    </div>
  );
};

export default JoycodeModal;