const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
async function sendEmbedWithButtons(
  guild,
  channelId,
  embedOptions,
  buttonOptions,
  interaction
) {
  const channel = guild.channels.cache.get(channelId);
  if (!channel) return console.error("Channel not found");

  const embed = new EmbedBuilder()
    .setTitle(embedOptions.title || "Default Title")
    .setDescription(embedOptions.description || "Default Description")
    .setColor(embedOptions.color || "#0099ff")
    .setFooter({
      text: embedOptions.footer || "Default Footer",
      iconURL:
        "https://discord.com/channels/1218982026330243143/1302958983144935444",
    })
    .setTimestamp();

  if (embedOptions.fields) {
    embed.addFields(embedOptions.fields);
  }

  const buttons = buttonOptions.map((btn) =>
    new ButtonBuilder()
      .setLabel(btn.label)
      .setStyle(btn.style || ButtonStyle.Primary)
      .setCustomId(btn.customId)
      .setEmoji(btn.emoji)
  );

  const actionRow = new ActionRowBuilder().addComponents(buttons);

  if (interaction)
    await interaction.reply({
      embeds: [embed],
      components: [actionRow],
      ephemeral: true,
    });
  else await channel.send({ embeds: [embed], components: [actionRow] });
}

module.exports = sendEmbedWithButtons;
