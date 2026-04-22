const walletService = require('../services/walletService');

/* GET /api/wallet/balance */
const getBalance = async (req, res) => {
  try {
    const result = await walletService.getBalance(req.user._id);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET /api/wallet/deposit/info — returns UPI ID / QR for user to pay */
const getDepositInfo = async (req, res) => {
  try {
    const info = await walletService.getDepositInfo();
    res.json({ success: true, ...info });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* POST /api/wallet/deposit/request — user submits amount + UTR */
const requestDeposit = async (req, res) => {
  try {
    const { amount, utrNumber, paymentMethod } = req.body;
    const result = await walletService.requestDeposit(req.user._id, { amount, utrNumber, paymentMethod });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/* POST /api/wallet/withdraw/request — user submits amount + bank/UPI details */
const requestWithdraw = async (req, res) => {
  try {
    const result = await walletService.requestWithdraw(req.user._id, req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/* GET /api/wallet/transactions */
const getTransactions = async (req, res) => {
  try {
    const page  = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await walletService.getTransactions(req.user._id, page, limit);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getBalance, getDepositInfo, requestDeposit, requestWithdraw, getTransactions };
