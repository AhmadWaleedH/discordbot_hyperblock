// modelActions.js
const {
  RoleSelectMenuBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ButtonBuilder,
  EmbedBuilder,
} = require("discord.js");
const { parse, isValid, format } = require("date-fns");
const Guilds = require("../../models/Guilds");
const ShopItem = require("../../models/Shop");
const ms = require("ms");
const showModal = require("../modelHandler");
const sendSelectMenu = require("../selectMenuHandler");
const Giveaway = require("../../models/raffles");
const { updateGiveaway, generateItemEmbed } = require("../commons");
const EmbedMessages = require("../../models/EmbedMessages");
const Auction = require("../../models/Auction");
const { placeBid } = require("../logics/bid");
const User = require("../../models/Users");
const Contest = require("../../models/Contests");
const { createGiveawayEmbed } = require("../embeds/giveawayEmbed");
const { walletRegexPatterns } = require("../constants");
const {
  createAuctionEmbedSaving,
  createAuctionEmbed,
} = require("../embeds/auctionEmbed");
async function handleSocialRewardsSubmission(interaction) {
  const guildId = interaction.guildId;
  const fields = interaction.fields;

  const actionPoints = {
    like: parseInt(fields.getTextInputValue("points_like")) || 0,
    comment: parseInt(fields.getTextInputValue("points_comment")) || 0,
    space: parseInt(fields.getTextInputValue("points_space")) || 0,
    retweet: parseInt(fields.getTextInputValue("points_rt")) || 0,
  };

  let guildDoc = await Guilds.findOne({ guildId });

  if (guildDoc) {
    guildDoc.pointsSystem.actions = {
      ...guildDoc.pointsSystem.actions,
      ...actionPoints,
    };
    await guildDoc.save();
    await interaction.update({
      content: "Points configuration updated successfully!",
      components: [],
      embeds: [],
      ephemeral: true,
    });
  } else {
    await interaction.reply({
      content: "Guild not found. Please set up the server first.",
      ephemeral: true,
    });
  }
}

async function handleSocialSetupSubmission(interaction) {
  const guildId = interaction.guildId;
  const twitterUrl = interaction.fields.getTextInputValue("twitter_link");

  let guildDoc = await Guilds.findOne({ guildId });

  if (guildDoc) {
    guildDoc.twitterUrl = twitterUrl;
    await guildDoc.save();
    await interaction.reply({
      content: "Twitter URL updated successfully!",
      ephemeral: true,
    });
  } else {
    await interaction.reply({
      content: "Guild not found. Please set up the server first.",
      ephemeral: true,
    });
  }
}

async function handleActiveRewardsSetupSubmission(interaction) {
  const guildId = interaction.guildId;
  const cooldownInput = interaction.fields.getTextInputValue(
    "active_reward_cooldown"
  );
  const points = parseInt(
    interaction.fields.getTextInputValue("active_reward_points"),
    0
  );
  const cooldown = ms(cooldownInput);

  if (!cooldown) {
    return await interaction.update({
      content:
        "Invalid cooldown format. Please use a format like '2 mins' or '5 hours'.",
      embeds: [],
      components: [],
      ephemeral: true,
    });
  }

  let guildDoc = await Guilds.findOne({ guildId });

  if (guildDoc) {
    guildDoc.botConfig.chats.cooldown = cooldown;
    guildDoc.botConfig.chats.points = points;
    await guildDoc.save();

    await interaction.update({
      content: "Chat configuration updated successfully!",
      ephemeral: true,
      embeds: [],
      components: [],
    });
  } else {
    await interaction.reply({
      content: "Guild not found. Please set up the server first.",
      ephemeral: true,
      embeds: [],
      components: [],
    });
  }
}

async function handleReactionRewardsSetupSubmission(interaction) {
  const guildId = interaction.guildId;
  const cooldownInput = interaction.fields.getTextInputValue(
    "reaction_reward_cooldown"
  );
  const points = parseInt(
    interaction.fields.getTextInputValue("reaction_reward_points"),
    0
  );
  const cooldown = ms(cooldownInput + " minutes");

  if (!cooldown) {
    return await interaction.update({
      content:
        "Invalid cooldown format. Please use a format like '2 mins' or '5 hours'.",
      embeds: [],
      components: [],
      ephemeral: true,
    });
  }

  let guildDoc = await Guilds.findOne({ guildId });

  if (guildDoc) {
    guildDoc.botConfig.reactions.cooldown = cooldown;
    guildDoc.botConfig.reactions.points = points;
    await guildDoc.save();

    await interaction.update({
      content: "Chat configuration updated successfully!",
      ephemeral: true,
      embeds: [],
      components: [],
    });
  } else {
    await interaction.update({
      content: "Guild not found. Please set up the server first.",
      ephemeral: true,
      embeds: [],
      components: [],
    });
  }
}

async function handleAddItemModelSubmission(interaction) {
  const guildId = interaction.guildId;

  // Retrieve values from interaction fields
  const name = interaction.fields.getTextInputValue("item_name");
  const price = interaction.fields.getTextInputValue("item_price");
  const description =
    interaction.fields.getTextInputValue("item_description") || "";
  const quantity = interaction.fields.getTextInputValue("item_quantity");
  const allowMultiple = interaction.fields.getTextInputValue("item_multiple");

  // Check required fields
  if (!name || !price) {
    return await interaction.reply({
      content: "Name and price are required fields.",
      ephemeral: true,
    });
  }

  // Build item data
  const itemData = {
    name,
    price: parseFloat(price),
  };

  // Handle optional fields if filled
  if (description) itemData.description = description;
  if (quantity) itemData.quantity = parseInt(quantity, 10) || -1; // Default to -1 for unlimited
  if (allowMultiple) {
    itemData.allowMultiplePurchases = allowMultiple.toLowerCase() === "yes"; // Convert yes/no to boolean
  }

  // Fetch guild document and add new item to shop
  let guildDoc = await Guilds.findOne({ guildId });

  if (!guildDoc) {
    return await interaction.reply({
      content: "Guild not found. Please set up the server first.",
      ephemeral: true,
    });
  }

  try {
    // Create new ShopItem and link to guild
    const newShopItem = new ShopItem({
      ...itemData,
      server: guildDoc._id,
    });

    await newShopItem.save();

    // Add item reference to guild's shop array and save
    guildDoc.shop.push(newShopItem._id);
    await guildDoc.save();

    const roleSelect = new RoleSelectMenuBuilder()
      .setCustomId(`add_item_select_${newShopItem._id}`)
      .setPlaceholder("Select roles")
      .setMinValues(1)
      .setMaxValues(1);

    const row = new ActionRowBuilder().addComponents(roleSelect);
    await interaction.reply({
      content:
        "Please select the role that will be given to buyer of the item.",
      components: [row],
      ephemeral: true,
    });
  } catch (error) {
    console.error("Error saving shop item:", error);
    await interaction.reply({
      content: "There was an error saving the shop item.",
      ephemeral: true,
    });
  }
}

async function handleEditItemModelSubmission(interaction, id) {
  const shopItem = await ShopItem.findById(id);

  if (!shopItem) {
    return await interaction.update({
      content: "Shop item not found.",
      ephemeral: true,
      components: [],
      embeds: [],
    });
  }
  const updatedName = interaction.fields.getTextInputValue("item_name");
  const updatedDescription =
    interaction.fields.getTextInputValue("item_description") || "";
  const updatedQuantity = interaction.fields.getTextInputValue("item_quantity");

  const updatedPrice = interaction.fields.getTextInputValue("item_price");

  if (updatedQuantity && isNaN(updatedQuantity)) {
    return interaction.update({
      content: "Quantity must be a positive number.",
      components: [],
      embeds: [],
      ephemeral: true,
    });
  }

  // Simple validation for price (if provided, must be a positive number)
  if (updatedPrice && (isNaN(updatedPrice) || parseFloat(updatedPrice) <= 0)) {
    return interaction.reply({
      content: "Price must be a positive number.",
      components: [],
      embeds: [],
      ephemeral: true,
    });
  }

  const roleSelect = new RoleSelectMenuBuilder()
    .setCustomId("edititem_role_select")
    .setPlaceholder("Select roles")
    .setMinValues(1)
    .setMaxValues(1);

  const roleSelectRow = new ActionRowBuilder().addComponents(roleSelect);

  // Reply with the role selection menu
  await interaction.update({
    content: "Please select roles that will be given to buyer of the item",
    components: [roleSelectRow],
    embeds: [],
    ephemeral: true,
  });

  const filter = (i) =>
    i.customId === "edititem_role_select" && i.user.id === interaction.user.id;
  const collector = interaction.message.createMessageComponentCollector({
    filter,
    max: 1,
    time: 60000,
  });

  collector.on("collect", async (roleInteraction) => {
    const selectedRoles = roleInteraction.values[0]; // Collect selected roles

    // Show submit/cancel buttons after role selection
    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("submit_edit")
        .setLabel("Submit")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("delete_item")
        .setLabel("Delete Item")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("cancel_edit")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Primary)
    );

    await roleInteraction.update({
      content: "Confirm your choices:",
      components: [actionRow],
    });

    const buttonCollector =
      roleInteraction.message.createMessageComponentCollector({
        filter: (i) =>
          i.user.id === interaction.user.id &&
          ["submit_edit", "cancel_edit", "delete_item"].includes(i.customId),
        max: 1,
        time: 30000,
      });

    buttonCollector.on("collect", async (buttonInteraction) => {
      if (buttonInteraction.customId === "submit_edit") {
        shopItem.name = updatedName;
        shopItem.description = updatedDescription;
        shopItem.quantity = parseInt(updatedQuantity, 10) || -1;
        shopItem.price = parseInt(updatedPrice, 10) || 1;
        shopItem.role = selectedRoles;
        await shopItem.save();

        const item = await ShopItem.findById(id);
        const { embed, row } = generateItemEmbed(item, interaction);
        const embedMessage = await EmbedMessages.findOne({ itemId: id });
        console.log(embedMessage);
        const { guildId, channelId, messageId } = embedMessage;

        const guild = await interaction.client.guilds.cache.get(guildId);
        if (!guild) return;

        const channel = await guild.channels.cache.get(channelId);
        console.log(channel);
        if (!channel) return;
        // Fetch the message and update it
        const message = await channel.messages
          .fetch(messageId)
          .catch(console.error);
        if (!message) return;

        await message.edit({
          embeds: [embed],
          components: [row],
        });
        await buttonInteraction.update({
          content: "Shop item updated successfully!",
          components: [],
        });
      } else if (buttonInteraction.customId === "delete_item") {
        console.log("ok");
        await ShopItem.findByIdAndDelete(id);
        await Guilds.updateMany({ shop: id }, { $pull: { shop: id } });

        await buttonInteraction.update({
          content: "Shop item deleted successfully.",
          components: [],
        });
      } else if (buttonInteraction.customId === "cancel_edit") {
        await buttonInteraction.update({
          content: "Editing process canceled.",
          components: [],
        });
      }
    });
  });
}
async function handleAddRaffle(interaction) {
  const raffleTitle = interaction.fields.getTextInputValue("raffle_title");
  const numWinners = Number(
    interaction.fields.getTextInputValue("num_of_winners") || 1
  );
  const entryCost = Number(interaction.fields.getTextInputValue("entry_cost"));

  if (isNaN(numWinners) || numWinners <= 0) {
    return interaction.reply({
      content: "❌ The number of winners must be a positive number.",
      ephemeral: true,
    });
  }

  if (isNaN(entryCost) || entryCost < 0) {
    return interaction.reply({
      content: "❌ Entry cost must be a valid positive number.",
      ephemeral: true,
    });
  }

  const giveaway = new Giveaway({
    guildId: interaction.guildId,
    guildName: interaction.guild.name,
    raffleTitle: raffleTitle,
    numWinners: numWinners,
    entryCost: entryCost,
  });
  await giveaway.save();

  const options = [
    {
      label: "Run",
      description: "Just want to go ahead and save the required data..",
      value: "none",
    },
    {
      label: "Description",
      description: "Add description for the page",
      value: "description",
    },
    {
      label: "Chain",
      description: "Add chain for the project",
      value: "project_chain",
    },
    {
      label: "Partner Twitter Page ",
      description: "Partner Twitter Page ",
      value: "twitter_page",
    },
    {
      label: "Role to Assigned for winners ",
      description: "Role Assigned for winners",
      value: "role_assigned",
    },
    {
      label: "Role allowed to enter",
      description: "Role Allowed to enter",
      value: "role_allowed_enter",
    },
    {
      label: "Entries limited",
      description: "Limited Entries to be entered",
      value: "entries_limited",
    },
    {
      label: "Notes for participants to follow",
      description: "Notes for participants to follow",
      value: "notes_follow",
    },
  ];

  await sendSelectMenu(
    interaction,
    "Choose your Optional Settings for the Raffle!",
    `add_optionalgiveaway_select_${giveaway._id}`,
    "Make a selection!",
    options,
    false
  );
}

async function addGiveawayTimer(interaction, id) {
  const doc = await Guilds.findOne({ guildId: interaction.guildId });
  const raffleChannelId = doc.botConfig.userChannels.raffles;

  const isValidDate = (date) => {
    const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/; // DD/MM/YYYY
    return regex.test(date);
  };

  const isValidTime = (time) => {
    const regex = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s(AM|PM)$/i;
    return regex.test(time);
  };

  // Get the values entered by the user
  const startDate = interaction.fields.getTextInputValue("giveaway_start_date");
  const startTime = interaction.fields.getTextInputValue("giveaway_start_time");
  const endDate = interaction.fields.getTextInputValue("giveaway_end_date");
  const endTime = interaction.fields.getTextInputValue("giveaway_end_time");
  if (!isValidDate(startDate)) {
    return interaction.reply({
      content: "Invalid start date. Please use the format DD/MM/YYYY.",
      ephemeral: true,
    });
  }

  if (!isValidTime(startTime)) {
    return interaction.reply({
      content: "Invalid start time. Please use the format HH:MM AM/PM.",
      ephemeral: true,
    });
  }

  if (!isValidDate(endDate)) {
    return interaction.reply({
      content: "Invalid end date. Please use the format DD/MM/YYYY.",
      ephemeral: true,
    });
  }

  if (!isValidTime(endTime)) {
    return interaction.reply({
      content: "Invalid end time. Please use the format HH:MM AM/PM.",
      ephemeral: true,
    });
  }

  const parseDateTime = (dateStr, timeStr) => {
    const dateTimeStr = `${dateStr} ${timeStr}`;
    console.log(dateTimeStr);
    // Parse the date and time using date-fns. Expect format: DD/MM/YYYY HH:mm AM/PM
    const parsedDate = parse(dateTimeStr, "dd/MM/yyyy hh:mm a", new Date());
    return parsedDate;
  };

  try {
    const startDateTime = parseDateTime(startDate, startTime);
    const endDateTime = parseDateTime(endDate, endTime);

    console.log(startDateTime);
    console.log(endDateTime);
    // Check if the parsed dates are valid
    if (!isValid(startDateTime)) {
      return interaction.reply({
        content:
          "Invalid start date and time format. Please use the correct format.",
        ephemeral: true,
      });
    }

    if (!isValid(endDateTime)) {
      return interaction.reply({
        content:
          "Invalid end date and time format. Please use the correct format.",
        ephemeral: true,
      });
    }
    // Find the giveaway by ID and update startTime and endTime
    const giveaway = await Giveaway.findById(id);
    if (!giveaway) {
      return interaction.reply({
        content: "Giveaway not found!",
        ephemeral: true,
      });
    }

    // Update the giveaway with new times
    giveaway.startTime = startDateTime.getTime(); // Save as timestamp
    giveaway.endTime = endDateTime;

    // Save the updated giveaway to the database
    await giveaway.save();
    const { embed, components } = createGiveawayEmbed(giveaway);
    const raffleChannel = interaction.guild.channels.cache.get(raffleChannelId);
    if (!raffleChannel) {
      return interaction.update({
        content:
          "The raffle channel could not be found. Please check the configuration.",
        ephemeral: true,
        components: [],
      });
    }
    const sentMessage = await raffleChannel.send({
      embeds: [embed],
      components: components,
    });
    await interaction.update({
      content: "The raffle has been sent to the channel!",
      ephemeral: true,
      components: [],
    });
    giveaway.messageId = sentMessage.id;
    giveaway.channelId = raffleChannelId;
    giveaway.channelName = raffleChannel.name;
    await giveaway.save();
  } catch (error) {
    console.error(error);
    return interaction.reply({
      content: "An error occurred while updating the giveaway times.",
      ephemeral: true,
    });
  }
}

async function addRaffleOptionals(
  interaction,
  id,
  key,
  dbKey,
  type = "String"
) {
  let val;
  if (type === "Number") {
    val = Number(interaction.fields.getTextInputValue(key));
  } else {
    val = interaction.fields.getTextInputValue(key);
  }

  await updateGiveaway(interaction, id, {
    [dbKey]: val,
  });
}

async function addAuctionModal(interaction) {
  try {
    const guildId = interaction.guildId;
    const guildName = interaction.guild.name; // Get the guild name
    const name = interaction.fields.getTextInputValue("item_name").trim();
    const chain = interaction.fields.getTextInputValue("item_chain").trim();
    const description =
      interaction.fields.getTextInputValue("item_description")?.trim() || "";
    const quantityInput = interaction.fields
      .getTextInputValue("item_quantity")
      .trim();
    const durationInput = interaction.fields
      .getTextInputValue("item_duration")
      .trim();

    // Validate name
    if (!name || name.length < 3) {
      return interaction.reply({
        content: "❌ The item name must be at least 3 characters long.",
        ephemeral: true,
      });
    }

    // Validate chain
    if (!chain || chain.length < 3) {
      return interaction.reply({
        content: "❌ The chain name must be at least 3 characters long.",
        ephemeral: true,
      });
    }

    // Validate quantity
    const quantity = parseInt(quantityInput, 10);
    if (isNaN(quantity) || quantity <= 0) {
      return interaction.reply({
        content: "❌ Quantity must be a valid number greater than 0.",
        ephemeral: true,
      });
    }

    // Validate and convert duration
    const durationMs = ms(durationInput);
    if (!durationMs) {
      return interaction.reply({
        content:
          "❌ Duration must be a valid time string (e.g., '1 min', '10 hours').",
        ephemeral: true,
      });
    }

    const duration = new Date(Date.now() + durationMs);

    // Create the auction document
    const newAuction = new Auction({
      guildId,
      guildName,
      name,
      chain,
      description,
      quantity,
      duration,
    });

    // Saving the document to the database
    await newAuction.save();

    const roleSelect = new RoleSelectMenuBuilder()
      .setCustomId(`add_auction_role_select_${newAuction._id}`)
      .setPlaceholder(
        "Select Select Role that will be given to the winner after winning auction"
      )
      .setMinValues(1)
      .setMaxValues(1);

    const row = new ActionRowBuilder().addComponents(roleSelect);
    await interaction.reply({
      content: "Please select your roles:",
      components: [row],
      ephemeral: true,
    });
  } catch (error) {
    console.error("Error creating auction:", error);

    // Inform the user about the error
    await interaction.reply({
      content: `An error occurred while creating the auction. Please try again later.`,
      ephemeral: true,
    });
  }
}

async function editAuctionModal(interaction, id) {
  const guildId = interaction.guildId;
  const name = interaction.fields.getTextInputValue("item_name").trim();
  const minimum_bid = interaction.fields
    .getTextInputValue("minimum_bid")
    .trim();
  const description =
    interaction.fields.getTextInputValue("item_description")?.trim() || "";
  const quantityInput = interaction.fields
    .getTextInputValue("item_quantity")
    .trim();

  if (!name || name.length < 3) {
    return interaction.reply({
      content: "Please provide a valid item name (at least 3 characters).",
      ephemeral: true,
    });
  }

  const quantity = parseInt(quantityInput, 10);
  if (isNaN(quantity) || quantity < 1) {
    return interaction.reply({
      content: "Please provide a valid quantity (must be a positive integer).",
      ephemeral: true,
    });
  }

  const minBid = parseFloat(minimum_bid);
  if (isNaN(minBid) || minBid < 0) {
    return interaction.reply({
      content:
        "Please provide a valid minimum bid (must be a positive number).",
      ephemeral: true,
    });
  }

  if (description && description.length > 500) {
    return interaction.reply({
      content: "Description is too long. Please keep it under 500 characters.",
      ephemeral: true,
    });
  }
  console.log(id);
  const auction = await Auction.findById(id);
  auction.name = name;
  auction.description = description;
  auction.minimumBid = minBid;
  auction.quantity = quantity;
  auction.save();

  const embedMessage = await EmbedMessages.findOne({ itemId: id });
  if (!embedMessage) {
    throw new Error("Could not find message data for this auction");
  }

  // Get the channel
  const channel = interaction.guild.channels.cache.get(embedMessage.channelId);
  if (!channel) {
    throw new Error(`Channel ${embedMessage.channelId} not found`);
  }

  // Fetch the message
  const message = await channel.messages.fetch(embedMessage.messageId);
  if (!message) {
    throw new Error("Could not find the auction message");
  }

  // Create new embed with updated auction data
  const { embed, components } = createAuctionEmbed(auction);

  // Edit the message
  await message.edit({
    embeds: [embed],
    components: components,
  });
  await interaction.reply({
    content: "Auction Edited Successfully.",
    ephemeral: true,
  });
}

async function handleBidAmountModal(interaction, id) {
  const bid_amount = interaction.fields.getTextInputValue("bid_amount").trim();

  const bid = parseInt(bid_amount, 10);
  if (isNaN(bid) || bid <= 0) {
    return interaction.reply({
      content: "❌ bid must be a valid number greater than 0.",
      ephemeral: true,
    });
  }

  const result = await placeBid(
    id,
    interaction.user.id,
    bid_amount,
    interaction.guildId,
    interaction.user.username
  );

  const auction = await Auction.findById(id);
  const embedMessage = await EmbedMessages.findOne({ itemId: id });
  if (!embedMessage) {
    throw new Error("Could not find message data for this auction");
  }

  // Get the channel
  const channel = interaction.guild.channels.cache.get(embedMessage.channelId);
  if (!channel) {
    throw new Error(`Channel ${embedMessage.channelId} not found`);
  }

  // Fetch the message
  const message = await channel.messages.fetch(embedMessage.messageId);
  if (!message) {
    throw new Error("Could not find the auction message");
  }

  // Create new embed with updated auction data
  const { embed, components } = createAuctionEmbed(auction);

  // Edit the message
  await message.edit({
    embeds: [embed],
    components: components,
  });

  if (result.success) {
    await interaction.reply({
      content: `Bid placed successfully!`,
      ephemeral: true,
    });
    // Update auction embed
    // ...
  } else {
    await interaction.reply({
      content: `Failed to place bid: ${result.error}`,
      ephemeral: true,
    });
  }
}

async function handleChangeWalletModal(interaction, id) {
  const change_wallet = interaction.fields
    .getTextInputValue("change_wallet")
    .trim();
  const userId = interaction.user.id;
  const auction = await Auction.findById(id);

  if (!auction) {
    return interaction.reply("Auction not found.");
  }

  const userBid = auction.bidders.find((bidder) => bidder.userId === userId);

  if (!userBid) {
    return interaction.reply(
      "You need to place a bid before changing your wallet address."
    );
  }
  userBid.walletAddress = change_wallet;
  await auction.save();

  return interaction.reply(
    `Your wallet address has been updated to: ${change_wallet}`
  );
}

async function handleSocialSettingsModal(interaction) {
  const x_account_handle = interaction.fields
    .getTextInputValue("x_account_handle")
    .trim();

  // Get optional account handles. If the user hasn't provided them, they'll be null or empty.
  const tg_account_handle =
    interaction.fields.getTextInputValue("tg_account_handle").trim() || null;
  const yt_account_handle =
    interaction.fields.getTextInputValue("yt_account_handle").trim() || null;
  const tiktok_account_handle =
    interaction.fields.getTextInputValue("tiktok_account_handle").trim() ||
    null;
  const ig_account_handle =
    interaction.fields.getTextInputValue("ig_account_handle").trim() || null;

  // Get the user's Discord ID (this can be passed through interaction)
  const discordId = interaction.user.id;

  // Prepare the social media handles
  const socials = {
    x: x_account_handle, // Required
    tg: tg_account_handle, // Optional
    yt: yt_account_handle, // Optional
    tiktok: tiktok_account_handle, // Optional
    ig: ig_account_handle, // Optional
  };

  try {
    // Check if the user exists in the database
    let user = await User.findOne({ discordId });

    if (!user) {
      // User doesn't exist, create a new user with the provided social handles
      user = new User({
        discordId,
        discordUsername: interaction.user.username,
        discordUserAvatarURL: interaction.user.displayAvatarURL(),
        socials,
      });

      // Optionally, you can set walletAddress and hyperBlockPoints here
      // user.walletAddress = someAddress;
      // user.hyperBlockPoints = 0;
    } else {
      // User exists, update the socials field, ensuring only non-null values are set
      user.socials = socials;
    }

    // Save the user
    await user.save();

    // Respond to the interaction
    await interaction.reply({
      content: "Your social media handles have been updated!",
      ephemeral: true,
    });
  } catch (error) {
    console.error("Error handling social settings:", error);
    await interaction.reply({
      content:
        "There was an error updating your social media handles. Please try again later.",
      ephemeral: true,
    });
  }
}
async function handleMintWalletModals(interaction, itemId) {
  const userId = interaction.user.id;
  const wallet_address =
    interaction.fields.getTextInputValue("wallet_address").trim() || null;

  console.log(wallet_address);

  // Find the matching regex object based on itemId
  const walletData = walletRegexPatterns.find(
    (wallet) => wallet.value === itemId
  );

  if (!walletData) {
    return interaction.reply({
      content: `Invalid cryptocurrency selection.`,
      ephemeral: true,
    });
  }
  console.log(walletData);
  // Validate wallet address
  if (!walletData.regex.test(wallet_address)) {
    return interaction.reply({
      content: `Invalid ${itemId} wallet address format. Please enter a correct address.`,
      ephemeral: true,
    });
  }

  let user = await User.findOne({ discordId: userId });

  if (!user) {
    user = new User({
      discordId: userId,
      discordUsername: interaction.user.username,
      discordUserAvatarURL: interaction.user.displayAvatarURL(),
      mintWallets: {},
    });
  }

  user.mintWallets[itemId] = wallet_address;

  await user.save();

  return interaction.reply({
    content: `Successfully added your ${itemId} wallet address!`,
    ephemeral: true,
  });
}
async function handleContestCreationModal(interaction) {
  const title = interaction.fields.getTextInputValue("title_contest");
  const duration = interaction.fields.getTextInputValue("duation_contest");
  const winners = interaction.fields.getTextInputValue("winners_contest");
  const description = interaction.fields.getTextInputValue("description_event");
  const points = interaction.fields.getTextInputValue("points_contest");

  if (!title || !duration || !winners || !description) {
    return await interaction.reply({
      content: "All fields are required!",
      ephemeral: true,
    });
  }

  const durationMs = ms(duration);

  if (!durationMs) {
    return await interaction.reply({
      content:
        "The duration must be in a valid format like '2 hours', '3 days', etc.",
      ephemeral: true,
    });
  }

  if (isNaN(winners) || parseInt(winners) < 1 || parseInt(winners) > 5) {
    return await interaction.reply({
      content:
        "Number of winners must be a valid number and at least 1 and less than 5.",
      ephemeral: true,
    });
  }

  if (isNaN(points) || parseInt(points) < 1) {
    return await interaction.reply({
      content: "points of particpans must be a valid number and at least 1.",
      ephemeral: true,
    });
  }

  const endTime = new Date(Date.now() + durationMs);
  const contest = new Contest({
    guildId: interaction.guild.id,
    guildName: interaction.guild.name,
    title,
    duration: endTime,
    numberOfWinners: parseInt(winners),
    description,
    pointsForParticipants: parseInt(points),
  });

  await contest.save();
  const roleSelect = new RoleSelectMenuBuilder()
    .setCustomId(`contest_creation_select_${contest._id}`)
    .setPlaceholder("Select roles")
    .setMinValues(1)
    .setMaxValues(1);

  const row = new ActionRowBuilder().addComponents(roleSelect);
  await interaction.reply({
    content:
      "Please Select the role that will be assigned to user in the event:",
    components: [row],
    ephemeral: true,
  });
}

async function handleEndGivewayModal(interaction, itemId) {
  try {
    const raffle_name = interaction.fields.getTextInputValue("raffle_name");

    const giveaway = await Giveaway.findById(itemId);

    if (!giveaway) {
      return interaction.reply({
        content: "Giveaway not found.",
        ephemeral: true,
      });
    }

    // Compare the raffle title with the user-provided raffle name
    if (
      giveaway.raffleTitle.toLowerCase() !== raffle_name.toLowerCase().trim()
    ) {
      return interaction.reply({
        content: "🎟️ Raffle Title does not match. Try again!",
        ephemeral: true,
      });
    }

    if (
      giveaway.isExpired ||
      (giveaway.endTime && giveaway.endTime <= new Date())
    ) {
      return interaction.reply({
        content: "⏰ This giveaway has already ended or expired.",
        ephemeral: true,
      });
    }

    const winners = selectRandomWinners(
      giveaway.participants,
      giveaway.numWinners
    );

    // Update giveaway with winners and mark as expired
    giveaway.winners = winners.map((participant) => ({
      userId: participant.userId,
      userName: participant.userName,
    }));
    giveaway.isExpired = true;
    await giveaway.save();

    // Get the channel
    const channel = await interaction.client.channels.fetch(giveaway.channelId);

    // Send winner announcement to channel
    const winnerEmbed = createWinnerEmbed(giveaway, winners);
    await channel.send({ embeds: [winnerEmbed] });

    const guildData = await Guilds.findOne({ guildId: giveaway.guildId });

    if (guildData?.botConfig?.userChannels?.leaderboard) {
      const leaderboardChannelId = guildData.botConfig.userChannels.leaderboard;
      const leaderboardChannel =
        await interaction.client.channels.fetch(leaderboardChannelId);

      if (leaderboardChannel) {
        await leaderboardChannel.send({ embeds: [winnerEmbed] });
      }
    }

    // Notify winners via DM
    for (const winner of winners) {
      await notifyWinner(winner.userId, giveaway, interaction);
    }

    // If there's a winner role to assign
    if (giveaway.winnerRole) {
      const guild = await interaction.client.guilds.fetch(giveaway.guildId);
      for (const winner of winners) {
        try {
          const member = await interaction.guild.members.fetch(winner.userId);
          await member.roles.add(giveaway.winnerRole);
        } catch (error) {
          console.error(`Failed to assign role to ${winner.userId}:`, error);
        }
      }
    }

    await interaction.reply({ content: "giveaway Ended!", ephemeral: true });
  } catch (e) {
    console.log(e);
  }
}
module.exports = {
  handleSocialSetupSubmission,
  handleSocialRewardsSubmission,
  handleActiveRewardsSetupSubmission,
  handleReactionRewardsSetupSubmission,
  handleAddItemModelSubmission,
  handleEditItemModelSubmission,
  handleAddRaffle,
  addGiveawayTimer,
  addRaffleOptionals,
  addAuctionModal,
  editAuctionModal,
  handleBidAmountModal,
  handleChangeWalletModal,
  handleSocialSettingsModal,
  handleMintWalletModals,
  handleEndGivewayModal,
  handleContestCreationModal,
};

function selectRandomWinners(participants, numWinners) {
  // Step 1: Create a weighted pool that preserves each entry's chance
  // but tracks which user each entry belongs to
  const weightedPool = [...participants];

  // Step 2: Shuffle the weighted pool to randomize selection
  const shuffledPool = weightedPool.sort(() => 0.5 - Math.random());

  // Step 3: Select winners ensuring no user is picked twice
  const winners = [];
  const selectedUserIds = new Set();

  // Keep drawing until we have enough winners or exhausted all participants
  let poolIndex = 0;
  while (winners.length < numWinners && poolIndex < shuffledPool.length) {
    const currentEntry = shuffledPool[poolIndex];

    // If this user hasn't been selected yet, add them to winners
    if (!selectedUserIds.has(currentEntry.userId)) {
      winners.push(currentEntry);
      selectedUserIds.add(currentEntry.userId);
    }

    poolIndex++;
  }

  return winners;
}

function createWinnerEmbed(giveaway, winners) {
  return new EmbedBuilder()
    .setTitle(`🎉 Giveaway Ended: ${giveaway.raffleTitle}`)
    .setDescription(`Congratulations to the winners!`)
    .addFields(
      {
        name: "Winners",
        value: winners.map((w) => `<@${w.userId}>`).join("\n") || "No winners",
      },
      {
        name: "Prize",
        value: `Entry Cost: ${giveaway.entryCost} ${giveaway.chain}`,
      },
      { name: "Total Participants", value: `${giveaway.totalParticipants}` }
    )
    .setColor("#00FF00")
    .setTimestamp();
}

async function notifyWinner(userId, giveaway, interaction) {
  try {
    const user = await interaction.client.users.fetch(userId);
    const winnerEmbed = new EmbedBuilder()
      .setTitle("🎉 Congratulations! You Won!")
      .setDescription(`You have won the giveaway: ${giveaway.raffleTitle}`)
      .addFields(
        { name: "Prize", value: `${giveaway.entryCost} ${giveaway.chain}` },
        { name: "Notes", value: giveaway.notes || "No additional notes" }
      )
      .setColor("#00FF00")
      .setTimestamp();

    await user.send({ embeds: [winnerEmbed] });
  } catch (error) {
    console.error(`Failed to DM winner ${userId}:`, error);
  }
}
