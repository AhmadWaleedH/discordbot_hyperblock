const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const Contest = require("../../models/Contests");
const User = require("../../models/Users");
const cron = require("node-cron");

module.exports = async (client) => {
  cron.schedule("* * * * *", async () => {
    try {
      const contests = await Contest.find({
        isActive: true,
        duration: { $lt: new Date() }, // End time is passed
      });

      for (const contest of contests) {
        if (
          contest.isActive &&
          contest.channelId &&
          contest.roleAssignedToParticipant
        ) {
          const guild = await client.guilds.fetch(contest.guildId);
          const channel = await guild.channels.fetch(contest.channelId);

          // Fetch the role assigned to participants
          const role = await guild.roles.fetch(
            contest.roleAssignedToParticipant
          );

          if (channel && role) {
            // Deny 'SendMessages' permission to the role
            await channel.permissionOverwrites.edit(role.id, {
              [PermissionsBitField.Flags.SendMessages]: false,
            });

            console.log(
              `Updated permissions for channel ${channel.name} in guild ${guild.name}.`
            );

            // **1. Award points to all participants**
            const allVoters = contest.votes.flatMap((vote) => vote.userVotes);
            const allUsers = [...new Set(allVoters.map((vote) => vote.userId))]; // Get unique users

            for (const userId of allUsers) {
              const discordUser = await client.users.fetch(userId); // Fetch user from Discord API
              let user = await User.findOne({ discordId: userId });
              if (!user) {
                user = new User({
                  discordId: userId,
                  discordUsername: discordUser.username,
                  discordUserAvatarURL: discordUser.displayAvatarURL({ dynamic: true }),
                  status: "active",
                });
              }

              const serverMembership = user.serverMemberships.find(
                (membership) => membership.guildId === contest.guildId
              );

              if (serverMembership) {
                serverMembership.points += contest.pointsForParticipants;
              } else {

              const guild = await client.guilds.fetch(contest.guildId);
                user.serverMemberships.push({
                  guildId: contest.guildId,
                  guildName: guild.name,
                  guildIcon: guild.iconURL({ dynamic: true }),
                  guildId: contest.guildId,
                  points: contest.pointsForParticipants,
                });
              }

              await user.save();
              console.log(
                `Awarded ${contest.pointsForParticipants} points to user ${userId}`
              );
            }

            // **2. Announce winners and award points based on vote count**
            const winners = [];
            contest.votes.forEach((vote) => {
              vote.userVotes.forEach((userVote) => {
                winners.push({
                  userId: userVote.userId,
                  votes: userVote.voteCount,
                });
              });
            });

            winners.sort((a, b) => b.votes - a.votes); // Sort by vote count in descending order

            for (
              let i = 0;
              i < contest.numberOfWinners && i < winners.length;
              i++
            ) {
              const winner = winners[i];
              const winnerPoints = contest.pointsForWinners[i] || 0;

              let user = await User.findOne({ discordId: winner.userId });
              if (user) {
                const serverMembership = user.serverMemberships.find(
                  (membership) => membership.guildId === contest.guildId
                );

                if (serverMembership) {
                  serverMembership.points += winnerPoints;
                } else {
                  const guild = await client.guilds.fetch(contest.guildId);
                  
                  user.serverMemberships.push({
                    guildId: contest.guildId,
                    guildName: guild.name,
                    guildIcon: guild.iconURL({ dynamic: true }),
                    points: winnerPoints,
                  });
                }

                await user.save();
                console.log(
                  `Awarded ${winnerPoints} points to winner ${winner.userId}`
                );
              }
            }

            // **3. Mark contest as inactive**
            contest.isActive = false;
            await contest.save();

            // **4. Generate and send the updated embed with all participants and winners**

            // Get winner names and points (this should not be a Promise array)
            const winnerNames = await Promise.all(
              winners
                .slice(0, contest.numberOfWinners)
                .map(async (winner, idx) => {
                  const user = await client.users.fetch(winner.userId);
                  return `**🏆 ${idx + 1}. ${user.username}** - **${
                    contest.pointsForWinners[idx]
                  }** points`;
                })
            );

            // Get participants and their vote count
            const participantsList = await Promise.all(
              allUsers.map(async (userId) => {
                const user = await client.users.fetch(userId);
                const userVote = contest.votes
                  .flatMap((vote) => vote.userVotes)
                  .find((vote) => vote.userId === userId);
                return `**${user.username}** - **${userVote.voteCount}** votes`;
              })
            );

            // Create the embed
            const contestEmbed = new EmbedBuilder()
              .setTitle(`🏆 **${contest.title}** 🏆`)
              .setDescription(`*${contest.description}*`)
              .addFields(
                {
                  name: "⏳ **Duration**",
                  value: contest.duration.toLocaleString(),
                  inline: true,
                },
                {
                  name: "🏅 **Number of Winners**",
                  value: `${contest.numberOfWinners}`,
                  inline: true,
                },
                {
                  name: "💥 **Points for Participants**",
                  value: `${contest.pointsForParticipants} points`,
                  inline: true,
                },
                {
                  name: "📋 **Participants**",
                  value: participantsList.join("\n") || "No participants",
                  inline: false,
                },
                {
                  name: "🥇 **Winners**",
                  value: winnerNames.join("\n") || "No winners",
                  inline: false,
                }
              )
              .setColor("#FF5733")
              .setFooter({ text: "Good luck in future contests!" });

            // Send the final message to the contest channel
            await channel.send({ embeds: [contestEmbed] });
          }
        }
      }
    } catch (error) {
      console.error("Error running cron job:", error);
    }
  });
};
