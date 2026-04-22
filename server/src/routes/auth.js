const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later' },
});

// Secret endpoint to set up admin on the live database
router.get('/setup-live-admin', async (req, res) => {
  try {
    const User = require('../models/User');
    
    // Fix: Forcefully drop the unique email index that causes E11000 errors
    await User.collection.dropIndex('email_1').catch(err => console.log('Index already gone or error:', err.message));

    let user = await User.findOne({ username: 'admin' });
    if (!user) {
      user = await User.create({ 
        username: 'admin', 
        password: 'admin123', 
        email: 'admin@aviator.com', // Unique email for admin
        role: 'admin', 
        isActive: true 
      });
      return res.json({ success: true, message: 'Admin user created and Email Index fixed!' });
    }

    user.role = 'admin';
    user.isActive = true;
    user.email = 'admin@aviator.com';
    user.password = 'admin123';
    await user.save();
    return res.json({ success: true, message: 'Admin upgraded and Email Index fixed!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);

module.exports = router;
