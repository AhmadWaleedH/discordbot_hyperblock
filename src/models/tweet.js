const mongoose = require("mongoose");

const tweetSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
      },
  tweetId: {
    type: String,
    required: true,
  },
  tweetURL: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    enum: ["like", "retweet", "like_retweet"],
    required: true,
  },
  
  timeRemaining: {
    type: Date,
    required: true,
  },
  isExpired: {
    type: Boolean,
    default: false, // Default value is false
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  participants: [
    {
      userId: { type: String, required: true },
      twitterId: { type: String, required: true },
    },
  ],
});

const Tweet = mongoose.model("Tweet", tweetSchema);

module.exports = Tweet;
