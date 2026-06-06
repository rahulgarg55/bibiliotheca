import React, { useContext, useState, useEffect } from 'react';
import { LibraryContext } from '../context/LibraryContext';
import { ChevronLeft, ChevronRight, Type, BookOpen, RotateCcw, Sliders } from 'lucide-react';

export default function ReadingRoom({ bookId, setActiveTab }) {
  const { books, showToast } = useContext(LibraryContext);
  
  const [theme, setTheme] = useState('dark'); // sepia, light, dark, cyber
  const [fontSize, setFontSize] = useState(17); // font size in px
  const [fontFamily, setFontFamily] = useState('serif'); // serif, sans, mono
  const [currentPage, setCurrentPage] = useState(0);

  const book = books.find(b => b.id === bookId);

  // Reset page when book changes
  useEffect(() => {
    setCurrentPage(0);
  }, [bookId]);

  if (!book) {
    return (
      <div className="glass-panel animate-slide" style={{ padding: '60px 20px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
        <BookOpen size={48} style={{ opacity: 0.2, marginBottom: '15px', color: 'var(--accent-primary)' }} />
        <h2 style={{ marginBottom: '8px' }}>E-Book Preview Mode</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
          No book is currently loaded in the reader. Go to the Book Catalog, open your favorite title, and select <strong>Read E-Book Preview</strong> to start reading.
        </p>
        <button className="glow-btn" style={{ margin: '0 auto' }} onClick={() => setActiveTab('catalog')}>
          Browse Catalog
        </button>
      </div>
    );
  }

  // Split excerpt into simulated pages of ~350 characters (split at nearest space)
  const getPages = (text) => {
    if (!text) return ["No content preview available for this book."];
    const words = text.split(' ');
    const pages = [];
    let currentChunk = [];

    words.forEach(word => {
      currentChunk.push(word);
      if (currentChunk.join(' ').length > 400) {
        pages.push(currentChunk.join(' '));
        currentChunk = [];
      }
    });

    if (currentChunk.length > 0) {
      pages.push(currentChunk.join(' '));
    }

    return pages;
  };

  const pages = getPages(book.excerpt);

  const handleNextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(prev => prev + 1);
    } else {
      showToast("You have reached the end of the book preview!", "success");
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <div className="animate-slide reader-container">
      {/* Top Toolbar panel */}
      <div className="glass-panel reader-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            className="secondary-btn" 
            style={{ padding: '6px 12px', fontSize: '12px' }}
            onClick={() => setActiveTab('catalog')}
          >
            ← Back to Catalog
          </button>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Reading: <strong>{book.title}</strong>
          </span>
        </div>

        {/* Font Style Adjusters */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {/* Theme buttons */}
          <div className="reader-toolbar-group" title="Themes">
            <button className="reader-theme-btn theme-sepia" onClick={() => setTheme('sepia')} />
            <button className="reader-theme-btn theme-light" onClick={() => setTheme('light')} />
            <button className="reader-theme-btn theme-dark" onClick={() => setTheme('dark')} />
            <button className="reader-theme-btn theme-cyber" onClick={() => setTheme('cyber')} />
          </div>

          <div style={{ width: '1px', height: '18px', background: 'var(--glass-border)' }} />

          {/* Typography choices */}
          <div className="reader-toolbar-group">
            <button 
              className="secondary-btn"
              style={{ 
                padding: '4px 8px', 
                fontSize: '11px', 
                fontWeight: fontFamily === 'serif' ? '700' : '400',
                background: fontFamily === 'serif' ? 'rgba(255,255,255,0.1)' : 'transparent'
              }}
              onClick={() => setFontFamily('serif')}
            >
              Serif
            </button>
            <button 
              className="secondary-btn"
              style={{ 
                padding: '4px 8px', 
                fontSize: '11px', 
                fontWeight: fontFamily === 'sans' ? '700' : '400',
                background: fontFamily === 'sans' ? 'rgba(255,255,255,0.1)' : 'transparent'
              }}
              onClick={() => setFontFamily('sans')}
            >
              Sans
            </button>
            <button 
              className="secondary-btn"
              style={{ 
                padding: '4px 8px', 
                fontSize: '11px', 
                fontWeight: fontFamily === 'mono' ? '700' : '400',
                background: fontFamily === 'mono' ? 'rgba(255,255,255,0.1)' : 'transparent'
              }}
              onClick={() => setFontFamily('mono')}
            >
              Mono
            </button>
          </div>

          <div style={{ width: '1px', height: '18px', background: 'var(--glass-border)' }} />

          {/* Font size change */}
          <div className="reader-toolbar-group">
            <button 
              className="secondary-btn" 
              style={{ padding: '4px 10px', fontSize: '12px' }}
              onClick={() => setFontSize(Math.max(12, fontSize - 1))}
            >
              A-
            </button>
            <button 
              className="secondary-btn" 
              style={{ padding: '4px 10px', fontSize: '12px' }}
              onClick={() => setFontSize(Math.min(24, fontSize + 1))}
            >
              A+
            </button>
          </div>
        </div>
      </div>

      {/* Main E-Book page container */}
      <div 
        className={`reader-book-body ${theme}`} 
        style={{ 
          fontSize: `${fontSize}px`,
          fontFamily: fontFamily === 'serif' ? 'var(--font-serif)' : fontFamily === 'sans' ? 'var(--font-sans)' : 'var(--font-mono)'
        }}
      >
        <h2 className="reader-book-title">{book.title}</h2>
        
        {/* Page text */}
        <p className="reader-book-text animate-fade" key={currentPage} style={{ textAlign: 'justify' }}>
          {pages[currentPage]}
        </p>

        {/* Progress details */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(0,0,0,0.1)', paddingTop: '15px', fontSize: '12px', opacity: 0.6 }}>
          <span>Chapter I</span>
          <span>Page {currentPage + 1} of {pages.length}</span>
        </div>
      </div>

      {/* Navigation pages footer */}
      <div className="reader-navigation">
        <button 
          className="secondary-btn"
          style={{ opacity: currentPage === 0 ? 0.5 : 1 }}
          onClick={handlePrevPage}
          disabled={currentPage === 0}
        >
          <ChevronLeft size={16} /> Previous Page
        </button>
        
        <button 
          className="secondary-btn"
          style={{ opacity: currentPage === pages.length - 1 ? 0.7 : 1 }}
          onClick={handleNextPage}
        >
          Next Page <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
