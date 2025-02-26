const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const User = require("../../models/Users");
const { generateCardImage } = require("../../utils/imgutil");

module.exports = {
  name: "mybag",
  description: "Check your bag and see the credit card image!",
  callback: async (client, interaction) => {
    try {
      const userId = interaction.user.id; // Get the Discord user ID from the interaction
      const guildId = interaction.guildId;

      const user = await User.findOne({ discordId: userId });


      if (!user) {
        return interaction.reply({
          content: "User not found in the database.",
          ephemeral: true,
        });
      }


      const serverMembership = user.serverMemberships.find(
        (membership) => membership.guildId === guildId
      );

      if (!serverMembership) {
        return interaction.reply({
          content: `No server membership found for this guild.`,
          ephemeral: true,
        });
      }

      console.log(interaction)

      const imagePath = await generateCardImage({interaction,user, serverMembership})
     
      await interaction.reply({
        content: "Here is your credit card image (front side)!",
        files: [imagePath],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("flip_to_back") // Flip to back when clicked
              .setLabel("Flip")
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setLabel("Customize")
              .setStyle(ButtonStyle.Link)
              .setURL("https://yourlink.com")
          ),
        ],
        ephemeral: true
      });
      

    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "Sorry, something went wrong while generating your image.",
        ephemeral: true,
      });
    }
  },
};
