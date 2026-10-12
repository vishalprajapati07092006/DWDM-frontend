import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Heart, Lock, User, AlertTriangle, LogIn, RefreshCw } from 'lucide-react';

const T = {
  surface: '#ffffff',
  text: '#0f172a',
  textMuted: '#64748b',
  textFaint: '#94a3b8',
  blue: '#2563eb',
  red: '#dc2626',
  border: '#e2e8f0',
  font: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  shadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -8px rgba(15,23,42,0.08)',
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (name) => ({
    width: '100%',
    background: focused === name ? '#ffffff' : '#f8fafc',
    color: T.text,
    border: `1px solid ${focused === name ? T.blue : '#cbd5e1'}`,
    borderRadius: '10px',
    padding: '12px 14px 12px 40px',
    fontSize: '14px',
    fontWeight: 500,
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'all 0.15s ease',
    boxShadow:
      focused === name ? '0 0 0 3px rgba(37,99,235,0.15)' : '0 1px 2px rgba(15,23,42,0.03)',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: T.font,
        background:
          'linear-gradient(135deg, #eff6ff 0%, #dbeafe 55%, #e0e7ff 100%)',
        padding: '20px',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: T.surface,
          padding: '40px 36px',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '400px',
          boxShadow:
            '0 2px 4px rgba(15,23,42,0.05), 0 24px 60px -20px rgba(37,99,235,0.35)',
          border: `1px solid ${T.border}`,
        }}
      >
        {/* Logo / header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              padding: '14px',
              borderRadius: '16px',
              color: '#ef4444',
              boxShadow: '0 8px 20px -8px rgba(239,68,68,0.55)',
              marginBottom: '16px',
            }}
          >
            <Heart size={32} fill="#ef4444" />
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: '22px',
              fontWeight: 800,
              color: T.text,
              letterSpacing: '-0.5px',
            }}
          >
            PULSE<span style={{ color: T.blue }}>.AI</span>
          </h1>
          <p
            style={{
              margin: '6px 0 0',
              fontSize: '13px',
              color: T.textMuted,
            }}
          >
            Sign in to access the Blood Donation DSS
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '10px 12px',
              borderRadius: '10px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12.5px',
              fontWeight: 600,
            }}
          >
            <AlertTriangle size={15} /> {error}
          </div>
        )}

        {/* Username */}
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 800,
              color: T.textMuted,
              letterSpacing: '0.5px',
              marginBottom: '4px',
            }}
          >
            USERNAME
          </label>
          <div style={{ position: 'relative' }}>
            <User
              size={16}
              color={focused === 'username' ? T.blue : T.textFaint}
              style={{
                position: 'absolute',
                left: '13px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setFocused('username')}
              onBlur={() => setFocused(null)}
              placeholder="admin"
              required
              autoFocus
              style={inputStyle('username')}
            />
          </div>
        </div>

        {/* Password */}
        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 800,
              color: T.textMuted,
              letterSpacing: '0.5px',
              marginBottom: '4px',
            }}
          >
            PASSWORD
          </label>
          <div style={{ position: 'relative' }}>
            <Lock
              size={16}
              color={focused === 'password' ? T.blue : T.textFaint}
              style={{
                position: 'absolute',
                left: '13px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              placeholder="••••••••"
              required
              style={inputStyle('password')}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: '10px',
            border: 'none',
            background: loading
              ? '#94a3b8'
              : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 800,
            cursor: loading ? 'wait' : 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 20px -8px rgba(37,99,235,0.55)',
            letterSpacing: '0.3px',
          }}
        >
          {loading ? (
            <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <LogIn size={16} />
          )}
          {loading ? 'Signing in…' : 'Sign In'}
        </button>

        {/* Hint */}
        <p
          style={{
            margin: '20px 0 0',
            fontSize: '11.5px',
            color: T.textFaint,
            textAlign: 'center',
          }}
        >
          Default credentials: <code>admin</code> / <code>admin123</code>
        </p>
      </form>
    </div>
  );
}