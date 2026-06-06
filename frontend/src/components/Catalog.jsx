import React, { useContext, useState } from 'react';
import { LibraryContext } from '../context/LibraryContext';
import { 
  Search, 
  SlidersHorizontal, 
  Grid, 
  List, 
  Plus, 
  Star, 
  X, 
  RotateCcw,
  BookOpen
} from 'lucide-react';

export default function Catalog({ setSelectedBookId }) {
  const { books, currentRole, addBook } = useContext(LibraryContext);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState('grid'); // grid vs list

  // Filters State
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [availability, setAvailability] = useState('all'); // all, available, out
  const [ratingFilter, setRatingFilter] = useState(0); // 0, 4, 4.5
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Add Book Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '', author: '', isbn: '', genre: 'Science Fiction',
    year: 2026, copies: 3, pages: 250, summary: '', coverColor: 'orange',
    excerpt: ''
  });

  const allGenres = [...new Set(books.map(b => b.genre))];

  // Colors available for covers
  const coverGradients = {
    orange: 'linear-gradient(135deg, #f59e0b, #b45309)',
    red: 'linear-gradient(135deg, #ef4444, #7f1d1d)',
    blue: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    green: 'linear-gradient(135deg, #10b981, #047857)',
    purple: 'linear-gradient(135deg, #8b5cf6, #5b21b6)',
    pink: 'linear-gradient(135deg, #ec4899, #be185d)',
    gray: 'linear-gradient(135deg, #4b5563, #1f2937)'
  };

  const handleGenreToggle = (genre) => {
    setSelectedGenres(prev => 
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const resetFilters = () => {
    setSelectedGenres([]);
    setAvailability('all');
    setRatingFilter(0);
    setSearch('');
    showToast("Filters reset successfully.", "info");
  };

  // Filter and Sort Books
  const filteredBooks = books.filter(b => {
    // Search filter
    const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase()) ||
                          b.author.toLowerCase().includes(search.toLowerCase()) ||
                          b.genre.toLowerCase().includes(search.toLowerCase()) ||
                          b.isbn.includes(search);

    // Genre filter
    const matchesGenre = selectedGenres.length === 0 || selectedGenres.includes(b.genre);

    // Availability filter
    let matchesAvailability = true;
    if (availability === 'available') {
      matchesAvailability = b.available > 0;
    } else if (availability === 'out') {
      matchesAvailability = b.available === 0;
    }

    // Rating filter
    const matchesRating = b.rating >= ratingFilter;

    return matchesSearch && matchesGenre && matchesAvailability && matchesRating;
  });

  // Sort Books
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'year') return b.year - a.year;
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'popularity') return b.ratingsCount - a.ratingsCount;
    return 0;
  });

  const handleAddBookSubmit = (e) => {
    e.preventDefault();
    if (!newBook.title.trim() || !newBook.author.trim()) return;
    
    // Assign selected cover gradient styling
    const coverGradientStyle = coverGradients[newBook.coverColor] || coverGradients.orange;
    
    addBook({
      ...newBook,
      coverColor: coverGradientStyle
    });

    setShowAddModal(false);
    // Reset form
    setNewBook({
      title: '', author: '', isbn: '', genre: 'Science Fiction',
      year: 2026, copies: 3, pages: 250, summary: '', coverColor: 'orange',
      excerpt: ''
    });
  };

  return (
    <div className="animate-slide">
      {/* Header controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px' }} className="text-glow-cyan">
            Book Catalog
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Explore {books.length} publications. Filter by category, availability, or ratings.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {currentRole === 'admin' && (
            <button 
              className="glow-btn" 
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={16} /> Add Publication
            </button>
          )}
        </div>
      </div>

      {/* Control Panel: Search, Sort, Filters toggle, View toggle */}
      <div className="catalog-controls">
        <div className="search-input-wrap">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search by title, author, genre or ISBN..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="sort-select"
        >
          <option value="rating">Sort by: High Rating</option>
          <option value="popularity">Sort by: Popularity</option>
          <option value="year">Sort by: Release Year</option>
          <option value="title">Sort by: Title (A-Z)</option>
        </select>

        <button 
          className={`view-toggle-btn ${showFiltersPanel ? 'active' : ''}`}
          onClick={() => setShowFiltersPanel(!showFiltersPanel)}
          title="Filter details"
        >
          <SlidersHorizontal size={18} />
        </button>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button 
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <Grid size={18} />
          </button>
          <button 
            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Expanded Filters Drawer panel */}
      {showFiltersPanel && (
        <div className="glass-panel animate-slide" style={{ padding: '20px', marginBottom: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Advanced Filter System</h3>
            <button 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}
              onClick={resetFilters}
            >
              <RotateCcw size={12} /> Reset Filters
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '25px', flexWrap: 'wrap' }}>
            {/* Genre List */}
            <div>
              <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 600 }}>GENRE CATEGORIES</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {allGenres.map(genre => (
                  <button 
                    key={genre}
                    onClick={() => handleGenreToggle(genre)}
                    className={`filter-pill ${selectedGenres.includes(genre) ? 'active' : ''}`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div>
              <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 600 }}>AVAILABILITY STATUS</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['all', 'available', 'out'].map(status => (
                  <label key={status} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    <input 
                      type="radio" 
                      name="availability" 
                      checked={availability === status}
                      onChange={() => setAvailability(status)}
                      style={{ accentColor: 'var(--accent-cyan)' }}
                    />
                    {status === 'all' && 'All Book Inventories'}
                    {status === 'available' && 'In Stock / Available to Borrow'}
                    {status === 'out' && 'Out of Stock (Place Hold)'}
                  </label>
                ))}
              </div>
            </div>

            {/* Ratings Filter */}
            <div>
              <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 600 }}>RATINGS THRESHOLD</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[0, 4.0, 4.5].map(val => (
                  <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    <input 
                      type="radio" 
                      name="rating" 
                      checked={ratingFilter === val}
                      onChange={() => setRatingFilter(val)}
                      style={{ accentColor: 'var(--accent-cyan)' }}
                    />
                    {val === 0 ? 'All Scores' : `${val.toFixed(1)} Stars & Above`}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Catalog Grid View */}
      {sortedBooks.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <BookOpen size={48} style={{ opacity: 0.2, marginBottom: '15px' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No books matched your criteria</h3>
          <p style={{ fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
            Try resetting active filters or clearing your search queries.
          </p>
          <button className="secondary-btn" style={{ margin: '20px auto 0 auto' }} onClick={resetFilters}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div className={`book-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
          {sortedBooks.map((book) => (
            <div 
              key={book.id} 
              className="glass-panel book-card"
              onClick={() => setSelectedBookId(book.id)}
            >
              {/* Visual Book Cover container */}
              <div className="book-cover-container">
                <div 
                  className="book-cover-art" 
                  style={{ background: book.coverColor }}
                >
                  <div className="book-cover-spine" />
                  <span className={`book-cover-badge ${book.available > 0 ? 'available' : 'checked-out'}`}>
                    {book.available > 0 ? 'Available' : 'Out of Stock'}
                  </span>
                  <div className="book-cover-title">{book.title}</div>
                  <div className="book-cover-author">{book.author}</div>
                </div>
              </div>

              {/* Book metadata content */}
              <div className="book-card-info">
                <span className="book-info-genre">{book.genre}</span>
                <div className="book-info-main">
                  <h3 className="book-info-title" title={book.title}>{book.title}</h3>
                  <p className="book-info-author">by {book.author}</p>
                </div>
                <div className="book-info-meta">
                  <div className="book-card-rating">
                    <Star size={13} fill="var(--warning)" color="var(--warning)" />
                    <span>{book.rating || 'N/A'}</span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({book.ratingsCount})</span>
                  </div>
                  {viewMode === 'list' && (
                    <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span>ISBN: <strong>{book.isbn}</strong></span>
                      <span>Copies: <strong>{book.available}/{book.copies}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin Add New Book Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '600px' }}>
            <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
              <X size={18} />
            </button>
            <form onSubmit={handleAddBookSubmit} style={{ padding: '30px' }}>
              <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 800 }} className="text-glow-purple">
                Add Publication to Catalog
              </h2>
              
              <div className="form-group">
                <label>Book Title *</label>
                <input 
                  type="text" 
                  required 
                  value={newBook.title}
                  onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                  className="form-input" 
                  placeholder="e.g. Pride and Prejudice"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Author *</label>
                  <input 
                    type="text" 
                    required 
                    value={newBook.author}
                    onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                    className="form-input" 
                    placeholder="e.g. Jane Austen"
                  />
                </div>
                <div className="form-group">
                  <label>ISBN Identifier</label>
                  <input 
                    type="text" 
                    value={newBook.isbn}
                    onChange={(e) => setNewBook({...newBook, isbn: e.target.value})}
                    className="form-input" 
                    placeholder="e.g. 978-0141439517"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Genre / Category</label>
                  <select 
                    value={newBook.genre}
                    onChange={(e) => setNewBook({...newBook, genre: e.target.value})}
                    className="form-input"
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="Science Fiction">Science Fiction</option>
                    <option value="Mystery">Mystery</option>
                    <option value="Classic Literature">Classic Literature</option>
                    <option value="Self-Help">Self-Help</option>
                    <option value="Thriller">Thriller</option>
                    <option value="Fantasy">Fantasy</option>
                    <option value="Biography">Biography</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Publication Year</label>
                  <input 
                    type="number" 
                    value={newBook.year}
                    onChange={(e) => setNewBook({...newBook, year: e.target.value})}
                    className="form-input" 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Total Copies Inventory</label>
                  <input 
                    type="number" 
                    min="1" 
                    required 
                    value={newBook.copies}
                    onChange={(e) => setNewBook({...newBook, copies: e.target.value})}
                    className="form-input" 
                  />
                </div>
                <div className="form-group">
                  <label>Page Count</label>
                  <input 
                    type="number" 
                    min="10" 
                    value={newBook.pages}
                    onChange={(e) => setNewBook({...newBook, pages: e.target.value})}
                    className="form-input" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Cover Theme Color</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {Object.keys(coverGradients).map((color) => (
                    <button 
                      key={color}
                      type="button"
                      onClick={() => setNewBook({...newBook, coverColor: color})}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: coverGradients[color],
                        border: newBook.coverColor === color ? '2.5px solid #fff' : '1.5px solid rgba(0,0,0,0.5)',
                        cursor: 'pointer',
                        boxShadow: newBook.coverColor === color ? '0 0 10px rgba(255,255,255,0.6)' : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Book Summary Description</label>
                <textarea 
                  value={newBook.summary}
                  onChange={(e) => setNewBook({...newBook, summary: e.target.value})}
                  className="form-input" 
                  style={{ height: '80px', resize: 'none' }}
                  placeholder="Provide a brief synopsis of the plot..."
                />
              </div>

              <div className="form-group">
                <label>Simulated Reading Room Content (Excerpt)</label>
                <textarea 
                  value={newBook.excerpt}
                  onChange={(e) => setNewBook({...newBook, excerpt: e.target.value})}
                  className="form-input" 
                  style={{ height: '80px', resize: 'none', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                  placeholder="Paste a brief paragraph to simulate E-Book reading mode..."
                />
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                <button type="submit" className="glow-btn" style={{ flex: 1 }}>
                  Create Book
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
    </div>
  );
}
