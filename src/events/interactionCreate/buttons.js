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


    case customId === "use_twt":
      await buttonActions.handleTweetEventCreate(interaction);
      break;
    case customId === "join_twt":
      await interaction.reply({content:'Please link your twitter account first at https://example.com', ephemeral:true})
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

    case customId.startsWith("purchase_add_item_"): {
      const itemId = customId.split("purchase_add_item_")[1];
      await buttonActions.handleAddedPurchaseItems(interaction, itemId);
      break;
    }

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

      case customId.startsWith("endRaffleNow_"): {
        const itemId = customId.split("endRaffleNow_")[1];
        await buttonActions.handleEndRaffle(interaction, itemId);
        break;
      }

    

    // delete leaderboard ✅ - add auction ⏳
    case customId === "add_auction":
      await buttonActions.handleAddAuction(interaction);
      break;
    // add auction ✅ - edit auction ⏳
    case customId === "edit_auction":
      await buttonActions.handleEditAuction(interaction);
      break;

    // edit auction ✅ - delete auction ⏳
    case customId === "delete_auction":
      await buttonActions.handleDeleteAuction(interaction);
      break;

    // delete auction ✅ - bid auction ⏳
    case customId === "bid_auction":
      await buttonActions.handleBidAuction(interaction);
      break;

    case customId.startsWith("place_bid_"): {
      const itemId = customId.split("place_bid_")[1];
      await buttonActions.handlePlaceBidAuction(interaction, itemId);
      break;
    }

    // bid auction ✅ - Change wallet ⏳

    case customId.startsWith("change_wallet_"): {
      const itemId = customId.split("change_wallet_")[1];
      await buttonActions.handleChangeWalletAuction(interaction, itemId);
      break;
    }
    // Change wallet ✅ - Flip ⏳
    case customId === "flip_to_back"  || customId === "flip_to_front":
      await buttonActions.handleFlipBag(interaction);
      break;

    // Flip ✅ - Contest button ⏳

    case customId === "contests_btn":
      await buttonActions.handleContestButton(interaction);
      break;

    case customId === "fanart_fun" || customId === "meme_fun" || customId === "community_fun":
      await buttonActions.handleFunContestBtn(interaction);
      break;

    case customId.startsWith("join_"): {
      const itemId = customId.split("join_")[1];
      await buttonActions.handleJoinContest(interaction, itemId);
      break;
    }

    default:
      console.log("Unknown button action:", interaction.customId);
      break;
  }
};
