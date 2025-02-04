const { PermissionsBitField, ChannelType, ButtonStyle } = require("discord.js");
const {
  categoryName,
  channels,
  UserChannels,
} = require("../../utils/constants");
const Guilds = require("../../models/Guilds");
const shopItem = require("../../models/Shop");
const sendEmbedWithButtons = require("../../utils/embeds/embedWithButtons");

const embedOptions = {
  title: "Config System",
  description:
    "Manage configuration for points, active rewards, reaction rewards here!",
  color: "#00ff99",
};

const ausctionEmbedOptions = {
  title: "Auction System",
  description:
    "Here's how you can get started with the adding/removing auction:",
  color: "#00ff99",
};

const itemsButtonsOptions = [
  {
    label: "Add Item",
    emoji: "➕",
    style: ButtonStyle.Success,
    customId: "add_item",
  },
  {
    label: "Edit Item",
    emoji: "✏️",
    style: ButtonStyle.Primary,
    customId: "edit_item",
  },
  {
    label: "Purchase",
    emoji: "💵",
    style: ButtonStyle.Secondary,
    customId: "purchase_item",
  },
];
// Button options
const buttonOptions = [
  {
    label: "Points Setup",
    emoji: "🎯",
    style: ButtonStyle.Success,
    customId: "points_setup",
  },
  {
    label: "Socials Setup",
    emoji: "🌐",
    style: ButtonStyle.Primary,
    customId: "socials_setup",
  },
  {
    label: "Team Setup",
    emoji: "👥",
    style: ButtonStyle.Secondary,
    customId: "team_setup",
  },
];

const auctionOptions = [
  {
    label: "Add Item",
    emoji: "🎯",
    style: ButtonStyle.Success,
    customId: "add_auction",
  },
  {
    label: "Edit Item",
    emoji: "🌐",
    style: ButtonStyle.Primary,
    customId: "edit_auction",
  },
  {
    label: "Bid",
    emoji: "👥",
    style: ButtonStyle.Secondary,
    customId: "bid_auction",
  },
  {
    label: "Delete",
    emoji: "🚨",
    style: ButtonStyle.Danger,
    customId: "delete_auction",
  },
];

const toCamelCase = (str) => {
  return str
    .toLowerCase()
    .replace(/-./g, (x) => x[1].toUpperCase())
    .replace(/^./, (x) => x.toLowerCase());
};

const createChannel = async (guild, channelName, category) => {
  return await guild.channels.create({
    name: channelName,
    parent: category,
    type: ChannelType.GuildText,
  });
};

module.exports = {
  name: "setup",
  description: "Setup channels for the server",
  permissions: PermissionsBitField.Flags.Administrator,
  callback: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true });

    const {
      guild,
      member: { id: ownerDiscordId },
    } = interaction;
    const guildId = guild.id;

    let doc = await Guilds.findOne({ guildId });
    if (!doc) {
      doc = new Guilds({
        guildId,
        guildName: guild.name,
        guildIconURL: guild.iconURL(),
        ownerDiscordId,
        botConfig: {
          channels: {},
        },
      });
    }

    let category = guild.channels.cache.get(doc.category);
    let userCategory = guild.channels.cache.get(doc.userCategory);

    if (!userCategory) {
      userCategory = await guild.channels.create({
        name: "Hypes",
        type: ChannelType.GuildCategory,
      });
      doc.userCategory = userCategory.id;
    }
    if (!category) {
      category = await guild.channels.create({
        name: categoryName,
        type: ChannelType.GuildCategory,
      });
      doc.category = category.id;
    }

    if (!doc.botConfig) {
      doc.botConfig = {
        channels: {},
        userChannels: {},
      };
    }

    for (const channelName of UserChannels) {
      const schemaKey = toCamelCase(channelName);
      const existingChannelId = doc.botConfig.userChannels[schemaKey];
      let channel = existingChannelId
        ? guild.channels.cache.get(existingChannelId)
        : null;

      if (!channel) {
        channel = await createChannel(guild, channelName, userCategory);
        doc.botConfig.userChannels[schemaKey] = channel.id;
      } else if (channel.parentId !== userCategory.id) {
        await channel.setParent(userCategory.id);
      }
    }

    for (const channelName of channels) {
      const schemaKey = toCamelCase(channelName);
      const existingChannelId = doc.botConfig.channels[schemaKey];
      let channel = existingChannelId
        ? guild.channels.cache.get(existingChannelId)
        : null;

      if (!channel) {
        channel = await createChannel(guild, channelName, category);
        doc.botConfig.channels[schemaKey] = channel.id;
      } else if (channel.parentId !== category.id) {
        await channel.setParent(category.id);
      }
    }

    doc.markModified("botConfig.channels");
    await doc.save();

    // Send a welcome message in the hype-logs channel
    const hypeLogsChannelId = doc.botConfig.channels.hypeLogs;
    const hypeMarketChannelId = doc.botConfig.channels.hyperMarket;
    await sendEmbedWithButtons(
      guild,
      hypeLogsChannelId,
      embedOptions,
      buttonOptions
    );

    const guildWithItems = await Guilds.findOne({ guildId: guildId }).populate(
      "shop"
    );

    const itemsDisplay = await formatShopItems(guildWithItems);

    const itemsEmbedOptions = {
      title: "Welcome to the Server!",
      description: itemsDisplay,
      color: "#00ff99",
    };
    await sendEmbedWithButtons(
      guild,
      hypeMarketChannelId,
      embedOptions,
      itemsButtonsOptions
    );

    await sendEmbedWithButtons(
      guild,
      hypeMarketChannelId,
      ausctionEmbedOptions,
      auctionOptions
    );
    await interaction.editReply({
      content: "Setup complete ✅",
      ephemeral: true,
    });
  },
};

async function formatShopItems(items) {
  if (!items.shop.length) return "No items available in the shop.";

  return items.shop
    .map((item, index) => {
      // Truncate description to 100 characters
      const description = item.description
        ? item.description.length > 100
          ? item.description.substring(0, 97) + "..."
          : item.description
        : "No description available";

      // Format quantity display
      const quantity =
        item.quantity === -1 ? "Unlimited" : `${item.quantity} remaining`;

      // Format role requirement
      const roleRequirement = item.requiredRoleToPurchase
        ? `\n> Required Role: <@&${item.requiredRoleToPurchase}>`
        : "";

      // Format reward role
      const rewardRole = item.role ? `\n> Rewards: <@&${item.role}>` : "";

      return `**${index + 1}. ${item.name}**
> 💰 Price: \`${item.price} points\`
> 📦 Stock: \`${quantity}\`
> 📝 ${description}${roleRequirement}${rewardRole}
${item.allowMultiplePurchases ? "> 🔄 Can be purchased multiple times" : ""}`;
    })
    .join("\n\n");
}
