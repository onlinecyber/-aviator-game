const User        = require('../models/User');
const Transaction = require('../models/Transaction');
const Setting     = require('../models/Setting');

const MAX_DEPOSIT  = 1000000;
const MIN_DEPOSIT  = 10;
const MAX_WITHDRAW = 500000;
const MIN_WITHDRAW = 50;

/* Our UPI ID / QR details — admin configures these */
const UPI_ID      = process.env.UPI_ID      || '';
const UPI_NAME    = process.env.UPI_NAME    || '';
const UPI_QR_URL  = process.env.UPI_QR_URL  || null;

/**
 * POST /api/wallet/deposit/request
 * User submits amount + UTR number after paying.
 * Creates a PENDING transaction — admin approves.
 */
const requestDeposit = async (userId, { amount, utrNumber, paymentMethod }) => {
  amount = parseFloat(amount);

  if (!amount || amount < MIN_DEPOSIT || amount > MAX_DEPOSIT)
    throw new Error(`Amount must be ₹${MIN_DEPOSIT} – ₹${MAX_DEPOSIT.toLocaleString()}`);

  if (!utrNumber || utrNumber.trim().length < 6)
    throw new Error('Valid UTR / Transaction ID is required');

  // Check duplicate UTR
  const exists = await Transaction.findOne({ utrNumber: utrNumber.trim(), type: 'deposit' });
  if (exists) throw new Error('This UTR number has already been submitted');

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const tx = await Transaction.create({
    userId,
    type:          'deposit',
    amount,
    balanceBefore: user.balance,
    balanceAfter:  user.balance,      // not credited yet
    status:        'pending',
    utrNumber:     utrNumber.trim(),
    paymentMethod: paymentMethod || 'UPI',
    description:   `Deposit ₹${amount} via ${paymentMethod || 'UPI'} — UTR: ${utrNumber.trim()}`,
  });

  return {
    message:  'Deposit request submitted! It will be credited within 30 minutes after verification.',
    txId:     tx._id,
    status:   'pending',
  };
};

/**
 * POST /api/wallet/withdraw/request
 * User submits amount + bank/UPI details.
 * Balance is held immediately, admin approves transfer.
 */
const requestWithdraw = async (userId, { amount, withdrawMethod, upiId, bankAccount, bankIfsc, bankName, accountHolder }) => {
  amount = parseFloat(amount);

  if (!amount || amount < MIN_WITHDRAW || amount > MAX_WITHDRAW)
    throw new Error(`Amount must be ₹${MIN_WITHDRAW} – ₹${MAX_WITHDRAW.toLocaleString()}`);

  if (withdrawMethod === 'upi') {
    if (!upiId || !upiId.includes('@'))
      throw new Error('Valid UPI ID required (e.g. name@upi)');
  } else {
    if (!bankAccount || bankAccount.length < 9) throw new Error('Valid bank account number required');
    if (!bankIfsc    || bankIfsc.length !== 11)  throw new Error('Valid IFSC code required (11 characters)');
    if (!accountHolder) throw new Error('Account holder name required');
  }

  // Deduct balance immediately (holds funds)
  const user = await User.findOneAndUpdate(
    { _id: userId, balance: { $gte: amount } },
    { $inc: { balance: -amount } },
    { new: true }
  );
  if (!user) throw new Error('Insufficient balance');

  await Transaction.create({
    userId,
    type:           'withdraw',
    amount:         -amount,
    balanceBefore:  user.balance + amount,
    balanceAfter:   user.balance,
    status:         'pending',
    withdrawMethod,
    upiId:          withdrawMethod === 'upi' ? upiId : null,
    bankAccount:    withdrawMethod === 'bank' ? bankAccount : null,
    bankIfsc:       withdrawMethod === 'bank' ? bankIfsc?.toUpperCase() : null,
    bankName:       withdrawMethod === 'bank' ? bankName : null,
    accountHolder:  withdrawMethod === 'bank' ? accountHolder : null,
    description:    `Withdrawal ₹${amount} via ${withdrawMethod?.toUpperCase()} — pending approval`,
  });

  return {
    balance: user.balance,
    message: 'Withdrawal request submitted! Processing in 24 hours.',
  };
};

/**
 * GET /api/wallet/deposit/info
 * Returns UPI details for payment from Settings (picks a random active one if multiple)
 */
const getDepositInfo = async () => {
  try {
    const setting = await Setting.findOne({ key: 'payment_settings' });
    let upiIds = setting?.value?.upiIds || [];
    let activeUpis = upiIds.filter(u => u.isActive);

    if (activeUpis.length === 0) {
      // Fallback to env variables if no active UPIs are set in admin panel
      if (!UPI_ID) throw new Error('No active UPI ID found');
      return { upiId: UPI_ID, name: UPI_NAME, qrUrl: UPI_QR_URL, minAmount: MIN_DEPOSIT, maxAmount: MAX_DEPOSIT };
    }

    // Pick a random active UPI ID
    const randomUpi = activeUpis[Math.floor(Math.random() * activeUpis.length)];
    
    return {
      upiId:   randomUpi.upiId,
      name:    randomUpi.name || 'Aviator Game',
      minAmount: MIN_DEPOSIT,
      maxAmount: MAX_DEPOSIT,
    };
  } catch (error) {
    if (!UPI_ID) throw new Error('No active UPI ID found');
    return { upiId: UPI_ID, name: UPI_NAME, qrUrl: UPI_QR_URL, minAmount: MIN_DEPOSIT, maxAmount: MAX_DEPOSIT };
  }
};

/** GET /api/wallet/balance */
const getBalance = async (userId) => {
  const user = await User.findById(userId).select('balance');
  if (!user) throw new Error('User not found');
  return { balance: user.balance };
};

/** GET /api/wallet/transactions */
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

module.exports = {
  requestDeposit,
  requestWithdraw,
  getDepositInfo,
  getBalance,
  getTransactions,
};
