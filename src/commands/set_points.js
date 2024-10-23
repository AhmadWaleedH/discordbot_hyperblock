const { PermissionsBitField, ChannelType } = require("discord.js");
const { handleInteractionError } = require("../utils/interaction");
const { CommandType } = require("wokcommands");
const Guilds = require("../models/Guilds");

module.exports = {
  description: "Setup points for different actions",
  type: CommandType.SLASH,
  permissions: PermissionsBitField.Flags.Administrator,

  options: [
    {
      name: "follow",
      type: 3,
      description: "Set points for following someone (0-1000)",
      required: false,
    },
    {
      name: "likes",
      type: 3,
      description: "Set points for liking tweet (0-1000)",
      required: false,
    },
    {
      name: "comment",
      type: 3,
      description: "Set points for commenting on tweet (0-1000)",
      required: false,
    },
    {
      name: "retweet",
      type: 3,
      description: "Set points for RT the tweet (0-1000)",
      required: false,
    },
    {
      name: "announcement_reaction",
      type: 3,
      description: "Set points for reacting to announcement (0-1000)",
      required: false,
    },
    {
      name: "chat",
      type: 3,
      description: "Set points for chat (0-1000)",
      required: false,
    },
  ],

  callback: async ({ interaction }) => {
    try {
      await interaction.deferReply({ ephemeral: true });

      const guildId = interaction.guildId;
      const updates = {};
      let updateMade = false;
      for (const option of interaction.options.data) {
        const points = parseInt(option.value);

        if (isNaN(points)) {
          await interaction.editReply({
            content: `Invalid point value for ${option.name}. Please use numbers only.`,
            ephemeral: true,
          });
          return;
        }

        if (points < 0 || points > 1000) {
          await interaction.editReply({
            content: `Points for ${option.name} must be between 0 and 1000.`,
            ephemeral: true,
          });
          return;
        }

        updates[`points.${option.name}`] = points;
        updateMade = true;
      }

      if (!updateMade) {
        await interaction.editReply({
          content: "Please provide at least one point value to update.",
          ephemeral: true,
        });
        return;
      }

      const guild = await Guilds.findOneAndUpdate(
        { guildId },
        { $set: updates },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );

      const updatedPoints = Object.entries(updates)
        .map(([key, value]) => `${key.replace("points.", "")}: ${value} points`)
        .join("\n");

      await interaction.editReply({
        content: `✅ Points updated successfully!\n\n${updatedPoints}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error in setPoints command:", error);
      await handleInteractionError(error, interaction);
    }
  },
};
