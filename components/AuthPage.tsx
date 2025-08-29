
import React, { useState } from 'react';

interface AuthPageProps {
  onLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (email: string, pass: string, name: string) => Promise<void>;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onRegister }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (isLoginView) {
        await onLogin(email, password);
      } else {
        await onRegister(email, password, name);
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-6xl font-black text-primary text-center mb-8 -tracking-tighter">
          Joysic
        </h1>
        <div className="bg-surface p-8 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-center text-primary mb-6">
            {isLoginView ? 'Вход' : 'Регистрация'}
          </h2>
          {error && (
            <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-4 text-center text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLoginView && (
              <div>
                <label className="text-sm font-bold text-text-secondary block mb-2" htmlFor="name">
                  Имя
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-surface-light text-text px-4 py-3 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Ваше имя"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-bold text-text-secondary block mb-2" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-surface-light text-text px-4 py-3 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-text-secondary block mb-2" htmlFor="password">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-surface-light text-text px-4 py-3 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent text-background font-bold py-3 px-4 rounded-lg hover:bg-opacity-80 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-background mx-auto"></div>
              ) : (
                isLoginView ? 'Войти' : 'Создать аккаунт'
              )}
            </button>
          </form>
          <div className="text-center mt-6">
            <button
              onClick={() => {
                setIsLoginView(!isLoginView);
                setError(null);
              }}
              className="text-sm text-accent hover:opacity-80 transition-opacity"
            >
              {isLoginView
                ? 'Нет аккаунта? Зарегистрироваться'
                : 'Уже есть аккаунт? Войти'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;