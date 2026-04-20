/**
 * Run this once to create the admin account:
 *   node scripts/createAdmin.js
 */
require('dotenv').config({ path: '../.env' })
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aviator'

async function createAdmin() {
  await mongoose.connect(MONGO_URI)

  const User = require('../src/models/User')

  const existing = await User.findOne({ email: 'admin@aviator.com' })
  if (existing) {
    console.log('❌ Admin already exists:', existing.email)
    await mongoose.disconnect()
    return
  }

  const admin = await User.create({
    username: 'admin',
    email: 'admin@aviator.com',
    password: 'admin123',
    role: 'admin',
    balance: 999999,
  })

  console.log('✅ Admin created successfully!')
  console.log('   Email:   admin@aviator.com')
  console.log('   Password: admin123')
  console.log('   ⚠️  Change this password before production deployment!')

  await mongoose.disconnect()
}

createAdmin().catch((err) => {
  console.error(err)
  process.exit(1)
})
