import React, { useContext, useState } from 'react';
import { LibraryContext } from '../context/LibraryContext';
import { 
  Search, 
  UserPlus, 
  X, 
  DollarSign, 
  History, 
  Trash2, 
  ShieldAlert,
  UserX,
  UserCheck
} from 'lucide-react';

export default function UserManagement() {
  const { 
    users, 
    loans, 
    books, 
    toggleUserStatus, 
    deleteUser, 
    createUser, 
    payFine 
  } = useContext(LibraryContext);

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', avatarColor: '#8b5cf6' });

  // Fine settlement state
  const [payAmount, setPayAmount] = useState('');
  const [selectedFineUserId, setSelectedFineUserId] = useState(null);

  // User borrow details state
  const [inspectUserId, setInspectUserId] = useState(null);

  const regularUsers = users.filter(u => u.role === 'user');

  // Filter users based on search
  const filteredUsers = regularUsers.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const colors = ['#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim()) return;
    createUser(newUser);
    setShowAddModal(false);
    setNewUser({ name: '', email: '', avatarColor: '#8b5cf6' });
  };

  const handleFinePaymentSubmit = (e, userId) => {
    e.preventDefault();
    payFine(userId, payAmount);
    setPayAmount('');
    setSelectedFineUserId(null);
  };

  // Inspect user's borrowing history
  const getInspectLoans = (userId) => {
    return loans.filter(l => l.userId === userId);
  };

  const inspectedUser = users.find(u => u.id === inspectUserId);
  const inspectedLoans = getInspectLoans(inspectUserId);

  return (
    <div className="animate-slide">
      {/* Header controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px' }} className="text-glow-purple">
            Member Directory
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Manage {regularUsers.length} registered members, check fine records, and view user audit logs.
          </p>
        </div>

        <button className="glow-btn" onClick={() => setShowAddModal(true)}>
          <UserPlus size={16} /> Register Member
        </button>
      </div>

      {/* Search Bar */}
      <div className="catalog-controls">
        <div className="search-input-wrap">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search member profiles by name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Users table */}
      {filteredUsers.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>No member profiles match your search criteria.</p>
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Member Info</th>
                <th>Status</th>
                <th>Monthly Progress</th>
                <th>Fine Balance</th>
                <th style={{ textAlign: 'right' }}>Management Options</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const userActiveLoans = loans.filter(l => l.userId === user.id && (l.status === 'active' || l.status === 'overdue'));
                
                return (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div 
                          className="avatar" 
                          style={{ backgroundColor: user.avatarColor, width: '40px', height: '40px', fontSize: '15px' }}
                        >
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h4 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</h4>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`user-status-dot ${user.status}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '140px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                          <span>Read {user.goalProgress}/{user.goal}</span>
                          <span>{Math.round((user.goalProgress / user.goal) * 100)}%</span>
                        </div>
                        <div className="goal-progress-bar" style={{ height: '4px' }}>
                          <div 
                            className="goal-progress-fill" 
                            style={{ width: `${Math.min(100, (user.goalProgress / user.goal) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        fontWeight: 700, 
                        color: user.fines > 0 ? 'var(--warning)' : 'var(--success)' 
                      }}>
                        ${user.fines.toFixed(2)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {/* Fine settlement button */}
                        {user.fines > 0 && (
                          <button 
                            className="secondary-btn" 
                            style={{ padding: '6px 10px', fontSize: '11px', borderColor: 'var(--warning-glow)' }}
                            onClick={() => setSelectedFineUserId(user.id)}
                            title="Record Payment"
                          >
                            <DollarSign size={12} color="var(--warning)" /> Settle
                          </button>
                        )}

                        {/* History details button */}
                        <button 
                          className="secondary-btn" 
                          style={{ padding: '6px 10px', fontSize: '11px' }}
                          onClick={() => setInspectUserId(user.id)}
                          title="Borrowing Ledger"
                        >
                          <History size={12} /> Ledger ({userActiveLoans.length} active)
                        </button>

                        {/* Suspend Account button */}
                        <button 
                          className="secondary-btn" 
                          style={{ 
                            padding: '6px 10px', 
                            fontSize: '11px',
                            borderColor: user.status === 'active' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'
                          }}
                          onClick={() => toggleUserStatus(user.id)}
                          title={user.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                        >
                          {user.status === 'active' ? (
                            <UserX size={12} color="var(--danger)" />
                          ) : (
                            <UserCheck size={12} color="var(--success)" />
                          )}
                        </button>

                        {/* Delete user button */}
                        <button 
                          className="danger-btn" 
                          style={{ padding: '6px 10px', fontSize: '11px' }}
                          onClick={() => {
                            if (window.confirm(`Permanently remove member profile for '${user.name}'?`)) {
                              deleteUser(user.id);
                            }
                          }}
                          title="Delete Account"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '450px' }}>
            <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
              <X size={18} />
            </button>
            <form onSubmit={handleAddSubmit} style={{ padding: '30px' }}>
              <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 800 }} className="text-glow-purple">
                Register New Member
              </h2>

              <div className="form-group">
                <label>Full Name *</label>
                <input 
                  type="text" 
                  required 
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="form-input" 
                  placeholder="e.g. Alice Smith"
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input 
                  type="email" 
                  required 
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="form-input" 
                  placeholder="e.g. alice@library.org"
                />
              </div>

              <div className="form-group">
                <label>Profile Theme Color</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {colors.map(color => (
                    <button 
                      key={color}
                      type="button"
                      onClick={() => setNewUser({ ...newUser, avatarColor: color })}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: color,
                        border: newUser.avatarColor === color ? '2px solid #fff' : '1px solid transparent',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
                <button type="submit" className="glow-btn" style={{ flex: 1 }}>
                  Create Profile
                </button>
                <button 
                  type="button" 
                  className="secondary-btn" 
                  style={{ flex: 1 }}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Fine Modal Overlay */}
      {selectedFineUserId && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '400px' }}>
            <button className="modal-close-btn" onClick={() => setSelectedFineUserId(null)}>
              <X size={18} />
            </button>
            {(() => {
              const fineUser = users.find(u => u.id === selectedFineUserId);
              return (
                <form onSubmit={(e) => handleFinePaymentSubmit(e, fineUser.id)} style={{ padding: '30px' }}>
                  <h2 style={{ marginBottom: '10px', fontSize: '18px', fontWeight: 800 }} className="text-glow-purple">
                    Fine Transaction Record
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                    Member: <strong>{fineUser?.name}</strong> <br />
                    Outstanding Balance: <strong style={{ color: 'var(--warning)' }}>${fineUser?.fines.toFixed(2)}</strong>
                  </p>

                  <div className="form-group">
                    <label>Payment Amount Received ($)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0.01" 
                      max={fineUser?.fines} 
                      required 
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="form-input" 
                      placeholder="e.g. 5.50"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button type="submit" className="glow-btn" style={{ flex: 1 }}>
                      Post Payment
                    </button>
                    <button 
                      type="button" 
                      className="secondary-btn" 
                      style={{ flex: 1 }}
                      onClick={() => setSelectedFineUserId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* Borrow inspection modal */}
      {inspectUserId && inspectedUser && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '650px', maxHeight: '80vh', overflowY: 'auto' }}>
            <button className="modal-close-btn" onClick={() => setInspectUserId(null)}>
              <X size={18} />
            </button>
            <div style={{ padding: '35px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div className="avatar" style={{ backgroundColor: inspectedUser.avatarColor, width: '40px', height: '40px' }}>
                  {inspectedUser.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{inspectedUser.name}'s Ledger</h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Registered account history logs</p>
                </div>
              </div>

              {inspectedLoans.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                  No borrowing records associated with this account.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {inspectedLoans.map(l => {
                    const book = books.find(b => b.id === l.bookId);
                    return (
                      <div 
                        key={l.id} 
                        className="glass-panel" 
                        style={{ 
                          padding: '12px 16px', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          background: l.status === 'overdue' ? 'rgba(239, 68, 68, 0.03)' : 'rgba(255,255,255,0.01)'
                        }}
                      >
                        <div>
                          <h4 style={{ fontSize: '14px', fontWeight: 600 }}>{book?.title || 'Removed Book'}</h4>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            Borrowed: {new Date(l.borrowDate).toLocaleDateString()} | 
                            {l.returnDate 
                              ? ` Returned: ${new Date(l.returnDate).toLocaleDateString()}` 
                              : ` Due: ${new Date(l.dueDate).toLocaleDateString()}`}
                          </span>
                        </div>
                        <span style={{ 
                          fontSize: '11px', 
                          padding: '2px 8px', 
                          borderRadius: '4px',
                          fontWeight: 700,
                          background: l.status === 'returned' 
                            ? 'rgba(16, 185, 129, 0.15)' 
                            : l.status === 'overdue' 
                              ? 'rgba(239, 68, 68, 0.15)' 
                              : 'rgba(6, 182, 212, 0.15)',
                          color: l.status === 'returned' 
                            ? 'var(--success)' 
                            : l.status === 'overdue' 
                              ? 'var(--danger)' 
                              : 'var(--accent-secondary)'
                        }}>
                          {l.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <button 
                className="secondary-btn" 
                style={{ width: '100%', marginTop: '20px' }}
                onClick={() => setInspectUserId(null)}
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
