// modelActions.js
const {
  RoleSelectMenuBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ButtonBuilder,
} = require("discord.js");
const Guilds = require("../../models/Guilds");
const ShopItem = require("../../models/Shop");
const ms = require("ms");
const showModal = require("../modelHandler");
const sendSelectMenu = require("../selectMenuHandler");
const Giveaway = require("../../models/raffles");
const { updateGiveaway, generateItemEmbed } = require("../commons");
const EmbedMessages = require("../../models/EmbedMessages");
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
    await interaction.reply({
      content: "Points configuration updated successfully!",
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
    return await interaction.reply({
      content:
        "Invalid cooldown format. Please use a format like '2 mins' or '5 hours'.",
      ephemeral: true,
    });
  }

  let guildDoc = await Guilds.findOne({ guildId });

  if (guildDoc) {
    guildDoc.botConfig.chats.cooldown = cooldown;
    guildDoc.botConfig.chats.points = points;
    await guildDoc.save();

    await interaction.reply({
      content: "Chat configuration updated successfully!",
      ephemeral: true,
    });
  } else {
    await interaction.reply({
      content: "Guild not found. Please set up the server first.",
      ephemeral: true,
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
  const cooldown = ms(cooldownInput);

  if (!cooldown) {
    return await interaction.reply({
      content:
        "Invalid cooldown format. Please use a format like '2 mins' or '5 hours'.",
      ephemeral: true,
    });
  }

  let guildDoc = await Guilds.findOne({ guildId });

  if (guildDoc) {
    guildDoc.botConfig.reactions.cooldown = cooldown;
    guildDoc.botConfig.reactions.points = points;
    await guildDoc.save();

    await interaction.reply({
      content: "Chat configuration updated successfully!",
      ephemeral: true,
    });
  } else {
    await interaction.reply({
      content: "Guild not found. Please set up the server first.",
      ephemeral: true,
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
      content: "Please select the role that will be given to buyer of the item.",
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
    return await interaction.reply({
      content: "Shop item not found.",
      ephemeral: true,
    });
  }
  const updatedName = interaction.fields.getTextInputValue("item_name");
  const updatedDescription =
    interaction.fields.getTextInputValue("item_description") || "";
  const updatedQuantity = interaction.fields.getTextInputValue("item_quantity");

  const roleSelect = new RoleSelectMenuBuilder()
    .setCustomId("edititem_role_select")
    .setPlaceholder("Select roles")
    .setMinValues(1)
    .setMaxValues(1);

  const roleSelectRow = new ActionRowBuilder().addComponents(roleSelect);

  // Reply with the role selection menu
  await interaction.reply({
    content: "Please select roles that will be given to buyer of the item",
    components: [roleSelectRow],
    ephemeral: true,
  });

  const filter = (i) =>
    i.customId === "edititem_role_select" && i.user.id === interaction.user.id;
  const collector = interaction.channel.createMessageComponentCollector({
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
      roleInteraction.channel.createMessageComponentCollector({
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
        shopItem.role = selectedRoles;
        await shopItem.save();

        const item = await ShopItem.findById(id);
        const { embed, row } = generateItemEmbed(item, interaction);
        const embedMessage = await EmbedMessages.findOne({ itemId: id });
        console.log(embedMessage);
        const { guildId, channelId, messageId } = embedMessage;

        const guild = await interaction.client.guilds.fetch(guildId);
        if (!guild) {
          throw new Error("Guild not found.");
        }

        const channel = await guild.channels.fetch(channelId);
        console.log(channel);
        if (!channel) {
          throw new Error("Channel not found or is not a text channel.");
        }

        // Fetch the message and update it
        const message = await channel.messages.fetch(messageId);
        if (!message) {
          throw new Error("Message not found.");
        }

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

    buttonCollector.on("end", async (collected) => {
      if (!collected.size) {
        await roleInteraction.editReply({
          content: "Action timed out.",
          components: [],
        });
      }
    });
  });

  collector.on("end", async (collected) => {
    if (!collected.size) {
      await interaction.editReply({
        content: "Role selection timed out.",
        components: [],
      });
    }
  });
}
async function handleAddRaffle(interaction) {
  // if (!raffleTitle || raffleTitle.trim() === "") {
  //   return interaction.reply({
  //     content: "❌ Please provide a valid raffle title.",
  //     ephemeral: true,
  //   });
  // }

  // if (isNaN(numWinners) || numWinners <= 0) {
  //   return interaction.reply({
  //     content: "❌ The number of winners must be a positive number.",
  //     ephemeral: true,
  //   });
  // }

  // if (isNaN(entryCost) || entryCost < 0) {
  //   return interaction.reply({
  //     content: "❌ Entry cost must be a valid positive number.",
  //     ephemeral: true,
  //   });
  // }

  // if (!durationTime || isNaN(ms(durationTime))) {
  //   return interaction.reply({
  //     content:
  //       "❌ Please provide a valid duration time (e.g., '1 hour', '30 minutes').",
  //     ephemeral: true,
  //   });
  // }

  // if (!chain || chain.trim() === "") {
  //   return interaction.reply({
  //     content: "❌ Please provide a valid chain project.",
  //     ephemeral: true,
  //   });
  // }
  const giveaway = new Giveaway({
    guildId: interaction.guildId,
    raffleTitle: interaction.fields.getTextInputValue("raffle_title"),
    numWinners: Number(
      interaction.fields.getTextInputValue("num_of_winners") || 1
    ),
    entryCost: Number(interaction.fields.getTextInputValue("entry_cost")),
    endTime: new Date(
      Date.now() + ms(interaction.fields.getTextInputValue("duration_time"))
    ),
    chain: interaction.fields.getTextInputValue("chain_project"),
  });
  giveaway
    .save()
    .then(() => {
      console.log("Giveaway saved successfully!");
    })
    .catch((error) => {
      console.error("Error saving giveaway:", error);
    });

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
    options
  );
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

module.exports = {
  handleSocialSetupSubmission,
  handleSocialRewardsSubmission,
  handleActiveRewardsSetupSubmission,
  handleReactionRewardsSetupSubmission,
  handleAddItemModelSubmission,
  handleEditItemModelSubmission,
  handleAddRaffle,
  addRaffleOptionals,
};
