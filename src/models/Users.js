const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  discordId: { type: String, required: true },
  discordUsername: { type: String, required: true },

  discordUserAvatarURL: String,
  walletAddress: { type: String },
  hyperBlockPoints: { type: Number },
  subscription: new Schema({ tier: { type: String, default: "free" } }),
  status: { type: String, enum: ["active", "inactive", "banned"] },
  socials: {
    x: { type: String }, // x is required
    tg: { type: String }, // Optional
    yt: { type: String }, // Optional
    tiktok: { type: String }, // Optional
    ig: { type: String }, // Optional
  },
  socialAccounts: {
    twitter: {
      id: { type: String },
      username: { type: String },
      profileUrl: { type: String },
    },
  },
  mintWallets: {
    Ethereum: { type: String },
    Solana: { type: String },
    Bitcoin: { type: String },
    Binance: { type: String },
    Cardano: { type: String },
    Polygon: { type: String },
    Avalanche: { type: String },
    Tron: { type: String },
    Polkadot: { type: String },
    Ripple: { type: String },
  },
  serverMemberships: [
    {
      guildId: { type: String, required: true },
      guildName: { type: String, required: true },
      guildIcon: String,
      subscription: new Schema({ tier: { type: String, default: "free" } }),
      status: { type: String, default: "active" },
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
  activeBids: [
    {
      auctionId: { type: Schema.Types.ObjectId, ref: "Auction" },
      bidAmount: { type: Number },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastActive: { type: Date },
});

module.exports = mongoose.model("User", userSchema);
