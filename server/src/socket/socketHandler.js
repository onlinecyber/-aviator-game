const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Socket.IO authentication middleware
 */
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('username email role balance isActive');

    if (!user || !user.isActive) {
      return next(new Error('User not found or suspended'));
    }

    socket.userId = user._id.toString();
    socket.username = user.username;
    socket.userRole = user.role;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
};

/**
 * Register all socket event handlers
 */
const registerSocketHandlers = (io, gameEngine) => {
  // Apply auth middleware to all socket connections
  io.use(socketAuth);

  io.on('connection', (socket) => {
    console.log(`🔌 ${socket.username} connected (${socket.id})`);

    // Join a personal room for targeted events
    socket.join(socket.userId);

    // Send current game state immediately on connect
    const state = gameEngine.getPublicState();
    socket.emit('game:state', {
      ...state,
      history: gameEngine.history.slice(0, 10),
    });

    // Send current active bets list
    socket.emit('players:active', gameEngine.getActiveBetsList());

    // ── Bet Placement ────────────────────────────────────────────────────
    socket.on('bet:place', async (data) => {
      try {
        const { amount, autoCashout } = data || {};
        const result = await gameEngine.placeBet(
          socket.userId,
          socket.username,
          parseFloat(amount),
          autoCashout ? parseFloat(autoCashout) : null
        );

        if (result.success) {
          socket.emit('bet:placed', {
            betId: result.bet._id,
            amount: result.bet.amount,
            autoCashout: result.bet.autoCashout,
            gameId: result.bet.gameId,
            balance: result.balance,
          });

          // Broadcast new active bet to all players
          io.emit('players:active', gameEngine.getActiveBetsList());

          // Update the user's wallet balance
          socket.emit('wallet:updated', { balance: result.balance });
        } else {
          socket.emit('bet:error', { message: result.message });
        }
      } catch (err) {
        socket.emit('bet:error', { message: 'Bet failed: ' + err.message });
      }
    });

    // ── Manual Cashout ────────────────────────────────────────────────────
    socket.on('bet:cashout', async () => {
      try {
        const result = await gameEngine.cashout(socket.userId);
        if (!result.success) {
          socket.emit('bet:error', { message: result.message });
        } else {
          socket.emit('wallet:updated', { balance: result.balance });
          io.emit('players:active', gameEngine.getActiveBetsList());
        }
      } catch (err) {
        socket.emit('bet:error', { message: 'Cashout failed: ' + err.message });
      }
    });

    // ── Chat / Ping ───────────────────────────────────────────────────────
    socket.on('ping', () => {
      socket.emit('pong', { time: Date.now() });
    });

    // ── Disconnect ────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`🔌 ${socket.username} disconnected: ${reason}`);
    });
  });
};

module.exports = { registerSocketHandlers };
