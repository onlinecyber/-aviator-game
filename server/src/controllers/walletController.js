const User = require('../models/User');
const walletService = require('../services/walletService');

// @route  GET /api/wallet/balance
const getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('balance');
    res.json({ success: true, balance: user.balance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route  POST /api/wallet/deposit
const deposit = async (req, res) => {
  try {
    const { amount } = req.body;
    const result = await walletService.deposit(req.user._id, amount);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @route  POST /api/wallet/withdraw
const withdraw = async (req, res) => {
  try {
    const { amount } = req.body;
    const result = await walletService.withdraw(req.user._id, amount);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @route  GET /api/wallet/transactions
const getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await walletService.getTransactions(req.user._id, page, limit);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getBalance, deposit, withdraw, getTransactions };
