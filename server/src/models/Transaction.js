const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['deposit', 'withdraw', 'bet', 'win', 'refund'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
    reference: { type: String, default: null }, // gameId or transaction ref
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
