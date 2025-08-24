import React from 'react';

interface BetaLockScreenProps {
  imageUrl: string | null;
}

const BetaLockScreen: React.FC<BetaLockScreenProps> = ({ imageUrl }) => {
  return (
    <div className="min-h-screen bg-background text-text flex flex-col justify-center items-center p-6 text-center">
      <div className="w-full max-w-md">
        {imageUrl ? (
          <img src={imageUrl} alt="Бета-тест" className="w-64 h-64 mx-auto mb-8 animate-breathing" />
        ) : (
          <div className="w-64 h-64 mx-auto mb-8 bg-surface rounded-2xl animate-pulse"></div>
        )}
        <h1 className="text-4xl font-black text-primary mb-4">Скоро...</h1>
        <p className="text-text-secondary leading-relaxed">
          Скоро начнется закрытое бета-тестирование Joysic.
          <br />
          На данный момент доступ к приложению ограничен. Спасибо за ваш интерес!
        </p>
      </div>
    </div>
  );
};

export default BetaLockScreen;