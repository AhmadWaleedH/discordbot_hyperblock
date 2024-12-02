const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");

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
      ctx.font = "bold 16px Arial"; // Bold font for better clarity
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
loadImage("bg.jpg")
  .then((backgroundImage) => {
    // Draw the background image to cover the entire canvas
    ctx.drawImage(backgroundImage, 0, 0, width, height);

    // Load the chip icon image
    loadImage("chip.png")
      .then((chipImage) => {
        // Resize the chip image to a smaller size
        const chipWidth = 50;
        const chipHeight = 50;

        // Calculate the position to place the chip at the center-right
        const xPosChip = width - chipWidth - 15;
        const yPosChip = (height - chipHeight) / 2;

        // Draw the chip image on the canvas, scaled to the desired size
        ctx.drawImage(chipImage, xPosChip, yPosChip, chipWidth, chipHeight);

        // Load the bottom right image
        loadImage("top1.png")
          .then((bottomRightImage) => {
            // Set the size for the bottom right image
            const imageWidth = 40;
            const imageHeight = 40;

            // Position in bottom right corner with some padding
            const xPosBottomRight = width - imageWidth - 20;
            const yPosBottomRight = height - imageHeight - 10;

            // Draw the bottom right image
            ctx.drawImage(
              bottomRightImage,
              xPosBottomRight,
              yPosBottomRight,
              imageWidth,
              imageHeight
            );

            drawIconWithText("coin.png", "25", 20, 15, (height - 30) / 2);
            drawIconWithText("coin.png", "99.9", 20, 15, (height + 25) / 2);
            drawIconWithText("icon.jpg", "Benluka.dev", 25, 15, height - 40);
            drawIconWithText("logo.png", "DevPinia 🍍", 25, 15, 25);

            // Save the image as a PNG
            const out = fs.createWriteStream(
              __dirname + "/credit-card-with-background-and-icons.png"
            );
            const stream = canvas.createPNGStream();
            stream.pipe(out);

            out.on("finish", () => {
              console.log(
                "The credit card image with background, icons, and text has been created!"
              );
            });
          })
          .catch((err) => {
            console.error("Error loading bottom right image:", err);
          });
      })
      .catch((err) => {
        console.error("Error loading chip image:", err);
      });
  })
  .catch((err) => {
    console.error("Error loading background image:", err);
  });
