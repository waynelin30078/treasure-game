// Login / signup screen with a "play as guest" option.
// Styling uses inline styles because src/index.css is a pre-compiled Tailwind
// build — arbitrary new utility classes would not take effect (see CLAUDE.md).
import { useState, FormEvent } from 'react';

interface AuthScreenProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onSignup: (username: string, password: string) => Promise<void>;
  onGuest: () => void;
}

export function AuthScreen({ onLogin, onSignup, onGuest }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Handles form submission for either login or signup. Input: form event. Output: none.
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        await onLogin(username.trim(), password);
      } else {
        await onSignup(username.trim(), password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.6rem 0.75rem',
    marginTop: '0.25rem',
    borderRadius: '0.5rem',
    border: '2px solid #fbbf24',
    background: '#fffbeb',
    fontSize: '1rem',
    boxSizing: 'border-box',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl mb-4 text-amber-900">🏴‍☠️ Treasure Hunt Game 🏴‍☠️</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: '22rem',
          background: 'rgba(254, 243, 199, 0.8)',
          backdropFilter: 'blur(4px)',
          border: '2px solid #fbbf24',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {(['login', 'signup'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                color: mode === m ? '#ffffff' : '#92400e',
                background: mode === m ? '#d97706' : 'transparent',
              }}
            >
              {m === 'login' ? '登入' : '註冊'}
            </button>
          ))}
        </div>

        <label style={{ display: 'block', color: '#92400e', marginBottom: '0.75rem' }}>
          使用者名稱
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            style={inputStyle}
          />
        </label>

        <label style={{ display: 'block', color: '#92400e', marginBottom: '1rem' }}>
          密碼
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            style={inputStyle}
          />
        </label>

        {error && (
          <div style={{ color: '#dc2626', marginBottom: '0.75rem', fontSize: '0.9rem' }}>{error}</div>
        )}

        <button
          type="submit"
          disabled={busy}
          style={{
            width: '100%',
            padding: '0.7rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: busy ? 'default' : 'pointer',
            fontWeight: 600,
            fontSize: '1rem',
            color: '#ffffff',
            background: busy ? '#b45309' : '#d97706',
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? '處理中…' : mode === 'login' ? '登入' : '建立帳號'}
        </button>
      </form>

      <button
        type="button"
        onClick={onGuest}
        style={{
          marginTop: '1.25rem',
          background: 'transparent',
          border: 'none',
          color: '#92400e',
          textDecoration: 'underline',
          cursor: 'pointer',
          fontSize: '0.95rem',
        }}
      >
        以訪客身分遊玩(分數不會儲存)
      </button>
    </div>
  );
}
