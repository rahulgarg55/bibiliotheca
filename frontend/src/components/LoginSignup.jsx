import React, { useState, useContext } from 'react';
import { LibraryContext } from '../context/LibraryContext';
import { Library, User, Mail, Lock, Plus } from 'lucide-react';

export default function LoginSignup({ onLoginSuccess }) {
  const { showToast } = useContext(LibraryContext);
  const [isLogin, setIsLogin] = useState(true);
  
  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup Form
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupAvatarColor, setSignupAvatarColor] = useState('#8b5cf6');

  const avatarColors = ['#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) return;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      
      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || 'Authentication failed.', 'error');
        return;
      }

      showToast(data.message, 'success');
      onLoginSuccess(data.token, data.user);
    } catch (err) {
      console.error(err);
      showToast('Cannot connect to authentication server.', 'error');
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) return;

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
          avatarColor: signupAvatarColor
        })
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || 'Registration failed.', 'error');
        return;
      }

      showToast(data.message, 'success');
      // Auto-toggle to login form
      setIsLogin(true);
      setLoginEmail(signupEmail);
      setLoginPassword('');
    } catch (err) {
      console.error(err);
      showToast('Cannot connect to registration server.', 'error');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'var(--bg-primary)',
      backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 60%)'
    }}>
      <div className="glass-panel animate-slide" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '40px 30px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)'
      }}>
        {/* Brand Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '35px' }}>
          <div className="logo-icon" style={{ width: '48px', height: '48px', borderRadius: '12px', marginBottom: '15px' }}>
            <Library size={26} color="#fff" />
          </div>
          <h1 className="logo-title" style={{ fontSize: '26px' }}>Bibliotheca</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px', textAlign: 'center' }}>
            {isLogin 
              ? 'Enter credentials to access catalog shelves.' 
              : 'Create profile to checkout books and set reading goals.'}
          </p>
        </div>

        {isLogin ? (
          /* Sign In Card */
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="form-group">
              <label>Email Address</label>
              <div className="search-input-wrap">
                <Mail size={16} />
                <input 
                  type="email" 
                  required 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="search-input" 
                  placeholder="name@library.org"
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="search-input-wrap">
                <Lock size={16} />
                <input 
                  type="password" 
                  required 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="search-input" 
                  placeholder="••••••••"
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            <button type="submit" className="glow-btn" style={{ marginTop: '10px' }}>
              Sign In to Bibliotheca
            </button>
          </form>
        ) : (
          /* Sign Up Card */
          <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label>Full Name</label>
              <div className="search-input-wrap">
                <User size={16} />
                <input 
                  type="text" 
                  required 
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  className="search-input" 
                  placeholder="Alice Smith"
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <div className="search-input-wrap">
                <Mail size={16} />
                <input 
                  type="email" 
                  required 
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="search-input" 
                  placeholder="alice@library.org"
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="search-input-wrap">
                <Lock size={16} />
                <input 
                  type="password" 
                  required 
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="search-input" 
                  placeholder="••••••••"
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            {/* Avatar color picker */}
            <div className="form-group">
              <label>Profile Avatar Color</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {avatarColors.map(color => (
                  <button 
                    key={color}
                    type="button"
                    onClick={() => setSignupAvatarColor(color)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: color,
                      border: signupAvatarColor === color ? '2px solid #fff' : '1px solid transparent',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>

            <button type="submit" className="glow-btn" style={{ marginTop: '10px' }}>
              Create Library Account
            </button>
          </form>
        )}

        {/* Card Toggle footer */}
        <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
          {isLogin ? (
            <p>
              New reader?{' '}
              <span 
                onClick={() => setIsLogin(false)} 
                style={{ color: 'var(--accent-secondary)', cursor: 'pointer', fontWeight: 600 }}
              >
                Sign Up
              </span>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <span 
                onClick={() => setIsLogin(true)} 
                style={{ color: 'var(--accent-secondary)', cursor: 'pointer', fontWeight: 600 }}
              >
                Sign In
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
