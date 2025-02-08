// buttonActions.js
const {
  ActionRowBuilder,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");

const Guilds = require("../../models/Guilds");
const sendEmbedWithButtons = require("../embeds/embedWithButtons");
const showModal = require("../modelHandler");
const sendSelectMenu = require("../selectMenuHandler");
const Shop = require("../../models/Shop");
const Giveaway = require("../../models/raffles");
const User = require("../../models/Users");
const { handlePurchase } = require("../commons");
const Auction = require("../../models/Auction");
const { createCreditCardBackImage } = require("../canvas/back");
const Contest = require("../../models/Contests");

const buttonOptions = [
  {
    label: "Fanart",
    emoji: "➕",
    style: ButtonStyle.Success,
    customId: "fanart_fun",
  },
  {
    label: "Meme",
    emoji: "🖊️",
    style: ButtonStyle.Primary,
    customId: "fanart_fun",
  },
  {
    label: "Community Fun",
    emoji: "👨",
    style: ButtonStyle.Primary,
    customId: "fanart_fun",
  },
];

const embedOptions = {
  title: "Contest Panel Configuration is here",
  description: "Here's how you can get started with Contests:",
  color: "#00ff99",
};

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
    buttonOptions,
    interaction
  );
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
    ephemeral: true,
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
  await interaction.update({
    content: "Please select your Channel:",
    embeds: [],
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
  await interaction.update({
    content: "Please select your Channel:",
    embeds: [],
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
async function handleAddedPurchaseItems(interaction, id) {
  try{
  const userId = interaction.user.id;
  const userRoles = interaction.member.roles.cache.map((role) => role.id);

  // First validate the purchase
  const validation = await handlePurchase(userId, id, userRoles);

  if (!validation.success) {
    return await interaction.reply({
      content: validation.message,
      ephemeral: true,
    });
  }

  const { item, user } = validation;
  const embed = new EmbedBuilder()
    .setTitle(item.name)
    .setDescription(
      `Are you sure you want to buy this item for ${item.price} points?`
    )
    .setColor("#2f3136");

  // Create the buttons
  const confirmButton = new ButtonBuilder()
    .setCustomId("confirm_purchase")
    .setStyle(ButtonStyle.Success)
    .setLabel("✓");

  const cancelButton = new ButtonBuilder()
    .setCustomId("cancel_purchase")
    .setStyle(ButtonStyle.Danger)
    .setLabel("✕");

  const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

  const response = await interaction.reply({
    embeds: [embed],
    components: [row],
    fetchReply: true,
  });

  const collector = response.createMessageComponentCollector({
    time: 60000,
  });

  collector.on("collect", async (i) => {
    if (i.customId === "confirm_purchase") {
      try {
        // Process the purchase
        user.hyperBlockPoints -= item.price;
        user.purchases.push({
          itemId: item._id,
          totalPrice: item.price,
        });

        if (item.quantity > 0) {
          item.quantity -= 1;
          await item.save();
        }

        await user.save();

        if (item.role) {
          try {
            const member = await i.guild.members.fetch(i.user.id);
            await member.roles.add(item.role);

            await i.update({
              content: `Successfully purchased the item for ${item.price} points! The role has been added to your profile.`,
              embeds: [],
              components: [],
            });
          } catch (roleError) {
            console.error("Role assignment error:", roleError);
            await i.update({
              content: `Purchase successful, but there was an issue adding the role. Please contact an administrator.\nError: ${roleError.message}`,
              embeds: [],
              components: [],
            });
          }
        } else {
          await i.update({
            content: `Successfully purchased the item for ${item.price} points!`,
            embeds: [],
            components: [],
          });
        }
      } catch (error) {
        await i.update({
          content: "An error occurred while processing your purchase.",
          embeds: [],
          components: [],
        });
      }
    }

    if (i.customId === "cancel_purchase") {
      await i.update({
        content: "Purchase cancelled.",
        embeds: [],
        components: [],
      });
    }

    collector.stop();
  });

  // Handle collector end
  collector.on("end", (collected, reason) => {
    if (reason === "time") {
      interaction
        .editReply({
          content: "Purchase confirmation timed out.",
          embeds: [],
          components: [],
        })
        .catch(console.error);
    }
  });
}catch(e){console.log(e)}
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

  if (new Date() < giveaway.startTime) {
    return await interaction.reply({
      content: "This giveaway has not started yet.",
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

  const serverMembership = user.serverMemberships.find(
    (membership) => membership.guildId === interaction.guildId
  );

  if (!serverMembership) {
    return await interaction.reply({
      content: "You are not a member of this server or missing required data.",
      ephemeral: true,
    });
  }
  if (!serverMembership || serverMembership.points < giveaway.entryCost) {
    return await interaction.reply({
      content: "Insufficient points in this server to enter the giveaway.",
      ephemeral: true,
    });
  }

  // Check if the user is a member of the server

  if (giveaway.roleRequired) {
    const requiredRoleId = giveaway.roleRequired;
    const member = interaction.guild.members.cache.get(interaction.user.id);
    if (!member.roles.cache.has(requiredRoleId)) {
      return await interaction.reply({
        content: "You don't have the required role to join this giveaway.",
        ephemeral: true,
      });
    }
  }

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
  serverMembership.points -= giveaway.entryCost;
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

async function handleDeleteGiveaway(interaction) {
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
    `📋 Select a giveaway from the menu below to Enter.\n\n` +
    `Total Giveaways: ${guildGiveaways.length}`;

  await sendSelectMenu(
    interaction,
    content,
    `delete_giveaway_select`,
    "🎟️ Choose a giveaway to view or enter...",
    giveawayOptions
  );
}

async function handleAddAuction(interaction) {
  const fieldOptions = [
    {
      label: "Name of Item",
      customId: "item_name",
      placeholder: "Enter Name of Item",
      style: "Short",
      require: true,
    },
    {
      label: "Quantity of the Item",
      customId: "item_quantity",
      placeholder: "Enter quantity of the item",
      style: "Short",
      require: true,
    },
    {
      label: "Chain of the item",
      customId: "item_chain",
      placeholder: "Enter Chain of the item",
      style: "Short",
      require: true,
    },
    {
      label: "Duration time (2min/2hour/5days)",
      customId: "item_duration",
      placeholder: "Enter Duration of the item",
      style: "Short",
      require: true,
    },
    {
      label: "Description of the item",
      customId: "item_description",
      placeholder: "Enter description of the item",
      style: "Short",
      require: true,
    },
  ];

  await showModal(
    interaction,
    "Add Auction",
    "add_auction_model",
    fieldOptions
  );
}

async function handleEditAuction(interaction) {
  await displayActiveAuctions(interaction, "edit_auction_select");
}

async function handleDeleteAuction(interaction) {
  await displayActiveAuctions(interaction, "delete_auction_select");
}

async function handleBidAuction(interaction) {
  await displayActiveAuctions(interaction, "bid_auction_select");
}

async function handleFlipBag(interaction) {
  console.log("here");
  // Data for generating the image
  const cardData = {
    backgroundImagePath: "background.jpg",
    chipImagePath: "chip.png",
    iconsWithText: [
      {
        iconPath: "green.png",
        text: "Utilities of Paid Users:",
        iconSize: 14,
        xPosIcon: 15,
        yPosIcon: 25,
      },
      {
        iconPath: "png.png",
        text: "Create your card in your style",
        iconSize: 14,
        xPosIcon: 5,
        yPosIcon: 65,
      },
      {
        iconPath: "png.png",
        text: "Earn HyperBlock Points while ",
        iconSize: 14,
        xPosIcon: 5,
        yPosIcon: 85,
      },
      {
        iconPath: "png.png",
        text: "earning server's points",
        iconSize: 14,
        xPosIcon: 5,
        yPosIcon: 105,
      },
      {
        iconPath: "png.png",
        text: "Auto-enrolled in HyperBlock raffles",
        iconSize: 14,
        xPosIcon: 5,
        yPosIcon: 125,
      },
      {
        iconPath: "png.png",
        text: "with 888 points",
        iconSize: 14,
        xPosIcon: 5,
        yPosIcon: 145,
      },
      {
        iconPath: "whitearrow.png",
        text: "Auto-discount applied at Merch Store.",
        iconSize: 14,
        xPosIcon: 5,
        yPosIcon: 205,
      },
    ],
    footerText: [
      { text: "Future Airdrops from HyperBlock", xPos: 25, yPos: 175 },
      { text: "& much more", xPos: 25, yPos: 193 },
    ],
  };

  try {
    // Generate the image and get the file path
    const imagePath = await createCreditCardBackImage(cardData);
    console.log(imagePath);
    // // Create the attachment to send to Discord
    // const attachment = new MessageAttachment(imagePath);

    // Send the image as a response
    await interaction.update({
      content: "Here is your generated credit card image:",
      files: [imagePath],
    });
  } catch (err) {
    console.error("Error generating the image:", err);
    await interaction.update({
      content:
        "There was an error generating the credit card image. Please try again later.",
    });
  }
}

async function handlePlaceBidAuction(interaction, id) {
  const fieldOptions = [
    {
      label: "Add the Amount to Bid",
      customId: "bid_amount",
      placeholder: "Enter Bid Amount (1,2,4,5)",
      style: "Short",
    },
  ];

  await showModal(
    interaction,
    "Amount to Bid",
    `bid_amount_modal_${id}`,
    fieldOptions
  );
}

async function handleChangeWalletAuction(interaction, id) {
  const user = await User.findOne({ discordId: interaction.userId });
  if (!user) {
    await interaction.reply({
      content: "No User Found",
    });
  }

  const fieldOptions = [
    {
      label: "Change Wallet",
      customId: "change_wallet",
      placeholder: "Enter change Wallet",
      style: "Short",
    },
  ];

  await showModal(
    interaction,
    "Change Wallet",
    `change__wallet_modal_${id}`,
    fieldOptions
  );
}

async function handleContestButton(interaction) {
  try {
    const guild = interaction.guild;

    await interaction.reply("Events are here :");
    await sendEmbedWithButtons(
      guild,
      interaction.channelId,
      embedOptions,
      buttonOptions
    );
  } catch (e) {
    console.log(e);
  }
}

async function handleFunContestBtn(interaction) {
  const fieldOptions = [
    {
      label: "Title of the Contest",
      customId: "title_contest",
      placeholder: "Enter Title of the contest",
      style: "Short",
      required: true,
    },
    {
      label: "Duration Time to Submit (1 hour, 3 days, etc)",
      customId: "duation_contest",
      placeholder: "Enter Duration of the contest",
      style: "Short",
      required: true,
    },
    {
      label: "Number of winners",
      customId: "winners_contest",
      placeholder: "Enter Number of Winners",
      style: "Short",
      required: true,
    },
    {
      label: "Description about event",
      customId: "description_event",
      placeholder: "Enter Description for the Event",
      style: "Short",
      required: true,
    },
    {
      label: "Points for Participants",
      customId: "points_contest",
      placeholder: "Enter Points",
      style: "Short",
      required: true,
    },
  ];

  await showModal(
    interaction,
    "Contest Creation",
    "contest_creation_modal",
    fieldOptions
  );
}

async function handleJoinContest(interaction, itemId) {
  try {
    // Step 1: Fetch the contest from the database using itemId (contest._id)
    const contest = await Contest.findById(itemId);
    if (!contest) {
      return interaction.reply({
        content: "Contest not found.",
        ephemeral: true,
      });
    }

    // Step 2: Get the role ID assigned to participants in the contest
    const roleId = contest.roleAssignedToParticipant;
    if (!roleId) {
      return interaction.reply({
        content: "No role assigned to participants in this contest.",
        ephemeral: true,
      });
    }

    // Step 3: Get the role object from the guild
    const role = await interaction.guild.roles.fetch(roleId);
    if (!role) {
      return interaction.reply({
        content: "Role not found in the guild.",
        ephemeral: true,
      });
    }

    // Step 4: Assign the role to the user who clicked the button
    await interaction.member.roles.add(role);

    // Step 5: Send confirmation message to the user
    return interaction.reply({
      content: `You have successfully joined the contest **${contest.title}**! Good luck!`,
      ephemeral: true,
    });
  } catch (error) {
    console.error("Error handling join contest:", error);
    return interaction.reply({
      content:
        "An error occurred while processing your request. Please try again later.",
      ephemeral: true,
    });
  }
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
  handleAddedPurchaseItems,
  handleCreateGiveaway,
  joinGiveaway,
  handleEditGiveaway,
  handleDeleteGiveaway,
  handleAddAuction,
  handleEditAuction,
  handleDeleteAuction,
  handleBidAuction,
  handlePlaceBidAuction,
  handleChangeWalletAuction,
  handleFlipBag,
  handleContestButton,
  handleFunContestBtn,
  handleJoinContest,
};

async function displayActiveAuctions(interaction, selectId) {
  try {
    // Fetch active auctions for the current guild
    const auctions = await Auction.find({
      status: "active",
      guildId: interaction.guildId,
    });

    // If no active auctions found
    if (auctions.length === 0) {
      return interaction.reply({
        content: "There are no active auctions at the moment.",
        ephemeral: true,
      });
    }

    // Map the auctions to create select menu options
    const options = auctions.map((auction) => {
      return {
        label: `${auction.name} - ${auction.quantity} available`,
        value: auction._id.toString(),
        description: `Current bid: $${auction.currentBid}`,
        emoji: "💰",
      };
    });

    // Create the select menu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(selectId)
      .setPlaceholder("Select an auction to view details")
      .addOptions(options);

    // Create the action row and add the select menu to it
    const row = new ActionRowBuilder().addComponents(selectMenu);

    // Send the reply with the select menu
    await interaction.reply({
      content: "Please select an auction:",
      components: [row],
      ephemeral: true,
    });
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error fetching the auctions.",
      ephemeral: true,
    });
  }
}
