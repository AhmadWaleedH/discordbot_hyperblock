const {
  RoleSelectMenuBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
  PermissionFlagsBits,
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
const User = require("../../models/Users");
const moment = require("moment");
const {
  createGiveawayEmbed,
  editGiveawayMessage,
} = require("../embeds/giveawayEmbed");
const EmbedMessages = require("../../models/EmbedMessages");
const Auction = require("../../models/Auction");
const sendEmbedWithButtons = require("../embeds/embedWithButtons");
const Contest = require("../../models/Contests");
const { generateContestEmbed } = require("../embeds/contestEmbed");
const { createAuctionEmbed } = require("../embeds/auctionEmbed");
async function teamSetupAdminRole(interaction) {
  await interaction.update({ content: "Updating", components: [], embeds: [] });

  const roleIds = interaction.values;
  const guildId = interaction.guildId;

  const roles = roleIds.map((r) => {
    const role = interaction.guild.roles.cache.get(r);
    return {
      roleId: role.id,
      roleName: role.name,
      roleIconURL: role.iconURL(),
    };
  });

  let guildDoc = await Guilds.findOne({ guildId });

  if (guildDoc) {
    const permOverWrites = roleIds.map((r) => ({
      id: r,
      allow: [
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ViewChannel,
      ],
    }));

    guildDoc.botConfig.adminRoles = roles;

    await Promise.all(
      Object.values(guildDoc.botConfig.channels).map(async (chId) => {
        const channel = interaction.guild.channels.cache.get(chId);

        if (!channel) return;

        await channel.permissionOverwrites.set([
          {
            id: interaction.guild.roles.everyone.id,
            deny: PermissionFlagsBits.ViewChannel,
          },
          ...permOverWrites,
        ]);
      })
    );
    await guildDoc.save();
    await interaction.editReply({
      content: "Admin roles updated successfully!",
    });
  } else {
    await interaction.editReply({
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
        label: "Cooldown (in minutes)",
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
        label: "Time (in minutes)",
        customId: "reaction_reward_cooldown",
        placeholder: "Input for how long each reaction reward will last",
        style: "Short",
      },
      {
        label: "Points",
        customId: "reaction_reward_points",
        placeholder: "Points for reaction",
        style: "Short",
      },
    ];
    await showModal(
      interaction,
      "Reaction Rewards Configuration",
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
      const hypermarketChannelId = guild.botConfig.userChannels.shop;
      if (!hypermarketChannelId) {
        return interaction.reply("❌ **shop channel not configured!**");
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
          description: `The leading decentralized platform for smart contracts and decentralized 
applications (dApps).`,
          value: "Ethereum",
        },
        {
          label: "Solana",
          description: `A high-performance blockchain supporting smart contracts`,
          value: "Solana",
        },
        {
          label: "Bitcoin",
          description: `The original cryptocurrency, primarily used as a store of value.`,
          value: "Bitcoin",
        },
        {
          label: "Binance",
          description: `A fast, low-cost Ethereum-compatible blockchain`,
          value: "Binance",
        },
        {
          label: "Cardano",
          description: `A research-driven blockchain with a focus on sustainability`,
          value: "Cardano",
        },
        {
          label: "Polygon",
          description: `A Layer-2 scaling solution for Ethereum, offering fast transactions`,
          value: "Polygon",
        },
        {
          label: "Avalanche",
          description: `A highly scalable blockchain platform with sub-second transaction`,
          value: "Avalanche",
        },
        {
          label: "Tron",
          description: `A decentralized platform for content sharing and entertainment dApps.`,
          value: "Tron",
        },
        {
          label: "Polkadot",
          description: `A multi-chain network enabling cross-blockchain transfers.`,
          value: "Polkadot",
        },
        {
          label: "Ripple",
          description: `A blockchain optimized for fast, low-cost cross-border payments`,
          value: "Ripple",
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
      value: shopItem.quantity !== -1 ? String(shopItem.quantity) : "",
      required: false,
    },
    {
      label: "Price of the Item",
      customId: "item_price",
      placeholder: "Enter the Price of the item",
      style: "Short",
      value:  String(shopItem.price) || "",
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
      const fieldOptions = [
        {
          label: "Date to start the giveaway e.g 25/06/2024",
          customId: "giveaway_start_date",
          placeholder: "DD/MM/YYYY",
          style: "Short",
        },
        {
          label: "Time to start HH:MM PM/AM 9:24 PM",
          customId: "giveaway_start_time",
          placeholder: "HH:MM PM/AM",
          style: "Short",
        },
        {
          label: "Date to end the giveaway e.g 25/06/2024",
          customId: "giveaway_end_date",
          placeholder: "DD/MM/YYYY",
          style: "Short",
        },
        {
          label: "Time to end HH:MM PM/AM 9:24 PM",
          customId: "giveaway_end_time",
          placeholder: "HH:MM PM/AM",
          style: "Short",
        },
      ];

      await showModal(
        interaction,
        "Giveaway Time Configuration",
        `add_giveaway_time_${id}`,
        fieldOptions
      );

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

async function addAuctionRoleDropdown(interaction, itemId) {
  const selectedRoleId = interaction.values[0];
  const auction = await Auction.findById(itemId);
  auction.roleForWinner = selectedRoleId;
  auction.save();

  const options = [
    {
      label: "Run",
      description: "Just save the auction and send it into the channel.",
      value: "run",
    },
    {
      label: "Minimum Bid",
      description: "Minimum Points required to bid.",
      value: "minimum_bid",
    },
    {
      label: "Blind Auction",
      description: "All Bids will be Hidden",
      value: "blind_auction",
    },
  ];
  await sendSelectMenu(
    interaction,
    "Choose your Optional States!",
    `add_optional_auction_select`,
    "Make a selection!",
    options
  );

  const filter = (interaction) => {
    return interaction.customId.startsWith("add_optional_auction_select");
  };
  const collector = interaction.channel.createMessageComponentCollector({
    filter,
    time: 60000,
  });
  collector.on("collect", async (selectInteraction) => {
    try {
      const selectedValue = selectInteraction.values[0];
      if (selectedValue === "run") {

        const guild = await Guilds.findOne({ guildId : selectInteraction.guildId });

        const auctionChannel = guild.botConfig?.userChannels?.auctions || null;
        const channel = await interaction.guild.channels.cache.get(auctionChannel);
        const { embed, components } = createAuctionEmbed(auction);

        // Send the message
        const sentMessage = await channel.send({
          embeds: [embed],
          components: components,
        });
    
        // Create new EmbedMessage document
        const embedMessage = new EmbedMessages({
          itemId: auction._id,
          guildId: selectInteraction.guildId,
          channelId: auctionChannel,
          messageId: sentMessage.id,
        });
    
        // Save to database
        await embedMessage.save();
    
        console.log(`Successfully sent and saved auction embed for auction ${auction._id}`);
        await selectInteraction.reply({
          content: "New Auction Created Successfully!",
          ephemeral: true,
        });
      } else {
        const modalConfigs = {
          minimum_bid: {
            title: "Add Minimum Bids",
            customId: "minimum_bid",
            fieldOptions: [
              {
                label: "Minimum Bid",
                customId: "minimum_bid",
                placeholder: "Enter No Of Winners",
                style: "Short",
              },
            ],
          },
          blind_auction: {
            title: "Blind Auction (yes/no)",
            customId: "blind_auction",
            fieldOptions: [
              {
                label: "Blind Auction",
                customId: "blind_auction",
                placeholder: "Enter Chain project",
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
          const submitted = await selectInteraction.awaitModalSubmit({
            filter,
            time: 600000,
          });
          if (submitted) {
            const submittedFields = submitted.fields.fields;
            console.log(submittedFields);
            switch (selectedValue) {
              case "minimum_bid":
                auction.minimumBid = Number(
                  submittedFields.get("minimum_bid").value
                );
                auction.save();
                break;
              case "blind_auction":
                const blind_auction =
                  submittedFields.get("blind_auction").value;
                auction.blindAuction = blind_auction.toLowerCase() === "yes";
                auction.save();
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

async function editAuctionSelect(interaction) {
  const id = interaction.values[0];
  console.log(id);
  const auction = await Auction.findById(id);

  const fieldOptions = [
    {
      label: "Item Name",
      customId: "item_name",
      placeholder: "Enter Item Name",
      value: auction.name,
      style: "Short",
    },
    {
      label: "Item Description",
      customId: "item_description",
      placeholder: "Enter Item Description",
      value: auction.description,
      style: "Short",
    },
    {
      label: "Item Quantity",
      customId: "item_quantity",
      placeholder: "Enter Item Quantity",
      value: auction.quantity.toString(),
      style: "Short",
    },
    {
      label: "Minimum Bid",
      customId: "minimum_bid",
      placeholder: "Enter Minimum Bid",
      value: auction.minimumBid.toString(),
      style: "Short",
    },
  ];

  await showModal(
    interaction,
    `Edit Auction Item`,
    `edit_auction_modal_${auction._id}`,
    fieldOptions
  );
}

async function deleteAuctionSelect(interaction) {
  const id = interaction.values[0];
  await Auction.findByIdAndDelete(id);
  await interaction.reply({
    content: "Auction Deleted Successfully",
    ephemeral: true,
  });
}

async function bidAuctionSelect(interaction) {
  const selectedId = interaction.values[0];
  const auction = await Auction.findById(selectedId);
  
  interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

async function mintWalletSelect(interaction) {
  const selectedOptions = interaction.values[0];
  const userId = interaction.user.id;

  // Fetch user data from the database
  const user = await User.findOne({ discordId: userId });

  if (!user) {
    return interaction.reply({
      content: "User data not found. Please try again later.",
      ephemeral: true,
    });
  }
  const address = user.mintWallets[selectedOptions];
  const fieldOptions = [
    {
      label: `Enter ${selectedOptions} Wallet Address`,
      customId: "wallet_address",
      placeholder: `Enter ${selectedOptions} Wallet Address`,
      style: "Short",
      ...(address ? { value: address } : {}),
    },
  ];

  await showModal(
    interaction,
    " Setup Configuration",
    `mint_wallet_modal_${selectedOptions}`,
    fieldOptions
  );
}

async function contestCreationSelect(interaction, id) {
  const selectedId = interaction.values[0];

  // Find the contest from the database
  const contest = await Contest.findById(id);

  // Save the selected role to the contest document
  contest.roleAssignedToParticipant = selectedId;
  await contest.save();

  // Now start collecting the points for the winners
  await interaction.reply({
    content: `Role assigned successfully! Now, let's collect points for the winners. You have ${contest.numberOfWinners} winners to provide points for.`,
    ephemeral: true,
  });

  // Call the function to collect the points for winners
  await collectPointsForWinners(interaction, contest);
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
  addAuctionRoleDropdown,
  editAuctionSelect,
  deleteAuctionSelect,
  bidAuctionSelect,
  mintWalletSelect,
  contestCreationSelect,
};

// function createAuctionEmbed(auction) {
//   // Calculate time remaining
//   // const timeRemaining = auction.duration - new Date();
//   // const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
//   const endTimeUnix = Math.floor(new Date(auction.duration).getTime() / 1000);

//   // Calculate time remaining
//   // const timeLeft = new Date(giveaway.endTime) - new Date();
//   // Create the embed
//   const embed = new EmbedBuilder()
//     .setTitle("Super")
//     .setDescription(
//       `New ${auction.chain} Auction is live! Click Below To Place Your Bid.\nThere Will Be ${auction.quantity} Spot(s) In This Auction.`
//     )
//     .setColor("#0099ff")
//     .addFields(
//       {
//         name: "Ends",
//         value: `<t:${endTimeUnix}:R>`,
//         inline: true,
//       },
//       {
//         name: "Highest Bidder",
//         value: auction.currentBidder ? `<@${auction.currentBidder}>` : "-",
//         inline: true,
//       },
//       {
//         name: "Value",
//         value: auction.currentBid ? `${auction.currentBid}` : "-",
//         inline: true,
//       }
//     );

//   // Add bids section
//   if (auction.bidders && auction.bidders.length > 0) {
//     const bidsField = auction.bidders
//       .sort((a, b) => b.bidAmount - a.bidAmount)
//       .slice(0, 6) // Show top 6 bids
//       .map((bid) => `<@${bid.userId}> - ${bid.bidAmount}`)
//       .join("\n");

//     embed.addFields({
//       name: "Bids",
//       value: bidsField || "-",
//     });
//   } else {
//     // Add empty bid placeholders like in the image
//     embed.addFields({
//       name: "Bids",
//       value: Array(6).fill("-").join("\n"),
//     });
//   }

//   // Create buttons
//   const bidButton = new ButtonBuilder()
//     .setCustomId(`place_bid_${auction._id}`)
//     .setLabel("Bid")
//     .setStyle(ButtonStyle.Primary)
//     .setEmoji("💰");

//   const changeWalletButton = new ButtonBuilder()
//     .setCustomId(`change_wallet_${auction._id}`)
//     .setLabel("Change Wallet")
//     .setStyle(ButtonStyle.Secondary)
//     .setEmoji("🔄");

//   // Create action row with buttons
//   const row = new ActionRowBuilder().addComponents(
//     bidButton,
//     changeWalletButton
//   );

//   return {
//     embed,
//     row,
//   };
// }

async function collectPointsForWinners(interaction, contest) {
  const winnerCount = contest.numberOfWinners;
  const pointsForWinners = [];

  // Start the message collector to collect points for each winner
  const filter = (response) => response.author.id === interaction.user.id;
  const collector = interaction.channel.createMessageCollector({
    filter,
    time: 60000, // 1 minute timeout for each message
    max: winnerCount, // Limit to the number of winners
  });

  // Notify the user to start entering points
  await interaction.followUp({
    content: `Please provide the points for the 1st place winner:`,
    ephemeral: true,
  });

  let winnerIndex = 1;

  collector.on("collect", async (collected) => {
    // Parse the input points
    const points = parseInt(collected.content);

    if (isNaN(points) || points <= 0) {
      await interaction.followUp({
        content: "Please enter a valid number of points greater than 0.",
        ephemeral: true,
      });
      return; // Skip invalid input
    }

    // Save the points for the current winner
    pointsForWinners.push(points);

    // If we have collected all the points for the winners, save them and end the collection
    if (pointsForWinners.length === winnerCount) {
      contest.pointsForWinners = pointsForWinners;
      await contest.save();

      await createContestThread(interaction, contest);

      collector.stop(); // Stop collecting after all points are gathered
    } else {
      // Ask for points for the next winner
      await interaction.followUp({
        content: `Please provide the points for the ${
          winnerIndex + 1
        }th place winner:`,
        ephemeral: true,
      });
    }

    winnerIndex++;
  });

  collector.on("end", (collected, reason) => {
    if (reason === "time") {
      interaction.followUp({
        content: "You took too long to respond. Please try again.",
        ephemeral: true,
      });
    }
  });
}

async function createContestThread(interaction, contest) {
  try {
    const newChannel = await interaction.guild.channels.create({
      name: contest.title,
      type: 0, // '0' represents a text channel
      reason: `Contest created for ${contest.title}`,
    });

    contest.channelId = newChannel.id;
    await contest.save();
    const roleId = contest.roleAssignedToParticipant;

    if (roleId) {
      // Fetch the role by its ID
      const role = await interaction.guild.roles.fetch(roleId);

      if (role) {
        // Update the permissions of the channel to restrict non-role users
        await newChannel.permissionOverwrites.edit(interaction.guild.id, {
          // Deny send messages for everyone in the guild
          [PermissionsBitField.Flags.SendMessages]: false,
        });

        await newChannel.permissionOverwrites.edit(role.id, {
          // Allow send messages for the specific role
          [PermissionsBitField.Flags.ViewChannel]: true,
          [PermissionsBitField.Flags.SendMessages]: true,
        });
      } else {
        console.error("Role not found.");
      }
    } else {
      console.log("No role assigned to participants.");
    }
    const timeRemaining = contest.duration - new Date();
    const formattedDuration = ms(timeRemaining, { long: true });

    // Buttons for Join and Result
    const joinButton = new ButtonBuilder()
      .setCustomId(`join_${contest._id}`)
      .setLabel("Join")
      .setStyle("Primary");

    const buttonRow = new ActionRowBuilder().addComponents(joinButton);

    // Send the embed and buttons to the newly created channel
    const savedChannel = await newChannel.send({
      content: `Welcome to the contest: **${contest.title}**! Please review the details below and choose your action.`,
      embeds: [generateContestEmbed(contest)],
      components: [buttonRow],
    });

    const embedMessage = new EmbedMessages({
      itemId: contest._id, // Save the contest ID (use contest._id to reference the contest)
      guildId: savedChannel.guild.id, // Save the guild ID (for context)
      channelId: savedChannel.channel.id, // Save the channel ID (where the message was sent)
      messageId: savedChannel.id, // Save the message ID (to easily edit the embed later)
    });

    // Save the document
    await embedMessage.save();

    contest.isActive = true;
    await contest.save();

    // Inform the user that the channel was created
    await interaction.followUp({
      content: `A channel for the contest "${contest.title}" has been created!`,
      ephemeral: true,
    });
  } catch (error) {
    console.error("Error creating thread:", error);
    await interaction.followUp({
      content:
        "There was an error creating the contest thread. Please try again later.",
      ephemeral: true,
    });
  }
}
