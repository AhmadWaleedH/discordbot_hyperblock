module.exports = {
    name: 'deleteallchannels',
    description: 'Deletes all channels in the server',
    
    callback: async (client, interaction) => {
      await interaction.deferReply({ ephemeral: true });
  
      const guild = interaction.guild;
  
      if (!guild) {
        return interaction.editReply('This command must be used in a server.');
      }
  
      try {
        const channels = guild.channels.cache;
  
        for (const [channelId, channel] of channels) {
          await channel.delete();
          console.log(`Deleted channel: ${channel.name} (${channelId})`);
        }
  
        interaction.editReply('✅ Successfully deleted all channels.');
      } catch (error) {
        console.error('Error deleting channels:', error);
        interaction.editReply('❌ Failed to delete some or all channels.');
      }
    },
  };
  