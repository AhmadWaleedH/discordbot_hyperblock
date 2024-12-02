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
function drawText(text, xPos, yPos) {
  ctx.font = "bold 12px Arial"; // Bold font for better clarity
  ctx.fillStyle = "white"; // White text color
  const textWidth = ctx.measureText(text).width; // Measure text width to align

  // Position text to the right of the icon
  const xPosText = xPos; // 5px padding from the icon
  const yPosText = yPos;

  // Draw the text next to the icon
  ctx.fillText(text, xPosText, yPosText);
}

// Load the background image
loadImage("background.jpg")
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

        // Draw the bottom left icon with text
        drawIconWithText("green.png", "Utilities of Paid Users:", 14, 15, 25);

        drawIconWithText(
          "png.png",
          "Create your card in your style",
          14,
          5,
          65
        );
        drawIconWithText("png.png", "Earn HyperBlock Points while ", 14, 5, 85);

        drawIconWithText("png.png", "earning server's points", 14, 5, 105);
        drawIconWithText(
          "png.png",
          "Auto-enrolled in HyperBlock raffles",
          14,
          5,
          125
        );
        drawIconWithText("png.png", "with 888 points", 14, 5, 145);
        drawText("Future Airdrops from HyperBlock", 25, 175);
        drawIconWithText(
          "whitearrow.png",
          "Auto-discount applied at Merch Store.",
          14,
          5,
          205
        );
        drawText("& much more", 25, 193);
        // Step 1: Create the glassmorphism effect area
        // const glassPadding = 15; // Padding for the glass effect
        // const glassWidth = xPosChip - glassPadding; // Width of the glass effect area (left of the chip)
        // const glassHeight = 170 - glassPadding * 1; // Full height with padding

        // // Step 2: Create an overlay (semi-transparent) for the frosted-glass effect
        // ctx.globalCompositeOperation = "source-over";
        // ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; // Light white with transparency
        // ctx.fillRect(0, 55, glassWidth, glassHeight); // Apply overlay inside the defined glass area

        // // Step 3: Apply a blur effect (simulate frosted-glass)
        // ctx.filter = "blur(8px)"; // Apply blur to simulate frosted-glass
        // ctx.drawImage(canvas, 0, 0); // Draw the current canvas onto itself to apply the blur

        // // Step 4: Reset the filter to normal
        // ctx.filter = "none";

        // // Add a subtle border or shadow effect to make it look like real glass
        // ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"; // A faint white border
        // ctx.lineWidth = 2;
        // ctx.strokeRect(0, 55, glassWidth, glassHeight); // Border around the frosted-glass effect area

        // Save the image as a PNG
        const out = fs.createWriteStream(
          __dirname + "/credit-card-with-background-and-icons.png"
        );
        const stream = canvas.createPNGStream();
        stream.pipe(out);

        out.on("finish", () => {
          console.log(
            "The credit card image with background, icons, and glassmorphism effect has been created!"
          );
        });
      })
      .catch((err) => {
        console.error("Error loading chip image:", err);
      });
  })
  .catch((err) => {
    console.error("Error loading background image:", err);
  });
