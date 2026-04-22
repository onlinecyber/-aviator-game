const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Bet = require('../models/Bet');
const Game = require('../models/Game');
const Setting = require('../models/Setting');

// @route GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalGames,
      pendingWithdrawals,
      revenueAgg,
      payoutAgg,
      todayBetsAgg,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', isActive: true }),
      Game.countDocuments({ status: 'crashed' }),
      Transaction.countDocuments({ type: 'withdraw', status: 'pending' }),
      // Total money bet
      Transaction.aggregate([
        { $match: { type: 'bet' } },
        { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } },
      ]),
      // Total payouts (wins)
      Transaction.aggregate([
        { $match: { type: 'win' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Today's bets
      Transaction.aggregate([
        {
          $match: {
            type: 'bet',
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        },
        { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } },
      ]),
    ]);

    const totalBet = revenueAgg[0]?.total || 0;
    const totalPayout = payoutAgg[0]?.total || 0;
    const houseProfit = totalBet - totalPayout;

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        bannedUsers: totalUsers - activeUsers,
        totalGames,
        pendingWithdrawals,
        totalBet,
        totalPayout,
        houseProfit,
        todayBets: todayBetsAgg[0]?.total || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const filter = req.query.filter || 'all'; // all | active | banned

    let query = {};
    if (search) {
      query.$or = [
        { username: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }
    if (filter === 'active') query.isActive = true;
    if (filter === 'banned') query.isActive = false;
    query.role = 'user';

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password'),
      User.countDocuments(query),
    ]);

    res.json({ success: true, users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/admin/users/:id/balance
const adjustBalance = async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const parsedAmount = parseFloat(amount);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $inc: { balance: parsedAmount } },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await Transaction.create({
      userId: req.params.id,
      type: parsedAmount >= 0 ? 'deposit' : 'withdraw',
      amount: parsedAmount,
      balanceBefore: user.balance - parsedAmount,
      balanceAfter: user.balance,
      description: `Admin adjustment: ${reason || 'No reason provided'}`,
      status: 'completed',
    });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/admin/users/:id/status  (ban/unban)
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, isActive: user.isActive, username: user.username });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/admin/withdrawals?status=pending
const getWithdrawals = async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const [withdrawals, total] = await Promise.all([
      Transaction.find({ type: 'withdraw', status })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username email balance')
        .lean(),
      Transaction.countDocuments({ type: 'withdraw', status }),
    ]);

    res.json({ success: true, withdrawals, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/admin/deposits?status=pending
const getDeposits = async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const page   = parseInt(req.query.page) || 1;
    const limit  = 20;
    const skip   = (page - 1) * limit;

    const [deposits, total] = await Promise.all([
      Transaction.find({ type: 'deposit', status })
        .sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate('userId', 'username email balance').lean(),
      Transaction.countDocuments({ type: 'deposit', status }),
    ]);

    res.json({ success: true, deposits, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/admin/deposits/:id/approve  — credits balance to user
const approveDeposit = async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx || tx.type !== 'deposit')
      return res.status(404).json({ success: false, message: 'Deposit not found' });
    if (tx.status !== 'pending')
      return res.status(400).json({ success: false, message: 'Already processed' });

    // Credit balance
    const user = await User.findByIdAndUpdate(
      tx.userId,
      { $inc: { balance: tx.amount } },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    tx.status      = 'completed';
    tx.balanceAfter = user.balance;
    tx.approvedAt  = new Date();
    tx.adminNote   = req.body.note || 'Approved by admin';
    await tx.save();

    res.json({ success: true, message: `Deposit of ₹${tx.amount} approved for ${user.username}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/admin/deposits/:id/reject
const rejectDeposit = async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx || tx.type !== 'deposit')
      return res.status(404).json({ success: false, message: 'Deposit not found' });
    if (tx.status !== 'pending')
      return res.status(400).json({ success: false, message: 'Already processed' });

    tx.status           = 'rejected';
    tx.rejectionReason  = req.body.reason || 'Invalid UTR or payment not received';
    await tx.save();

    res.json({ success: true, message: 'Deposit rejected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/admin/withdrawals/:id/approve
const approveWithdrawal = async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (tx.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Already processed' });
    }

    tx.status      = 'completed';
    tx.approvedAt  = new Date();
    tx.adminNote   = req.body.note || 'Approved by admin';
    await tx.save();

    res.json({ success: true, message: 'Withdrawal approved — please transfer manually' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/admin/withdrawals/:id/reject
const rejectWithdrawal = async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id).populate('userId');
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (tx.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Already processed' });
    }

    // Refund the held amount back to user
    const refundAmount = Math.abs(tx.amount);
    const user = await User.findByIdAndUpdate(
      tx.userId._id,
      { $inc: { balance: refundAmount } },
      { new: true }
    );

    tx.status          = 'rejected';
    tx.rejectionReason = req.body.reason || 'Rejected by admin';
    await tx.save();

    // Create refund transaction
    await Transaction.create({
      userId:        tx.userId._id,
      type:          'refund',
      amount:        refundAmount,
      balanceBefore: user.balance - refundAmount,
      balanceAfter:  user.balance,
      description:   `Refund for rejected withdrawal — ₹${refundAmount}`,
      status:        'completed',
    });

    res.json({ success: true, message: 'Withdrawal rejected and amount refunded to user' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/admin/games
const getGameRounds = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const [games, total] = await Promise.all([
      Game.find({ status: 'crashed' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('gameId revealedCrashPoint crashedAt playerCount totalBetAmount totalCashoutAmount clientSeed createdAt'),
      Game.countDocuments({ status: 'crashed' }),
    ]);

    res.json({ success: true, games, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/admin/transactions
const getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const type = req.query.type || '';

    const query = type ? { type } : {};

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username email')
        .lean(),
      Transaction.countDocuments(query),
    ]);

    res.json({ success: true, transactions, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/admin/settings/payment
const getPaymentSettings = async (req, res) => {
  try {
    let setting = await Setting.findOne({ key: 'payment_settings' });
    if (!setting) {
      // Return default empty structure if not found
      setting = { value: { upiIds: [] } };
    }
    res.json({ success: true, settings: setting.value });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PUT /api/admin/settings/payment
const updatePaymentSettings = async (req, res) => {
  try {
    const { upiIds } = req.body;
    
    let setting = await Setting.findOne({ key: 'payment_settings' });
    if (!setting) {
      setting = new Setting({ key: 'payment_settings', value: { upiIds: [] } });
    }
    
    setting.value = { upiIds: upiIds || [] };
    setting.markModified('value');
    await setting.save();
    
    res.json({ success: true, settings: setting.value });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getStats,
  getUsers,
  adjustBalance,
  toggleUserStatus,
  getDeposits,
  approveDeposit,
  rejectDeposit,
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getGameRounds,
  getTransactions,
  getPaymentSettings,
  updatePaymentSettings,
};
