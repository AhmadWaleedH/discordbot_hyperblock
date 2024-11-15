const mongoose = require("mongoose");
const participantSchema = new mongoose.Schema({
  userId: { type: String, required: true },
});

const winnersSchema = new mongoose.Schema({
  userId: { type: String, required: true },
});
const giveawaySchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: false },
  messageId: { type: String, required: false },
  raffleTitle: { type: String, required: true },
  numWinners: { type: Number, required: true },
  entryCost: { type: Number, required: true },
  endTime: { type: Date, required: true },
  chain: { type: String, required: true },

  // Optional fields
  description: String,
  partnerTwitter: String,
  winnerRole: String,
  roleRequired: String,
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
