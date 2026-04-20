const User = require('../models/User');
const Transaction = require('../models/Transaction');

const MAX_DEPOSIT = 1000000;
const MIN_DEPOSIT = 10;
const MAX_WITHDRAW = 500000;
const MIN_WITHDRAW = 50;

/**
 * Deposit funds to a user account
 */
const deposit = async (userId, amount) => {
  amount = parseFloat(amount);

  if (!amount || amount < MIN_DEPOSIT || amount > MAX_DEPOSIT) {
    throw new Error(`Deposit must be between ${MIN_DEPOSIT} and ${MAX_DEPOSIT}`);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { balance: amount } },
    { new: true }
  );

  if (!user) throw new Error('User not found');

  await Transaction.create({
    userId,
    type: 'deposit',
    amount,
    balanceBefore: user.balance - amount,
    balanceAfter: user.balance,
    description: `Manual deposit of ${amount}`,
    status: 'completed',
  });

  return { balance: user.balance };
};

/**
 * Withdraw — creates PENDING transaction for admin approval.
 * Balance is held (deducted) immediately until approved/rejected.
 */
const withdraw = async (userId, amount) => {
  amount = parseFloat(amount);

  if (!amount || amount < MIN_WITHDRAW || amount > MAX_WITHDRAW) {
    throw new Error(`Withdrawal must be between ${MIN_WITHDRAW} and ${MAX_WITHDRAW}`);
  }

  const user = await User.findOneAndUpdate(
    { _id: userId, balance: { $gte: amount } },
    { $inc: { balance: -amount } },
    { new: true }
  );

  if (!user) throw new Error('Insufficient balance');

  await Transaction.create({
    userId,
    type: 'withdraw',
    amount: -amount,
    balanceBefore: user.balance + amount,
    balanceAfter: user.balance,
    description: `Withdrawal request of ₹${amount} — pending admin approval`,
    status: 'pending',
  });

  return { balance: user.balance, message: 'Withdrawal request submitted. Awaiting admin approval.' };
};

/**
 * Get user transaction history
 */
const getTransactions = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [transactions, total] = await Promise.all([
    Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Transaction.countDocuments({ userId }),
  ]);
  return { transactions, total, page, pages: Math.ceil(total / limit) };
};

module.exports = { deposit, withdraw, getTransactions };
