/**
 * Run this script to create an admin user or promote existing user to admin.
 * Usage: node scripts/makeAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aviator';

// ── CHANGE THESE ──────────────────────────
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';
// ─────────────────────────────────────────

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB connected');

  const User = require('../src/models/User');

  // Check if admin already exists
  let user = await User.findOne({ username: ADMIN_USERNAME });

  if (user) {
    // Promote existing user to admin
    user.role     = 'admin';
    user.isActive = true;
    await user.save();
    console.log(`✅ User "${ADMIN_USERNAME}" promoted to admin!`);
  } else {
    // Create new admin user
    user = await User.create({
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
      role:     'admin',
      balance:  0,
    });
    console.log(`✅ Admin user created!`);
  }

  console.log('\n📋 Admin Credentials:');
  console.log(`   Username : ${ADMIN_USERNAME}`);
  console.log(`   Password : ${ADMIN_PASSWORD}`);
  console.log(`   URL      : http://localhost:5173/admin`);
  console.log('\n🔐 Login at http://localhost:5173/login then go to /admin\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
