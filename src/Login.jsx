import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Heart, Lock, User, AlertTriangle, LogIn, RefreshCw, ShieldCheck, Activity, Database, CheckCircle2 } from 'lucide-react';

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL || 'https://dwdm-backend-oavt.onrender.com') + '/api';

const T = {
  red: '#dc2626',
  redDeep: '#991b1b',
  blue: '#2563eb',
  navy: '#0f172a',
  text: '#0f172a',
  textMuted: '#64748b',
  textFaint: '#94a3b8',
  border: '#e2e8f0',
  font: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [focused, setFocused] = useState(null);
  const [backendOnline, setBackendOnline] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const ping = async () => {
      try {
        const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
        if (!cancelled) setBackendOnline(res.ok);
      } catch {
        if (!cancelled) setBackendOnline(false);
      }
    };
    ping();
    const iv = setInterval(ping, 30000);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      setSuccess(true);
      // let the checkmark breathe for ~900ms before redirecting
      setTimeout(() => navigate('/', { replace: true }), 900);
    } catch (err) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes ecg-draw {
          0%   { stroke-dashoffset: 1200; }
          65%  { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
        @keyframes ecg-glow {
          0%, 100% { filter: drop-shadow(0 0 3px rgba(239,68,68,0.55)); }
          50%      { filter: drop-shadow(0 0 12px rgba(239,68,68,0.9)); }
        }
        @keyframes heart-beat {
          0%, 100% { transform: scale(1);    box-shadow: 0 0 0 0 rgba(239,68,68,0.55), 0 8px 24px -8px rgba(239,68,68,0.55); }
          15%      { transform: scale(1.08); box-shadow: 0 0 0 8px rgba(239,68,68,0),   0 8px 24px -8px rgba(239,68,68,0.55); }
          30%      { transform: scale(1);    box-shadow: 0 0 0 14px rgba(239,68,68,0),  0 8px 24px -8px rgba(239,68,68,0.55); }
          45%      { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(239,68,68,0),  0 8px 24px -8px rgba(239,68,68,0.55); }
        }
        @keyframes cell-float {
          0%   { transform: translateY(0) translateX(0) scale(1);   opacity: 0; }
          10%  { opacity: 0.75; }
          90%  { opacity: 0.2; }
          100% { transform: translateY(-120vh) translateX(30px) scale(1.15); opacity: 0; }
        }
        @keyframes scanline {
          0%   { transform: translateY(-10%); opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.6; }
          100% { transform: translateY(110%); opacity: 0; }
        }
        @keyframes card-in {
          0%   { opacity: 0; transform: translateY(28px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes field-in {
          0%   { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%      { transform: translateX(-6px); }
          40%      { transform: translateX(6px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }
        @keyframes btn-breathe {
          0%, 100% { box-shadow: 0 8px 20px -8px rgba(220,38,38,0.7), 0 0 0 0 rgba(220,38,38,0.35); }
          50%      { box-shadow: 0 8px 20px -8px rgba(220,38,38,0.9), 0 0 0 8px rgba(220,38,38,0); }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-150%); }
          100% { transform: translateX(250%); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1;   transform: scale(1); }
          50%      { opacity: 0.4; transform: scale(0.85); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes grid-drift {
          0%   { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        @keyframes orb-drift {
          0%, 100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(20px,-20px) scale(1.08); }
        }
        @keyframes success-pop {
          0%   { transform: scale(0) rotate(-45deg); opacity: 0; }
          60%  { transform: scale(1.15) rotate(0deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg);    opacity: 1; }
        }
        @keyframes success-ring {
          0%   { transform: scale(0.5); opacity: 0.9; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes success-fade {
          0%   { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 46fr) minmax(0, 54fr)',
          fontFamily: T.font,
          background:
            'radial-gradient(1200px 800px at 80% 0%, #eff6ff 0%, #f8fafc 45%, #f1f5f9 100%)',
        }}
        className="pulse-login-root"
      >
        {/* ============ LEFT: light-blue ECG panel ============ */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            background:
              'radial-gradient(1200px 800px at 20% 10%, #d6e4ff 0%, #e6efff 45%, #f1f6ff 100%)',
            borderRight: '1px solid #cfe0ff',
            color: T.navy,
            padding: '48px 44px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* soft red glow orbs */}
          <div
            style={{
              position: 'absolute',
              width: '380px',
              height: '380px',
              borderRadius: '50%',
              top: '-130px',
              left: '-90px',
              background:
                'radial-gradient(circle, rgba(239,68,68,0.18) 0%, rgba(239,68,68,0) 70%)',
              animation: 'orb-drift 14s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '340px',
              height: '340px',
              borderRadius: '50%',
              bottom: '-130px',
              right: '-90px',
              background:
                'radial-gradient(circle, rgba(239,68,68,0.14) 0%, rgba(239,68,68,0) 70%)',
              animation: 'orb-drift 18s ease-in-out infinite reverse',
              pointerEvents: 'none',
            }}
          />

          {/* grid overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(37,99,235,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.07) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              animation: 'grid-drift 20s linear infinite',
              pointerEvents: 'none',
            }}
          />

          {/* red scanline */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: '2px',
              background:
                'linear-gradient(90deg, transparent 0%, rgba(239,68,68,0.9) 50%, transparent 100%)',
              animation: 'scanline 5s linear infinite',
              filter: 'blur(0.5px)',
              pointerEvents: 'none',
            }}
          />

          {/* floating red blood cells */}
          {[
            { left: '12%', size: 18, dur: 14, delay: 0 },
            { left: '28%', size: 12, dur: 18, delay: 3 },
            { left: '46%', size: 22, dur: 16, delay: 6 },
            { left: '62%', size: 14, dur: 20, delay: 2 },
            { left: '76%', size: 20, dur: 15, delay: 8 },
            { left: '88%', size: 10, dur: 22, delay: 5 },
          ].map((c, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                bottom: '-40px',
                left: c.left,
                width: c.size,
                height: c.size,
                borderRadius: '50%',
                background:
                  'radial-gradient(circle at 30% 30%, #fecaca 0%, #ef4444 55%, #b91c1c 100%)',
                boxShadow: '0 4px 12px rgba(239,68,68,0.4)',
                animation: `cell-float ${c.dur}s linear ${c.delay}s infinite`,
                pointerEvents: 'none',
              }}
            />
          ))}

          {/* TOP: logo */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
                  border: '1px solid #fecdd3',
                  padding: '10px',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'heart-beat 2.2s ease-in-out infinite',
                }}
              >
                <Heart size={22} fill="#ef4444" color="#ef4444" />
              </div>
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: 800,
                    letterSpacing: '-0.5px',
                    color: T.navy,
                  }}
                >
                  PULSE<span style={{ color: T.blue }}>.AI</span>
                </h1>
                <span
                  style={{
                    fontSize: '10px',
                    letterSpacing: '1.5px',
                    color: '#475569',
                    fontWeight: 700,
                  }}
                >
                  BLOOD SUPPLY INTELLIGENCE
                </span>
              </div>
            </div>
          </div>

          {/* MIDDLE: red ECG + tagline */}
          <div style={{ position: 'relative', zIndex: 2, marginTop: '20px' }}>
            <svg
              viewBox="0 0 600 120"
              preserveAspectRatio="none"
              style={{
                width: '100%',
                height: '110px',
                animation: 'ecg-glow 2s ease-in-out infinite',
              }}
            >
              <path
                d="M0,60 L80,60 L100,60 L110,20 L120,100 L130,50 L145,60 L220,60 L240,60 L250,25 L260,95 L270,55 L285,60 L360,60 L380,60 L390,30 L400,90 L410,55 L425,60 L500,60 L520,60 L530,25 L540,95 L550,55 L570,60 L600,60"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="1200"
                strokeDashoffset="1200"
                style={{ animation: 'ecg-draw 4s ease-out infinite' }}
              />
            </svg>

            <h2
              style={{
                fontSize: '30px',
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: '-0.8px',
                margin: '20px 0 12px 0',
                color: T.navy,
                maxWidth: '420px',
              }}
            >
              Every drop counts.
              <br />
              <span style={{ color: T.red }}>Every donor matters.</span>
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: '#475569',
                margin: 0,
                maxWidth: '440px',
                lineHeight: 1.6,
              }}
            >
              Real-time predictive analytics, behavioral clustering, and OLAP warehousing — built to
              keep the blood supply chain alive.
            </p>
          </div>

          {/* BOTTOM: trust badges */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            {[
              { icon: <ShieldCheck size={13} />, label: 'JWT Secured' },
              { icon: <Activity size={13} />, label: 'Live ML Inference' },
              { icon: <Database size={13} />, label: 'OLAP Warehouse' },
            ].map((b, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 11px',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.85)',
                  border: '1px solid #bfdbfe',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#1e3a8a',
                  letterSpacing: '0.3px',
                  backdropFilter: 'blur(6px)',
                }}
              >
                {b.icon}
                {b.label}
              </div>
            ))}
          </div>
        </div>

        {/* ============ RIGHT: glass card (now a <form>) ============ */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 40px',
            position: 'relative',
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              width: '100%',
              maxWidth: '460px',
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(20px) saturate(160%)',
              WebkitBackdropFilter: 'blur(20px) saturate(160%)',
              border: '1px solid rgba(191,219,254,0.7)',
              borderRadius: '20px',
              boxShadow:
                '0 2px 4px rgba(15,23,42,0.04), 0 24px 60px -24px rgba(37,99,235,0.28), inset 0 1px 0 rgba(255,255,255,0.9)',
              padding: '40px 36px 32px 36px',
              position: 'relative',
              animation: 'card-in 0.55s cubic-bezier(0.16,1,0.3,1) both',
              overflow: 'hidden',
            }}
          >
            {/* SUCCESS overlay */}
            {success && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(6px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '14px',
                  zIndex: 10,
                  borderRadius: '20px',
                }}
              >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div
                    style={{
                      position: 'absolute',
                      width: 72,
                      height: 72,
                      borderRadius: '50%',
                      background: 'rgba(22,163,74,0.25)',
                      animation: 'success-ring 1s ease-out forwards',
                    }}
                  />
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 12px 32px -8px rgba(22,163,74,0.55)',
                      animation: 'success-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
                    }}
                  >
                    <CheckCircle2 size={38} color="#fff" strokeWidth={2.6} />
                  </div>
                </div>
                <div style={{ textAlign: 'center', animation: 'success-fade 0.4s 0.25s both' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#166534' }}>
                    Welcome back
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#4d7c0f', marginTop: 2 }}>
                    Redirecting to your dashboard…
                  </div>
                </div>
              </div>
            )}

            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  background: 'rgba(254,242,242,0.9)',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  letterSpacing: '0.6px',
                  marginBottom: '14px',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background:
                      backendOnline === null
                        ? '#94a3b8'
                        : backendOnline
                        ? '#16a34a'
                        : '#dc2626',
                    animation: 'pulse-dot 1.6s ease-in-out infinite',
                  }}
                />
                {backendOnline === null
                  ? 'CHECKING BACKEND…'
                  : backendOnline
                  ? 'BACKEND ONLINE'
                  : 'BACKEND OFFLINE'}
              </div>
              <h2
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  margin: '0 0 6px 0',
                  color: T.text,
                  letterSpacing: '-0.7px',
                }}
              >
                Welcome back
              </h2>
              <p style={{ margin: 0, fontSize: '13.5px', color: T.textMuted }}>
                Sign in to access the Blood Donation DSS
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div
                style={{
                  background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  padding: '11px 13px',
                  borderRadius: '10px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  animation: 'shake 0.4s ease-in-out',
                }}
              >
                <AlertTriangle size={15} /> {error}
              </div>
            )}

            {/* Username */}
            <div style={{ marginBottom: '18px', animation: 'field-in 0.5s 0.1s both' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  color: T.textMuted,
                  letterSpacing: '0.6px',
                  marginBottom: '6px',
                }}
              >
                USERNAME
              </label>
              <div style={{ position: 'relative' }}>
                <User
                  size={16}
                  color={focused === 'username' ? T.red : T.textFaint}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    transition: 'color 0.15s ease',
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
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.9)',
                    color: T.text,
                    border: `1.5px solid ${focused === 'username' ? T.red : '#cbd5e1'}`,
                    borderRadius: '10px',
                    padding: '12px 14px 12px 42px',
                    fontSize: '14px',
                    fontWeight: 500,
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'all 0.18s ease',
                    boxShadow:
                      focused === 'username'
                        ? '0 0 0 4px rgba(220,38,38,0.12)'
                        : '0 1px 2px rgba(15,23,42,0.03)',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '26px', animation: 'field-in 0.5s 0.18s both' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  color: T.textMuted,
                  letterSpacing: '0.6px',
                  marginBottom: '6px',
                }}
              >
                PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  color={focused === 'password' ? T.red : T.textFaint}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    transition: 'color 0.15s ease',
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
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.9)',
                    color: T.text,
                    border: `1.5px solid ${focused === 'password' ? T.red : '#cbd5e1'}`,
                    borderRadius: '10px',
                    padding: '12px 14px 12px 42px',
                    fontSize: '14px',
                    fontWeight: 500,
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'all 0.18s ease',
                    boxShadow:
                      focused === 'password'
                        ? '0 0 0 4px rgba(220,38,38,0.12)'
                        : '0 1px 2px rgba(15,23,42,0.03)',
                  }}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || success}
              style={{
                position: 'relative',
                overflow: 'hidden',
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                border: 'none',
                background: loading || success
                  ? '#94a3b8'
                  : 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                color: '#fff',
                fontSize: '14.5px',
                fontWeight: 800,
                cursor: loading || success ? 'wait' : 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                letterSpacing: '0.4px',
                animation: loading || success ? 'none' : 'btn-breathe 2.4s ease-in-out infinite',
                transition: 'transform 0.15s ease, filter 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!loading && !success) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.filter = 'brightness(1.08)';
                  const shimmer = e.currentTarget.querySelector('.shimmer');
                  if (shimmer) {
                    shimmer.style.animation = 'none';
                    void shimmer.offsetWidth;
                    shimmer.style.animation = 'shimmer 0.9s ease-out forwards';
                  }
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              {/* shimmer sweep */}
              <span
                className="shimmer"
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  width: '40%',
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
                  pointerEvents: 'none',
                  transform: 'translateX(-150%)',
                }}
              />
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
                margin: '22px 0 0',
                fontSize: '12px',
                color: T.textFaint,
                textAlign: 'center',
                animation: 'field-in 0.5s 0.3s both',
              }}
            >
              Default credentials: <code style={{ color: T.red, fontWeight: 700 }}>admin</code> /{' '}
              <code style={{ color: T.red, fontWeight: 700 }}>admin123</code>
            </p>
          </form>
        </div>
      </div>

      {/* Mobile */}
      <style>{`
        @media (max-width: 820px) {
          .pulse-login-root {
            grid-template-columns: 1fr !important;
          }
          .pulse-login-root > div:first-child {
            padding: 28px 24px 32px 24px !important;
            min-height: 240px;
          }
          .pulse-login-root > div:first-child svg {
            height: 70px !important;
          }
          .pulse-login-root > div:first-child h2 {
            font-size: 22px !important;
          }
          .pulse-login-root > div:first-child p {
            font-size: 12.5px !important;
          }
        }
      `}</style>
    </>
  );
}