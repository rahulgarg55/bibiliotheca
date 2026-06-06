import React, { useContext } from 'react';
import { LibraryContext } from '../context/LibraryContext';
import { 
  Library, 
  LayoutDashboard, 
  BookOpen, 
  Bookmark, 
  Users, 
  Terminal, 
  RefreshCw,
  Trophy,
  LogOut
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { 
    currentUser, 
    currentRole, 
    users, 
    switchUser, 
    toggleRole,
    handleLogout
  } = useContext(LibraryContext);

  // Filter regular members for quick switching in user mode
  const memberUsers = users.filter(u => u.role === 'user');

  return (
    <div className="sidebar-container">
      <div>
        {/* Brand Logo */}
        <div className="logo-area">
          <div className="logo-icon">
            <Library size={22} color="#fff" />
          </div>
          <span className="logo-title">Bibliotheca</span>
        </div>

        {/* Role Switcher */}
        <div className="role-switcher">
          <button 
            className={`role-switch-btn ${currentRole === 'user' ? 'active' : ''}`}
            onClick={() => currentRole !== 'user' && toggleRole()}
          >
            Member
          </button>
          <button 
            className={`role-switch-btn ${currentRole === 'admin' ? 'active' : ''}`}
            onClick={() => currentRole !== 'admin' && toggleRole()}
          >
            Admin
          </button>
        </div>

        {/* Navigation Menu */}
        <ul className="menu-list">
          <li 
            className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </li>
          <li 
            className={`menu-item ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            <BookOpen size={18} />
            Book Catalog
          </li>
          <li 
            className={`menu-item ${activeTab === 'shelves' ? 'active' : ''}`}
            onClick={() => setActiveTab('shelves')}
          >
            <Bookmark size={18} />
            Custom Shelves
          </li>

          {/* Admin Restricted Views */}
          {currentRole === 'admin' && (
            <>
              <li 
                className={`menu-item ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <Users size={18} />
                User Directory
              </li>
              <li 
                className={`menu-item ${activeTab === 'logs' ? 'active' : ''}`}
                onClick={() => setActiveTab('logs')}
              >
                <Terminal size={18} />
                Console Logs
              </li>
            </>
          )}
        </ul>
      </div>

      {/* User Session Profile Card */}
      <div className="profile-card">
        <div className="profile-header">
          <div 
            className="avatar" 
            style={{ backgroundColor: currentUser?.avatarColor || '#6366f1' }}
          >
            {currentUser?.name?.split(' ').map(n => n[0]).join('') || 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser?.name}
            </h4>
            <span className={`role-badge ${currentRole}`}>
              {currentRole === 'admin' ? 'Administrator' : 'Library Member'}
            </span>
          </div>
        </div>

        {/* Reading Goal Widget for Member role */}
        {currentRole === 'user' && currentUser?.goal > 0 && (
          <div className="goal-tracker">
            <div className="goal-header">
              <span>Goal: Read {currentUser.goal} books</span>
              <span>{Math.min(currentUser.goal, currentUser.goalProgress)} / {currentUser.goal}</span>
            </div>
            <div className="goal-progress-bar">
              <div 
                className="goal-progress-fill" 
                style={{ 
                  width: `${Math.min(100, (currentUser.goalProgress / currentUser.goal) * 100)}%` 
                }}
              />
            </div>
            {currentUser.goalProgress >= currentUser.goal && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontSize: '10px', marginTop: '6px', fontWeight: 600 }}>
                <Trophy size={11} /> Goal achieved! Well done!
              </div>
            )}
          </div>
        )}

        {/* Quick Profile Selector for demo testing */}
        {currentRole === 'user' && (
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              TEST PROFILE SWITCHER:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <select 
                value={currentUser.id} 
                onChange={(e) => switchUser(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  padding: '4px 6px',
                  borderRadius: '4px',
                  outline: 'none'
                }}
              >
                {memberUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        <button 
          onClick={handleLogout}
          style={{
            marginTop: '15px',
            width: '100%',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#fca5a5',
            padding: '8px',
            fontSize: '11px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: '0.2s ease'
          }}
        >
          <LogOut size={12} /> Sign Out
        </button>
      </div>
    </div>
  );
}
