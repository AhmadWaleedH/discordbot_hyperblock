const {
  PermissionsBitField,
  ChannelType,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");
const {
  categoryName,
  channels,
  UserChannels,
} = require("../../utils/constants");
const Guilds = require("../../models/Guilds");
const shopItem = require("../../models/Shop");
const sendEmbedWithButtons = require("../../utils/embeds/embedWithButtons");

const contestButtonOptions = [
  {
    label: "Contests",
    emoji: "🖊️",
    style: ButtonStyle.Primary,
    customId: "contests_btn",
  },
];

const contestEmbedOptions = {
  title: "Manage Your Events Here!",
  description: "Manage events, games here by creating contests",
  color: "#00ff99",
};
const giveawayButtonOptions = [
  {
    label: "Create",
    emoji: "➕",
    style: ButtonStyle.Success,
    customId: "create_giveaway",
  },
  {
    label: "Edit",
    emoji: "🖊️",
    style: ButtonStyle.Primary,
    customId: "edit_giveaway",
  },
  {
    label: "Delete",
    emoji: "❌",
    style: ButtonStyle.Danger,
    customId: "delete_giveaway",
  },
];

const missionHallEmbed = {
  title: "🚀 Manage Your Events Here!",
  description:
    "Please click the button below to fill some requirements to start a tweet engagement event!",
  color: "#00ff99",
};
const missionHallButtonOptions = [
  {
    label: "TWT ",
    emoji: "🐤",
    style: ButtonStyle.Success,
    customId: "use_twt",
  },
];

const giveawayembedOptions = {
  title: "Raffle Setup!",
  description: "Manage creating, and updating raffles here",
  color: "#00ff99",
};

const embedOptions = {
  title: "Config System",
  description:
    "Manage configuration for points, active rewards, reaction rewards here!",
  color: "#00ff99",
};

const ausctionEmbedOptions = {
  title: "Auction System",
  description: "Here you can get started with the adding/removing auction",
  color: "#00ff99",
};
const storeEmbedOptions = {
  title: "Shop System",
  description:
    "Here you can create hyperblock store items for your members to buy!",
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
    try {
      await interaction.deferReply({ ephemeral: true });

      const { guild, member } = interaction;
      const guildId = guild.id;
      const totalMembers = guild.memberCount; 

      console.log(guild.memberCount);
      
      console.log( guild.memberCount * 2 * 0.5)

      const reservedTotal =  guild.memberCount * 2

      const vault =Math.floor(reservedTotal * 0.5)


      const doc = await Guilds.findOneAndUpdate(
        { guildId }, 
        {
            guildName: guild.name,
            guildIconURL: guild.iconURL(),
            ownerUserId: member.id,
            ownerUsername: member.user.username,
            ownerAvatarURL: member.displayAvatarURL(),
            totalMembers: guild.memberCount,
            botConfig: { channels: {} },
            analytics: {
              reservedPoints: reservedTotal - vault,
              vault,
            },
        },
        { new: true, upsert: true }
      );

      for (const channelName of channels) {
        const schemaKey = toCamelCase(channelName);
        const existingChannelId = doc.botConfig.channels[schemaKey];
        let channel = existingChannelId
          ? guild.channels.cache.get(existingChannelId)
          : null;

        if (channel) await channel.delete();
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
      const missionsHallChannelId = doc.botConfig.channels.missionsHall;
      const stadiumChannelId = doc.botConfig.channels.stadium;
      const rafflesChannelId = doc.botConfig.channels.raffles;
      // user channels
      const eventChannelId = doc.botConfig.userChannels.events;
      const myBagChannelId = doc.botConfig.userChannels.myBag;
      const userRafflesChannelId = doc.botConfig.userChannels.raffles;
      const shopChannelId = doc.botConfig.userChannels.shop;
      const auctionsChannelId = doc.botConfig.userChannels.auctions;
      const hyperNotesChannelId = doc.botConfig.userChannels.hyperNotes;
      const leaderboardChannelId = doc.botConfig.userChannels.leaderboard;
      const message =
        "Tracks all member activities, rewards, and bot interactions for transparency and audit purposes";
      const missionHallMessage =
        " Hosts social tasks (e.g., Twitter engagement) and event announcements. Admins create tasks here";
      const stadiumMessage =
        " Dedicated to community events (e.g., contests). Members participate to earn points";
      const hypeMarketMessage =
        "  Marketplace for purchasing roles, WL spots, or merch using community/HyperBlock Points (HBPs)";
      const raffleMessage =
        "Hosts raffle events. Admins configure entry costs, winners, and rewards";
      const hyperNotesMessage =
        "Notifications about important events will be placed here";
      const myBagMessage =
        " Members view their inventory (purchased items, HBPs, and achievements)";
      const eventsMessage =
        "Join exciting events where you can compete, earn rewards, and have fun with other community members. Stay tuned for new challenges and opportunities to shine!";
      const shopMessage =
        "Visit the shop to browse and purchase exclusive items, upgrades, and rewards to enhance your experience. Find everything from cosmetics to special gear!";
      const userRaffleMessage =
        "Enter raffles for a chance to win fantastic prizes. Your luck could lead to amazing rewards, so don't miss out on these thrilling opportunities!";
      const auctionMessage =
        "Participate in auctions where you can bid on rare and highly sought-after items. The highest bidder wins, so get ready to compete for unique treasures!";
      const leaderboardMessage =
        "All contests winners will be announced here including raffles, contests, auctions";
      await sendEmbedMessage(client, missionsHallChannelId, missionHallMessage);
      await sendEmbedMessage(client, stadiumChannelId, stadiumMessage);
      await sendEmbedMessage(client, hypeLogsChannelId, message);
      await sendEmbedMessage(client, hypeMarketChannelId, hypeMarketMessage);
      await sendEmbedMessage(client, rafflesChannelId, raffleMessage);
      await sendEmbedMessage(client, hyperNotesChannelId, hyperNotesMessage);
      //user channels
      await sendEmbedMessage(client, eventChannelId, eventsMessage);
      await sendEmbedMessage(client, myBagChannelId, myBagMessage);
      await sendEmbedMessage(client, userRafflesChannelId, userRaffleMessage);
      await sendEmbedMessage(client, shopChannelId, shopMessage);
      await sendEmbedMessage(client, auctionsChannelId, auctionMessage);
      await sendEmbedMessage(client, leaderboardChannelId, leaderboardMessage);

      await sendEmbedWithButtons(
        guild,
        hypeLogsChannelId,
        embedOptions,
        buttonOptions
      );

      await sendEmbedWithButtons(
        guild,
        missionsHallChannelId,
        missionHallEmbed,
        missionHallButtonOptions
      );

      const guildWithItems = await Guilds.findOne({
        guildId: guildId,
      }).populate("shop");

      const itemsDisplay = await formatShopItems(guildWithItems);

      const itemsEmbedOptions = {
        title: "Welcome to the Server!",
        description: itemsDisplay,
        color: "#00ff99",
      };
      await sendEmbedWithButtons(
        guild,
        stadiumChannelId,
        contestEmbedOptions,
        contestButtonOptions
      );

      await sendEmbedWithButtons(
        guild,
        rafflesChannelId,
        giveawayembedOptions,
        giveawayButtonOptions
      );
      await sendEmbedWithButtons(
        guild,
        hypeMarketChannelId,
        storeEmbedOptions,
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
    } catch (error) {
      console.log(error);
    }
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

async function sendEmbedMessage(client, channelId, description) {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) throw new Error("Channel not found");

    const embed = new EmbedBuilder()
      .setDescription(description)
      .setColor("#57F287"); // Discord green

    await channel.send({ embeds: [embed] });
    console.log(`Embed sent to channel: ${channelId}`);
  } catch (error) {
    console.error(error);
  }
}
