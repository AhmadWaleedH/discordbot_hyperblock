const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { generateCreditCardImage } = require("../../utils/canvas/front");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const sharp = require("sharp");
const User = require("../../models/Users");
async function downloadImage(url) {
  const response = await axios({
    method: "get",
    url: url,
    responseType: "arraybuffer",
  });
  return Buffer.from(response.data);
}

async function convertToPng(buffer) {
  return await sharp(buffer).png().toBuffer();
}

async function saveImage(buffer, filename) {
  fs.writeFileSync(filename, buffer);
}

const defaultAvatarUrl =
  "https://media.discordapp.net/attachments/620548120803016725/1313199776174702702/discord-logo-discord-icon-transparent-free-png.webp?ex=674f4418&is=674df298&hm=e3435d7291da250f2a633ae66c5c34014cd4470c7c615f8939f504425a986439&=&format=webp&width=620&height=620";

module.exports = {
  name: "mybag",
  description: "Check your bag and see the credit card image!",
  callback: async (client, interaction) => {
    try {
      const guildIconURL =
        interaction.guild.iconURL({
          format: "png",
          size: 256,
        }) || defaultAvatarUrl;

      // Get the user avatar URL (with fallback to default)
      const userAvatarURL =
        interaction.user.displayAvatarURL({
          format: "png",
          size: 256,
        }) || defaultAvatarUrl;
      const tempGuildIconPath = path.join(
        __dirname,
        "../../",
        "temp_guild_icon.png"
      );
      const tempUserAvatarPath = path.join(
        __dirname,
        "../../",
        "temp_user_avatar.png"
      );

      const guildName = interaction.guild.name;
      const userName = interaction.user.username;
      const userId = interaction.user.id; // Get the Discord user ID from the interaction
      const guildId = interaction.guildId;

      const user = await User.findOne({ discordId: userId });

      if (!user) {
        return interaction.reply({
          content: "User not found in the database.",
          ephemeral: true,
        });
      }

      const hyperBlockPoints = user.hyperBlockPoints || 0;

      const serverMembership = user.serverMemberships.find(
        (membership) => membership.guildId === guildId
      );

      if (!serverMembership) {
        return interaction.reply({
          content: `No server membership found for this guild.`,
          ephemeral: true,
        });
      }

      // Get the serverMembership points
      const serverMembershipPoints = serverMembership.points || 0;

      // Download and convert the guild icon and user avatar to PNG
      const guildIconBuffer = await downloadImage(guildIconURL);
      const userAvatarBuffer = await downloadImage(userAvatarURL);

      // Convert the buffers to PNG
      const guildIconPng = await convertToPng(guildIconBuffer);
      const userAvatarPng = await convertToPng(userAvatarBuffer);

      // Save the PNG images locally
      await saveImage(guildIconPng, tempGuildIconPath);
      await saveImage(userAvatarPng, tempUserAvatarPath);

      // Example data for text and icons
      const textAndIconData = [
        {
          iconPath: "coin.png",
          text: serverMembershipPoints,
          iconSize: 20,
          xPosIcon: 15,
          yPosIcon: (204 - 30) / 2,
        },
        {
          iconPath: "coin.png",
          text: hyperBlockPoints,
          iconSize: 20,
          xPosIcon: 15,
          yPosIcon: (204 + 25) / 2,
        },
        {
          iconPath: tempUserAvatarPath,
          text: userName,
          iconSize: 25,
          xPosIcon: 15,
          yPosIcon: 204 - 40,
        },
        {
          iconPath: tempGuildIconPath,
          text: guildName,
          iconSize: 25,
          xPosIcon: 15,
          yPosIcon: 25,
        },
      ];

      // Call the function to generate the credit card image
      const imagePath = await generateCreditCardImage({
        backgroundImagePath: "background.jpg",
        chipImagePath: "chip.png",
        bottomRightImagePath: "top1.png",
        coinImagePath: "coin.png",
        textAndIconData: textAndIconData,
      });

      // Send the image back to the user
      await interaction.reply({
        content: "Here is your credit card image!",
        files: [imagePath],
        components: [
          new ActionRowBuilder().addComponents(
            // Create the "Flip" button
            new ButtonBuilder()
              .setCustomId("flip")
              .setLabel("Flip")
              .setStyle(ButtonStyle.Primary), // You can change the style as needed

            // Create the "Customize" button
            new ButtonBuilder()
              .setLabel("Customize")
              .setStyle(ButtonStyle.Link)
              .setURL("https://yourlink.com")
          ),
        ],
      });

      //   // Clean up temporary image files
      fs.unlinkSync(tempGuildIconPath);
      fs.unlinkSync(tempUserAvatarPath);
    } catch (error) {
      console.error("Error generating the image:", error);
      await interaction.reply({
        content: "Sorry, something went wrong while generating your image.",
        ephemeral: true,
      });
    }
  },
};
