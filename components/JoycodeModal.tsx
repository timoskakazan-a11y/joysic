import React from 'react';
import type { Track } from '../types';
import Barcode from './Barcode';

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
          backgroundImage: `url(${track.coverUrl})`,
          filter: 'blur(24px)',
        }}
      />
      <div className="absolute inset-0 bg-black/60" />

      {/* Glassmorphism Card */}
      <div 
        className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-sm text-center border border-white/10 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 flex flex-col items-center gap-6">
            <img 
              src={track.coverUrl} 
              alt={track.title} 
              className="w-40 h-40 object-cover rounded-2xl mx-auto shadow-lg"
            />
            
            <div className="w-full">
                <h2 className="text-2xl font-bold text-primary truncate">{track.title}</h2>
                <p className="text-text-secondary">{track.artist}</p>
            </div>
            
            <div className="bg-white p-4 rounded-2xl">
                <Barcode 
                    value={track.id} 
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default JoycodeModal;