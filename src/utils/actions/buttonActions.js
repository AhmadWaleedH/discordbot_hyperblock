// buttonActions.js
const {
  ActionRowBuilder,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
} = require("discord.js");

const Guilds = require("../../models/Guilds");
const sendEmbedWithButtons = require("../embeds/embedWithButtons");
const showModal = require("../modelHandler");
const sendSelectMenu = require("../selectMenuHandler");
const Shop = require("../../models/Shop");
const Giveaway = require("../../models/raffles");
const User = require("../../models/Users");
const ITEM_EMOJIS = {
  weapon: "⚔️",
  armor: "🛡️",
  potion: "🧪",
  food: "🍖",
  tool: "🔨",
  cosmetic: "👑",
  special: "⭐",
  key: "🔑",
  chest: "📦",
  gem: "💎",
  scroll: "📜",
  pet: "🐾",
  default: "🎁",
};

async function handlePointsSetup(interaction) {
  const embedOptions = {
    title: "Points Setup",
    description: "Choose the type of rewards you want to configure:",
    color: "#FFD700",
    footer: "Points Configuration",
    fields: [
      {
        name: "Available Reward Types",
        value: "`Select a reward type below to proceed.`",
      },
    ],
  };

  const buttonOptions = [
    {
      label: "Social Rewards",
      emoji: "🌟",
      style: "Primary",
      customId: "points_setup_social_rewards",
    },
    {
      label: "Reactions Rewards",
      emoji: "👍",
      style: "Success",
      customId: "points_setup_reactions_rewards",
    },
    {
      label: "Active Reward",
      emoji: "🔥",
      style: "Secondary",
      customId: "points_setup_active_reward",
    },
  ];

  await sendEmbedWithButtons(
    interaction.guild,
    interaction.channelId,
    embedOptions,
    buttonOptions
  );
  await interaction.deferUpdate();
}

async function handleSocialRewards(interaction) {
  const fieldOptions = [
    {
      label: "Points for Like",
      customId: "points_like",
      placeholder: "Enter points for Like",
      style: "Short",
    },
    {
      label: "Points for Comment",
      customId: "points_comment",
      placeholder: "Enter points for Comment",
      style: "Short",
    },
    {
      label: "Points for Space",
      customId: "points_space",
      placeholder: "Enter points for Space",
      style: "Short",
    },
    {
      label: "Points for RT",
      customId: "points_rt",
      placeholder: "Enter points for RT",
      style: "Short",
    },
  ];

  await showModal(
    interaction,
    "Social Rewards Configuration",
    "social_rewards_modal",
    fieldOptions
  );
}

async function handleSocialSetup(interaction) {
  const fieldOptions = [
    {
      label: "Twitter Link",
      customId: "twitter_link",
      placeholder: "Enter Twitter Link",
      style: "Short",
    },
  ];

  await showModal(
    interaction,
    "Social Setup Configuration",
    "social_setup_modal",
    fieldOptions
  );
}

async function handleTeamSetup(interaction) {
  const roleSelect = new RoleSelectMenuBuilder()
    .setCustomId("team_setup_select")
    .setPlaceholder("Select roles")
    .setMinValues(1)
    .setMaxValues(3);

  const row = new ActionRowBuilder().addComponents(roleSelect);
  await interaction.reply({
    content: "Please select your roles:",
    components: [row],
  });
}

async function handlePointsSetupActiveRewards(interaction) {
  const roleSelect = new ChannelSelectMenuBuilder()
    .setCustomId("active_reward_select")
    .setPlaceholder("Select Channel")
    .setMinValues(1)
    .setMaxValues(1);

  const row = new ActionRowBuilder().addComponents(roleSelect);
  await interaction.reply({
    content: "Please select your Channel:",
    components: [row],
  });
}

async function handlePointsSetupReactionRewards(interaction) {
  const roleSelect = new ChannelSelectMenuBuilder()
    .setCustomId("reaction_reward_select")
    .setPlaceholder("Select Channel")
    .setMinValues(1)
    .setMaxValues(1);

  const row = new ActionRowBuilder().addComponents(roleSelect);
  await interaction.reply({
    content: "Please select your Channel:",
    components: [row],
  });
}
async function handleAddItems(interaction) {
  const fieldOptions = [
    {
      label: "Name of the item",
      customId: "item_name",
      placeholder: "Enter Name of the item",
      style: "Short",
    },
    {
      label: "Price of the Item",
      customId: "item_price",
      placeholder: "Enter Price of the item",
      style: "Short",
    },
    {
      label: "Description of the item",
      customId: "item_description",
      placeholder: "Enter description of the item",
      style: "Short",
      required: false,
    },
    {
      label: "Quantity of the Item",
      customId: "item_quantity",
      placeholder: "Enter quantitiy for item",
      style: "Short",
      required: false,
    },
    {
      label: "Allow Multiple buy for the item (yes/no)",
      customId: "item_multiple",
      placeholder: "Enter all multiple for item in yes/no",
      style: "Short",
      required: false,
    },
  ];

  await showModal(interaction, "Add Item", "add_item_model", fieldOptions);
}

async function handleEditItems(interaction) {
  const guildId = interaction.guildId;
  const guild = await Guilds.findOne({ guildId: guildId }).populate("shop");
  console.log(guild);
  if (!guild || !guild.shop.length) {
    return await interaction.reply({
      content: "🏪 The shop is currently empty!",
      ephemeral: true,
    });
  }

  const shopOptions = guild.shop.map((item) => ({
    label: `${item.name} (${item.price} coins)`,
    description:
      item.description?.slice(0, 100) ||
      `${
        item.quantity !== -1 ? `${item.quantity} remaining` : "Unlimited stock"
      }`,
    value: item._id.toString(),
    emoji: ITEM_EMOJIS[item.role?.toLowerCase()] || ITEM_EMOJIS.default,
  }));

  const content =
    `**🏪 Welcome to the Server Shop!**\n\n` +
    `Browse our collection of amazing items!\n` +
    `💰 Select an item from the menu below to edit/delete details.\n\n` +
    `Total Items: ${guild.shop.length}`;

  await sendSelectMenu(
    interaction,
    content,
    `edit_items_select`,
    "📦 Choose an item to edit details...",
    shopOptions
  );
}

async function handlePurchaseItems(interaction) {
  const guildId = interaction.guildId;
  const guild = await Guilds.findOne({ guildId: guildId }).populate("shop");
  console.log(guild);
  if (!guild || !guild.shop.length) {
    return await interaction.reply({
      content: "🏪 The shop is currently empty!",
      ephemeral: true,
    });
  }

  const shopOptions = guild.shop.map((item) => ({
    label: `${item.name} (${item.price} coins)`,
    description:
      item.description?.slice(0, 100) ||
      `${
        item.quantity !== -1 ? `${item.quantity} remaining` : "Unlimited stock"
      }`,
    value: item._id.toString(),
    emoji: ITEM_EMOJIS[item.role?.toLowerCase()] || ITEM_EMOJIS.default,
  }));

  const content =
    `**🏪 Welcome to the Server Shop!**\n\n` +
    `Browse our collection of amazing items!\n` +
    `💰 Select an item from the menu below to purchase the item.\n\n` +
    `Total Items: ${guild.shop.length}`;

  await sendSelectMenu(
    interaction,
    content,
    `purchase_items_select`,
    "📦 Choose an item to edit details...",
    shopOptions
  );
}

async function handleCreateGiveaway(interaction) {
  const fieldOptions = [
    {
      label: "Raffle Title",
      customId: "raffle_title",
      placeholder: "Enter title of the raffle",
      style: "Short",
      required: true,
    },
    {
      label: "Number of winners",
      customId: "num_of_winners",
      placeholder: "Enter no of the winners",
      style: "Short",
      required: true,
    },
    {
      label: "Entry Cost",
      customId: "entry_cost",
      placeholder: "Enter entry cost of the raffle",
      style: "Short",
      required: true,
    },
    {
      label: "Duration Time of raffle",
      customId: "duration_time",
      placeholder: "Enter time duration for giveaway",
      style: "Short",
      required: true,
    },
    {
      label: "Chain of the project",
      customId: "chain_project",
      placeholder: "Enter chain of the project",
      style: "Short",
      required: true,
    },
  ];

  await showModal(interaction, "Add raffle", "add_raffle", fieldOptions);
}

async function joinGiveaway(interaction, id) {
  const giveaway = await Giveaway.findById(id);
  const userId = interaction.user.id;
  if (!giveaway) {
    return await interaction.reply({
      content: "Giveaway not found.",
      ephemeral: true,
    });
  }

  // Check if the giveaway has expired
  if (giveaway.isExpired || new Date() > giveaway.endTime) {
    return await interaction.reply({
      content: "This giveaway has ended.",
      ephemeral: true,
    });
  }

  // Fetch the user
  const user = await User.findOne({ discordId: userId });
  if (!user) {
    return await interaction.reply({
      content: "User not found.",
      ephemeral: true,
    });
  }

  // Check if user is active and not banned
  if (user.status !== "active") {
    return await interaction.reply({
      content: "Your account is not eligible to join.",
      ephemeral: true,
    });
  }

  // Check if user has sufficient points
  if (user.hyperBlockPoints < giveaway.entryCost) {
    return await interaction.reply({
      content: "Insufficient points to enter the giveaway.",
      ephemeral: true,
    });
  }

  // Check for required role if specified
  // if (giveaway.roleRequired && !userHasRole(user, giveaway.roleRequired)) {
  //   return await interaction.reply({
  //     content: "You don't have the required role to join this giveaway.",
  //     ephemeral: true,
  //   });
  // }

  // Check if entries are limited and if the limit has been reached
  if (
    giveaway.entriesLimited &&
    giveaway.totalParticipants >= giveaway.entriesLimited
  ) {
    return await interaction.reply({
      content: "The giveaway has reached its maximum number of participants.",
      ephemeral: true,
    });
  }

  // Check if user has already participated
  const isAlreadyParticipant = giveaway.participants.some(
    (participant) => participant.userId === userId
  );
  if (isAlreadyParticipant) {
    return await interaction.reply({
      content: "You have already participated in this giveaway.",
      ephemeral: true,
    });
  }

  // Deduct entry points from user and save
  user.hyperBlockPoints -= giveaway.entryCost;
  await user.save();

  // Add user to giveaway participants and increment the count
  giveaway.participants.push({ userId });
  giveaway.totalParticipants += 1;
  await giveaway.save();

  return await interaction.reply({
    content: "You have successfully joined the giveaway!",
    ephemeral: true,
  });
}

async function handleEditGiveaway(interaction) {
  const guildGiveaways = await Giveaway.find({ guildId: interaction.guildId });
  if (!guildGiveaways.length) {
    return await interaction.reply({
      content: "🎉 No active giveaways at the moment!",
      ephemeral: true,
    });
  }

  const giveawayOptions = guildGiveaways.map((giveaway) => ({
    label: `${giveaway.raffleTitle} (${giveaway.entryCost} coins)`,
    description:
      giveaway.description?.slice(0, 100) ||
      `Ends on ${giveaway.endTime.toLocaleDateString()}`,
    value: giveaway._id.toString(),
    emoji: "🎟️",
  }));

  const content =
    `🎉 **Welcome to the Server Giveaways!**\n\n` +
    `Join an active giveaway and win exciting rewards!\n` +
    `📋 Select a giveaway from the menu below to view or enter.\n\n` +
    `Total Giveaways: ${guildGiveaways.length}`;

  await sendSelectMenu(
    interaction,
    content,
    `edit_giveaway_select`,
    "🎟️ Choose a giveaway to view or enter...",
    giveawayOptions
  );
}
module.exports = {
  handlePointsSetup,
  handleSocialRewards,
  handleSocialSetup,
  handleTeamSetup,
  handlePointsSetupActiveRewards,
  handlePointsSetupReactionRewards,
  handleAddItems,
  handleEditItems,
  handlePurchaseItems,
  handleCreateGiveaway,
  joinGiveaway,
  handleEditGiveaway,
};
