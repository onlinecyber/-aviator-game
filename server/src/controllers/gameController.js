const Game = require('../models/Game');
const Bet = require('../models/Bet');
const User = require('../models/User');

// @route GET /api/games/history
const getHistory = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const games = await Game.find({ status: 'crashed' })
      .sort({ crashedAt: -1 })
      .limit(limit)
      .select('gameId revealedCrashPoint crashedAt playerCount totalBetAmount clientSeed');

    res.json({ success: true, games });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/games/leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .sort({ totalWon: -1 })
      .limit(20)
      .select('username totalWon totalBets totalLost');

    const leaderboard = users.map((u, i) => ({
      rank: i + 1,
      username: u.username,
      totalWon: u.totalWon,
      totalBets: u.totalBets,
      netProfit: u.totalWon - u.totalLost,
    }));

    res.json({ success: true, leaderboard });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/games/:gameId/bets
const getGameBets = async (req, res) => {
  try {
    const bets = await Bet.find({ gameId: req.params.gameId })
      .select('username amount cashedOutAt profit status')
      .sort({ createdAt: -1 });
    res.json({ success: true, bets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/games/my-bets
const getMyBets = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const [bets, total] = await Promise.all([
      Bet.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Bet.countDocuments({ userId: req.user._id }),
    ]);

    res.json({ success: true, bets, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getHistory, getLeaderboard, getGameBets, getMyBets };
