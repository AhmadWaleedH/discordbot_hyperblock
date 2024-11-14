const modelActions = require("../../utils/actions/modelActions");
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

    case customId.startsWith("add_raffle_twitter_"): {
      const itemId = customId.split("add_raffle_twitter_")[1];
      await modelActions.addRaffleOptionals(
        interaction,
        itemId,
        "twitter_page_link",
        "partnerTwitter"
      );
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

    default:
      console.log("Unknown modal submission:", interaction.customId);
      break;
  }
};
