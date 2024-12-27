const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");

/**
 * Creates a formatted giveaway embed with buttons
 * @param {Object} giveaway - The giveaway object from MongoDB
 * @returns {Object} - Returns { embed, components }
 */
function createGiveawayEmbed(giveaway) {
  // Format end time for Discord timestamp
  const endTimeUnix = Math.floor(new Date(giveaway.endTime).getTime() / 1000);
  const startTimeUnix = Math.floor(
    new Date(giveaway.startTime).getTime() / 1000
  );

  // Calculate time remaining
  const timeLeft = new Date(giveaway.endTime) - new Date();
  const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));

  // Format entry requirements
  const requirements = [];
  if (giveaway.roleRequired) {
    requirements.push(`• Role Required: <@&${giveaway.roleRequired}>`);
  }
  if (giveaway.entriesLimited) {
    requirements.push(
      `• Limited to ${giveaway.entriesLimited} entries per user`
    );
  }

  // Create progress bar based on total participants
  const maxWidth = 20;
  const progress = giveaway.entriesLimited
    ? Math.floor(
        (giveaway.totalParticipants / giveaway.entriesLimited) * maxWidth
      )
    : maxWidth / 2;
  const progressBar = "█".repeat(progress) + "░".repeat(maxWidth - progress);

  const embed = new EmbedBuilder()
    .setColor(giveaway.isExpired ? "#FF0000" : "#00FF00")
    .setTitle(`🎉 ${giveaway.raffleTitle.toUpperCase()} 🎉`)
    .setDescription(
      `
      ━━━━━━━━━━━━━━━━━━━━━━━━━
      
      ${giveaway.description || "No description provided"}

      ━━━━━━━━━━━━━━━━━━━━━━━━━
    `
    )
    .addFields(
      {
        name: "🏆 Prize Details",
        value: `
          • **Winners:** ${giveaway.numWinners}
          • **Entry Cost:** ${giveaway.entryCost} Points
          • **Chain:** ${giveaway.chain}
          ${
            giveaway.winnerRole
              ? `• **Winner Role:** <@&${giveaway.winnerRole}>`
              : ""
          }
        `,
        inline: false,
      },
      {
        name: "⏰ Time Information",
        value: `
         • **Starts:** <t:${startTimeUnix}:F>
          • **Starts At:** <t:${startTimeUnix}:R>
          • **Ends:** <t:${endTimeUnix}:F>
          • **Time Left:** <t:${endTimeUnix}:R>
          • **Created:** <t:${Math.floor(
            giveaway.createdAt.getTime() / 1000
          )}:R>
        `,
        inline: false,
      }
    );

  // Add partner information if exists
  if (giveaway.partnerTwitter) {
    embed.addFields({
      name: "🤝 Partner",
      value: `[${giveaway.partnerTwitter}](https://twitter.com/${giveaway.partnerTwitter})`,
      inline: false,
    });
  }

  // Add notes if they exist
  if (giveaway.notes) {
    embed.addFields({
      name: "📝 Notes",
      value: giveaway.notes,
      inline: false,
    });
  }

  // Add footer with entry information
  embed.setFooter({
    text: `${
      giveaway.isExpired
        ? "❌ GIVEAWAY ENDED"
        : "🎟️ Click the button below to join!"
    } • ID: ${giveaway._id}`,
  });

  // Create buttons
  const joinButton = new ButtonBuilder()
    .setCustomId(`joinGiveaway_${giveaway._id}`)
    .setLabel(`Join Giveaway (${giveaway.entryCost} Points)`)
    .setStyle(giveaway.isExpired ? ButtonStyle.Secondary : ButtonStyle.Success)
    .setEmoji("🎟️")
    .setDisabled(giveaway.isExpired);

  // Create action row with buttons
  const row = new ActionRowBuilder().addComponents(joinButton);

  return {
    embed: embed,
    components: [row],
  };
}

async function editGiveawayMessage(interaction, giveaway) {
  try {
    // Fetch the channel
    const channel = interaction.guild.channels.cache.get(giveaway.channelId);
    if (!channel) {
      throw new Error(`Channel ${giveaway.channelId} not found`);
    }

    // Fetch the message
    const message = await channel.messages.fetch(giveaway.messageId);
    if (!message) {
      throw new Error(`Message ${giveaway.messageId} not found`);
    }

    // Create new embed and components
    const { embed, components } = createGiveawayEmbed(giveaway);

    // Edit the message
    await message.edit({
      embeds: [embed],
      components: components,
    });

    console.log(
      `Successfully edited message ${giveaway.messageId} in channel ${giveaway.channelId}`
    );
  } catch (error) {
    console.error(`Failed to edit giveaway message: ${error.message}`);
  }
}

module.exports = {
  createGiveawayEmbed,
  editGiveawayMessage,
};
