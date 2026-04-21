/**
 * Fix Script: Drop the broken email_1 unique index
 * Run with: node server/scripts/fixEmailIndex.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function fixEmailIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // List existing indexes
    const indexes = await collection.indexes();
    console.log('\nExisting indexes:');
    indexes.forEach(idx => console.log(' -', idx.name, JSON.stringify(idx)));

    // Drop the bad email_1 index if it exists
    const emailIndexExists = indexes.find(i => i.name === 'email_1');
    if (emailIndexExists) {
      await collection.dropIndex('email_1');
      console.log('\n✅ Dropped old email_1 index');
    } else {
      console.log('\n⚠️  email_1 index not found — may already be fixed');
    }

    // Recreate it correctly with sparse: true
    await collection.createIndex(
      { email: 1 },
      { unique: true, sparse: true, name: 'email_1' }
    );
    console.log('✅ Recreated email_1 index with sparse: true');
    console.log('\n🎉 Done! Users can now register without an email.\n');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixEmailIndex();
