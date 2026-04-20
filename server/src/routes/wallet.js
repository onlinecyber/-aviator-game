const express = require('express');
const router = express.Router();
const { getBalance, deposit, withdraw, getTransactions } = require('../controllers/walletController');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const walletLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many wallet requests' },
});

router.get('/balance', protect, getBalance);
router.post('/deposit', protect, walletLimiter, deposit);
router.post('/withdraw', protect, walletLimiter, withdraw);
router.get('/transactions', protect, getTransactions);

module.exports = router;
