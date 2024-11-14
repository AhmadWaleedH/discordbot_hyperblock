const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");

/**
 * Show a dynamic modal with custom fields in response to an interaction.
 *
 * @param {Interaction} interaction - The interaction that triggers the modal.
 * @param {string} modalTitle - Title of the modal.
 * @param {string} customId - Custom ID for the modal interaction.
 * @param {Array<Object>} fieldOptions - Array of field configurations (label, placeholder, customId, style).
 */
async function showModal(interaction, modalTitle, customId, fieldOptions) {
  const modal = new ModalBuilder().setCustomId(customId).setTitle(modalTitle);

  const actionRows = fieldOptions.map((field) => {
    const textInput = new TextInputBuilder()
      .setCustomId(field.customId)
      .setLabel(field.label)
      .setPlaceholder(field.placeholder || "")
      .setStyle(field.style || TextInputStyle.Short)
      .setRequired(field.required === undefined ? true : field.required);
    if (field.value) {
      textInput.setValue(field.value);
    }
    return new ActionRowBuilder().addComponents(textInput);
  });

  modal.addComponents(...actionRows);

  await interaction.showModal(modal);
}

module.exports = showModal;
