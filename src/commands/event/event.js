const { ButtonStyle } = require("discord.js");
const sendEmbedWithButtons = require("../../utils/embeds/embedWithButtons");

const buttonOptions = [
  {
    label: "Prediction",
    emoji: "➕",
    style: ButtonStyle.Success,
    customId: "prediction_btn",
  },
  {
    label: "Contests",
    emoji: "🖊️",
    style: ButtonStyle.Primary,
    customId: "contests_btn",
  },
];

const embedOptions = {
  title: "Create/ Manage Your Events Here!",
  description: "Here's how you can get started with events:",
  color: "#00ff99",
};

module.exports = {
  name: "event",
  description: "Create events!",

  callback: async (client, interaction) => {
    const guild = interaction.guild;
    await sendEmbedWithButtons(
      guild,
      interaction.channelId,
      embedOptions,
      buttonOptions
    );
    await interaction.reply("Events are here :");
  },
};
