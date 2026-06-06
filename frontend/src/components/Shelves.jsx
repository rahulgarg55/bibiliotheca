import React, { useContext, useState } from 'react';
import { LibraryContext } from '../context/LibraryContext';
import { Plus, Trash2, FolderPlus, Bookmark, Eye } from 'lucide-react';

export default function Shelves({ setSelectedBookId }) {
  const { 
    books, 
    shelves, 
    createShelf, 
    toggleBookOnShelf,
    showToast 
  } = useContext(LibraryContext);

  const [newShelfName, setNewShelfName] = useState('');
  const [activeShelfSelect, setActiveShelfSelect] = useState({}); // stores { shelfId: bookId } for selections

  // Spine background colors helper mapping
  const coverSpineColors = [
    '#b45309', // brown/orange
    '#7f1d1d', // red
    '#0891b2', // blue
    '#047857', // green
    '#5b21b6', // purple
    '#be185d', // pink
    '#1f2937'  // gray
  ];

  // Helper to resolve book details from ID
  const getBook = (id) => books.find(b => b.id === id);

  const handleCreateShelf = (e) => {
    e.preventDefault();
    if (!newShelfName.trim()) return;
    createShelf(newShelfName);
    setNewShelfName('');
  };

  const handleSelectBookForShelf = (shelfId, bookId) => {
    if (!bookId) return;
    toggleBookOnShelf(shelfId, bookId);
    // Reset selection state
    setActiveShelfSelect(prev => ({ ...prev, [shelfId]: '' }));
  };

  return (
    <div className="animate-slide">
      {/* Header controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px' }} className="text-glow-purple">
            Custom Bookshelves
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Build custom bookshelves to organize your reading checklists and bookmark titles.
          </p>
        </div>

        {/* Create shelf form */}
        <form onSubmit={handleCreateShelf} className="glass-panel" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="text" 
            placeholder="New shelf name..." 
            value={newShelfName}
            onChange={(e) => setNewShelfName(e.target.value)}
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--glass-border)',
              color: '#fff',
              fontSize: '13px',
              padding: '6px 12px',
              borderRadius: '6px',
              outline: 'none'
            }}
          />
          <button type="submit" className="glow-btn" style={{ padding: '6px 12px', fontSize: '12px' }}>
            <FolderPlus size={14} /> Create Shelf
          </button>
        </form>
      </div>

      {/* Shelves Stack Grid */}
      <div className="shelves-container">
        {shelves.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No custom bookshelves configured. Create one above to get started!</p>
          </div>
        ) : (
          shelves.map((shelf) => (
            <div key={shelf.id} className="shelf-unit">
              
              {/* Shelf Title & Controls */}
              <div className="shelf-header">
                <div className="shelf-title-area">
                  <Bookmark size={16} color="var(--accent-secondary)" />
                  <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{shelf.name}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '2px 6px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                    {shelf.bookIds.length} book(s)
                  </span>
                </div>

                {/* Add book select dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <select 
                    value={activeShelfSelect[shelf.id] || ''}
                    onChange={(e) => handleSelectBookForShelf(shelf.id, e.target.value)}
                    style={{
                      background: 'rgba(18, 14, 34, 0.65)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">+ Add book to shelf...</option>
                    {books.map(b => (
                      <option key={b.id} value={b.id}>
                        {shelf.bookIds.includes(b.id) ? '✓ ' : ''}{b.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Graphical Wooden Bookshelf representation */}
              <div className="shelf-books-row">
                {shelf.bookIds.length === 0 ? (
                  <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic', paddingBottom: '20px' }}>
                    Shelf is currently empty. Drop a catalog book here!
                  </div>
                ) : (
                  shelf.bookIds.map((bookId, index) => {
                    const book = getBook(bookId);
                    if (!book) return null;
                    
                    // Assign spine color based on index to create aesthetic variety
                    const spineColor = coverSpineColors[index % coverSpineColors.length];
                    // Randomize height slightly to make the shelf look realistic
                    const spineHeight = 130 + (index % 4) * 6; // range between 130px and 148px
                    // Randomize spine width slightly
                    const spineWidth = 32 + (index % 3) * 4; // range between 32px and 40px

                    return (
                      <div 
                        key={bookId}
                        className="shelf-book-spine"
                        style={{ 
                          backgroundColor: spineColor,
                          height: `${spineHeight}px`,
                          width: `${spineWidth}px`
                        }}
                        onClick={() => setSelectedBookId(bookId)}
                        title={`${book.title} by ${book.author} (Click to view)`}
                      >
                        <div className="shelf-book-spine-accent" />
                        <div className="shelf-book-spine-text">
                          {book.title}
                        </div>
                        <div className="shelf-book-spine-accent-bottom" />
                      </div>
                    );
                  })
                )}
              </div>
              <div className="shelf-wooden-plank" />

              {/* Shelf Book list checklist (Alternative control view for quick deletions) */}
              {shelf.bookIds.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '15px', padding: '0 10px' }}>
                  {shelf.bookIds.map(bookId => {
                    const book = getBook(bookId);
                    if (!book) return null;
                    return (
                      <span 
                        key={bookId}
                        style={{
                          fontSize: '11px',
                          padding: '4px 8px',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        <span 
                          style={{ cursor: 'pointer', hover: { color: '#fff' } }}
                          onClick={() => setSelectedBookId(bookId)}
                        >
                          {book.title}
                        </span>
                        <button 
                          style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          onClick={() => toggleBookOnShelf(shelf.id, bookId)}
                          title="Remove from Shelf"
                        >
                          <Plus size={10} style={{ transform: 'rotate(45deg)' }} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

            </div>
          ))
        )}
      </div>
    </div>
  );
}
