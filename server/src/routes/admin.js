const express = require('express');
const router  = express.Router();
const {
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
} = require('../controllers/adminController');
const { protect }    = require('../middleware/auth');
const { adminOnly }  = require('../middleware/adminAuth');

router.use(protect, adminOnly);

// Stats
router.get('/stats', getStats);

// Users
router.get('/users',                getUsers);
router.patch('/users/:id/balance',  adjustBalance);
router.patch('/users/:id/status',   toggleUserStatus);

// Deposits (UTR verification)
router.get('/deposits',                  getDeposits);
router.patch('/deposits/:id/approve',    approveDeposit);
router.patch('/deposits/:id/reject',     rejectDeposit);

// Withdrawals
router.get('/withdrawals',               getWithdrawals);
router.patch('/withdrawals/:id/approve', approveWithdrawal);
router.patch('/withdrawals/:id/reject',  rejectWithdrawal);

// Game rounds
router.get('/games',        getGameRounds);

// Transactions
router.get('/transactions', getTransactions);

// Settings
router.get('/settings/payment', getPaymentSettings);
router.put('/settings/payment', updatePaymentSettings);

module.exports = router;
