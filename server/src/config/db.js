const mongoose = require('mongoose');

const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      retries++;
      console.error(`❌ MongoDB connection attempt ${retries} failed: ${error.message}`);
      if (retries < maxRetries) {
        console.log(`   Retrying in 3 seconds...`);
        await new Promise((res) => setTimeout(res, 3000));
      } else {
        console.error('   Max retries reached. Exiting.');
        process.exit(1);
      }
    }
  }
};

module.exports = connectDB;
