import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiShield } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

const LoginForm = ({ isAuthenticated }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showToast } = useToast();
  const { isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-fill email from query param (?email=...)
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryEmail = params.get('email');
    if (queryEmail) {
      setEmail(queryEmail);
    }
  }, [location.search]);

  // If already logged in, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/admin/dashboard/overview';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      showToast(`Welcome back, ${user?.name || 'Administrator'}!`, 'success');
      const from = location.state?.from?.pathname || '/admin/dashboard/overview';
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Invalid email or password.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(16px, 4vw, 24px)',
        position: 'relative',
        background: 'var(--bg)',
        overflow: 'hidden'
      }}
    >
      {/* Background Decorative Glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, var(--accent-light) 0%, transparent 70%)',
          filter: 'blur(60px)',
          opacity: isDark ? 0.6 : 0.4,
          pointerEvents: 'none'
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: 'clamp(24px, 6vw, 36px) clamp(16px, 5vw, 28px)',
          borderRadius: 'var(--radius-xl)',
          position: 'relative',
          zIndex: 1,
          border: '1px solid var(--border-strong)'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-7)' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-light)',
              border: '1px solid var(--accent)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-4)',
              boxShadow: 'var(--shadow-glow)',
              overflow: 'hidden',
              padding: '6px'
            }}
          >
            <img src="/logo.png" alt="Zuna Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          <h1 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-2)' }}>Zuna Central</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
            Enterprise Command Center & Support Hub
          </p>
        </div>

        {/* Error Notice */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: 'var(--space-5)'
            }}
          >
            {error}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Email */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-2)'
              }}
            >
              Administrator Email
            </label>
            <div style={{ position: 'relative' }}>
              <FiMail
                size={18}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '14px', top: '12px', pointerEvents: 'none' }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@zuna.com"
                required
                className="input-field"
                style={{ paddingLeft: '42px' }}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-2)'
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <FiLock
                size={18}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '14px', top: '12px', pointerEvents: 'none' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="input-field"
                style={{ paddingLeft: '42px', paddingRight: '42px' }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '10px',
                  padding: '4px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              height: '46px',
              marginTop: 'var(--space-3)',
              fontSize: '0.9375rem',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (
              <span>Verifying Credentials...</span>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <FiArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Quick autofill helper for convenience */}
        <div
          style={{
            marginTop: 'var(--space-6)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--border)',
            textAlign: 'center'
          }}
        >
          <button
            type="button"
            onClick={() => {
              setEmail('admin@zuna.com');
              setPassword('Cgs@001a');
            }}
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            Autofill Super Admin Credentials
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginForm;
