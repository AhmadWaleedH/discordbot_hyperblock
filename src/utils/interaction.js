exports.replyOrEditInteraction = async (interaction, reply) => {
  try {
    if (interaction.deferred || interaction.replied)
      return await interaction.editReply(reply);
    return await interaction.reply(reply);
  } catch (error) {
    console.log(error);
  }
};

exports.handleInteractionError = async (err, interaction) => {
  console.log(err);

  const content = `Err! \`${err.message}\``;

  await this.replyOrEditInteraction(interaction, {
    content,
    components: [],
    embeds: [],
    ephemeral: true,
  });
};
