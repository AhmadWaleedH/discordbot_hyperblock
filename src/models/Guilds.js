const { Schema, model } = require("mongoose");

const pointsSchema = new Schema({
  follow: {
    type: Number,
    required: true,
    min: 0,
    max: 1000,
    default: 0,
  },
  likes: {
    type: Number,
    required: true,
    min: 0,
    max: 1000,
    default: 0,
  },
  comment: {
    type: Number,
    required: true,
    min: 0,
    max: 1000,
    default: 0,
  },
  retweet: {
    type: Number,
    required: true,
    min: 0,
    max: 1000,
    default: 0,
  },
  announcement_reaction: {
    type: Number,
    required: true,
    min: 0,
    max: 1000,
    default: 0,
  },
  chat: {
    type: Number,
    required: true,
    min: 0,
    max: 1000,
    default: 0,
  },
});
const schema = new Schema({
  guildId: String,
  channels: { type: Object, default: {} },
  points: {
    type: pointsSchema,
    default: () => ({}),
  },
  category: String,
});

module.exports = model("Guilds", schema);
