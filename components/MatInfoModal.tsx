import React from 'react';
import { CloseIcon } from './IconComponents';

interface MatInfoModalProps {
  onClose: () => void;
}

const MatInfoModal: React.FC<MatInfoModalProps> = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 z-[101] flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-black/60 animate-fadeInScaleUp"
        style={{ animationDuration: '0.3s' }}
      ></div>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-surface-light rounded-t-2xl shadow-lg p-6 animate-fadeInScaleUp"
        style={{ transformOrigin: 'bottom', animationDuration: '0.4s' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-primary transition-colors z-10 p-1"
          aria-label="Close"
        >
          <CloseIcon className="w-6 h-6" />
        </button>
        <h2 className="flex items-baseline gap-2 text-xl font-bold text-primary mb-3">
          <span className="bg-surface text-text-secondary text-xs font-bold px-2 py-1 rounded-md">МАТ</span>
          <span>Материалы Альтернативного Толкования</span>
        </h2>
        <p className="text-text-secondary leading-relaxed">
          Этот значок означает, что материалы могут содержать:
        </p>
        <ul className="list-disc list-inside text-text-secondary mt-2 space-y-1">
          <li>Нецензурную лексику</li>
          <li>Темы, связанные с политикой и властью</li>
          <li>Сцены или упоминания насилия и жестокости</li>
        </ul>
        <p className="text-text-secondary leading-relaxed mt-4 text-sm">
          Данный контент предназначен для совершеннолетней аудитории.
        </p>
      </div>
    </div>
  );
};

export default MatInfoModal;