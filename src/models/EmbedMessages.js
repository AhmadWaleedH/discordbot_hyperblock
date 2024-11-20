const mongoose = require("mongoose");

const embedMessageSchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      required: true,
    },
    guildId: {
      type: String,
      required: true,
    },
    channelId: {
      type: String,
      required: true,
    },
    messageId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("EmbedMessage", embedMessageSchema);
