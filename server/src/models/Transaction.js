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
    balanceAfter:  { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'rejected'],
      default: 'completed',
    },
    reference:   { type: String, default: null },
    description: { type: String, default: '' },

    /* ── Deposit specific ── */
    utrNumber:     { type: String, default: null },   // UTR / transaction ID from user
    paymentMethod: { type: String, default: null },   // UPI / NEFT / IMPS / Bank
    paymentProof:  { type: String, default: null },   // screenshot URL (future)

    /* ── Withdraw specific ── */
    withdrawMethod: { type: String, default: null },  // 'upi' | 'bank'
    upiId:          { type: String, default: null },
    bankAccount:    { type: String, default: null },
    bankIfsc:       { type: String, default: null },
    bankName:       { type: String, default: null },
    accountHolder:  { type: String, default: null },

    /* ── Admin fields ── */
    adminNote:      { type: String, default: null },
    rejectionReason:{ type: String, default: null },
    approvedAt:     { type: Date,   default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
