const dropdownActions = require("../../utils/actions/dropdownActions");
module.exports = async (client, interaction) => {
  if (!interaction.isAnySelectMenu()) return;

  const { customId } = interaction;

  // setup ⏳
  switch (true) {
    case customId === "team_setup_select":
      await dropdownActions.teamSetupAdminRole(interaction);
      break;
    case customId === "active_reward_select":
      await dropdownActions.pointsSetupAdminRole(interaction);
      break;

    case customId === "reaction_reward_select":
      await dropdownActions.reactionRewardSetup(interaction);
      break;

    // setup ✅ add item ⏳

    case customId.startsWith("add_item_select_"): {
      const itemId = customId.split("add_item_select_")[1];
      await dropdownActions.addItemRoleDropDown(interaction, itemId);
      break;
    }

    case customId.startsWith("add_optionalItems_select_"): {
      const itemId = customId.split("add_optionalItems_select_")[1];
      await dropdownActions.addAdditionalItemOptions(interaction, itemId);
      break;
    }

    case customId.startsWith("additem_blockchain_select_"): {
      const itemId = customId.split("additem_blockchain_select_")[1];
      await dropdownActions.addItemBlockChainDropDown(interaction, itemId);
      break;
    }

    case customId.startsWith("additem_rolegate_select_"): {
      const itemId = customId.split("additem_rolegate_select_")[1];
      await dropdownActions.addItemRoleGateDropDown(interaction, itemId);
      break;
    }

    // add item ✅ edit item ⏳

    case customId === "edit_items_select":
      await dropdownActions.editItemDropdown(interaction);
      break;
    case customId === "purchase_items_select":
      await dropdownActions.purchaseItemDropDown(interaction);
      break;

    // edit item ✅  add giveaway ⏳

    case customId.startsWith("add_optionalgiveaway_select_"): {
      const itemId = customId.split("add_optionalgiveaway_select_")[1];
      await dropdownActions.addRaffleOptionalDropDown(interaction, itemId);
      break;
    }
    case customId.startsWith("add_raffleassign_role_"): {
      const itemId = customId.split("add_raffleassign_role_")[1];
      await dropdownActions.addRaffleOptionalsDb(
        interaction,
        itemId,
        "winnerRole"
      );
      break;
    }
    case customId.startsWith("add_raffleallowed_role_"): {
      const itemId = customId.split("add_raffleallowed_role_")[1];
      await dropdownActions.addRaffleOptionalsDb(
        interaction,
        itemId,
        "roleRequired"
      );
      break;
    }

    // add giveaway ✅ edit giveaway ⏳

    case customId === "edit_giveaway_select":
      await dropdownActions.editRaffleDropdown(interaction);
      break;

    // edit giveaway ✅  delete giveaway ⏳
    case customId === "delete_giveaway_select":
      await dropdownActions.deleteRaffleDropdown(interaction);
      break;

    // delete giveaway ✅ add auction ⏳

    case customId.startsWith("add_auction_role_select_"): {
      const itemId = customId.split("add_auction_role_select_")[1];
      await dropdownActions.addAuctionRoleDropdown(interaction, itemId);
      break;
    }
    //  add auction ✅ edit auction ⏳

    case customId === "edit_auction_select":
      await dropdownActions.editAuctionSelect(interaction);
      break;
    //  edit auction ✅ delete auction ⏳
    case customId === "delete_auction_select":
      await dropdownActions.deleteAuctionSelect(interaction);
      break;
    //  delete auction ✅ bid auction ⏳
    case customId === "bid_auction_select":
      await dropdownActions.bidAuctionSelect(interaction);
      break;

    case customId === "add_mint_wallet_select":
      await dropdownActions.mintWalletSelect(interaction);
      break;

    case customId === "contest_creation_select":
      await dropdownActions.contestCreationSelect(interaction);
      break;

    case customId.startsWith("contest_creation_select_"): {
      const itemId = customId.split("contest_creation_select_")[1];
      await dropdownActions.contestCreationSelect(interaction, itemId);
      break;
    }

    default:
      console.log("Unknown modal submission:", interaction.customId);
      break;
  }
};
