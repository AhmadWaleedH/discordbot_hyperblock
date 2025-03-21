const { PermissionsBitField, ChannelType } = require("discord.js");
const { handleInteractionError } = require("../utils/interaction");
const { CommandType } = require("wokcommands");
const { categoryName, channels } = require("../utils/constants");
const Guilds = require("../models/Guilds");

module.exports = {
  description: "Setup channels",
  type: CommandType.SLASH,

  permissions: PermissionsBitField.Flags.Administrator,

  /**
   *
   * @param {CommandInteraction} interaction
   */

  callback: async ({ interaction }) => {
    try {
      await interaction.deferReply({ ephemeral: true });

      const {
        guild: { id: guildId },
      } = interaction;

      // return interaction.editReply(
      //   "Please create an account at https://example.com/"
      // );

      const doc = await Guilds.findOne({ guildId });

      if (doc) {
        let cat = interaction.guild.channels.cache.get(doc.category);

        if (!cat) {
          cat = await interaction.guild.channels.create({
            name: categoryName,
            type: ChannelType.GuildCategory,
          });
          for (const channel of channels) {
            const ch = await interaction.guild.channels.create({
              name: channel,
              parent: cat,
            });

            doc.channels[channel] = ch.id;
          }
        }

        doc.category = cat.id;

        for (const channel of channels) {
          let ch = interaction.guild.channels.cache.get(doc.channels[channel]);

          if (!ch) {
            ch = await interaction.guild.channels.create({
              name: channel,
              parent: cat,
            });
            doc.channels[channel] = ch.id;
          }
        }

        doc.markModified("channels"); // mongoose doesnt detect nested object changes on save()

        await doc.save();
      }

      if (!doc) {
        const newDoc = new Guilds({ guildId });
        const cat = await interaction.guild.channels.create({
          name: categoryName,
          type: ChannelType.GuildCategory,
        });

        newDoc.category = cat.id;

        for (const channel of channels) {
          const ch = await interaction.guild.channels.create({
            name: channel,
            parent: cat,
          });

          newDoc.channels[channel] = ch.id;
        }

        await newDoc.save();
      }

      await interaction.editReply("Setup complete ✅");
    } catch (error) {
      await handleInteractionError(error, interaction);
    }
  },
};
