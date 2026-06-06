import express from 'express';
import prisma from '../config/db.js';
import redisClient from '../config/redis.js';
import { producer } from '../config/kafka.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

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
  } catch (err) {
    console.error('Failed to emit to Kafka', err.message);
  }
};

// Fetch System Logs (Admin Only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const logs = await prisma.systemLog.findMany({
      orderBy: { timestamp: 'desc' }
    });
    return res.json(logs);
  } catch (err) {
    console.error('Get Logs Error:', err);
    return res.status(500).json({ error: 'Server database error.' });
  }
});

// Time Travel Simulation: Shifts dates of active loans backwards in Postgres
router.post('/simulate-time', authenticateToken, async (req, res) => {
  const { days } = req.body;
  const daysInt = parseInt(days);

  if (isNaN(daysInt) || daysInt <= 0) {
    return res.status(400).json({ error: 'Please enter a valid positive number of days.' });
  }

  try {
    // 1. Get all active or overdue loans
    const activeLoans = await prisma.loan.findMany({
      where: { status: { in: ['active', 'overdue'] } }
    });

    const today = new Date();

    for (const loan of activeLoans) {
      // Shift dates backwards in time
      const newBorrow = new Date(loan.borrowDate);
      newBorrow.setDate(newBorrow.getDate() - daysInt);

      const newDue = new Date(loan.dueDate);
      newDue.setDate(newDue.getDate() - daysInt);

      // Check if it has now become overdue
      let status = loan.status;
      let fineAmount = loan.fineAmount;

      if (today > newDue) {
        status = 'overdue';
        const diffTime = Math.abs(today - newDue);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        fineAmount = diffDays * 0.50; // $0.50 per day
      }

      // Update Loan record
      await prisma.loan.update({
        where: { id: loan.id },
        data: {
          borrowDate: newBorrow,
          dueDate: newDue,
          status,
          fineAmount
        }
      });

      // Update User fine balance in database
      if (fineAmount > loan.fineAmount) {
        const deltaFine = fineAmount - loan.fineAmount;
        await prisma.user.update({
          where: { id: loan.userId },
          data: {
            fines: { increment: deltaFine }
          }
        });
      }
    }

    // Invalidate Redis cache since loan availabilities/stats might have adjusted
    await redisClient.del('books:catalog');

    // Emit event
    await publishKafkaEvent('system', `Time advanced by ${daysInt} days. Recalculated due dates and fine balances.`);

    return res.json({ message: `Successfully simulated ${daysInt} days passing in the library database.` });
  } catch (err) {
    console.error('Time Simulation Error:', err);
    return res.status(500).json({ error: 'Failed to process timeline shift.' });
  }
});

export default router;
