require('dotenv').config();
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./src/config/db');
const { registerSocketHandlers } = require('./src/socket/socketHandler');
const GameEngine = require('./src/services/gameEngine');

// Routes
const authRoutes = require('./src/routes/auth');
const walletRoutes = require('./src/routes/wallet');
const gameRoutes = require('./src/routes/games');
const adminRoutes = require('./src/routes/admin');

const app = express();
const server = http.createServer(app);

// ─── Socket.IO Setup ──────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ─── Express Middleware ───────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── REST API Routes ──────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (_, res) =>
  res.json({ status: 'ok', env: process.env.NODE_ENV, timestamp: new Date() })
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Boot Sequence ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const boot = async () => {
  await connectDB();

  // Initialize game engine and attach to Socket.IO
  const gameEngine = new GameEngine(io);

  // Register all socket event handlers
  registerSocketHandlers(io, gameEngine);

  // Start the game loop
  await gameEngine.start();

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
    console.log(`📡 WebSocket ready`);
  });
};

boot().catch((err) => {
  console.error('Fatal boot error:', err);
  process.exit(1);
});
