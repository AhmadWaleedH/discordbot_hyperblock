const Giveaway = require("../models/raffles"); // Adjust the path to your model
const Users = require("../models/Users");
const ShopItem = require("../models/Shop");
const mongoose = require("mongoose");
const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
async function updateGiveaway(interaction, id, updateData, shouldUpdate) {
  try {
    const updatedGiveaway = await Giveaway.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedGiveaway) {
      return interaction.reply({
        content: "Giveaway not found.",
        ephemeral: true,
      });
    }

    if (shouldUpdate)
      return await interaction.update({
        content: "Giveaway optional added successfully.",
        ephemeral: true,
        components: [],
      });
    await interaction.reply({
      content: "Giveaway optional added successfully.",
      ephemeral: true,
    });
  } catch (error) {
    console.error("Error updating giveaway:", error);
    await interaction.reply({
      content: "There was an error updating the giveaway.",
      ephemeral: true,
    });
  }
}

async function handlePurchase(userId, itemId, userRoles, guildId) {
  try {
    const user = await Users.findOne({ discordId: userId });
    const item = await ShopItem.findById(itemId);
    // Check user existence
    if (!user) {
      return { success: false, message: "User not found." };
    }

    // Check item existence
    if (!item) {
      return { success: false, message: "Item not found." };
    }

    // Check account status
    // if (user.status !== "active") {
    //   return {
    //     success: false,
    //     message: "Your account status does not allow purchases.",
    //   };
    // }

    if (typeof item.price !== "number") {
      return { success: false, message: "Invalid item price or user points." };
    }

    // Check required role
    if (
      item.requiredRoleToPurchase &&
      !userRoles.includes(item.requiredRoleToPurchase)
    ) {
      return {
        success: false,
        message: "You do not have the required role to purchase this item.",
      };
    }

    // Check stock
    if (item.quantity === 0) {
      return { success: false, message: "This item is out of stock." };
    }

    const serverMembership = user.serverMemberships.find(
      (membership) => membership.guildId === guildId
    );

    if (!serverMembership) {
      return {
        success: false,
        message: "User is not a member of this server.",
      };
    }

    // Check if user has enough points in this server
    if (serverMembership.points < item.price) {
      return { success: false, message: "Insufficient points." };
    }

    // Check previous purchase
    const alreadyPurchased = user.purchases.some(
      (purchase) =>
        purchase.itemId.toString() === itemId && !item.allowMultiplePurchases
    );
    if (alreadyPurchased) {
      return {
        success: false,
        message: "This item can only be purchased once.",
      };
    }

    return { success: true, item, user };
  } catch (error) {
    console.error("Validation error:", error);
    return {
      success: false,
      message: "An error occurred while validating the purchase.",
    };
  }
}

function generateItemEmbed(item, interaction) {
  const embed = new EmbedBuilder()
    .setColor("#FFD700") // Gold color
    .setTitle(`🛍️ ${item.name}`)
    .setDescription(item.description || "No description available")
    .addFields([
      {
        name: "💰 Price",
        value: `\`${item.price.toLocaleString()}\` coins`,
        inline: true,
      },
      {
        name: "📦 Quantity",
        value:
          item.quantity === -1
            ? "`∞ Unlimited`"
            : `\`${item.quantity}\` remaining`,
        inline: true,
      },
    ])
    .setTimestamp()
    .setFooter({
      text: `Item ID: ${item._id}`,
      iconURL: interaction.guild.iconURL(),
    });

  // Add optional fields if they exist
  if (item.role) {
    embed.addFields({
      name: "🎭 Role Reward",
      value: `<@&${item.role}>`,
      inline: true,
    });
  }

  if (item.requiredRoleToPurchase) {
    embed.addFields({
      name: "🔒 Required Role",
      value: `<@&${item.requiredRoleToPurchase}>`,
      inline: true,
    });
  }

  if (item.blockchainId) {
    embed.addFields({
      name: "⛓️ Blockchain ID",
      value: `\`${item.blockchainId}\``,
      inline: true,
    });
  }

  // Create purchase button
  const purchaseButton = new ButtonBuilder()
    .setCustomId(`purchase_add_item_${item._id}`)
    .setLabel("Purchase Item")
    .setEmoji("🛒")
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(purchaseButton);

  return { embed, row };
}

// Export the function
module.exports = { updateGiveaway, handlePurchase, generateItemEmbed };
