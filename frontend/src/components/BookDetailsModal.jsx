import React, { useContext, useState } from 'react';
import { LibraryContext } from '../context/LibraryContext';
import { 
  X, 
  Star, 
  Heart, 
  BookOpen, 
  BookMarked,
  Edit,
  Trash2,
  Calendar,
  Layers,
  FileText,
  Bookmark
} from 'lucide-react';

export default function BookDetailsModal({ bookId, onClose, setActiveTab, setReadingBookId }) {
  const { 
    books, 
    loans, 
    holds,
    currentUser, 
    currentRole, 
    borrowBook, 
    returnBook, 
    placeHold, 
    addReview,
    editBook,
    deleteBook,
    toggleFavorite,
    favorites,
    showToast
  } = useContext(LibraryContext);

  const [isEditing, setIsEditing] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  
  // Edit Form State
  const [editForm, setEditForm] = useState(null);

  const book = books.find(b => b.id === bookId);
  if (!book) return null;

  // Initialize edit form once editing is triggered
  const startEditing = () => {
    setEditForm({
      title: book.title,
      author: book.author,
      genre: book.genre,
      isbn: book.isbn,
      year: book.year,
      copies: book.copies,
      pages: book.pages,
      summary: book.summary,
      excerpt: book.excerpt,
      coverColor: book.coverColor
    });
    setIsEditing(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    editBook(book.id, editForm);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to permanently delete '${book.title}'?`)) {
      deleteBook(book.id);
      onClose();
    }
  };

  // Find user's active loan for this book
  const activeLoan = loans.find(l => l.bookId === book.id && l.userId === currentUser.id && l.status !== 'returned');

  // Find historical loans for this book
  const bookLoans = loans.filter(l => l.bookId === book.id);

  // Find holds for this book
  const bookHolds = holds.filter(h => h.bookId === book.id && h.status === 'pending');
  const userHasHold = holds.some(h => h.bookId === book.id && h.userId === currentUser.id && h.status === 'pending');

  const isFavorite = favorites.includes(book.id);

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      showToast("Please enter a comment.", "error");
      return;
    }
    addReview(book.id, { rating: reviewRating, comment: reviewComment });
    setReviewComment('');
    setReviewRating(5);
  };

  const handleStartReading = () => {
    setReadingBookId(book.id);
    setActiveTab('reading-room');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content">
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        {isEditing ? (
          /* Admin Edit Layout */
          <form onSubmit={handleEditSubmit} style={{ padding: '35px' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 800 }} className="text-glow-purple">
              Modify Publication Specs
            </h2>
            
            <div className="form-group">
              <label>Book Title</label>
              <input 
                type="text" 
                required 
                value={editForm.title}
                onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                className="form-input" 
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Author</label>
                <input 
                  type="text" 
                  required 
                  value={editForm.author}
                  onChange={(e) => setEditForm({...editForm, author: e.target.value})}
                  className="form-input" 
                />
              </div>
              <div className="form-group">
                <label>ISBN Identifier</label>
                <input 
                  type="text" 
                  value={editForm.isbn}
                  onChange={(e) => setEditForm({...editForm, isbn: e.target.value})}
                  className="form-input" 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Genre / Category</label>
                <select 
                  value={editForm.genre}
                  onChange={(e) => setEditForm({...editForm, genre: e.target.value})}
                  className="form-input"
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
                  value={editForm.year}
                  onChange={(e) => setEditForm({...editForm, year: e.target.value})}
                  className="form-input" 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Total Copies</label>
                <input 
                  type="number" 
                  min="1" 
                  required 
                  value={editForm.copies}
                  onChange={(e) => setEditForm({...editForm, copies: e.target.value})}
                  className="form-input" 
                />
              </div>
              <div className="form-group">
                <label>Page Count</label>
                <input 
                  type="number" 
                  min="10" 
                  value={editForm.pages}
                  onChange={(e) => setEditForm({...editForm, pages: e.target.value})}
                  className="form-input" 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Book Summary Synopsis</label>
              <textarea 
                value={editForm.summary}
                onChange={(e) => setEditForm({...editForm, summary: e.target.value})}
                className="form-input" 
                style={{ height: '100px', resize: 'none' }}
              />
            </div>

            <div className="form-group">
              <label>Simulated Reading Room Content (Excerpt)</label>
              <textarea 
                value={editForm.excerpt}
                onChange={(e) => setEditForm({...editForm, excerpt: e.target.value})}
                className="form-input" 
                style={{ height: '100px', resize: 'none', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
              <button type="submit" className="glow-btn" style={{ flex: 1 }}>
                Save Changes
              </button>
              <button 
                type="button" 
                className="secondary-btn" 
                style={{ flex: 1 }}
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          /* Book Detail Display Layout */
          <div className="book-details-layout">
            
            {/* Left Cover Panel */}
            <div>
              <div 
                style={{ 
                  aspectRatio: '2/3', 
                  width: '100%', 
                  background: book.coverColor,
                  borderRadius: 'var(--border-radius-md)',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '24px',
                  textAlign: 'center',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '12px', background: 'rgba(0,0,0,0.25)', boxShadow: '2px 0 5px rgba(0,0,0,0.15)' }} />
                
                <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                  {currentRole === 'user' && (
                    <button 
                      onClick={() => toggleFavorite(book.id)}
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: isFavorite ? 'var(--accent-tertiary)' : 'var(--text-secondary)',
                        transition: 'transform 0.2s'
                      }}
                      className="star-btn"
                    >
                      <Heart size={16} fill={isFavorite ? 'var(--accent-tertiary)' : 'transparent'} />
                    </button>
                  )}
                </div>

                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700, textShadow: '1px 1px 3px rgba(0,0,0,0.5)', marginTop: '20px' }}>
                  {book.title}
                </div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', textShadow: '1px 1px 2px rgba(0,0,0,0.5)', marginBottom: '20px' }}>
                  {book.author}
                </div>
              </div>

              {/* Book Specs list */}
              <ul className="details-meta-list">
                <li>
                  <span>Format:</span>
                  <span>Softcover Book</span>
                </li>
                <li>
                  <span>Year:</span>
                  <span>{book.year}</span>
                </li>
                <li>
                  <span>Pages:</span>
                  <span>{book.pages} pages</span>
                </li>
                <li>
                  <span>ISBN:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{book.isbn}</span>
                </li>
                <li>
                  <span>Copies Available:</span>
                  <span style={{ color: book.available > 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {book.available} / {book.copies}
                  </span>
                </li>
              </ul>

              {/* Admin Actions */}
              {currentRole === 'admin' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                  <button className="glow-btn glow-btn-cyan" onClick={startEditing}>
                    <Edit size={14} /> Edit Book Details
                  </button>
                  <button className="danger-btn" onClick={handleDelete}>
                    <Trash2 size={14} /> Delete from Catalog
                  </button>
                </div>
              ) : (
                /* Member Actions */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                  {activeLoan ? (
                    <button 
                      className="glow-btn" 
                      style={{ background: 'linear-gradient(135deg, var(--warning), #d97706)' }}
                      onClick={() => returnBook(activeLoan.id)}
                    >
                      <BookMarked size={14} /> Return Book copy
                    </button>
                  ) : book.available > 0 ? (
                    <button className="glow-btn" onClick={() => borrowBook(book.id)}>
                      <BookOpen size={14} /> Borrow Book copy
                    </button>
                  ) : userHasHold ? (
                    <button className="secondary-btn" disabled style={{ opacity: 0.6 }}>
                      Hold Requested (Pending)
                    </button>
                  ) : (
                    <button className="glow-btn glow-btn-cyan" onClick={() => placeHold(book.id)}>
                      <Layers size={14} /> Place Reservation Hold
                    </button>
                  )}
                  
                  {book.excerpt && (
                    <button className="secondary-btn" onClick={handleStartReading}>
                      <FileText size={14} /> Read E-Book Preview
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right Book Information Panel */}
            <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--accent-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {book.genre}
                </span>
                <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '6px 0 2px 0' }} className="text-glow-purple">
                  {book.title}
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>by <strong>{book.author}</strong></p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                  <div style={{ display: 'flex', color: 'var(--warning)', alignItems: 'center' }}>
                    <Star size={16} fill="var(--warning)" color="var(--warning)" />
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginLeft: '6px' }}>{book.rating || '0.0'}</span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    ({book.ratingsCount} verified reviews)
                  </span>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Synopsis Description
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                  {book.summary}
                </p>
              </div>

              {/* Reservation waitlist summary */}
              {bookHolds.length > 0 && (
                <div className="glass-panel" style={{ padding: '12px 16px', background: 'rgba(245, 158, 11, 0.04)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                  <span style={{ color: 'var(--warning)', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ⚠️ Reservation Hold Queue: {bookHolds.length} member(s) waiting.
                  </span>
                </div>
              )}

              {/* Reviews Section */}
              <div className="reviews-section">
                <h3 className="reviews-title">
                  <span>Reader Reviews</span>
                  {currentRole === 'user' && (
                    <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-secondary)' }}>
                      Tell us what you think
                    </span>
                  )}
                </h3>

                {/* Rating Form (Members only) */}
                {currentRole === 'user' && (
                  <form onSubmit={handleReviewSubmit} className="review-form">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>Your Rating:</span>
                      <div className="rating-picker">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className={`star-btn ${star <= reviewRating ? 'selected' : ''}`}
                            onClick={() => setReviewRating(star)}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Write your constructive review here..."
                      className="review-textarea"
                      required
                    />
                    <button type="submit" className="glow-btn" style={{ alignSelf: 'flex-end', padding: '6px 14px', fontSize: '12px' }}>
                      Submit Review
                    </button>
                  </form>
                )}

                {/* Reviews List */}
                <div className="review-list">
                  {book.reviews.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic', textAlign: 'center', padding: '15px' }}>
                      No reviews posted yet. Be the first to share your thoughts!
                    </p>
                  ) : (
                    book.reviews.map((rev) => (
                      <div key={rev.id} className="review-card">
                        <div className="review-card-header">
                          <span className="review-card-user">{rev.user}</span>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ color: 'var(--warning)' }}>{'★'.repeat(rev.rating)}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{rev.date}</span>
                          </div>
                        </div>
                        <p className="review-card-comment">{rev.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
