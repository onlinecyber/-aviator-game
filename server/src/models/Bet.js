const mongoose = require('mongoose');

const betSchema = new mongoose.Schema(
  {
    gameId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    username: { type: String, required: true },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Minimum bet is 1'],
    },
    autoCashout: {
      type: Number, // Multiplier to auto-cashout at (null = manual)
      default: null,
      min: [1.01, 'Auto-cashout must be > 1.01'],
    },
    status: {
      type: String,
      enum: ['active', 'cashedout', 'lost'],
      default: 'active',
    },
    cashedOutAt: { type: Number, default: null }, // Multiplier at cashout
    profit: { type: Number, default: 0 },         // Net profit (negative if lost)
  },
  { timestamps: true }
);

// Prevent duplicate bets in the same game
betSchema.index({ gameId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Bet', betSchema);
