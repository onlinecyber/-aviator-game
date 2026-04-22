const express = require('express');
const router  = express.Router();
const { getBalance, getDepositInfo, requestDeposit, requestWithdraw, getTransactions } =
  require('../controllers/walletController');
const { protect } = require('../middleware/auth');
const rateLimit   = require('express-rate-limit');

const walletLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many wallet requests' },
});

router.get('/balance',          protect, getBalance);
router.get('/deposit/info',     protect, getDepositInfo);
router.post('/deposit/request', protect, walletLimiter, requestDeposit);
router.post('/withdraw/request',protect, walletLimiter, requestWithdraw);
router.get('/transactions',     protect, getTransactions);

module.exports = router;
