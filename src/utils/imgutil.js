const path = require("path");
const fs = require("fs");
const axios = require("axios");
const sharp = require("sharp");
const { generateCreditCardImage } = require("./canvas/front");

// Download an image from a URL and return it as a buffer
async function downloadImage(url) {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(response.data);
}

// Convert an image buffer to PNG format
async function convertToPng(buffer) {
  return await sharp(buffer).png().toBuffer();
}

// Save an image buffer to a specified path
async function saveImage(buffer, filename) {
  fs.writeFileSync(filename, buffer);
}

// Process an image: download, convert, and save
async function processImage(imageURL, savePath) {
  const imageBuffer = await downloadImage(imageURL);
  const imagePng = await convertToPng(imageBuffer);
  await saveImage(imagePng, savePath);
}

// Main function to generate a credit card image
async function generateCardImage({ interaction, user, serverMembership }) {
    console.log(interaction)
  const defaultAvatarUrl = "https://freelogopng.com/images/all_img/1691730767discord-logo-transparent.png";

  const guildIconURL = interaction.guild.iconURL({ format: "png", size: 256 }) || defaultAvatarUrl;
  const userAvatarURL = interaction.user.displayAvatarURL({ format: "png", size: 256 }) || defaultAvatarUrl;

  const tempGuildIconPath = path.join(__dirname, "../../", "temp_guild_icon.png");
  const tempUserAvatarPath = path.join(__dirname, "../../", "temp_user_avatar.png");

  // Download and save the images
  await Promise.all([
    processImage(guildIconURL, tempGuildIconPath),
    processImage(userAvatarURL, tempUserAvatarPath),
  ]);

  const guildName = interaction.guild.name;
  const userName = interaction.user.username;
  const hyperBlockPoints = user.hyperBlockPoints || 0;
  const serverMembershipPoints = serverMembership.points || 0;

  const textAndIconData = [
    {
      iconPath: "coin.png",
      text: `${serverMembershipPoints} THP${hyperBlockPoints}`,
      iconSize: 20,
      xPosIcon: 15,
      yPosIcon: (204 - 50) / 2,
    },
    {
      iconPath: tempGuildIconPath,
      text: guildName,
      iconSize: 20,
      xPosIcon: 15,
      yPosIcon: 114,
    },
    {
      iconPath: tempUserAvatarPath,
      text: userName,
      iconSize: 20,
      xPosIcon: 15,
      yPosIcon: 25,
    },
  ];

  const imagePath = await generateCreditCardImage({
    backgroundImagePath: "card.bg.png",
    chipImagePath: "chip.png",
    bottomRightImagePath: "top1.png",
    coinImagePath: "coin.png",
    textAndIconData,
  });

  // Clean up temporary files
  fs.unlinkSync(tempGuildIconPath);
  fs.unlinkSync(tempUserAvatarPath);

  return imagePath;
}

module.exports = { generateCardImage };
