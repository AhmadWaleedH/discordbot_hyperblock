const mongoose = require("mongoose");
const participantSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
});

const winnersSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
});
const giveawaySchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  guildName: { type: String, required: true },
  channelId: { type: String, required: false },
  channelName: { type: String, required: false },
  messageId: { type: String, required: false },
  raffleTitle: { type: String, required: true },
  numWinners: { type: Number, required: true },
  entryCost: { type: Number, required: true },
  startTime: { type: Date, required: false },
  endTime: { type: Date, required: false },
  chain: { type: String },

  // Optional fields
  description: String,
  partnerTwitter: [{ type: String }],
  winnerRole: String,
  winnerRoleName: String,
  roleRequired: String,
  roleRequiredName: String,
  entriesLimited: Number,
  notes: String,
  totalParticipants: { type: Number, default: 0 },
  participants: [participantSchema],
  winners: [winnersSchema],
  isExpired: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Giveaway", giveawaySchema);
