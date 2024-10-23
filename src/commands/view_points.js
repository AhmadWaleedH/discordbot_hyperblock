const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { CommandType } = require("wokcommands");
const { handleInteractionError } = require("../utils/interaction");
const Guilds = require("../models/Guilds");

module.exports = {
  description: "View current points configuration",
  type: CommandType.SLASH,

  callback: async ({ interaction }) => {
    try {
      await interaction.deferReply({ ephemeral: true });

      const guildId = interaction.guildId;
      const guildConfig = await Guilds.findOne({ guildId });

      if (!guildConfig || !guildConfig.points) {
        return await interaction.editReply({
          content:
            "❌ No points configuration found for this server. Use `/setpoints` to set up point values.",
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setTitle("🎯 Points Configuration")
        .setColor("#2B2D31")
        .setDescription("Current point values for different actions:")
        .addFields([
          {
            name: "Follow Points",
            value: `${guildConfig.points.follow || 0} points`,
            inline: true,
          },
          {
            name: "Like Points",
            value: `${guildConfig.points.likes || 0} points`,
            inline: true,
          },
          {
            name: "Comment Points",
            value: `${guildConfig.points.comment || 0} points`,
            inline: true,
          },
          {
            name: "Retweet Points",
            value: `${guildConfig.points.retweet || 0} points`,
            inline: true,
          },
          {
            name: "Announcement Reaction",
            value: `${guildConfig.points.announcement_reaction || 0} points`,
            inline: true,
          },
          {
            name: "Chat Points",
            value: `${guildConfig.points.chat || 0} points`,
            inline: true,
          },
        ])
        .setFooter({
          text: "Use /setpoints to modify these values",
        });
      if (guildConfig.category) {
        embed.addFields({
          name: "Category",
          value: guildConfig.category,
          inline: false,
        });
      }

      await interaction.editReply({
        embeds: [embed],
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error in viewPoints command:", error);
      await handleInteractionError(error, interaction);
    }
  },
};
