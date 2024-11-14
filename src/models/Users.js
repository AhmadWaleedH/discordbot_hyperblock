const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  discordId: { type: String, required: true },
  walletAddress: { type: String },
  hyperBlockPoints: { type: Number },
  status: { type: String, enum: ["active", "inactive", "banned"] },
  socialAccounts: {
    twitter: {
      id: { type: String },
      username: { type: String },
      profileUrl: { type: String },
    },
  },
  mintWallets: {
    ethereum: { type: String },
    solana: { type: String },
  },
  serverMemberships: [
    {
      guildId: { type: String, required: true },
      joinedAt: { type: Date },
      points: { type: Number },
      activeRaids: { type: Number },
      completedTasks: { type: Number },
    },
  ],
  purchases: [
    {
      itemId: { type: Schema.Types.ObjectId, ref: "ShopItem", required: true },
      purchaseDate: { type: Date, default: Date.now },
      totalPrice: { type: Number, required: true },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastActive: { type: Date },
});

module.exports = mongoose.model("User", userSchema);
