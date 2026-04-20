const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema(
  {
    gameId: {
      type: String,
      required: true,
      unique: true,
    },
    serverSeed: {
      type: String,
      required: true,
      select: false, // Never expose server seed during game
    },
    clientSeed: {
      type: String,
      required: true,
    },
    crashPoint: {
      type: Number,
      required: true,
      select: false, // Never expose crash point until game ends
    },
    revealedCrashPoint: {
      type: Number, // Set after crash — safe to expose
      default: null,
    },
    status: {
      type: String,
      enum: ['waiting', 'running', 'crashed'],
      default: 'waiting',
    },
    startedAt: { type: Date, default: null },
    crashedAt: { type: Date, default: null },
    totalBetAmount: { type: Number, default: 0 },
    totalCashoutAmount: { type: Number, default: 0 },
    playerCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Game', gameSchema);
