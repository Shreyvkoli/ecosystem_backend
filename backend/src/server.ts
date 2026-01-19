import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { apiLimiter } from './middleware/rateLimit.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// robustness: try to find .env file
const possiblePaths = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), 'backend', '.env'),
  path.join(__dirname, '..', '.env'), // if running from dist (dist/server.js -> backend/.env)
  path.join(__dirname, '..', '..', '.env') // if running from src (src/server.ts -> backend/.env)
];

let loaded = false;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    console.log(`Loaded environment from: ${p}`);
    loaded = true;
    break;
  }
}
// On Render, we expect env vars to be pre-loaded, so failing to find .env is OK.
if (!loaded) {
  console.log('NOTE: .env file not found. Assuming environment variables are injected (e.g. Docker/Render/Vercel).');
}
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orders.js';
import fileRoutes from './routes/files.js';
import messageRoutes from './routes/messages.js';
import paymentRoutes from './routes/payments.js';
import editorRoutes from './routes/editor.js';
import userRoutes from './routes/users.js';
import youtubeRoutes from './routes/youtube.js';
import notificationRoutes from './routes/notifications.js';
import reviewRoutes from './routes/reviews.js';
import videoRoutes from './routes/videos.js';
import withdrawalRoutes from './routes/withdrawals.js';
import invoiceRoutes from './routes/invoices.js';
import { SchedulerService } from './services/schedulerService.js';


import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;
// ...
// (We must initialize IO after allowedOrigins is defined, or move it)
// actually I'll do it lower down.


const allowedOrigins = new Set(
  [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:3002',
    'http://localhost:3004'
  ].filter(Boolean) as string[]
);

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url} [Origin: ${req.headers.origin}]`);
  next();
});

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow localhost
    if (allowedOrigins.has(origin)) return callback(null, true);
    if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return callback(null, true);

    // Allow any Vercel deployment
    if (origin.endsWith('.vercel.app')) return callback(null, true);

    // Fallback: Log blocked origin
    console.log('Blocked by CORS:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Raw body parser for webhook (must be before express.json())
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(helmet());
app.use(express.json());
app.use('/api', apiLimiter); // Apply global rate limit to all API routes

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/editor', editorRoutes);
app.use('/api/users', userRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/invoices', invoiceRoutes);
app.get('/', (_req, res) => {
  res.status(200).json({ status: 'Backend is running' });
});


app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow localhost
      if (allowedOrigins.has(origin)) return callback(null, true);
      if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return callback(null, true);

      // Allow any Vercel deployment
      if (origin.endsWith('.vercel.app')) return callback(null, true);

      return callback(null, false);
    },
    credentials: true
  }
});

app.set('io', io);
import { NotificationService } from './services/notificationService.js';
NotificationService.getInstance().setIo(io);

io.on('connection', (socket) => {
  // console.log('User connected:', socket.id);

  socket.on('join_user', (userId) => {
    if (userId) {
      socket.join(userId);
      // console.log(`Socket joined user room: ${userId}`);
    }
  });

  socket.on('join_order', (orderId) => {
    if (orderId) {
      socket.join(`order:${orderId}`);
      // console.log(`Socket joined order room: ${orderId}`);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Backend restarted with FULL order schema (Deadline + Durations + Ref).');
  console.log('Razorpay Config:', process.env.RAZORPAY_KEY_ID ? 'Loaded (' + process.env.RAZORPAY_KEY_ID.substring(0, 8) + '...)' : 'MISSING');
  // Debug: Check if .env file exists
  import('fs').then(fs => {
    const envPath = require('path').join(process.cwd(), '.env');
    console.log('.env file path:', envPath, 'Exists:', fs.existsSync(envPath));
  });

  if (process.env.ENABLE_SCHEDULER === 'true') {
    SchedulerService.getInstance().startAll();
  }
});

