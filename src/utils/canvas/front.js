const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

async function generateCreditCardImage({
  backgroundImagePath,
  chipImagePath,
  bottomRightImagePath,
  coinImagePath,
  textAndIconData,
}) {
  // Credit card dimensions in pixels
  const width = 339;
  const height = 204;

  // Create a canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Function to draw an icon with text
  function drawIconWithText(iconPath, text, iconSize, xPosIcon, yPosIcon) {
    loadImage(iconPath) // Load the icon image
      .then((iconImage) => {
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
        ctx.font = "bold 13px Arial"; // Bold font for better clarity
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

  // Load the background image
  const backgroundImage = await loadImage(backgroundImagePath);
  ctx.drawImage(backgroundImage, 0, 0, width, height);



  // Loop through the data for the icons and text
  for (const {
    iconPath,
    text,
    iconSize,
    xPosIcon,
    yPosIcon,
  } of textAndIconData) {
    drawIconWithText(iconPath, text, iconSize, xPosIcon, yPosIcon);
  }

  // Generate the file name dynamically to avoid overwriting
  const fileName = "credit-card-with-background-and-icons.png";
  const outputPath = path.join(__dirname, fileName);

  // Save the image as a PNG
  const out = fs.createWriteStream(outputPath);
  const stream = canvas.createPNGStream();
  stream.pipe(out);

  return new Promise((resolve, reject) => {
    out.on("finish", () => {
      console.log("The credit card image has been created!");
      resolve(outputPath); // Return the path to the saved image
    });
    out.on("error", (err) => reject(err));
  });
}

module.exports = { generateCreditCardImage };
