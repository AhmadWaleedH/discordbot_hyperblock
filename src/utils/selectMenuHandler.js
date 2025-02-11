const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");

/**
 * Sends a select menu with specified content to the given channel.
 *
 * @param {Object} channel - The channel to send the message to.
 * @param {string} content - The content of the message to send.
 * @param {string} customId - The custom ID for the select menu.
 * @param {string} placeholder - The placeholder text for the select menu.
 * @param {Array} options - An array of options for the select menu.
 */
async function sendSelectMenu(
  interaction,
  content,
  customId,
  placeholder,
  options,
  shouldUpdate = true
) {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder);

  // Add each option dynamically to the select menu
  options.forEach((option) => {
    selectMenu.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(option.label)
        .setDescription(option.description)
        .setValue(option.value)
    );
  });

  // Create the ActionRow with the select menu component
  const row = new ActionRowBuilder().addComponents(selectMenu);

  if (shouldUpdate)
    await interaction.update({
      content: content,
      components: [row],
      ephemeral: true,
    });
  if (!shouldUpdate)
    await interaction.reply({
      content: content,
      components: [row],
      ephemeral: true,
    });
}

module.exports = sendSelectMenu;
