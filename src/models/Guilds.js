const { Schema, model } = require("mongoose");

const schema = new Schema({
  guildId: String,
  channels: { type: Object, default: {} },
  category: String,
});

module.exports = model("Guilds", schema);
