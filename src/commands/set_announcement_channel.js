const { PermissionsBitField, ChannelType } = require("discord.js");
const { handleInteractionError } = require("../utils/interaction");
const { CommandType } = require("wokcommands");
const Guilds = require("../models/Guilds");

module.exports = {
  description: "Set the announcement channel for the server",
  type: CommandType.SLASH,

  options: [
    {
      name: "channel",
      type: 7, // CHANNEL type
      description: "Select the announcement channel",
      required: true,
    },
  ],

  callback: async ({ interaction }) => {
    try {
      await interaction.deferReply({ ephemeral: true });

      const channel = interaction.options.getChannel("channel");
      const guildId = interaction.guildId;

      // Update or create guild configuration
      const updatedGuild = await Guilds.findOneAndUpdate(
        { guildId },
        {
          $set: {
            announcementChannelId: channel.id,
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );

      try {
        await channel.send({
          content: "🎉 This channel has been set as the announcement channel!",
          flags: ["SuppressNotifications"],
        });
      } catch (error) {
        await interaction.editReply({
          content:
            "⚠️ Warning: The bot might not have permission to send messages in this channel. Please check the channel permissions.",
          ephemeral: true,
        });
        return;
      }

      await interaction.editReply({
        content: `✅ Successfully set ${channel} as the announcement channel!`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error in setAnnouncementChannel command:", error);
      await handleInteractionError(error, interaction);
    }
  },
};
