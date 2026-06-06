import React, { useContext, useState } from 'react';
import { LibraryContext } from '../context/LibraryContext';
import { 
  BookOpen, 
  RefreshCw, 
  AlertTriangle, 
  DollarSign, 
  Play, 
  BookMarked,
  ArrowRight,
  User,
  Activity,
  Plus
} from 'lucide-react';

export default function Dashboard({ setActiveTab, setSelectedBookId }) {
  const { 
    books, 
    loans, 
    currentUser, 
    currentRole, 
    returnBook, 
    simulateDaysPass,
    favorites,
    showToast 
  } = useContext(LibraryContext);

  const [simDays, setSimDays] = useState(5);
  const [activeTabLocal, setActiveTabLocal] = useState('active'); // active vs history

  // Calculate Metrics
  const totalBooks = books.reduce((sum, b) => sum + b.copies, 0);
  const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'overdue');
  const overdueLoans = loans.filter(l => l.status === 'overdue');
  
  // Fines calculation based on role
  const totalFines = currentRole === 'admin' 
    ? usersFinesSum() 
    : currentUser.fines;

  function usersFinesSum() {
    const localUsers = JSON.parse(localStorage.getItem('bib_users')) || [];
    return localUsers.reduce((sum, u) => sum + u.fines, 0);
  }

  // Active loans to show in table
  const displayLoans = currentRole === 'admin' 
    ? loans.filter(l => l.status === 'active' || l.status === 'overdue')
    : loans.filter(l => l.userId === currentUser.id && (l.status === 'active' || l.status === 'overdue'));

  // Past loans to show in history table
  const pastLoans = currentRole === 'admin'
    ? loans.filter(l => l.status === 'returned')
    : loans.filter(l => l.userId === currentUser.id && l.status === 'returned');

  // Dynamic book recommendations based on user's favorite book genres or rating
  const getRecommendations = () => {
    // If they have favorites, match genres
    const favGenres = books
      .filter(b => favorites.includes(b.id))
      .map(b => b.genre);

    const matchBooks = books.filter(b => {
      // Don't recommend books they currently borrow
      const isBorrowed = loans.some(l => l.userId === currentUser.id && l.bookId === b.id && l.status === 'active');
      if (isBorrowed) return false;
      
      if (favGenres.length > 0) {
        return favGenres.includes(b.genre) && !favorites.includes(b.id);
      }
      return b.rating >= 4.5; // fallback to high rating
    });

    return matchBooks.slice(0, 3);
  };

  const recommendedBooks = getRecommendations();
  const trendingBooks = [...books].sort((a, b) => b.ratingsCount - a.ratingsCount).slice(0, 3);

  // Dynamic SVG Bar Chart Data: Book counts per Genre
  const genres = [...new Set(books.map(b => b.genre))];
  const genreData = genres.map(g => {
    const count = books.filter(b => b.genre === g).reduce((sum, b) => sum + b.copies, 0);
    return { name: g, count };
  }).sort((a,b) => b.count - a.count).slice(0, 5);

  const maxGenreCount = genreData.reduce((max, d) => d.count > max ? d.count : max, 1);

  // SVG Line Chart Data: Mock Borrow Trend count over 7 days
  const trendData = [
    { day: "Mon", count: 4 },
    { day: "Tue", count: 8 },
    { day: "Wed", count: 5 },
    { day: "Thu", count: 12 },
    { day: "Fri", count: 16 },
    { day: "Sat", count: 10 },
    { day: "Sun", count: 15 }
  ];
  const maxTrendVal = 20;

  // Generate SVG Points for Line Chart
  const svgWidth = 500;
  const svgHeight = 160;
  const points = trendData.map((d, index) => {
    const x = (index / (trendData.length - 1)) * (svgWidth - 60) + 40;
    const y = svgHeight - 30 - (d.count / maxTrendVal) * (svgHeight - 60);
    return { x, y, ...d };
  });

  const pathD = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') 
    : '';

  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${svgHeight - 30} L ${points[0].x} ${svgHeight - 30} Z`
    : '';

  return (
    <div className="animate-slide">
      {/* Page Title & User Welcome */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px' }} className="text-glow-purple">
            {currentRole === 'admin' ? 'Library Insights' : `Welcome Back, ${currentUser.name.split(' ')[0]}!`}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {currentRole === 'admin' 
              ? 'Real-time overview of library transactions, inventory, and analytics.' 
              : 'Keep track of your reading goals, active checkouts, and discover new titles.'}
          </p>
        </div>

        {/* Dynamic simulation component */}
        <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Simulate Time Travel:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input 
              type="number" 
              value={simDays} 
              onChange={(e) => setSimDays(Math.max(1, parseInt(e.target.value) || 1))}
              style={{
                width: '50px',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid var(--glass-border)',
                color: '#fff',
                padding: '6px',
                borderRadius: '6px',
                textAlign: 'center',
                outline: 'none'
              }}
            />
            <button 
              className="glow-btn glow-btn-cyan" 
              style={{ padding: '6px 12px', fontSize: '12px' }}
              onClick={() => simulateDaysPass(simDays)}
            >
              <Play size={12} fill="#fff" />
              Advance Days
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="dashboard-grid">
        <div className="glass-panel stat-card">
          <div className="stat-info">
            <h4>Total Inventory</h4>
            <p>{totalBooks} books</p>
          </div>
          <div className="stat-icon-wrap" style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-primary)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <BookOpen size={24} />
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-info">
            <h4>Active Loans</h4>
            <p>{activeLoans.length} copies</p>
          </div>
          <div className="stat-icon-wrap" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-secondary)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
            <RefreshCw size={24} />
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-info">
            <h4>Overdue Returns</h4>
            <p style={{ color: overdueLoans.length > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
              {overdueLoans.length} items
            </p>
          </div>
          <div className="stat-icon-wrap" style={{ 
            background: overdueLoans.length > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.03)', 
            color: overdueLoans.length > 0 ? 'var(--danger)' : 'var(--text-secondary)',
            border: overdueLoans.length > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--glass-border)'
          }}>
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-info">
            <h4>{currentRole === 'admin' ? 'Total Fines Owed' : 'My Owed Balance'}</h4>
            <p style={{ color: totalFines > 0 ? 'var(--warning)' : 'var(--success)' }}>
              ${totalFines.toFixed(2)}
            </p>
          </div>
          <div className="stat-icon-wrap" style={{ 
            background: totalFines > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)', 
            color: totalFines > 0 ? 'var(--warning)' : 'var(--success)',
            border: totalFines > 0 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      {/* Visual SVG Analytics Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '30px' }}>
        {/* SVG Line Chart: Borrows Trend */}
        <div className="glass-panel chart-panel">
          <div className="chart-header">
            <h3 className="chart-title">Borrowing Traffic Trend</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>weekly frequency count</span>
          </div>
          <div className="svg-chart-container">
            <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Horizontal Gridlines */}
              <line x1="40" y1="30" x2={svgWidth - 20} y2="30" stroke="rgba(255,255,255,0.04)" strokeDasharray="3" />
              <line x1="40" y1="80" x2={svgWidth - 20} y2="80" stroke="rgba(255,255,255,0.04)" strokeDasharray="3" />
              <line x1="40" y1="130" x2={svgWidth - 20} y2="130" stroke="rgba(255,255,255,0.04)" />

              {/* Chart Line Path */}
              {areaD && <path d={areaD} fill="url(#chart-area-grad)" />}
              {pathD && <path d={pathD} fill="none" stroke="var(--accent-primary)" strokeWidth="3" strokeLinecap="round" />}

              {/* Data points */}
              {points.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="5" fill="var(--bg-primary)" stroke="var(--accent-primary)" strokeWidth="2.5" />
                  {/* labels */}
                  <text x={p.x} y={p.y - 12} fill="var(--text-primary)" fontSize="10" fontWeight="600" textAnchor="middle">
                    {p.count}
                  </text>
                  <text x={p.x} y={svgHeight - 12} fill="var(--text-secondary)" fontSize="10" textAnchor="middle">
                    {p.day}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* SVG Bar Chart: Genre Distribution */}
        <div className="glass-panel chart-panel">
          <div className="chart-header">
            <h3 className="chart-title">Popular Book Categories</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>total copies on shelves</span>
          </div>
          <div className="svg-chart-container">
            <svg width="100%" height="100%" viewBox="0 0 400 160" preserveAspectRatio="none">
              <defs>
                <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-secondary)" />
                  <stop offset="100%" stopColor="#0891b2" />
                </linearGradient>
              </defs>
              {genreData.map((d, i) => {
                const width = 45;
                const spacing = 75;
                const x = i * spacing + 40;
                const barHeight = (d.count / maxGenreCount) * 100;
                const y = 130 - barHeight;
                
                return (
                  <g key={i}>
                    {/* Rounded top rect */}
                    <rect 
                      x={x} 
                      y={y} 
                      width={width} 
                      height={barHeight} 
                      rx="4" 
                      fill="url(#bar-grad)" 
                      opacity="0.85" 
                      className="chart-bar"
                    />
                    <text x={x + width/2} y={y - 8} fill="var(--text-primary)" fontSize="11" fontWeight="700" textAnchor="middle">
                      {d.count}
                    </text>
                    {/* Truncated genre name */}
                    <text x={x + width/2} y="148" fill="var(--text-secondary)" fontSize="9" textAnchor="middle" fontWeight="500">
                      {d.name.length > 9 ? `${d.name.substring(0, 8)}...` : d.name}
                    </text>
                  </g>
                );
              })}
              <line x1="20" y1="130" x2="380" y2="130" stroke="rgba(255,255,255,0.08)" />
            </svg>
          </div>
        </div>
      </div>

      {/* Active Borrowing Cards & Recommendations Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px' }}>
        
        {/* Left: Active Loans Table/Console */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
              {currentRole === 'admin' ? 'Active Library Loans' : 'My Active Borrowings'}
            </h3>
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '2px', borderRadius: '6px' }}>
              <button 
                onClick={() => setActiveTabLocal('active')}
                style={{
                  border: 'none',
                  background: activeTabLocal === 'active' ? 'var(--accent-primary)' : 'transparent',
                  color: activeTabLocal === 'active' ? '#fff' : 'var(--text-secondary)',
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Active ({displayLoans.length})
              </button>
              <button 
                onClick={() => setActiveTabLocal('history')}
                style={{
                  border: 'none',
                  background: activeTabLocal === 'history' ? 'var(--accent-primary)' : 'transparent',
                  color: activeTabLocal === 'history' ? '#fff' : 'var(--text-secondary)',
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                History ({pastLoans.length})
              </button>
            </div>
          </div>

          {activeTabLocal === 'active' ? (
            displayLoans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <BookMarked size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                <p style={{ fontSize: '14px' }}>No active borrowings on record.</p>
                {currentRole === 'user' && (
                  <button 
                    className="glow-btn" 
                    style={{ margin: '15px auto 0 auto', padding: '8px 16px', fontSize: '12px' }}
                    onClick={() => setActiveTab('catalog')}
                  >
                    Browse Catalog <ArrowRight size={14} />
                  </button>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <th style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>Book Title</th>
                      {currentRole === 'admin' && <th style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>Borrower</th>}
                      <th style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>Due Date</th>
                      <th style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>Status</th>
                      <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayLoans.map((l) => {
                      const book = books.find(b => b.id === l.bookId);
                      const borrower = JSON.parse(localStorage.getItem('bib_users'))?.find(u => u.id === l.userId) || { name: 'Unknown Member' };
                      
                      return (
                        <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '12px 10px', fontWeight: 600 }}>
                            <span 
                              style={{ cursor: 'pointer', hover: { color: 'var(--accent-primary)' } }}
                              onClick={() => {
                                setSelectedBookId(l.bookId);
                              }}
                            >
                              {book?.title}
                            </span>
                          </td>
                          {currentRole === 'admin' && (
                            <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>
                              {borrower.name}
                            </td>
                          )}
                          <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>
                            {new Date(l.dueDate).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <span style={{ 
                              fontSize: '11px', 
                              padding: '2px 6px', 
                              borderRadius: '4px',
                              fontWeight: 600,
                              background: l.status === 'overdue' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: l.status === 'overdue' ? 'var(--danger)' : 'var(--success)',
                              border: l.status === 'overdue' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
                            }}>
                              {l.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                            <button 
                              className="secondary-btn" 
                              style={{ padding: '6px 12px', fontSize: '11px', margin: '0 auto' }}
                              onClick={() => returnBook(l.id)}
                            >
                              Return Book
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            pastLoans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <Activity size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                <p style={{ fontSize: '14px' }}>No return transactions found in historical archives.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <th style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>Book Title</th>
                      {currentRole === 'admin' && <th style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>Borrower</th>}
                      <th style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>Returned On</th>
                      <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', textAlign: 'right' }}>Fine Accrued</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastLoans.map((l) => {
                      const book = books.find(b => b.id === l.bookId);
                      const borrower = JSON.parse(localStorage.getItem('bib_users'))?.find(u => u.id === l.userId) || { name: 'Unknown' };
                      
                      return (
                        <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '12px 10px', fontWeight: 600 }}>{book?.title}</td>
                          {currentRole === 'admin' && <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{borrower.name}</td>}
                          <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>
                            {l.returnDate ? new Date(l.returnDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'right', color: l.fineAmount > 0 ? 'var(--warning)' : 'var(--text-secondary)' }}>
                            {l.fineAmount > 0 ? `$${l.fineAmount.toFixed(2)}` : '$0.00'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* Right: Recommendations or Trending reads */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Recommended Panel */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '15px' }}>
              {currentRole === 'admin' ? 'Highly Rated Titles' : 'Recommended For You'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {(currentRole === 'admin' ? trendingBooks : recommendedBooks).map((book) => (
                <div 
                  key={book.id} 
                  style={{ display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setSelectedBookId(book.id)}
                >
                  <div 
                    style={{ 
                      width: '45px', 
                      height: '65px', 
                      borderRadius: '4px',
                      background: book.coverColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '6px',
                      padding: '4px',
                      textAlign: 'center',
                      color: '#fff',
                      fontFamily: 'var(--font-serif)',
                      fontWeight: 700,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                      flexShrink: 0
                    }}
                  >
                    {book.title}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {book.title}
                    </h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>by {book.author}</p>
                    <div style={{ display: 'flex', gap: '4px', color: 'var(--warning)', fontSize: '11px', marginTop: '4px', alignItems: 'center' }}>
                      ★ <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{book.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Simulation Help Card */}
          <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-secondary)', marginBottom: '8px' }}>
              💡 Pro Tip: Testing Overdues & Fines
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Check out a book, then use the <strong>Time Travel</strong> simulator at the top of the dashboard to advance time by 15 days. 
              The borrowed book status will automatically shift to <strong>overdue</strong> and accrue library fines dynamically!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
