const { Schema, model } = require("mongoose");
const serverSchema = new Schema({
  guildId: { type: String, required: true },
  ownerDiscordId: { type: String, required: true },
  twitterUrl: { type: String },
  category: String,
  announcementChannelId: { type: String, required: false },
  botConfig: {
    enabled: { type: Boolean },
    prefix: { type: String },
    adminRoles: {
      type: [String],
      default: [],
    },
    channels: {
      hypeLogs: { type: String },
      missionsHall: { type: String },
      stadium: { type: String },
      hyperMarket: { type: String },
      myBag: { type: String },
      hyperNotes: { type: String },
      raffles: { type: String },
    },
    chats: {
      channels: {
        type: [String],
        default: [],
      },
      cooldown: { type: Number, default: 0 },
      points: { type: Number, default: 0 },
    },
    reactions: {
      channels: {
        type: [String],
        default: [],
      },
      cooldown: { type: Number, default: 0 },
      points: { type: Number, default: 0 },
    },
  },
  pointsSystem: {
    name: { type: String },
    exchangeRate: { type: Number },
    actions: {
      like: { type: Number },
      retweet: { type: Number },
      comment: { type: Number },
      space: { type: Number },
      reaction: { type: Number },
      messagePoints: { type: Number },
    },
  },
  subscription: {
    tier: { type: String, enum: ["Free", "Gold", "Diamond", "Platinum"] },
    startDate: { type: Date },
    endDate: { type: Date },
    autoRenew: { type: Boolean },
  },
  analytics: {
    rating: { type: String, enum: ["S", "A", "B", "C", "D"] },
    rank: { type: Number },
    isTop10: { type: Boolean },
    metrics: {
      activeUsers: { type: Number },
      messageCount: { type: Number },
      taskCompletion: { type: Number },
      pointsUsage: { type: Number },
      chatHealth: { type: Number },
    },
  },
  shop: [{ type: Schema.Types.ObjectId, ref: "ShopItem" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = model("Guilds", serverSchema);
