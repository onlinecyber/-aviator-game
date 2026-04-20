const { v4: uuidv4 } = require('uuid');
const Game = require('../models/Game');
const Bet = require('../models/Bet');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { generateCrashPoint, generateSeed } = require('../utils/rng');
const {
  BETTING_PHASE_MS,
  CRASH_PHASE_MS,
  TICK_INTERVAL_MS,
  MAX_BET_AMOUNT,
  MIN_BET_AMOUNT,
} = require('../config/constants');

class GameEngine {
  constructor(io) {
    this.io = io;
    this.state = 'WAITING'; // 'WAITING' | 'RUNNING' | 'CRASHED'
    this.currentGame = null;
    this.currentGameId = null;
    this.crashPoint = null;

    // Runtime state during a round
    this.multiplier = 1.0;
    this.startTime = null;
    this.tickInterval = null;

    // Map of userId -> bet object (for fast lookup during ticks)
    this.activeBets = new Map();

    // Last 10 crash results for history bar
    this.history = [];
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  async start() {
    await this._loadHistory();
    console.log('🚀 Game Engine started');
    this._runWaitingPhase();
  }

  /**
   * Place a bet — called by socket handler
   * Returns: { success, bet, message }
   */
  async placeBet(userId, username, amount, autoCashout = null) {
    if (this.state !== 'WAITING') {
      return { success: false, message: 'Betting is closed for this round' };
    }

    if (!amount || amount < MIN_BET_AMOUNT || amount > MAX_BET_AMOUNT) {
      return { success: false, message: `Bet must be between ${MIN_BET_AMOUNT} and ${MAX_BET_AMOUNT}` };
    }

    // Check for duplicate bet
    if (this.activeBets.has(userId.toString())) {
      return { success: false, message: 'You already placed a bet this round' };
    }

    // Atomically deduct balance
    const user = await User.findOneAndUpdate(
      { _id: userId, balance: { $gte: amount } },
      { $inc: { balance: -amount } },
      { new: true }
    );

    if (!user) {
      return { success: false, message: 'Insufficient balance' };
    }

    // Create bet record
    const bet = await Bet.create({
      gameId: this.currentGameId,
      userId,
      username,
      amount,
      autoCashout: autoCashout || null,
      status: 'active',
    });

    // Create transaction record
    await Transaction.create({
      userId,
      type: 'bet',
      amount: -amount,
      balanceBefore: user.balance + amount,
      balanceAfter: user.balance,
      reference: this.currentGameId,
      description: `Bet placed in game ${this.currentGameId}`,
    });

    // Update game totals
    await Game.findOneAndUpdate(
      { gameId: this.currentGameId },
      { $inc: { totalBetAmount: amount, playerCount: 1 } }
    );

    // Cache in memory
    this.activeBets.set(userId.toString(), {
      betId: bet._id.toString(),
      userId: userId.toString(),
      username,
      amount,
      autoCashout,
    });

    // Update user stats
    await User.findByIdAndUpdate(userId, { $inc: { totalBets: 1 } });

    return { success: true, bet, balance: user.balance };
  }

  /**
   * Cash out — called by socket handler
   * Returns: { success, multiplier, profit, message }
   */
  async cashout(userId) {
    if (this.state !== 'RUNNING') {
      return { success: false, message: 'Game is not running' };
    }

    const betData = this.activeBets.get(userId.toString());
    if (!betData) {
      return { success: false, message: 'No active bet found' };
    }

    return await this._processCashout(userId.toString(), betData, this.multiplier);
  }

  // ─── Internal Phases ──────────────────────────────────────────────────────

  _runWaitingPhase() {
    this.state = 'WAITING';
    this.multiplier = 1.0;
    this.activeBets.clear();

    const serverSeed = generateSeed(32);
    const clientSeed = generateSeed(8);
    this.crashPoint = generateCrashPoint(serverSeed, clientSeed);
    this.currentGameId = uuidv4();

    // Persist game (crashPoint hidden via schema select:false)
    Game.create({
      gameId: this.currentGameId,
      serverSeed,
      clientSeed,
      crashPoint: this.crashPoint,
      status: 'waiting',
    }).catch((err) => console.error('Game create error:', err));

    console.log(`🎮 Game ${this.currentGameId} | Crash: ${this.crashPoint}x (hidden)`);

    this.io.emit('game:state', {
      status: 'WAITING',
      gameId: this.currentGameId,
      multiplier: 1.0,
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

    this.io.emit('game:state', {
      status: 'RUNNING',
      gameId: this.currentGameId,
      multiplier: 1.0,
    });

    this.tickInterval = setInterval(() => this._tick(), TICK_INTERVAL_MS);
  }

  async _tick() {
    const elapsed = Date.now() - this.startTime;
    this.multiplier = this._calculateMultiplier(elapsed);

    // Process auto-cashouts
    const cashoutPromises = [];
    for (const [userId, bet] of this.activeBets) {
      if (bet.autoCashout && this.multiplier >= bet.autoCashout) {
        cashoutPromises.push(this._processCashout(userId, bet, bet.autoCashout));
      }
    }
    if (cashoutPromises.length > 0) {
      await Promise.all(cashoutPromises);
    }

    // Check crash condition
    if (this.multiplier >= this.crashPoint) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
      await this._crash();
      return;
    }

    // Broadcast tick
    this.io.emit('game:tick', {
      multiplier: parseFloat(this.multiplier.toFixed(2)),
      elapsed,
    });
  }

  async _crash() {
    this.state = 'CRASHED';
    const finalCrashPoint = parseFloat(this.crashPoint.toFixed(2));

    // Mark all remaining active bets as lost
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

      // Update user stats for losses
      const lossUpdates = lostBets.map((bet) =>
        User.findByIdAndUpdate(bet.userId, { $inc: { totalLost: bet.amount } })
      );
      await Promise.all(lossUpdates);
    }

    // Update game record with revealed crash point
    await Game.findOneAndUpdate(
      { gameId: this.currentGameId },
      {
        status: 'crashed',
        crashedAt: new Date(),
        revealedCrashPoint: finalCrashPoint,
      }
    );

    // Add to history
    this.history.unshift({
      gameId: this.currentGameId,
      crashPoint: finalCrashPoint,
      crashedAt: new Date(),
    });
    if (this.history.length > 20) this.history.pop();

    console.log(`💥 Game ${this.currentGameId} crashed at ${finalCrashPoint}x`);

    this.io.emit('game:crashed', {
      crashPoint: finalCrashPoint,
      gameId: this.currentGameId,
      history: this.history.slice(0, 10),
    });

    this.activeBets.clear();

    // Start next round after delay
    setTimeout(() => this._runWaitingPhase(), CRASH_PHASE_MS);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  async _processCashout(userId, betData, multiplier) {
    if (!this.activeBets.has(userId)) return { success: false, message: 'Already cashed out' };

    this.activeBets.delete(userId);

    const cashoutMultiplier = parseFloat(multiplier.toFixed(2));
    const winAmount = parseFloat((betData.amount * cashoutMultiplier).toFixed(2));
    const profit = parseFloat((winAmount - betData.amount).toFixed(2));

    // Update bet record
    await Bet.findByIdAndUpdate(betData.betId, {
      status: 'cashedout',
      cashedOutAt: cashoutMultiplier,
      profit,
    });

    // Credit winnings
    const user = await User.findByIdAndUpdate(
      betData.userId,
      { $inc: { balance: winAmount, totalWon: winAmount } },
      { new: true }
    );

    // Create win transaction
    await Transaction.create({
      userId: betData.userId,
      type: 'win',
      amount: winAmount,
      balanceBefore: user.balance - winAmount,
      balanceAfter: user.balance,
      reference: this.currentGameId,
      description: `Cashed out at ${cashoutMultiplier}x in game ${this.currentGameId}`,
    });

    // Emit to the specific user
    this.io.to(userId).emit('bet:cashedout', {
      betId: betData.betId,
      multiplier: cashoutMultiplier,
      profit,
      winAmount,
      balance: user.balance,
    });

    // Broadcast to all (for active bets list)
    this.io.emit('player:cashedout', {
      username: betData.username,
      multiplier: cashoutMultiplier,
      amount: betData.amount,
      profit,
    });

    return { success: true, multiplier: cashoutMultiplier, profit, balance: user.balance };
  }

  _calculateMultiplier(elapsedMs) {
    // Exponential growth formula — starts 1.00x, grows faster over time
    // At 1s → ~1.006x, 5s → ~1.03x, 15s → ~2.45x, 30s → ~6x, 60s → ~36x
    return Math.E ** (0.00006 * elapsedMs);
  }

  async _loadHistory() {
    try {
      const recent = await Game.find({ status: 'crashed' })
        .sort({ createdAt: -1 })
        .limit(20)
        .select('gameId revealedCrashPoint crashedAt');

      this.history = recent.map((g) => ({
        gameId: g.gameId,
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
      multiplier: parseFloat((this.multiplier || 1.0).toFixed(2)),
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
