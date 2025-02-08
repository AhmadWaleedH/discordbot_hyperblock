const {
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle,
  } = require("discord.js");
  
  /**
   * Creates a formatted auction embed with bid button
   * @param {Object} auction - The auction document from MongoDB
   * @returns {Object} - Returns { embed, components }
   */
  function createAuctionEmbedSaving(auction) {
    // Calculate time remaining and format timestamps
    const endTimeUnix = Math.floor(new Date(auction.duration).getTime() / 1000);
    const timeLeft = new Date(auction.duration) - new Date();
    
    // Format current bid display
    const currentBidDisplay = auction.blindAuction 
      ? "🔒 Hidden (Blind Auction)"
      : `${auction.currentBid.toLocaleString()} Points`;
  
    // Create the embed
    const embed = new EmbedBuilder()
      .setColor(auction.status === "active" ? "#FFD700" : "#808080")
      .setTitle(`🏆 ${auction.name.toUpperCase()}`)
      .setDescription(`
        ━━━━━━━━━━━━━━━━━━━━━━━━━
        
        ${auction.description || "No description provided"}
  
        ━━━━━━━━━━━━━━━━━━━━━━━━━
      `)
      .addFields(
        {
          name: "📊 Auction Details",
          value: `
            • **Quantity:** ${auction.quantity}
            • **Chain:** ${auction.chain}
            • **Minimum Bid:** ${auction.minimumBid.toLocaleString()} Points
            ${auction.roleRequired ? `• **Role Required:** <@&${auction.roleRequired}>` : ''}
            ${auction.roleForWinner ? `• **Winner Role:** <@&${auction.roleForWinner}>` : ''}
          `,
          inline: false,
        },
        {
          name: "⏰ Time Information",
          value: `
            • **Ends:** <t:${endTimeUnix}:F>
            • **Time Left:** <t:${endTimeUnix}:R>
            • **Created:** <t:${Math.floor(auction.createdAt.getTime() / 1000)}:R>
          `,
          inline: false,
        }
      );
  
    // Add winner information if auction has ended
    if (auction.status === "ended" && auction.winner) {
      embed.addFields({
        name: "🎉 Winner",
        value: `
          • **Winner:** <@${auction.winner.userId}>
          • **Winning Bid:** ${auction.winner.winningBid.toLocaleString()} Points
        `,
        inline: false,
      });
    }
  
    // Set footer based on auction status
    const footerText = {
      active: "🎫 Click the button below to place your bid!",
      ended: "🏁 This auction has ended",
      cancelled: "❌ This auction was cancelled"
    }[auction.status];
  
    embed.setFooter({
      text: `${footerText} • ID: ${auction._id}`,
    });
  
    // Create bid button
    const bidButton = new ButtonBuilder()
      .setCustomId(`placeBid_${auction._id}`)
      .setLabel(auction.blindAuction ? "Place Blind Bid" : "Place Bid")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🎫")
      .setDisabled(auction.status !== "active");
  
    // Create action row with button
    const row = new ActionRowBuilder().addComponents(bidButton);
  
    return {
      embed: embed,
      components: [row],
    };
  }
  
  /**
   * Updates an existing auction message with new embed and components
   * @param {Object} interaction - Discord interaction object
   * @param {Object} auction - The auction document
   */
  async function updateAuctionMessage(interaction, auction) {
    try {
      const channel = interaction.guild.channels.cache.get(auction.channelId);
      if (!channel) {
        throw new Error(`Channel ${auction.channelId} not found`);
      }
  
      const message = await channel.messages.fetch(auction.messageId);
      if (!message) {
        throw new Error(`Message ${auction.messageId} not found`);
      }
  
      const { embed, components } = createAuctionEmbed(auction);
  
      await message.edit({
        embeds: [embed],
        components: components,
      });
  
      console.log(`Successfully updated auction message ${auction.messageId}`);
    } catch (error) {
      console.error(`Failed to update auction message: ${error.message}`);
    }
  }
  
  module.exports = {
    createAuctionEmbedSaving,
    updateAuctionMessage,
  };