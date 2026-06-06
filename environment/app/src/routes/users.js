import express from 'express';
import prisma from '../config/db.js';
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

// Get Member Directory (Admin Only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    return res.json(users);
  } catch (err) {
    console.error('Get Users Error:', err);
    return res.status(500).json({ error: 'Server database error.' });
  }
});

// Toggle Member suspension status (Admin Only)
router.post('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User profile not found.' });

    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    const updated = await prisma.user.update({
      where: { id },
      data: { status: newStatus }
    });

    await publishKafkaEvent('admin', `Admin updated account status of ${user.name} to ${newStatus}`);

    return res.json(updated);
  } catch (err) {
    console.error('Toggle User Status Error:', err);
    return res.status(500).json({ error: 'Failed to update member status.' });
  }
});

// Delete User Profile (Admin Only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User profile not found.' });

    await prisma.user.delete({ where: { id } });

    await publishKafkaEvent('admin', `Admin deleted user profile: ${user.name} (${user.email})`);

    return res.json({ message: 'User profile deleted successfully.' });
  } catch (err) {
    console.error('Delete User Error:', err);
    return res.status(500).json({ error: 'Failed to delete user record.' });
  }
});

// Settle Fine (Admin Only)
router.post('/:id/settle-fine', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  const payment = parseFloat(amount);
  if (isNaN(payment) || payment <= 0) {
    return res.status(400).json({ error: 'Please enter a valid positive payment amount.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User profile not found.' });

    if (payment > user.fines) {
      return res.status(400).json({ error: 'Payment exceeds outstanding balance.' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        fines: { decrement: payment }
      }
    });

    await publishKafkaEvent('fine', `Settle $${payment.toFixed(2)} of fines for member ${user.name}`);

    return res.json(updated);
  } catch (err) {
    console.error('Settle Fine Error:', err);
    return res.status(500).json({ error: 'Failed to update fine record.' });
  }
});

// Update Reading Goal (For Active User)
router.put('/goal', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { goal } = req.body;

  const goalInt = parseInt(goal);
  if (isNaN(goalInt) || goalInt < 0) {
    return res.status(400).json({ error: 'Please enter a valid positive goal number.' });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { goal: goalInt }
    });

    return res.json(updated);
  } catch (err) {
    console.error('Update Goal Error:', err);
    return res.status(500).json({ error: 'Failed to update reading goal.' });
  }
});

export default router;
