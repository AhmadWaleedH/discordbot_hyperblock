const Giveaway = require("../models/raffles"); // Adjust the path to your model

async function updateGiveaway(interaction, id, updateData) {
  try {
    const updatedGiveaway = await Giveaway.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedGiveaway) {
      return interaction.reply({
        content: "Giveaway not found.",
        ephemeral: true,
      });
    }

    await interaction.reply({
      content: "Giveaway optional added successfully.",
      ephemeral: true,
    });
  } catch (error) {
    console.error("Error updating giveaway:", error);
    await interaction.reply({
      content: "There was an error updating the giveaway.",
      ephemeral: true,
    });
  }
}

// Export the function
module.exports = { updateGiveaway };
