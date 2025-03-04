const { Schema, model } = require("mongoose");
const serverSchema = new Schema({
  guildId: { type: String, required: true },
  guildName: { type: String, required: true },
  guildIconURL: String,
  twitterUrl: { type: String },
  category: String,
  userCategory: String,
  botConfig: {
    enabled: { type: Boolean },
    prefix: { type: String },
    adminRoles: {
      type: [],
      default: [],
    },
    channels: {
      hypeLogs: { type: String },
      missionsHall: { type: String },
      stadium: { type: String },
      hyperMarket: { type: String },
      hyperNotes: { type: String },
      raffles: { type: String },
    },
    userChannels: {
      events: { type: String },
      myBag: { type: String },
      raffles: { type: String },
      shop: { type: String },
      auctions: { type: String },
    },
    chats: {
      channelId: {
        type: String,
      },
      channelName : {
        type: String,
      },
      cooldown: { type: Number, default: 0 },
      points: { type: Number, default: 0 },
    },
    reactions: {
      channelId: {
        type: String,
      },
      channelName: { type: String},
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
  analytics:{type: new Schema({
    CAS: { type: Number, default: 0 }, 
    CHS: { type: Number, default: 0 },
    EAS: { type: Number, default: 0 },
    CCS: { type: Number, default: 0 },
    ERC: { type: Number, default: 0 },
    vault: { type: Number, default: 0 },
    reservedPoints: { type: Number, default: 0 },
  }), default:()=> ({})
},
  shop: [{ type: Schema.Types.ObjectId, ref: "ShopItem" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = model("Guilds", serverSchema);
