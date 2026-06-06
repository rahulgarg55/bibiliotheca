import express from 'express';
import prisma from '../config/db.js';
import redisClient from '../config/redis.js';
import { producer } from '../config/kafka.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Helper to publish audit log event to Kafka queue
const publishKafkaEvent = async (type, message) => {
  try {
    const payload = {
      timestamp: new Date().toISOString(),
      type,
      message
    };
    await producer.send({
      topic: 'library-audit-logs',
      messages: [{ value: JSON.stringify(payload) }]
    });
    console.log(`Kafka event sent: [${type}] ${message}`);
  } catch (err) {
    console.error('Failed to emit log event to Kafka queue:', err.message);
    // Fallback: log directly to system log table if Kafka broker is unavailable
    try {
      await prisma.systemLog.create({
        data: {
          type,
          message: `${message} (Kafka Fallback)`
        }
      });
    } catch (e) {
      console.error('Database log fallback also failed:', e.message);
    }
  }
};

// Fetch Book Catalog (with Redis Caching)
router.get('/', async (req, res) => {
  try {
    // Check cache first
    let cachedCatalog = null;
    try {
      if (redisClient.isOpen) {
        cachedCatalog = await redisClient.get('books:catalog');
      }
    } catch (cacheErr) {
      console.warn('Redis Cache Read failed, falling back to database:', cacheErr.message);
    }

    if (cachedCatalog) {
      console.log('Redis CACHE HIT: returning catalog');
      return res.json(JSON.parse(cachedCatalog));
    }

    console.log('Redis CACHE MISS: fetching from database');
    // Fetch from Database
    const books = await prisma.book.findMany({
      include: {
        reviews: true
      }
    });

    // Cache in Redis for 5 minutes (300s)
    try {
      if (redisClient.isOpen) {
        await redisClient.set('books:catalog', JSON.stringify(books), {
          EX: 300
        });
      }
    } catch (cacheErr) {
      console.warn('Redis Cache Write failed:', cacheErr.message);
    }

    return res.json(books);
  } catch (err) {
    console.error('Get Books Error:', err);
    return res.status(500).json({ error: 'Server database error.' });
  }
});

// Add Publication (Admin Only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { title, author, isbn, genre, year, copies, pages, summary, coverColor, excerpt } = req.body;

  if (!title || !author || !isbn) {
    return res.status(400).json({ error: 'Title, Author, and ISBN are required fields.' });
  }

  try {
    const existing = await prisma.book.findUnique({ where: { isbn } });
    if (existing) {
      return res.status(400).json({ error: 'A book with this ISBN already exists.' });
    }

    const newBook = await prisma.book.create({
      data: {
        title, author, isbn, genre, 
        year: parseInt(year) || new Date().getFullYear(),
        copies: parseInt(copies) || 1,
        available: parseInt(copies) || 1,
        pages: parseInt(pages) || 100,
        summary: summary || '',
        coverColor: coverColor || 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
        excerpt: excerpt || ''
      }
    });

    // Invalidate Redis Cache
    try {
      if (redisClient.isOpen) {
        await redisClient.del('books:catalog');
      }
    } catch (cacheErr) {
      console.warn('Redis Cache eviction failed:', cacheErr.message);
    }

    // Publish event
    await publishKafkaEvent('admin', `Admin added book '${title}' (ISBN: ${isbn}) to catalog`);

    return res.status(201).json(newBook);
  } catch (err) {
    console.error('Add Book Error:', err);
    return res.status(500).json({ error: 'Failed to create book record.' });
  }
});

// Modify Publication Specs (Admin Only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, author, isbn, genre, year, copies, pages, summary, coverColor, excerpt } = req.body;

  try {
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) {
      return res.status(404).json({ error: 'Book record not found.' });
    }

    // calculate availability adjustment based on total copies change
    const copyDiff = (parseInt(copies) || book.copies) - book.copies;
    const newAvailable = Math.max(0, book.available + copyDiff);

    const updatedBook = await prisma.book.update({
      where: { id },
      data: {
        title: title || book.title,
        author: author || book.author,
        isbn: isbn || book.isbn,
        genre: genre || book.genre,
        year: year ? parseInt(year) : book.year,
        copies: copies ? parseInt(copies) : book.copies,
        available: newAvailable,
        pages: pages ? parseInt(pages) : book.pages,
        summary: summary || book.summary,
        coverColor: coverColor || book.coverColor,
        excerpt: excerpt || book.excerpt
      }
    });

    // Invalidate Cache
    try {
      if (redisClient.isOpen) {
        await redisClient.del('books:catalog');
      }
    } catch (cacheErr) {
      console.warn('Redis Cache eviction failed:', cacheErr.message);
    }

    // Publish event
    await publishKafkaEvent('admin', `Admin modified specs for book '${updatedBook.title}'`);

    return res.json(updatedBook);
  } catch (err) {
    console.error('Edit Book Error:', err);
    return res.status(500).json({ error: 'Failed to update book specifications.' });
  }
});

// Delete Publication (Admin Only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) {
      return res.status(404).json({ error: 'Book record not found.' });
    }

    await prisma.book.delete({ where: { id } });

    // Invalidate Cache
    try {
      if (redisClient.isOpen) {
        await redisClient.del('books:catalog');
      }
    } catch (cacheErr) {
      console.warn('Redis Cache eviction failed:', cacheErr.message);
    }

    // Publish event
    await publishKafkaEvent('admin', `Admin deleted book '${book.title}' from catalog`);

    return res.json({ message: `Successfully deleted book '${book.title}'` });
  } catch (err) {
    console.error('Delete Book Error:', err);
    return res.status(500).json({ error: 'Failed to delete book record.' });
  }
});

// Borrow Book copy
router.post('/:id/borrow', authenticateToken, async (req, res) => {
  const bookId = req.params.id;
  const userId = req.user.id; // From JWT payload

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User profile not found.' });
    
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account suspended due to outstanding violations.' });
    }

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) return res.status(404).json({ error: 'Book record not found.' });

    // Check if user already holds active borrow
    const active = await prisma.loan.findFirst({
      where: { userId, bookId, status: { in: ['active', 'overdue'] } }
    });
    if (active) {
      return res.status(400).json({ error: 'You have already checked out a copy of this book.' });
    }

    if (book.available <= 0) {
      return res.status(400).json({ error: 'No copies currently available in stack.' });
    }

    // Begin checkout transaction
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // 2 weeks limit

    const [updatedBook, newLoan] = await prisma.$transaction([
      prisma.book.update({
        where: { id: bookId },
        data: { available: { decrement: 1 } }
      }),
      prisma.loan.create({
        data: {
          userId,
          bookId,
          dueDate,
          status: 'active'
        }
      })
    ]);

    // Invalidate cache
    try {
      if (redisClient.isOpen) {
        await redisClient.del('books:catalog');
      }
    } catch (cacheErr) {
      console.warn('Redis Cache eviction failed:', cacheErr.message);
    }

    // Publish Kafka Checkout Event
    await publishKafkaEvent('checkout', `${user.name} checked out book '${book.title}'`);

    return res.status(201).json({
      message: 'Checkout successful!',
      loan: newLoan,
      availableCopies: updatedBook.available
    });
  } catch (err) {
    console.error('Borrow Book Error:', err);
    return res.status(500).json({ error: 'Transaction failed.' });
  }
});

// Place Reservation Hold
router.post('/:id/hold', authenticateToken, async (req, res) => {
  const bookId = req.params.id;
  const userId = req.user.id;

  try {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!book || !user) return res.status(404).json({ error: 'User or Book records not found.' });

    // Verify if already holding
    const existing = await prisma.hold.findFirst({
      where: { bookId, userId, status: 'pending' }
    });
    if (existing) {
      return res.status(400).json({ error: 'You already have an active hold on this book.' });
    }

    const hold = await prisma.hold.create({
      data: {
        bookId,
        userId,
        status: 'pending'
      }
    });

    // Publish event
    await publishKafkaEvent('system', `${user.name} placed a reservation hold on '${book.title}'`);

    return res.status(201).json({ message: 'Hold requested successfully.', hold });
  } catch (err) {
    console.error('Hold Book Error:', err);
    return res.status(500).json({ error: 'Failed to register hold.' });
  }
});

// Return Book copy
router.post('/loans/:loanId/return', authenticateToken, async (req, res) => {
  const { loanId } = req.params;

  try {
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) return res.status(404).json({ error: 'Borrow record not found.' });
    if (loan.status === 'returned') {
      return res.status(400).json({ error: 'This transaction was already returned.' });
    }

    const book = await prisma.book.findUnique({ where: { id: loan.bookId } });
    const user = await prisma.user.findUnique({ where: { id: loan.userId } });

    // Calculate overdue fine
    const today = new Date();
    const dueDate = new Date(loan.dueDate);
    let fine = 0.0;

    if (today > dueDate) {
      const diffTime = Math.abs(today - dueDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      fine = diffDays * 0.50;
    }

    // Process Return in Database Transaction
    await prisma.$transaction([
      prisma.loan.update({
        where: { id: loanId },
        data: {
          returnDate: today,
          status: 'returned',
          fineAmount: fine
        }
      }),
      prisma.book.update({
        where: { id: loan.bookId },
        data: { available: { increment: 1 } }
      }),
      prisma.user.update({
        where: { id: loan.userId },
        data: {
          fines: { increment: fine },
          goalProgress: { increment: user.role === 'user' ? 1 : 0 }
        }
      })
    ]);

    // Check if there are any pending holds for this book
    const oldestHold = await prisma.hold.findFirst({
      where: { bookId: loan.bookId, status: 'pending' },
      orderBy: { holdDate: 'asc' }
    });

    if (oldestHold) {
      const holdUser = await prisma.user.findUnique({ where: { id: oldestHold.userId } });
      await prisma.hold.update({
        where: { id: oldestHold.id },
        data: { status: 'fulfilled' }
      });
      await publishKafkaEvent('system', `Hold fulfilled on '${book.title}' for user ${holdUser.name}`);
    }

    // Invalidate Redis cache
    try {
      if (redisClient.isOpen) {
        await redisClient.del('books:catalog');
      }
    } catch (cacheErr) {
      console.warn('Redis Cache eviction failed:', cacheErr.message);
    }

    // Emit event
    if (fine > 0) {
      await publishKafkaEvent('fine', `${user.name} returned overdue copy of '${book.title}' ($${fine.toFixed(2)} fine)`);
    } else {
      await publishKafkaEvent('return', `${user.name} returned copy of '${book.title}'`);
    }

    return res.json({
      message: 'Return recorded successfully!',
      finePaid: false,
      fineAmount: fine
    });
  } catch (err) {
    console.error('Return Book Error:', err);
    return res.status(500).json({ error: 'Server database error.' });
  }
});

// Submit Reader Review
router.post('/:id/review', authenticateToken, async (req, res) => {
  const bookId = req.params.id;
  const { rating, comment } = req.body;

  if (!rating || !comment) {
    return res.status(400).json({ error: 'Rating and comment are required.' });
  }

  try {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) return res.status(404).json({ error: 'Book record not found.' });

    // Create Review
    const newReview = await prisma.review.create({
      data: {
        bookId,
        user: req.user.name,
        rating: parseInt(rating),
        comment,
        date: new Date().toISOString().split('T')[0]
      }
    });

    // Recalculate average rating
    const reviews = await prisma.review.findMany({ where: { bookId } });
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = parseFloat((sum / reviews.length).toFixed(1));

    await prisma.book.update({
      where: { id: bookId },
      data: {
        rating: avg,
        ratingsCount: reviews.length
      }
    });

    // Evict Redis Cache
    try {
      if (redisClient.isOpen) {
        await redisClient.del('books:catalog');
      }
    } catch (cacheErr) {
      console.warn('Redis Cache eviction failed:', cacheErr.message);
    }

    // Publish event
    await publishKafkaEvent('system', `${req.user.name} posted review on '${book.title}'`);

    return res.status(201).json(newReview);
  } catch (err) {
    console.error('Post Review Error:', err);
    return res.status(500).json({ error: 'Server database error.' });
  }
});

export default router;
