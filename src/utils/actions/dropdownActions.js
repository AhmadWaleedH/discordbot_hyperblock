const {
  RoleSelectMenuBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const Guilds = require("../../models/Guilds");
const ShopItem = require("../../models/Shop");
const Users = require("../../models/Users");
const showModal = require("../modelHandler");
const ms = require("ms");
const sendSelectMenu = require("../selectMenuHandler");
const {
  updateGiveaway,
  handlePurchase,
  generateItemEmbed,
} = require("../commons");
const Giveaway = require("../../models/raffles");
const moment = require("moment");
const {
  createGiveawayEmbed,
  editGiveawayMessage,
} = require("../embeds/giveawayEmbed");
const EmbedMessages = require("../../models/EmbedMessages");
async function teamSetupAdminRole(interaction) {
  const roleIds = interaction.values;
  const guildId = interaction.guildId;
  let guildDoc = await Guilds.findOne({ guildId });
  if (guildDoc) {
    guildDoc.botConfig.adminRoles = roleIds;
    await guildDoc.save();
    await interaction.reply({
      content: "Admin roles updated successfully!",
      ephemeral: true,
    });
  } else {
    await interaction.reply({
      content: "Guild not found. Please set up the server first.",
      ephemeral: true,
    });
  }
}
async function pointsSetupAdminRole(interaction) {
  const guildId = interaction.guildId;
  const channelIds = interaction.values;
  let guildDoc = await Guilds.findOne({ guildId });
  if (guildDoc) {
    guildDoc.botConfig.chats.channels = channelIds;
    await guildDoc.save();
    const fieldOptions = [
      {
        label: "Cooldown",
        customId: "active_reward_cooldown",
        placeholder: "Enter Cooldown Between Messages",
        style: "Short",
      },
      {
        label: "Points",
        customId: "active_reward_points",
        placeholder: "Enter Points for messages",
        style: "Short",
      },
    ];
    await showModal(
      interaction,
      "Chat Rewards Configuration",
      "active_reward_model",
      fieldOptions
    );
  } else {
    await interaction.reply({
      content: "Guild not found. Please set up the server first.",
      ephemeral: true,
    });
  }
}
async function reactionRewardSetup(interaction) {
  const guildId = interaction.guildId;
  const channelIds = interaction.values;
  let guildDoc = await Guilds.findOne({ guildId });
  if (guildDoc) {
    guildDoc.botConfig.reactions.channels = channelIds;
    await guildDoc.save();
    const fieldOptions = [
      {
        label: "Cooldown",
        customId: "reaction_reward_cooldown",
        placeholder: "Enter Cooldown Between Messages",
        style: "Short",
      },
      {
        label: "Points",
        customId: "reaction_reward_points",
        placeholder: "Enter Points for messages",
        style: "Short",
      },
    ];
    await showModal(
      interaction,
      "Chat Rewards Configuration",
      "reaction_reward_model",
      fieldOptions
    );
  } else {
    await interaction.reply({
      content: "Guild not found. Please set up the server first.",
      ephemeral: true,
    });
  }
}
async function addItemRoleDropDown(interaction, id) {
  try {
    const selectedRoleId = interaction.values[0];
    const shopItem = await ShopItem.findById(id);
    if (!shopItem) {
      return interaction.reply({
        content: "Item not found.",
        ephemeral: true,
      });
    }
    shopItem.role = selectedRoleId;
    await shopItem.save();
    const options = [
      {
        label: "Run",
        description: "Dont want to add Blockchain / RoleGate",
        value: "none",
      },
      {
        label: "BlockChain of Item",
        description: "Select a block chain of an item",
        value: "blockchain",
      },
      {
        label: "Specific Role to purchase",
        description: "Slect role which only that one can purchase this item ",
        value: "rolegate",
      },
    ];
    await sendSelectMenu(
      interaction,
      "Choose your Optional Settings for the Items!",
      `add_optionalItems_select_${id}`,
      "Make a selection!",
      options
    );
  } catch (error) {
    console.error("Error updating shop item role:", error);
    await interaction.reply({
      content: "There was an error setting the role. Please try again.",
      ephemeral: true,
    });
  }
}
async function addAdditionalItemOptions(interaction, id) {
  const selectedAction = interaction.values[0];
  switch (selectedAction) {
    case "none": {
      const item = await ShopItem.findById(id);
      if (!item) {
        return interaction.reply("❌ **Item not found in the shop!**");
      }
      // Find the guild and get hypermarket channel
      const guild = await Guilds.findOne({ guildId: interaction.guild.id });
      if (!guild) {
        return interaction.reply("❌ **Server configuration not found!**");
      }
      const hypermarketChannelId = guild.botConfig.channels.hyperMarket;
      if (!hypermarketChannelId) {
        return interaction.reply("❌ **Hypermarket channel not configured!**");
      }
      const hypermarketChannel = await interaction.guild.channels.fetch(
        hypermarketChannelId
      );
      if (!hypermarketChannel) {
        return interaction.reply("❌ **Hypermarket channel not found!**");
      }
      const { embed, row } = generateItemEmbed(item, interaction);
      // Send to hypermarket channel
      const sentMessage = await hypermarketChannel.send({
        embeds: [embed],
        components: [row],
      });
      const guildId = sentMessage.guild.id;
      const channelId = sentMessage.channel.id;
      const messageId = sentMessage.id;
      const embedMessage = new EmbedMessages({
        itemId: id,
        guildId,
        channelId,
        messageId,
      });
      await embedMessage.save();
      // Confirm to user
      await interaction.reply("Items Created Successfully.");
      break;
    }
    case "blockchain": {
      const options = [
        {
          label: "Ethereum",
          description:
            "The leading decentralized platform for smart contracts.",
          value: "ethereum",
        },
        {
          label: "Binance Smart Chain",
          description:
            "A blockchain network running smart contract-based applications.",
          value: "binance",
        },
        {
          label: "Polygon",
          description:
            "A framework for building and connecting Ethereum-compatible blockchain networks.",
          value: "polygon",
        },
        {
          label: "Solana",
          description:
            "A high-performance blockchain supporting smart contracts and decentralized apps.",
          value: "solana",
        },
        {
          label: "Cardano",
          description:
            "A blockchain platform for smart contracts with a research-driven approach.",
          value: "cardano",
        },
      ];
      await sendSelectMenu(
        interaction,
        "Choose your BlockChain for the Items!",
        `additem_blockchain_select_${id}`,
        "Make a selection!",
        options
      );
      break;
    }
    case "rolegate": {
      const roleSelect = new RoleSelectMenuBuilder()
        .setCustomId(`additem_rolegate_select_${id}`)
        .setPlaceholder("Select roles")
        .setMinValues(1)
        .setMaxValues(1);
      const row = new ActionRowBuilder().addComponents(roleSelect);
      await interaction.reply({
        content: "Please select your roles:",
        components: [row],
        ephemeral: true,
      });
      break;
    }
    default:
      await interaction.reply("Invalid selection.");
      break;
  }
}
async function addItemBlockChainDropDown(interaction, id) {
  const selectedRoleId = interaction.values[0];
  const shopItem = await ShopItem.findById(id);
  if (!shopItem) {
    return interaction.reply({
      content: "Item not found.",
      ephemeral: true,
    });
  }
  shopItem.blockchainId = selectedRoleId;
  await shopItem.save();
  await interaction.reply({
    content: "Item Created Successfully.",
    ephemeral: true,
  });
}
async function addItemRoleGateDropDown(interaction, id) {
  const selectedRoleId = interaction.values[0];
  const shopItem = await ShopItem.findById(id);
  if (!shopItem) {
    return interaction.reply({
      content: "Item not found.",
      ephemeral: true,
    });
  }
  shopItem.requiredRoleToPurchase = selectedRoleId;
  await shopItem.save();
  await interaction.reply({
    content: "Item Created Successfully.",
    ephemeral: true,
  });
}
async function editItemDropdown(interaction) {
  const selectedItemId = interaction.values[0];
  console.log(selectedItemId);
  const shopItem = await ShopItem.findById(selectedItemId);
  if (!shopItem) {
    return await interaction.reply({
      content: "Shop item not found.",
      ephemeral: true,
    });
  }
  // // Create field options with pre-filled values
  const fieldOptions = [
    {
      label: "Name of the Item",
      customId: "item_name",
      placeholder: "Enter the name of the item",
      style: "Short",
      value: shopItem.name, // Pre-fill with the current value
    },
    {
      label: "Description of the Item",
      customId: "item_description",
      placeholder: "Enter description of the item",
      style: "Short",
      value: shopItem.description || "", // Pre-fill with the current value or empty
      required: false,
    },
    {
      label: "Quantity of the Item",
      customId: "item_quantity",
      placeholder: "Enter quantity for the item",
      style: "Short",
      value: shopItem.quantity !== -1 ? String(shopItem.quantity) : "", // Pre-fill with quantity or empty if unlimited
      required: false,
    },
  ];
  await showModal(
    interaction,
    "Edit Shop Item",
    `edit_item_modal_${shopItem._id}`,
    fieldOptions
  );
}
async function purchaseItemDropDown(interaction) {
  const itemId = interaction.values[0];
  const userId = interaction.user.id;
  const userRoles = interaction.member.roles.cache.map((role) => role.id);
  // First validate the purchase
  const validation = await handlePurchase(
    userId,
    itemId,
    userRoles,
    interaction.guild.id
  );
  if (!validation.success) {
    return await interaction.reply({
      content: validation.message,
      ephemeral: true,
    });
  }
  const { item, user, serverMembership } = validation;
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
        serverMembership.points -= item.price;
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
}
async function addRaffleOptionalDropDown(interaction, id) {
  console.log(interaction.guildId);
  const doc = await Guilds.findOne({ guildId: interaction.guildId });
  console.log(doc);
  const raffleChannelId = doc.botConfig.channels.raffles;
  const selectedOption = interaction.values[0];
  let modalCustomId;
  switch (selectedOption) {
    case "none": {
      const giveaway = await Giveaway.findById(id);
      if (!giveaway) {
        return interaction.reply({
          content: "Giveaway not found.",
          ephemeral: true,
        });
      }
      const { embed, components } = createGiveawayEmbed(giveaway);
      const raffleChannel =
        interaction.guild.channels.cache.get(raffleChannelId);
      if (!raffleChannel) {
        return interaction.reply({
          content:
            "The raffle channel could not be found. Please check the configuration.",
          ephemeral: true,
        });
      }
      const sentMessage = await raffleChannel.send({
        embeds: [embed],
        components: components,
      });
      await interaction.reply("the raffle has been sent to the channel!");
      giveaway.messageId = sentMessage.id;
      giveaway.channelId = raffleChannelId;
      await giveaway.save();
      break;
    }
    case "description":
      modalCustomId = `add_raffle_description_${id}`;
      await showModal(interaction, "Add Description", modalCustomId, [
        {
          label: "Description",
          customId: "description",
          placeholder: "Enter description of the raffle",
          style: "Short",
          required: true,
        },
      ]);
      break;
    case "twitter_page":
      modalCustomId = `add_raffle_twitter_${id}`;
      await showModal(interaction, "Add Twitter Page", modalCustomId, [
        {
          label: "Twitter Page",
          customId: "twitter_page_link",
          placeholder: "Enter twitter page of the raffle",
          style: "Short",
          required: true,
        },
      ]);
      break;
    case "role_assigned":
      const roleSelect = new RoleSelectMenuBuilder()
        .setCustomId(`add_raffleassign_role_${id}`)
        .setPlaceholder(
          "Select role too be assigned after user wins the giveaway"
        )
        .setMinValues(1)
        .setMaxValues(1);
      const row = new ActionRowBuilder().addComponents(roleSelect);
      await interaction.reply({
        content: "Please select your roles:",
        components: [row],
        ephemeral: true,
      });
      break;
    case "role_allowed_enter":
      const roleallowed = new RoleSelectMenuBuilder()
        .setCustomId(`add_raffleallowed_role_${id}`)
        .setPlaceholder("Select role needed to enter in the giveaway")
        .setMinValues(1)
        .setMaxValues(1);
      const btn = new ActionRowBuilder().addComponents(roleallowed);
      await interaction.reply({
        content: "Please select your roles:",
        components: [btn],
        ephemeral: true,
      });
      break;
    case "entries_limited":
      modalCustomId = `add_raffle_limit_${id}`;
      await showModal(interaction, "Add Entries limit", modalCustomId, [
        {
          label: "Entries Limited",
          customId: `add_entries_limited`,
          placeholder: "Entries limited",
          style: "Short",
          required: true,
        },
      ]);
      break;
    case "notes_follow":
      modalCustomId = `add_raffle_notes_${id}`;
      await showModal(interaction, "Add Raffle Notes", modalCustomId, [
        {
          label: "Notes to Follow",
          customId: `add_notes_follow"`,
          placeholder: "Notes to follow",
          style: "Short",
          required: true,
        },
      ]);
      break;
    default:
      console.log("Unknown selection.");
  }
}
async function addRaffleOptionalsDb(interaction, id, dbKey) {
  const value = await interaction.values[0];
  await updateGiveaway(interaction, id, {
    [dbKey]: value,
  });
}
async function editRaffleDropdown(interaction) {
  let selectedOptions = interaction.values[0];
  const options = [
    {
      label: "Name of Raffle",
      description: "Just want to go ahead and save the required data..",
      value: "edit_raffle_title",
    },
    {
      label: "No of winners",
      description: "Just want to go ahead and save the required data..",
      value: "edit_no_winners",
    },
    {
      label: "Chain of he project",
      description: "Just want to go ahead and save the required data..",
      value: "edit_chain_project",
    },
    {
      label: "Entry Cost ",
      description: "Just want to go ahead and save the required data..",
      value: "edit_entry_cost",
    },
    {
      label: "Duration time (2 hour, 5 days)",
      description: "Just want to go ahead and save the required data..",
      value: "edit_duration_time",
    },
    {
      label: "Description",
      description: "Add description for the page",
      value: "edit_description",
    },
    {
      label: "Partner Twitter Page ",
      description: "Partner Twitter Page ",
      value: "edit_twitter_page",
    },
    {
      label: "Entries limited",
      description: "Limited Entries to be entered",
      value: "edit_entries_limited",
    },
    {
      label: "Notes for participants to follow",
      description: "Notes for participants to follow",
      value: "edit_notes_follow",
    },
  ];
  await sendSelectMenu(
    interaction,
    "Which one you want to edit?",
    `edit_giveawayOptions_select_${selectedOptions}`,
    "Make a selection!",
    options
  );
  const giveaway = await Giveaway.findById(selectedOptions);
  const filter = (interaction) => {
    return interaction.customId.startsWith("edit_giveawayOptions_select_");
  };
  const collector = interaction.channel.createMessageComponentCollector({
    filter,
    time: 60000,
  });
  collector.on("collect", async (selectInteraction) => {
    try {
      const selectedValue = selectInteraction.values[0];
      const modalConfigs = {
        edit_raffle_title: {
          title: "Edit Giveaway Title",
          customId: "edit_giveaway_title",
          fieldOptions: [
            {
              label: "Giveaway Title",
              customId: "edit_title",
              placeholder: "Enter Giveaway Link",
              value: giveaway.raffleTitle,
              style: "Short",
            },
          ],
        },
        edit_no_winners: {
          title: "Edit Giveaway No of Winners",
          customId: "edit_no_winners",
          fieldOptions: [
            {
              label: "No Of Winners",
              customId: "no_of_winners",
              placeholder: "Enter No Of Winners",
              value: giveaway.numWinners.toString(),
              style: "Short",
            },
          ],
        },
        edit_chain_project: {
          title: "Edit Chain Project",
          customId: "edit_chain_project",
          fieldOptions: [
            {
              label: "Chain Project",
              customId: "edit_chain_project",
              placeholder: "Enter Chain project",
              value: giveaway.chain,
              style: "Short",
            },
          ],
        },
        edit_entry_cost: {
          title: "Edit Entry Cost (2 min, 5 hour) ",
          customId: "edit_entry_cost",
          fieldOptions: [
            {
              label: "Entry Cost ",
              customId: "edit_entry_cost",
              placeholder: "Enter Entry cost",
              value: giveaway.entryCost.toString(),
              style: "Short",
            },
          ],
        },
        edit_duration_time: {
          title: "Edit Duration Time",
          customId: "edit_duration_time",
          fieldOptions: [
            {
              label: " Duration Time",
              customId: "edit_duration_time",
              placeholder: "Enter Duration Time",
              style: "Short",
            },
          ],
        },
        edit_description: {
          title: "Edit Description",
          customId: "edit_description",
          fieldOptions: [
            {
              label: "Description",
              customId: "edit_description",
              placeholder: "Enter Description",
              value: giveaway.description || "",
              style: "Short",
            },
          ],
        },
        edit_twitter_page: {
          title: "Edit Twitter Page",
          customId: "edit_twitter_page",
          fieldOptions: [
            {
              label: " Twitter Page",
              customId: "edit_twitter_page",
              placeholder: "Enter Twitter Page",
              value: giveaway.partnerTwitter || "",
              style: "Short",
            },
          ],
        },
        edit_entries_limited: {
          title: "Edit Entries Limited",
          customId: "edit_entries_limited",
          fieldOptions: [
            {
              label: "Entries limited",
              customId: "edit_entries_limited",
              placeholder: "Edit Entries Limited",
              value: giveaway.entriesLimited?.toString(),
              style: "Short",
            },
          ],
        },
        edit_notes_follow: {
          title: "Edit Notes Follow",
          customId: "edit_notes_follow",
          fieldOptions: [
            {
              label: "Notes Follow",
              customId: "edit_notes_follow",
              placeholder: "Edit Notes Follow",
              value: giveaway.notes || "",
              style: "Short",
            },
          ],
        },
      };
      const modalConfig = modalConfigs[selectedValue];
      await showModal(
        selectInteraction,
        modalConfig.title,
        modalConfig.customId,
        modalConfig.fieldOptions
      );
      try {
        const filter = (i) => {
          return (
            i.customId === modalConfig.customId &&
            i.user.id === selectInteraction.user.id
          );
        };
        // Wait for modal submission
        const submitted = await selectInteraction.awaitModalSubmit({
          filter,
          time: 600000,
        });
        if (submitted) {
          const submittedFields = submitted.fields.fields;
          console.log(submittedFields);
          switch (selectedValue) {
            case "edit_raffle_title":
              giveaway.raffleTitle = submittedFields.get("edit_title").value;
              giveaway.save();
              await editGiveawayMessage(selectInteraction, giveaway);
              break;
            case "edit_no_winners":
              const noOfWinners = Number(
                submittedFields.get("no_of_winners").value
              );
              console.log(noOfWinners);
              giveaway.numWinners = noOfWinners;
              giveaway.save();
              await editGiveawayMessage(selectInteraction, giveaway);
              break;
            case "edit_chain_project":
              giveaway.chain = submittedFields.get("edit_chain_project").value;
              giveaway.save();
              await editGiveawayMessage(selectInteraction, giveaway);
              break;
            case "edit_entry_cost":
              giveaway.entryCost = Number(
                submittedFields.get("edit_entry_cost").value
              );
              giveaway.save();
              await editGiveawayMessage(selectInteraction, giveaway);
              break;
            case "edit_duration_time":
              console.log(submittedFields.get("edit_duration_time").value);
              giveaway.endTime = new Date(
                Date.now() + ms(submittedFields.get("edit_duration_time").value)
              );
              t;
              await editGiveawayMessage(selectInteraction, giveaway);
              giveaway.save();
              break;
            case "edit_description":
              giveaway.description =
                submittedFields.get("edit_description").value;
              giveaway.save();
              await editGiveawayMessage(selectInteraction, giveaway);
              break;
            case "edit_twitter_page":
              giveaway.description =
                submittedFields.get("edit_twitter_page").value;
              giveaway.save();
              await editGiveawayMessage(selectInteraction, giveaway);
              break;
            case "edit_entries_limited":
              giveaway.entriesLimited = Number(
                submittedFields.get("edit_entries_limited").value
              );
              giveaway.save();
              await editGiveawayMessage(selectInteraction, giveaway);
              break;
            case "edit_notes_follow":
              giveaway.notes = submittedFields.get("edit_notes_follow").value;
              giveaway.save();
              await editGiveawayMessage(selectInteraction, giveaway);
              break;
          }
          await submitted.reply({
            content: `Successfully updated ${modalConfig.title.toLowerCase()}!`,
            ephemeral: true,
          });
        }
      } catch (error) {
        console.error("Error handling modal submission:", error);
        await selectInteraction.followUp({
          content: "Failed to process modal submission or timeout occurred.",
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error("Error handling select menu:", error);
    }
  });
  collector.on("end", (collected) => {
    if (collected.size === 0) {
      console.log("No selection was made within the time limit");
      // Optionally handle timeout
      interaction
        .followUp({
          content: "You did not make a selection in time!",
          ephemeral: true,
        })
        .catch(console.error);
    }
  });
}
async function deleteRaffleDropdown(interaction) {
  const selectedId = interaction.values[0];
  const giveaway = await Giveaway.findByIdAndDelete(selectedId);
  if (giveaway) {
    await interaction.reply("Successfully deleted the Selected Giveaway");
  } else {
    await interaction.reply("failed to delete the selected Giveaway!");
  }
}
module.exports = {
  teamSetupAdminRole,
  pointsSetupAdminRole,
  reactionRewardSetup,
  addItemRoleDropDown,
  addAdditionalItemOptions,
  addItemBlockChainDropDown,
  addItemRoleGateDropDown,
  editItemDropdown,
  purchaseItemDropDown,
  addRaffleOptionalDropDown,
  addRaffleOptionalsDb,
  editRaffleDropdown,
  deleteRaffleDropdown,
};
