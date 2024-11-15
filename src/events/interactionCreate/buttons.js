const buttonActions = require("../../utils/actions/buttonActions");

module.exports = async (client, interaction) => {
  if (!interaction.isButton()) return;

  console.log("Button clicked:", interaction.customId);

  const { customId } = interaction;
  switch (true) {
    case customId === "points_setup":
      await buttonActions.handlePointsSetup(interaction);
      break;

    case customId === "socials_setup":
      await buttonActions.handleSocialSetup(interaction);
      break;

    case customId === "team_setup":
      await buttonActions.handleTeamSetup(interaction);
      break;

    //Setup config ✅

    case customId === "points_setup_social_rewards":
      await buttonActions.handleSocialRewards(interaction);
      break;

    case customId === "points_setup_reactions_rewards":
      await buttonActions.handlePointsSetupReactionRewards(interaction);
      break;

    case customId === "points_setup_active_reward":
      await buttonActions.handlePointsSetupActiveRewards(interaction);
      break;

    // setup ✅ - add/edit/delete items ⏳

    case customId === "add_item":
      await buttonActions.handleAddItems(interaction);
      break;

    //add item ✅ - edit item ⏳

    case customId === "edit_item":
      await buttonActions.handleEditItems(interaction);
      break;

    //edit item ✅ purchase item ⏳

    case customId === "purchase_item":
      await buttonActions.handlePurchaseItems(interaction);
      break;

    // purchase item ✅ raffle - create raffle ⏳

    case customId === "create_giveaway":
      await buttonActions.handleCreateGiveaway(interaction);
      break;

    case customId.startsWith("joinGiveaway_"): {
      const itemId = customId.split("joinGiveaway_")[1];
      await buttonActions.joinGiveaway(interaction, itemId);
      break;
    }

    // create raffle ⏳ Edit raffle ✅

    case customId === "edit_giveaway":
      await buttonActions.handleEditGiveaway(interaction);
      break;

    // edit raffle  ✅ - delete leaderboard ⏳
    case customId === "delete_giveaway":
      await buttonActions.handleDeleteGiveaway(interaction);
      break;

    default:
      console.log("Unknown button action:", interaction.customId);
      break;
  }
};
