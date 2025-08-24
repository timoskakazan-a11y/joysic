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
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeInScaleUp"
      onClick={onClose}
    >
      <div 
        className="bg-surface rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-sm text-center border border-surface-light"
        onClick={e => e.stopPropagation()}
      >
        <img 
          src={track.coverUrl} 
          alt={track.title} 
          className="w-32 h-32 object-cover rounded-2xl mx-auto -mt-20 mb-4 shadow-lg border-4 border-surface"
        />
        <h2 className="text-2xl font-bold text-primary truncate">{track.title}</h2>
        <p className="text-text-secondary mb-6">{track.artist}</p>
        
        <div className="bg-surface-light p-2 rounded-2xl">
          <div className="bg-background rounded-xl overflow-hidden flex justify-center items-center p-4">
            <Barcode 
                value={track.id} 
                options={{
                    width: 200,
                }}
            />
          </div>
        </div>

        <p className="text-xs text-text-secondary mt-4">Отсканируйте этот Joycode в приложении, чтобы поделиться треком.</p>

        <button
          onClick={onClose}
          className="mt-6 bg-accent text-background font-bold py-3 px-8 rounded-full hover:bg-opacity-80 transition-opacity duration-200"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};

export default JoycodeModal;