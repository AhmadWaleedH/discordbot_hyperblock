const modelActions = require("../../utils/actions/modelActions");
const { updateGiveaway } = require("../../utils/commons");
module.exports = async (client, interaction) => {
  if (!interaction.isModalSubmit()) return;
  // Handle modal submissions with a switch statement
  const { customId } = interaction;
  switch (true) {
    case customId === "social_rewards_modal":
      await modelActions.handleSocialRewardsSubmission(interaction);
      break;
    case customId === "social_setup_modal":
      await modelActions.handleSocialSetupSubmission(interaction);
      break;
    case customId === "active_reward_model":
      await modelActions.handleActiveRewardsSetupSubmission(interaction);
      break;
    case customId === "reaction_reward_model":
      await modelActions.handleReactionRewardsSetupSubmission(interaction);
      break;
    // setup models complete now items models
    case customId === "add_item_model":
      await modelActions.handleAddItemModelSubmission(interaction);
      break;
    // add item ✅ edit item ⏳
    case customId.startsWith("edit_item_modal_"): {
      const itemId = customId.split("edit_item_modal_")[1];
      await modelActions.handleEditItemModelSubmission(interaction, itemId);
      break;
    }
    // edit item ✅ add raffle ⏳
    case customId === "add_raffle":
      await modelActions.handleAddRaffle(interaction);
      break;

    case customId.startsWith("enter_raffle_end_"): {
      const itemId = customId.split("enter_raffle_end_")[1];
      await modelActions.handleEndGivewayModal(interaction, itemId);
      break;
    }

    case customId.startsWith("add_raffle_description_"): {
      const itemId = customId.split("add_raffle_description_")[1];
      await modelActions.addRaffleOptionals(
        interaction,
        itemId,
        "description",
        "description"
      );
      break;
    }

    case customId.startsWith("add_giveaway_time_"): {
      const itemId = customId.split("add_giveaway_time_")[1];
      await modelActions.addGiveawayTimer(interaction, itemId);
      break;
    }

    case customId.startsWith("add_raffle_twitter_"): {
      const itemId = customId.split("add_raffle_twitter_")[1];

      const field = interaction.fields.getTextInputValue("twitter_page_link");

      const match = field.match(
        /^(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/@?([a-zA-Z0-9_]+)\/?$|^@?([a-zA-Z0-9_]+)$/i
      );

      if (!match)
        await interaction.reply({
          content:
            "Please enter correct format like \`http://x.com/elonMusk\` OR \`elonMusk\` (plain username)",
          ephemeral: true,
        });

      if (match) {
        const username = match[2] || match[1] || match[0];

        await updateGiveaway(interaction, itemId, {
          partnerTwitter: `https://x.com/${username}`,
        });
      }

      break;
    }

    case customId.startsWith("add_raffle_limit_"): {
      const itemId = customId.split("add_raffle_limit_")[1];
      await modelActions.addRaffleOptionals(
        interaction,
        itemId,
        "add_entries_limited",
        "entriesLimited",
        "Number"
      );
      break;
    }
    case customId.startsWith("add_raffle_notes_"): {
      const itemId = customId.split("add_raffle_notes_")[1];
      await modelActions.addRaffleOptionals(
        interaction,
        itemId,
        "add_notes_follow",
        "notes"
      );
      break;
    }

    // add raffle ✅ add Auction ⏳

    case customId === "add_auction_model":
      await modelActions.addAuctionModal(interaction);
      break;

    // add Auction ✅ edit Auction ⏳
    case customId === "edit_auction_modal":
      await modelActions.editAuctionModal(interaction);
      break;

    case customId.startsWith("edit_auction_modal_"): {
      const itemId = customId.split("edit_auction_modal_")[1];
      await modelActions.editAuctionModal(interaction, itemId);
      break;
    }
    // edit Auction ✅ Bid Auction ⏳
    case customId.startsWith("bid_amount_modal_"): {
      const itemId = customId.split("bid_amount_modal_")[1];
      await modelActions.handleBidAmountModal(interaction, itemId);
      break;
    }

    case customId.startsWith("change_wallet_"): {
      const itemId = customId.split("change_wallet_")[1];
      await modelActions.handleChangeWalletModal(interaction, itemId);
      break;
    }

    // Bid Auction ✅ User Socials ⏳
    case customId === "social_settings_modal":
      await modelActions.handleSocialSettingsModal(interaction);
      break;

    case customId.startsWith("mint_wallet_modal_"): {
      const itemId = customId.split("mint_wallet_modal_")[1];
      await modelActions.handleMintWalletModals(interaction, itemId);
      break;
    }

    case customId === "contest_creation_modal":
      await modelActions.handleContestCreationModal(interaction);
      break;

    default:
      console.log("Unknown modal submission:", interaction.customId);
      break;
  }
};
