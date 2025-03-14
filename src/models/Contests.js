const mongoose = require("mongoose");

const contestSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
  },
  guildName: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  duration: {
    type: Date, // Duration in milliseconds
    required: true,
  },
  numberOfWinners: {
    type: Number,
    required: true,
    min: 1, // Ensure there is at least 1 winner
  },
  description: {
    type: String,
    required: true,
  },
  pointsForParticipants: {
    type: Number, // Flat points reward for participants
    required: true,
  },
  roleAssignedToParticipant: {
    type: String, // Role ID or name required to participate
    required: false,
  },
  roleAssignedToParticipantName: {
    type: String, // Role ID or name required to participate
    required: false,
  },
  isActive: {
    type: Boolean,
    required: false,
  },
  channelId: {
    type: String,
    required: false,
  },
  channelName: {
    type: String,
    required: false,
  },
  pointsForWinners: {
    type: [Number], // Array of points for each winner (e.g., [100, 50, 25] for 1st, 2nd, 3rd)
    required: false,
  },
  votes: [
    {
      messageId: String,
      authorId: String,
      authorName : String,
      userVotes: [
        {
          userId: String,
          userName : String,
          voteCount: { type: Number, default: 0 },
        },
      ],
    },
  ],
  deletionTime: { type: Date, default: null }, // Time to delete the channel
});

const   Contest = mongoose.model("Contest", contestSchema);

module.exports = Contest;
