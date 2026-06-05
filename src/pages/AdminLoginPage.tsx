import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/adminStore';

export default function AdminLoginPage() {
  const [pw, setPw] = useState('');
  const [error, setError] = useState(false);
  const login = useAdminStore((s) => s.login);
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = login(pw);
    if (ok) navigate('/admin');
    else setError(true);
  }

  return (
    <div style={{
      minHeight: '100svh',
      background: 'var(--color-ink)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-xl)',
      fontFamily: 'var(--font-family)',
    }}>
      {/* Subtle gradient mesh backdrop */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: `
          radial-gradient(ellipse 60% 60% at 20% 30%, rgba(83,58,253,0.2) 0%, transparent 60%),
          radial-gradient(ellipse 50% 50% at 80% 70%, rgba(234,34,97,0.1) 0%, transparent 60%),
          var(--color-ink)
        `,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 380,
        background: 'var(--color-canvas)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-xxl)',
        boxShadow: 'var(--shadow-2)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xxl)' }}>
          <p style={{ fontSize: 22, fontWeight: 300, letterSpacing: '-0.22px', color: 'var(--color-ink)', marginBottom: 4 }}>
            でんしゃ<span style={{ color: 'var(--color-primary)' }}>電波</span>
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-ink-mute)', letterSpacing: '-0.39px' }}>管理画面</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 400, color: 'var(--color-ink-mute)', marginBottom: 'var(--space-sm)' }}>
              パスワード
            </label>
            <input
              type="password"
              value={pw}
              onChange={(e) => { setPw(e.target.value); setError(false); }}
              placeholder="パスワードを入力"
              autoFocus
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${error ? 'var(--color-ruby)' : 'var(--color-hairline-input)'}`,
                background: 'var(--color-canvas)',
                color: 'var(--color-ink)',
                fontSize: 15,
                fontWeight: 300,
                fontFamily: 'var(--font-family)',
                outline: 'none',
              }}
              onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
              onBlur={(e) => { if (!error) e.currentTarget.style.borderColor = 'var(--color-hairline-input)'; }}
            />
            {error && (
              <p style={{ fontSize: 13, color: 'var(--color-ruby)', marginTop: 'var(--space-xs)', letterSpacing: '-0.39px' }}>
                パスワードが間違っています
              </p>
            )}
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              background: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              padding: '10px 24px',
              fontSize: 16,
              fontWeight: 400,
              fontFamily: 'var(--font-family)',
              cursor: 'pointer',
            }}
          >
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
}
