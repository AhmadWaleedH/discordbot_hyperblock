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
  function createAuctionEmbed(auction) {
    // Calculate time remaining and format timestamps
    const endTimeUnix = Math.floor(new Date(auction.duration).getTime() / 1000);
    const timeLeft = new Date(auction.duration) - new Date();
    
    // Format current bid display
    const currentBidDisplay = auction.blindAuction 
      ? "🔒 Hidden (Blind Auction)"
      : `${auction.currentBid?.toLocaleString() || '-'} Points`;
  
    // Create the embed
    const embed = new EmbedBuilder()
      .setColor(auction.status === "active" ? "#FFD700" : "#808080")
      .setTitle(`🏆 ${auction.name?.toUpperCase() || "Super"}`)
      .setDescription(`
        ━━━━━━━━━━━━━━━━━━━━━━━━━
        
        ${auction.description || `New ${auction.chain} Auction is live! Click Below To Place Your Bid.\nThere Will Be ${auction.quantity} Spot(s) In This Auction.`}
  
        ━━━━━━━━━━━━━━━━━━━━━━━━━
      `)
      .addFields(
        {
          name: "📊 Auction Details",
          value: `
            • **Quantity:** ${auction.quantity}
            • **Chain:** ${auction.chain}
            • **Current Bid:** ${currentBidDisplay}
            • **Highest Bidder:** ${auction.currentBidder ? `<@${auction.currentBidder}>` : '-'}
            ${auction.minimumBid ? `• **Minimum Bid:** ${auction.minimumBid.toLocaleString()} Points` : ''}
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
            ${auction.createdAt ? `• **Created:** <t:${Math.floor(auction.createdAt.getTime() / 1000)}:R>` : ''}
          `,
          inline: false,
        }
      );
  
    // Add bids section if available
    if (auction.bidders && auction.bidders.length > 0) {
      const bidsField = auction.bidders
        .sort((a, b) => b.bidAmount - a.bidAmount)
        .slice(0, 6) // Show top 6 bids
        .map((bid) => `<@${bid.userId}> - ${bid.bidAmount}`)
        .join("\n");
  
      embed.addFields({
        name: "📋 Bids",
        value: bidsField || "-",
      });
    } else {
      // Add empty bid placeholders
      embed.addFields({
        name: "📋 Bids",
        value: Array(6).fill("-").join("\n"),
      });
    }
  
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
    }[auction.status || 'active'];
  
    embed.setFooter({
      text: `${footerText}${auction._id ? ` • ID: ${auction._id}` : ''}`,
    });
  
    // Create buttons
    const bidButton = new ButtonBuilder()
      .setCustomId(`place_bid_${auction._id}`)
      .setLabel(auction.blindAuction ? "Place Blind Bid" : "Place Bid")
      .setStyle(ButtonStyle.Primary)
      .setEmoji(auction.blindAuction ? "🎫" : "💰")
      .setDisabled(auction.status !== "active");
  
    const changeWalletButton = new ButtonBuilder()
      .setCustomId(`change_wallet_${auction._id}`)
      .setLabel("Change Wallet")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("🔄");
  
    // Create action row with buttons
    const row = new ActionRowBuilder().addComponents(
      bidButton,
      ...(auction.status === "active" ? [changeWalletButton] : [])
    );
  
    return {
      embed,
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
    createAuctionEmbed,
    updateAuctionMessage,
  };