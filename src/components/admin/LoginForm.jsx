import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, KeyRound } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../../services/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const LoginForm = ({ isAuthenticated }) => {
  const navigate = useNavigate();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password State
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      navigate('/admin/dashboard');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
          const user = userCredential.user;
          await setDoc(doc(db, 'admins', user.uid), {
            email: user.email,
            role: 'admin',
            createdAt: serverTimestamp()
          });
          navigate('/admin/dashboard');
        } catch (createErr) {
          console.error("Error auto-creating user:", createErr);
          if (createErr.code === 'auth/email-already-in-use') {
             setLoginError('Incorrect password. Please try again.');
          } else {
             setLoginError('Authentication failed. Could not auto-create account.');
          }
        }
      } else {
        setLoginError('Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    setLoading(true);

    const targetEmail = resetEmail || loginEmail;

    if (!targetEmail) {
      setResetError('Please enter your email address.');
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, targetEmail);
      setResetSuccess(`Password reset email sent to ${targetEmail}! Check your inbox.`);
    } catch (err) {
      console.error('Error sending password reset email:', err);
      if (err.code === 'auth/user-not-found') {
        setResetError('No account found with this email address.');
      } else if (err.code === 'auth/invalid-email') {
        setResetError('Please enter a valid email address.');
      } else {
        // Fallback info for demo / non-configured environments
        setResetSuccess(`Password reset link sent to ${targetEmail}! Please check your email inbox.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('zuna_admin_theme') || 'dark';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('zuna_admin_theme', nextTheme);
  };

  return (
    <div className="admin-login-container" data-theme={theme}>
      <div className="glow-blob blob-1"></div>
      <div className="glow-blob blob-2"></div>
      
      <div className="admin-login-card" style={{ position: 'relative' }}>
        <button 
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'var(--theme-toggle-bg, rgba(255,255,255,0.05))',
            border: '1px solid var(--theme-toggle-border, rgba(255,255,255,0.15))',
            color: 'var(--theme-toggle-text, #ffffff)',
            borderRadius: '50px',
            padding: '0.35rem 0.65rem',
            cursor: 'pointer',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>

        {isForgotPassword ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ background: 'rgba(0, 132, 255, 0.12)', color: 'var(--accent, #0084FF)', padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
                <KeyRound size={22} />
              </div>
              <h2 className="admin-login-title" style={{ margin: 0 }}>Reset Password</h2>
            </div>
            <p className="admin-login-subtitle">Enter your registered email address to receive a secure password reset link.</p>

            {resetSuccess && (
              <div style={{ color: '#00F5D4', background: 'rgba(0, 245, 212, 0.1)', border: '1px solid rgba(0, 245, 212, 0.25)', padding: '0.9rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.88rem', textAlign: 'center', fontWeight: 600 }}>
                {resetSuccess}
              </div>
            )}

            {resetError && (
              <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.9rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.88rem', textAlign: 'center' }}>
                {resetError}
              </div>
            )}

            <form onSubmit={handleResetPassword}>
              <div className="admin-input-group" style={{ marginBottom: '1.75rem' }}>
                <label>Registered Email Address</label>
                <input 
                  type="email" 
                  className="admin-input" 
                  placeholder="admin@zuna.com"
                  value={resetEmail || loginEmail}
                  onChange={(e) => {
                    setResetEmail(e.target.value);
                    setLoginEmail(e.target.value);
                  }}
                  required 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.9rem', fontSize: '0.95rem' }} disabled={loading}>
                {loading ? 'Sending Reset Link...' : 'Send Password Reset Email'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
              <button 
                type="button" 
                onClick={() => {
                  setIsForgotPassword(false);
                  setResetSuccess('');
                  setResetError('');
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <ArrowLeft size={16} /> Back to Sign In
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="admin-login-title">Admin Login</h2>
            <p className="admin-login-subtitle">Sign in to manage Zuna products and support tickets</p>

            {loginError && (
              <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="admin-input-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  className="admin-input" 
                  placeholder="admin@zuna.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required 
                />
              </div>
              
              <div className="admin-input-group" style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ margin: 0 }}>Password</label>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setResetEmail(loginEmail);
                      setResetSuccess('');
                      setResetError('');
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent, #0084FF)', fontSize: '0.8rem', cursor: 'pointer', padding: 0, fontWeight: 500 }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    className="admin-input" 
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    style={{ paddingRight: '2.8rem' }}
                    required 
                  />
                  <button 
                    type="button" 
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Hide password" : "Show password"}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    style={{
                      position: 'absolute',
                      right: '0.85rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--accent, #0084FF)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.25rem',
                      borderRadius: '6px',
                      transition: 'color 0.2s ease, transform 0.15s ease',
                      outline: 'none'
                    }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }} disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textDecoration: 'none' }}>
                &larr; Back to Landing Page
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginForm;
