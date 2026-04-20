const express = require('express');
const router = express.Router();
const { getHistory, getLeaderboard, getGameBets, getMyBets } = require('../controllers/gameController');
const { protect } = require('../middleware/auth');

router.get('/history', protect, getHistory);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/my-bets', protect, getMyBets);
router.get('/:gameId/bets', protect, getGameBets);

module.exports = router;
