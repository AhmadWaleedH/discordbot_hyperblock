const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

async function createCreditCardBackImage({
  backgroundImagePath,
  chipImagePath,
  iconsWithText,
  footerText,
}) {
  const width = 339;
  const height = 204;

  // Create a canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Function to draw an icon with text
  function drawIconWithText(iconPath, text, iconSize, xPosIcon, yPosIcon) {
    loadImage(iconPath) // Load the icon image
      .then((iconImage) => {
        console.log(iconPath);
        // Clip the context to a circle for the rounded icon
        ctx.save(); // Save the current state of the canvas
        ctx.beginPath();
        ctx.arc(
          xPosIcon + iconSize / 2,
          yPosIcon + iconSize / 2,
          iconSize / 2,
          0,
          Math.PI * 2
        );
        ctx.clip(); // Apply the clipping path

        // Draw the icon inside the circle clipping
        ctx.drawImage(iconImage, xPosIcon, yPosIcon, iconSize, iconSize);

        // Restore the canvas context to the previous state
        ctx.restore();

        // Add text next to the icon
        ctx.font = "bold 12px Arial"; // Bold font for better clarity
        ctx.fillStyle = "white"; // White text color
        const textWidth = ctx.measureText(text).width; // Measure text width to align

        // Position text to the right of the icon
        const xPosText = xPosIcon + iconSize + 5; // 5px padding from the icon
        const yPosText = yPosIcon + iconSize / 2 + 5; // Align vertically with the icon

        // Draw the text next to the icon
        ctx.fillText(text, xPosText, yPosText);
      })
      .catch((err) => {
        console.error("Error loading icon image:", err);
      });
  }

  // Function to draw footer text
  function drawText(ctx, text, xPos, yPos) {
    ctx.font = "bold 12px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(text, xPos, yPos);
  }

  try {
    // Load the background image
    console.log(backgroundImagePath);
    const backgroundImage = await loadImage(backgroundImagePath);
    ctx.drawImage(backgroundImage, 0, 0, width, height);

    console.log("try catch");
    // Load the chip image and place it on the canvas
    const chipImage = await loadImage(chipImagePath);
    const chipWidth = 50;
    const chipHeight = 50;
    const xPosChip = width - chipWidth - 15;
    const yPosChip = (height - chipHeight) / 2;
    ctx.drawImage(chipImage, xPosChip, yPosChip, chipWidth, chipHeight);
    // Loop through icons and text data
    for (const {
      iconPath,
      text,
      iconSize,
      xPosIcon,
      yPosIcon,
    } of iconsWithText) {
      drawIconWithText(iconPath, text, iconSize, xPosIcon, yPosIcon);
    }

    // Loop through footer text
    for (const { text, xPos, yPos } of footerText) {
      drawText(ctx, text, xPos, yPos);
    }

    // Save the   image as a PNG
    const fileName = "credit_card_back.png";
    const outputPath = path.join(__dirname, fileName);
    const out = fs.createWriteStream(outputPath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);

    console.log(outputPath);
    return new Promise((resolve, reject) => {
      out.on("finish", () => {
        console.log("The credit card image has been created!");
        resolve(outputPath);
      });
      out.on("error", (err) => reject(err));
    });
  } catch (error) {
    console.error("Error generating the credit card back image:", error);
    throw new Error("Failed to generate credit card image.");
  }
}

module.exports = { createCreditCardBackImage };
