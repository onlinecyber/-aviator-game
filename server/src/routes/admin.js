const express = require('express');
const router = express.Router();
const {
  getStats,
  getUsers,
  adjustBalance,
  toggleUserStatus,
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getGameRounds,
  getTransactions,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');

router.use(protect, adminOnly);

// Stats
router.get('/stats', getStats);

// Users
router.get('/users', getUsers);
router.patch('/users/:id/balance', adjustBalance);
router.patch('/users/:id/status', toggleUserStatus);

// Withdrawals
router.get('/withdrawals', getWithdrawals);
router.patch('/withdrawals/:id/approve', approveWithdrawal);
router.patch('/withdrawals/:id/reject', rejectWithdrawal);

// Game rounds
router.get('/games', getGameRounds);

// Transactions
router.get('/transactions', getTransactions);

module.exports = router;
