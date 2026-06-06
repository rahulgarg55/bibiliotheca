import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import prisma from './config/db.js';
import redisClient from './config/redis.js';
import { connectKafka, consumer } from './config/kafka.js';

import authRouter from './routes/auth.js';
import booksRouter from './routes/books.js';
import usersRouter from './routes/users.js';
import logsRouter from './routes/logs.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Bind API Routes
app.use('/api/auth', authRouter);
app.use('/api/books', booksRouter);
app.use('/api/users', usersRouter);
app.use('/api/logs', logsRouter);

// Root Status Check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Kafka Consumer: Subscribes to audit logs and writes them to Postgres database
const startKafkaConsumer = async () => {
  try {
    await consumer.subscribe({ topic: 'library-audit-logs', fromBeginning: true });
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const payload = JSON.parse(message.value.toString());
          console.log(`Kafka Consumer processed: [${payload.type}] ${payload.message}`);
          
          // Write log directly into DB
          await prisma.systemLog.create({
            data: {
              timestamp: new Date(payload.timestamp),
              type: payload.type,
              message: payload.message
            }
          });
        } catch (parseErr) {
          console.error('Failed to parse incoming Kafka log payload:', parseErr.message);
        }
      }
    });
    console.log("Kafka Audit Log Consumer running and listening...");
  } catch (err) {
    console.error("Failed to start Kafka Consumer worker loop:", err.message);
  }
};

// Start Server & Connections
const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`Bibliotheca Security API Server running on port ${PORT}`);
  });

  // Connect message brokers in background
  connectKafka().then(() => {
    startKafkaConsumer();
  }).catch((err) => {
    console.warn("Background Kafka initialization failed:", err.message);
  });
};

startServer().catch((e) => {
  console.error("Fatal Server Startup Error:", e);
});
