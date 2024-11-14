const { ButtonStyle } = require("discord.js");
const sendEmbedWithButtons = require("../../utils/embeds/embedWithButtons");

const buttonOptions = [
  {
    label: "Create",
    emoji: "➕",
    style: ButtonStyle.Success,
    customId: "create_giveaway",
  },
  {
    label: "Edit",
    emoji: "🖊️",
    style: ButtonStyle.Primary,
    customId: "edit_giveaway",
  },
];

const embedOptions = {
  title: "Welcome to the Server!",
  description: "Here's how you can get started with the server setup:",
  color: "#00ff99",
};

module.exports = {
  name: "giveaway",
  description: "Create/delete/edit raffles!",

  callback: async (client, interaction) => {
    const guild = interaction.guild;
    await sendEmbedWithButtons(
      guild,
      interaction.channelId,
      embedOptions,
      buttonOptions
    );
  },
};
