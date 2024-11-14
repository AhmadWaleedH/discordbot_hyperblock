const { ActivityType } = require("discord.js");
const { default: mongoose } = require("mongoose");

module.exports = async (client) => {
  console.log(`${client.user.tag} is online.`);
  try {
    const MONGO_URI = process.env.MONGO_URI;
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("📦 Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
  client.user.setPresence({
    activities: [
      {
        name: `Launching soon 🍾!`,
        type: ActivityType.Playing,
      },
    ],
  });
};
