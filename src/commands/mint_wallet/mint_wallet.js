const { StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js"); // Use ActionRowBuilder for v14
const showModal = require("../../utils/modelHandler");
const sendSelectMenu = require("../../utils/selectMenuHandler");

module.exports = {
  name: "mint_wallet",
  description: "Add Wallet!",
  callback: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true });
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

    // Create a select menu with a maximum of 5 values
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("add_mint_wallet_select") // ID to identify the selection action
      .setPlaceholder("Choose the blockchains") // Placeholder text
      .addOptions(
        options.map((option) => ({
          label: option.label,
          description: option.description,
          value: option.value,
        }))
      ); // Dynamically add options

    // Wrap the select menu in an action row (use ActionRowBuilder for v14)
    const row = new ActionRowBuilder().addComponents(selectMenu);

    // Edit the reply with the select menu
    await interaction.editReply({
      content: "Please select blockchain networks to mint your wallet!",
      components: [row], // Add the select menu as a component
      ephemeral: true,
    });
  },
};
