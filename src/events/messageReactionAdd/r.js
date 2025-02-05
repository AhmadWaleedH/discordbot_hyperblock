const Guilds = require("../../models/Guilds");
const Users = require("../../models/Users");

module.exports = async (client, messageReaction, user) => {
  try {
    if (messageReaction.partial) await messageReaction.fetch();

    const { message } = messageReaction;

    const g = await Guilds.findOne({ guildId: message.guildId });

    if (!g) return console.log("Reaction added but no guild setup");

    const { botConfig } = g;
    if (!botConfig) return;

    if (!botConfig.reactions?.channels?.length)
      return console.log("Reaction not setup");

    const { channels, cooldown, points } = botConfig.reactions;

    console.log(message.createdAt);

    if (Date.now() > message.createdAt.getTime() + cooldown)
      return console.log("Reaction received but time expired");

    if (!channels.includes(message.channelId)) return;

    const userDoc = await Users.findOne({ discordId: user.id });

    if (!userDoc)
      return await Users.create({
        discordId: user.id,
        discordUsername: user.username,
        discordUserAvatarURL: user.displayAvatarURL(),
        serverMemberships: [
          {
            guildId: message.guildId,
            guildName: message.guild.name,
            guildIcon: message.guild.iconURL(),
            points,
          },
        ],
      });

    const membership = userDoc.serverMemberships.find(
      (g) => g.guildId === message.guildId
    );

    if (!membership)
      userDoc.serverMemberships.push({
        guildId: message.guildId,
        guildName: message.guild.name,
        guildIcon: message.guild.iconURL(),
        points,
      });
    if (membership) membership.points += points;

    await userDoc.save();
  } catch (error) {
    console.log(error);
  }
};
