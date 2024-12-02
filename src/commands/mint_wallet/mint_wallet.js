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
        description: "The leading decentralized platform for smart contracts.",
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

    // Create a select menu with a maximum of 5 values
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("add_mint_wallet_select") // ID to identify the selection action
      .setPlaceholder("Choose up to 5 blockchains") // Placeholder text
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
