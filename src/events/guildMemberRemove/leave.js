const Users = require("../../models/Users");

module.exports = async (client, member) => {
  try {
    const r = await Users.findOneAndUpdate(
      {
        discordId: member.id,
        "serverMemberships.guildId": member.guild.id,
      },
      { $set: { "serverMemberships.$.status": "inactive" } }
    );
  } catch (e) {}
};
