const { v4: uuidv4 } = require('uuid');
const Game = require('../models/Game');
const Bet = require('../models/Bet');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { generateCrashPoint, generateSeed, generateHash } = require('../utils/rng');
const {
  BETTING_PHASE_MS,
  CRASH_PHASE_MS,
  MAX_BET_AMOUNT,
  MIN_BET_AMOUNT,
} = require('../config/constants');

class GameEngine {
  constructor(io) {
    this.io = io;
    this.state = 'WAITING'; // 'WAITING' | 'RUNNING' | 'CRASHED'
    this.currentGameId = null;
    this.crashPoint = null;
    this.serverSeed = null;
    this.clientSeed = null;
    this.serverSeedHash = null;

    // Runtime state during a round
    this.startTime = null;
    this.tickInterval = null;

    // Map of userId -> bet object
    this.activeBets = new Map();
    // Memory lock to prevent rapid double-clicks
    this.actionLocks = new Set();

    // Last 10 crash results for history bar
    this.history = [];
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  async start() {
    await this._loadHistory();
    console.log('🚀 Game Engine started');
    this._runWaitingPhase();
  }

  async placeBet(userId, username, amount, autoCashout = null) {
    const lockKey = `bet:${userId}`;
    if (this.actionLocks.has(lockKey)) return { success: false, message: 'Processing...' };
    this.actionLocks.add(lockKey);

    try {
      if (this.state !== 'WAITING') {
        return { success: false, message: 'Betting is closed for this round' };
      }

      if (!amount || amount < MIN_BET_AMOUNT || amount > MAX_BET_AMOUNT) {
        return { success: false, message: `Bet must be between ${MIN_BET_AMOUNT} and ${MAX_BET_AMOUNT}` };
      }

      if (this.activeBets.has(userId.toString())) {
        return { success: false, message: 'You already placed a bet this round' };
      }

      const user = await User.findOneAndUpdate(
        { _id: userId, balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { new: true }
      );

      if (!user) {
        return { success: false, message: 'Insufficient balance' };
      }

      const bet = await Bet.create({
        gameId: this.currentGameId,
        userId,
        username,
        amount,
        autoCashout: autoCashout || null,
        status: 'active',
      });

      await Transaction.create({
        userId,
        type: 'bet',
        amount: -amount,
        balanceBefore: user.balance + amount,
        balanceAfter: user.balance,
        reference: this.currentGameId,
        description: `Bet placed in game ${this.currentGameId}`,
      });

      await Game.findOneAndUpdate(
        { gameId: this.currentGameId },
        { $inc: { totalBetAmount: amount, playerCount: 1 } }
      );

      this.activeBets.set(userId.toString(), {
        betId: bet._id.toString(),
        userId: userId.toString(),
        username,
        amount,
        autoCashout,
      });

      await User.findByIdAndUpdate(userId, { $inc: { totalBets: 1 } });

      return { success: true, bet, balance: user.balance };
    } finally {
      this.actionLocks.delete(lockKey);
    }
  }

  async cashout(userId) {
    const lockKey = `cashout:${userId}`;
    if (this.actionLocks.has(lockKey)) return { success: false, message: 'Processing...' };
    this.actionLocks.add(lockKey);

    try {
      if (this.state !== 'RUNNING') {
        return { success: false, message: 'Game is not running' };
      }

      const betData = this.activeBets.get(userId.toString());
      if (!betData) {
        return { success: false, message: 'No active bet found' };
      }

      // Exact server-time validation
      const elapsedMs = Date.now() - this.startTime;
      const trueMultiplier = this._calculateMultiplier(elapsedMs);

      // Latency protection (strict rejection)
      if (trueMultiplier >= this.crashPoint) {
         return { success: false, message: 'Too late! Plane already crashed.' };
      }

      return await this._processCashout(userId.toString(), betData, trueMultiplier);
    } finally {
      this.actionLocks.delete(lockKey);
    }
  }

  // ─── Internal Phases ──────────────────────────────────────────────────────

  _runWaitingPhase() {
    this.state = 'WAITING';
    this.activeBets.clear();

    this.serverSeed = generateSeed(32);
    this.clientSeed = generateSeed(8);
    this.serverSeedHash = generateHash(this.serverSeed);
    this.crashPoint = generateCrashPoint(this.serverSeed, this.clientSeed);
    this.currentGameId = uuidv4();

    Game.create({
      gameId: this.currentGameId,
      serverSeed: this.serverSeed,
      clientSeed: this.clientSeed,
      crashPoint: this.crashPoint,
      status: 'waiting',
    }).catch((err) => console.error('Game create error:', err));

    console.log(`🎮 Game ${this.currentGameId} | Crash: ${this.crashPoint}x | Hash: ${this.serverSeedHash}`);

    this.io.emit('game:state', {
      status: 'WAITING',
      gameId: this.currentGameId,
      serverSeedHash: this.serverSeedHash,
      bettingEndsIn: BETTING_PHASE_MS,
      history: this.history,
    });

    setTimeout(() => this._runGamePhase(), BETTING_PHASE_MS);
  }

  _runGamePhase() {
    this.state = 'RUNNING';
    this.startTime = Date.now();

    Game.findOneAndUpdate(
      { gameId: this.currentGameId },
      { status: 'running', startedAt: new Date() }
    ).catch(console.error);

    // Broadcast only EXACT start time. No multiplayer ticks leaking crash point or causing lag.
    this.io.emit('game:started', {
      status: 'RUNNING',
      gameId: this.currentGameId,
      startTime: this.startTime
    });

    // Internal loop to evaluate exact crash logic and auto cashouts
    this.tickInterval = setInterval(() => this._internalEval(), 50);
  }

  async _internalEval() {
    const elapsed = Date.now() - this.startTime;
    const currentMultiplier = this._calculateMultiplier(elapsed);

    // Check crash condition first
    if (currentMultiplier >= this.crashPoint) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
      await this._crash();
      return;
    }

    // Process auto-cashouts
    const cashoutPromises = [];
    for (const [userId, bet] of this.activeBets) {
      if (bet.autoCashout && currentMultiplier >= bet.autoCashout) {
        cashoutPromises.push(this._processCashout(userId, bet, bet.autoCashout));
      }
    }
    if (cashoutPromises.length > 0) {
      await Promise.all(cashoutPromises);
    }
  }

  async _crash() {
    this.state = 'CRASHED';
    const finalCrashPoint = parseFloat(this.crashPoint.toFixed(2));

    const lostUserIds = Array.from(this.activeBets.keys());
    if (lostUserIds.length > 0) {
      const lostBets = await Bet.find({
        gameId: this.currentGameId,
        userId: { $in: lostUserIds },
        status: 'active',
      });

      const bulkOps = lostBets.map((bet) => ({
        updateOne: {
          filter: { _id: bet._id },
          update: { $set: { status: 'lost', profit: -bet.amount } },
        },
      }));
      if (bulkOps.length) await Bet.bulkWrite(bulkOps);

      const lossUpdates = lostBets.map((bet) =>
        User.findByIdAndUpdate(bet.userId, { $inc: { totalLost: bet.amount } })
      );
      await Promise.all(lossUpdates);
    }

    await Game.findOneAndUpdate(
      { gameId: this.currentGameId },
      {
        status: 'crashed',
        crashedAt: new Date(),
        revealedCrashPoint: finalCrashPoint,
      }
    );

    this.history.unshift({
      gameId: this.currentGameId,
      serverSeed: this.serverSeed,
      clientSeed: this.clientSeed,
      crashPoint: finalCrashPoint,
      crashedAt: new Date(),
    });
    if (this.history.length > 20) this.history.pop();

    console.log(`💥 Game ${this.currentGameId} crashed at ${finalCrashPoint}x`);

    this.io.emit('game:crashed', {
      crashPoint: finalCrashPoint,
      serverSeed: this.serverSeed,
      clientSeed: this.clientSeed,
      gameId: this.currentGameId,
      history: this.history.slice(0, 10),
    });

    this.activeBets.clear();
    setTimeout(() => this._runWaitingPhase(), CRASH_PHASE_MS);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  async _processCashout(userId, betData, exactMultiplier) {
    if (!this.activeBets.has(userId)) return { success: false, message: 'Already cashed out' };

    this.activeBets.delete(userId);

    const cashoutMultiplier = parseFloat(exactMultiplier.toFixed(2));
    const winAmount = parseFloat((betData.amount * cashoutMultiplier).toFixed(2));
    const profit = parseFloat((winAmount - betData.amount).toFixed(2));

    await Bet.findByIdAndUpdate(betData.betId, {
      status: 'cashedout',
      cashedOutAt: cashoutMultiplier,
      profit,
    });

    const user = await User.findByIdAndUpdate(
      betData.userId,
      { $inc: { balance: winAmount, totalWon: winAmount } },
      { new: true }
    );

    await Transaction.create({
      userId: betData.userId,
      type: 'win',
      amount: winAmount,
      balanceBefore: user.balance - winAmount,
      balanceAfter: user.balance,
      reference: this.currentGameId,
      description: `Cashed out at ${cashoutMultiplier}x in game ${this.currentGameId}`,
    });

    this.io.to(userId).emit('bet:cashedout', {
      betId: betData.betId,
      multiplier: cashoutMultiplier,
      profit,
      winAmount,
      balance: user.balance,
    });

    this.io.emit('player:cashedout', {
      username: betData.username,
      multiplier: cashoutMultiplier,
      amount: betData.amount,
      profit,
    });

    return { success: true, multiplier: cashoutMultiplier, profit, balance: user.balance };
  }

  _calculateMultiplier(elapsedMs) {
    if (elapsedMs < 0) return 1.0;
    return Math.E ** (0.00006 * elapsedMs);
  }

  async _loadHistory() {
    try {
      const recent = await Game.find({ status: 'crashed' })
        .sort({ createdAt: -1 })
        .limit(20)
        .select('gameId revealedCrashPoint crashedAt serverSeed clientSeed');

      this.history = recent.map((g) => ({
        gameId: g.gameId,
        serverSeed: g.serverSeed,
        clientSeed: g.clientSeed,
        crashPoint: g.revealedCrashPoint,
        crashedAt: g.crashedAt,
      }));

      console.log(`📜 Loaded ${this.history.length} historical games`);
    } catch (err) {
      console.error('Failed to load history:', err.message);
    }
  }

  getPublicState() {
    return {
      status: this.state,
      gameId: this.currentGameId,
      startTime: this.startTime,
      serverSeedHash: this.serverSeedHash,
      history: this.history.slice(0, 10),
      activeBetsCount: this.activeBets.size,
    };
  }

  getActiveBetsList() {
    const list = [];
    for (const [, bet] of this.activeBets) {
      list.push({
        username: bet.username,
        amount: bet.amount,
        autoCashout: bet.autoCashout,
      });
    }
    return list;
  }
}

module.exports = GameEngine;
