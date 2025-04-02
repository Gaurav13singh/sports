const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ [Database] MongoDB Connected Successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ [Database] MongoDB Connection Failed: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;