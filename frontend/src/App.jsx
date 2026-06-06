import React, { useState, useContext } from 'react';
import { LibraryProvider, LibraryContext } from './context/LibraryContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Catalog from './components/Catalog';
import BookDetailsModal from './components/BookDetailsModal';
import Shelves from './components/Shelves';
import ReadingRoom from './components/ReadingRoom';
import UserManagement from './components/UserManagement';
import ActivityLogView from './components/ActivityLogView';
import LoginSignup from './components/LoginSignup';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [readingBookId, setReadingBookId] = useState(null);
  
  const { toasts, currentUser, handleLogin, currentRole } = useContext(LibraryContext);

  // Gated: Reset admin-restricted tabs if user toggles/logins role to user
  React.useEffect(() => {
    if (currentRole === 'user' && (activeTab === 'users' || activeTab === 'logs')) {
      setActiveTab('dashboard');
    }
  }, [currentRole, activeTab]);

  // Gatekeeper: Render Login/Signup view when no session token exists
  if (!currentUser) {
    return (
      <>
        <LoginSignup onLoginSuccess={handleLogin} />
        {/* Floating Toast alerts */}
        <div className="toast-container">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast-card ${toast.type}`}>
              {toast.type === 'success' && <CheckCircle2 size={18} color="var(--success)" />}
              {toast.type === 'error' && <AlertTriangle size={18} color="var(--danger)" />}
              {toast.type === 'info' && <Info size={18} color="var(--accent-secondary)" />}
              {toast.type === 'warning' && <AlertTriangle size={18} color="var(--warning)" />}
              <span style={{ fontSize: '13px', fontWeight: 500 }}>{toast.message}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="content-container">
        {activeTab === 'dashboard' && (
          <Dashboard 
            setActiveTab={setActiveTab} 
            setSelectedBookId={setSelectedBookId} 
          />
        )}
        {activeTab === 'catalog' && (
          <Catalog 
            setSelectedBookId={setSelectedBookId} 
          />
        )}
        {activeTab === 'shelves' && (
          <Shelves 
            setSelectedBookId={setSelectedBookId} 
          />
        )}
        {activeTab === 'users' && currentRole === 'admin' && (
          <UserManagement />
        )}
        {activeTab === 'logs' && currentRole === 'admin' && (
          <ActivityLogView />
        )}
        {activeTab === 'reading-room' && (
          <ReadingRoom 
            bookId={readingBookId} 
            setActiveTab={setActiveTab} 
          />
        )}
      </div>

      {/* Book Detail Modal overlay */}
      {selectedBookId && (
        <BookDetailsModal 
          bookId={selectedBookId} 
          onClose={() => setSelectedBookId(null)}
          setActiveTab={setActiveTab}
          setReadingBookId={setReadingBookId}
        />
      )}

      {/* System Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card ${toast.type}`}>
            {toast.type === 'success' && <CheckCircle2 size={18} color="var(--success)" />}
            {toast.type === 'error' && <AlertTriangle size={18} color="var(--danger)" />}
            {toast.type === 'info' && <Info size={18} color="var(--accent-secondary)" />}
            {toast.type === 'warning' && <AlertTriangle size={18} color="var(--warning)" />}
            <span style={{ fontSize: '13px', fontWeight: 500 }}>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LibraryProvider>
      <AppContent />
    </LibraryProvider>
  );
}
