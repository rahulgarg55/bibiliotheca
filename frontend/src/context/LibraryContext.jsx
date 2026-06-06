import React, { createContext, useState, useEffect } from 'react';

export const LibraryContext = createContext();

export const LibraryProvider = ({ children }) => {
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [holds, setHolds] = useState([]);
  const [logs, setLogs] = useState([]);

  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [currentRole, setCurrentRole] = useState('user');

  // Local storage bookmarks
  const [shelves, setShelves] = useState([]);
  const [favorites, setFavorites] = useState([]);

  // Toast alerts state
  const [toasts, setToasts] = useState([]);

  // Initial Load: checks for saved token session
  useEffect(() => {
    const savedToken = localStorage.getItem('bib_jwt');
    const savedUser = localStorage.getItem('bib_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      const userObj = JSON.parse(savedUser);
      setCurrentUser(userObj);
      setCurrentRole(userObj.role);
    }

    const savedShelves = localStorage.getItem('bib_shelves');
    setShelves(savedShelves ? JSON.parse(savedShelves) : [
      { id: "shelf-1", name: "Currently Reading", bookIds: ["bk-2"] },
      { id: "shelf-2", name: "Want to Read", bookIds: ["bk-3", "bk-4"] },
      { id: "shelf-3", name: "My Favorites", bookIds: ["bk-1"] }
    ]);

    const savedFavs = localStorage.getItem('bib_favorites');
    setFavorites(savedFavs ? JSON.parse(savedFavs) : ["bk-1", "bk-4"]);
  }, []);

  // Fetch Core Catalog when token updates
  useEffect(() => {
    if (token) {
      fetchCatalog();
      if (currentRole === 'admin') {
        fetchUsers();
        fetchLogs();
      }
    } else {
      setBooks([]);
      setUsers([]);
      setLoans([]);
      setLogs([]);
    }
  }, [token, currentRole]);

  // Sync shelves and favorites locally
  useEffect(() => {
    if (shelves.length > 0) localStorage.setItem('bib_shelves', JSON.stringify(shelves));
  }, [shelves]);

  useEffect(() => {
    if (favorites.length > 0) localStorage.setItem('bib_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Toast Helper
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Secure Fetch API wrapper
  const apiFetch = async (url, options = {}) => {
    const activeToken = token || localStorage.getItem('bib_jwt');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }
    return fetch(url, { ...options, headers });
  };

  // 1. API Fetch Helpers
  const fetchCatalog = async () => {
    try {
      const res = await apiFetch('/api/books');
      if (res.ok) {
        const data = await res.json();
        setBooks(data);
        
        // Extract loans dynamically from catalog books to update user progress
        const activeLoans = [];
        data.forEach(book => {
          if (book.loans) {
            book.loans.forEach(l => {
              activeLoans.push({ ...l, bookTitle: book.title });
            });
          }
        });
        setLoans(activeLoans);
      }
    } catch (err) {
      console.error('Failed to load books catalog:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await apiFetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        localStorage.setItem('bib_users', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Failed to load users registry:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await apiFetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to load console logs:', err);
    }
  };

  // 2. Authentication handlers
  const handleLogin = (jwtToken, userProfile) => {
    localStorage.setItem('bib_jwt', jwtToken);
    localStorage.setItem('bib_user', JSON.stringify(userProfile));
    setToken(jwtToken);
    setCurrentUser(userProfile);
    setCurrentRole(userProfile.role);
  };

  const handleLogout = () => {
    localStorage.removeItem('bib_jwt');
    localStorage.removeItem('bib_user');
    localStorage.removeItem('bib_users');
    setToken(null);
    setCurrentUser(null);
    setCurrentRole('user');
    showToast("Logged out successfully.", "info");
  };

  const toggleRole = () => {
    // Role switcher mock function: simply toggles role payload for demo
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    const updatedProfile = { ...currentUser, role: nextRole };
    
    localStorage.setItem('bib_user', JSON.stringify(updatedProfile));
    setCurrentUser(updatedProfile);
    setCurrentRole(nextRole);
    showToast(`Switched active view to ${nextRole.toUpperCase()}`, "info");
  };

  // 3. Library Transaction Queries
  const borrowBook = async (bookId) => {
    try {
      const res = await apiFetch(`/api/books/${bookId}/borrow`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to borrow book copy.', 'error');
        return;
      }

      showToast(data.message, 'success');
      fetchCatalog(); // Reload states
      if (currentRole === 'admin') fetchUsers();
    } catch (err) {
      console.error(err);
      showToast('Connection error during checkout.', 'error');
    }
  };

  const returnBook = async (loanId) => {
    try {
      const res = await apiFetch(`/api/books/loans/${loanId}/return`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to return book.', 'error');
        return;
      }

      showToast(data.message, data.fineAmount > 0 ? 'warning' : 'success');
      fetchCatalog();
      // If returning user is active profile, sync fine updates
      if (currentUser) {
        const profileSync = await apiFetch(`/api/auth/login`, {
          // Re-fetch profile details or simulate update
        });
        // Simplest: update local session state metrics
        const fineInc = data.fineAmount;
        setCurrentUser(prev => ({
          ...prev,
          fines: prev.fines + fineInc,
          goalProgress: prev.role === 'user' ? prev.goalProgress + 1 : prev.goalProgress
        }));
      }
      if (currentRole === 'admin') {
        fetchUsers();
        fetchLogs();
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error during returns.', 'error');
    }
  };

  const placeHold = async (bookId) => {
    try {
      const res = await apiFetch(`/api/books/${bookId}/hold`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to request hold.', 'error');
        return;
      }

      showToast(data.message, 'success');
      fetchCatalog();
      if (currentRole === 'admin') {
        fetchLogs();
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error requesting hold.', 'error');
    }
  };

  const toggleFavorite = (bookId) => {
    setFavorites(prev => {
      const isFav = prev.includes(bookId);
      const next = isFav ? prev.filter(id => id !== bookId) : [...prev, bookId];
      showToast(isFav ? "Removed from favorites" : "Added to favorites", isFav ? "info" : "success");
      return next;
    });
  };

  // 4. Admin Management Operations (JWT guarded)
  const payFine = async (userId, amount) => {
    try {
      const res = await apiFetch(`/api/users/${userId}/settle-fine`, {
        method: 'POST',
        body: JSON.stringify({ amount })
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to record fine payment.', 'error');
        return;
      }

      showToast('Fine payment recorded successfully!', 'success');
      fetchUsers();
      fetchLogs();
      if (currentUser?.id === userId) {
        setCurrentUser(prev => ({ ...prev, fines: Math.max(0, prev.fines - parseFloat(amount)) }));
      }
    } catch (err) {
      console.error(err);
      showToast('Fine settlement connection error.', 'error');
    }
  };

  const updateReadingGoal = async (userId, goalNum) => {
    try {
      const res = await apiFetch('/api/users/goal', {
        method: 'PUT',
        body: JSON.stringify({ goal: goalNum })
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to update goals.', 'error');
        return;
      }

      showToast(`Monthly goal set to ${goalNum} books!`, 'success');
      if (currentUser?.id === userId) {
        setCurrentUser(prev => ({ ...prev, goal: parseInt(goalNum) }));
      }
      if (currentRole === 'admin') fetchUsers();
    } catch (err) {
      console.error(err);
      showToast('Connection error updating goal.', 'error');
    }
  };

  const toggleUserStatus = async (userId) => {
    try {
      const res = await apiFetch(`/api/users/${userId}/status`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to update user status.', 'error');
        return;
      }

      showToast(`Member profile is now ${data.status}.`, 'info');
      fetchUsers();
      fetchLogs();
    } catch (err) {
      console.error(err);
      showToast('Connection error suspending profile.', 'error');
    }
  };

  const deleteUser = async (userId) => {
    try {
      const res = await apiFetch(`/api/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to delete member.', 'error');
        return;
      }

      showToast(data.message, 'warning');
      fetchUsers();
      fetchLogs();
    } catch (err) {
      console.error(err);
      showToast('Connection error deleting member profile.', 'error');
    }
  };

  // 5. Book management operations (Admin guarded)
  const addBook = async (bookData) => {
    try {
      const res = await apiFetch('/api/books', {
        method: 'POST',
        body: JSON.stringify(bookData)
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to create catalog book.', 'error');
        return;
      }

      showToast(`Added '${bookData.title}' successfully!`, 'success');
      fetchCatalog();
      fetchLogs();
    } catch (err) {
      console.error(err);
      showToast('Connection error creating book.', 'error');
    }
  };

  const editBook = async (bookId, bookData) => {
    try {
      const res = await apiFetch(`/api/books/${bookId}`, {
        method: 'PUT',
        body: JSON.stringify(bookData)
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to update book specifications.', 'error');
        return;
      }

      showToast(`Updated '${bookData.title}' specifications!`, 'success');
      fetchCatalog();
      fetchLogs();
    } catch (err) {
      console.error(err);
      showToast('Connection error editing book details.', 'error');
    }
  };

  const deleteBook = async (bookId) => {
    try {
      const res = await apiFetch(`/api/books/${bookId}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to delete book record.', 'error');
        return;
      }

      showToast(data.message, 'warning');
      fetchCatalog();
      fetchLogs();
    } catch (err) {
      console.error(err);
      showToast('Connection error deleting book.', 'error');
    }
  };

  const addReview = async (bookId, reviewData) => {
    try {
      const res = await apiFetch(`/api/books/${bookId}/review`, {
        method: 'POST',
        body: JSON.stringify(reviewData)
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to submit review.', 'error');
        return;
      }

      showToast('Review submitted successfully!', 'success');
      fetchCatalog();
      if (currentRole === 'admin') fetchLogs();
    } catch (err) {
      console.error(err);
      showToast('Connection error posting review.', 'error');
    }
  };

  // 6. Custom Shelf Managers
  const createShelf = (name) => {
    if (!name.trim()) return;
    const newShelf = { id: `shelf-${Date.now()}`, name, bookIds: [] };
    setShelves(prev => [...prev, newShelf]);
    showToast(`Created custom shelf '${name}'`, 'success');
  };

  const toggleBookOnShelf = (shelfId, bookId) => {
    setShelves(prev => prev.map(s => {
      if (s.id === shelfId) {
        const isPresent = s.bookIds.includes(bookId);
        const nextIds = isPresent ? s.bookIds.filter(id => id !== bookId) : [...s.bookIds, bookId];
        showToast(isPresent ? `Removed from ${s.name}` : `Added to ${s.name}`, 'success');
        return { ...s, bookIds: nextIds };
      }
      return s;
    }));
  };

  // 7. Time warp timeline simulation
  const simulateDaysPass = async (days) => {
    try {
      const res = await apiFetch('/api/logs/simulate-time', {
        method: 'POST',
        body: JSON.stringify({ days })
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to advance timeline.', 'error');
        return;
      }

      showToast(data.message, 'info');
      
      // Re-trigger catalog updates
      fetchCatalog();
      if (currentRole === 'admin') {
        fetchUsers();
        fetchLogs();
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error simulating timeline shift.', 'error');
    }
  };

  return (
    <LibraryContext.Provider value={{
      books,
      users,
      loans,
      holds,
      logs,
      shelves,
      favorites,
      currentUser,
      currentRole,
      toasts,
      handleLogin,
      handleLogout,
      toggleRole,
      borrowBook,
      returnBook,
      placeHold,
      toggleFavorite,
      payFine,
      updateReadingGoal,
      toggleUserStatus,
      deleteUser,
      addBook,
      editBook,
      deleteBook,
      addReview,
      createShelf,
      toggleBookOnShelf,
      simulateDaysPass,
      showToast
    }}>
      {children}
    </LibraryContext.Provider>
  );
};
