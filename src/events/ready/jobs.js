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

            // Get all participants (message creators)
            const allParticipants = [...new Set(contest.votes.map(vote => vote.authorId).filter(id => id))];
            
            // **1. Award points to all participants (post creators)**
            for (const userId of allParticipants) {
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
                  points: contest.pointsForParticipants,
                });
              }

              await user.save();
              console.log(
                `Awarded ${contest.pointsForParticipants} points to participant ${userId}`
              );
            }

            // **2. Determine winners based on content creators with most votes**
            // Calculate total votes for each message
            const contentCreatorVotes = [];
            
            for (const vote of contest.votes) {
              if (!vote.authorId) continue; // Skip if no author ID (shouldn't happen)
              
              // Calculate total votes for this message
              const totalVotesForMessage = vote.userVotes.reduce(
                (sum, userVote) => sum + userVote.voteCount, 
                0
              );
              
              // Add to our array of content creators and their votes
              contentCreatorVotes.push({
                userId: vote.authorId,
                messageId: vote.messageId,
                votes: totalVotesForMessage
              });
            }
            
            // Sort by vote count in descending order
            contentCreatorVotes.sort((a, b) => b.votes - a.votes);

            // Award points to winners
            for (
              let i = 0;
              i < contest.numberOfWinners && i < contentCreatorVotes.length;
              i++
            ) {
              const winner = contentCreatorVotes[i];
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

            // Get winner names and points
            const winnerNames = await Promise.all(
              contentCreatorVotes
                .slice(0, contest.numberOfWinners)
                .map(async (winner, idx) => {
                  const user = await client.users.fetch(winner.userId);
                  return `**🏆 ${idx + 1}. ${user.username}** - **${
                    contest.pointsForWinners[idx]
                  }** points (${winner.votes} votes)`;
                })
            );

            // Get participants and their vote count
            const participantsList = await Promise.all(
              allParticipants.map(async (userId) => {
                const user = await client.users.fetch(userId);
                // Find all votes for this participant's messages
                const userMessages = contest.votes.filter(vote => vote.authorId === userId);
                const totalVotes = userMessages.reduce((sum, msg) => {
                  return sum + msg.userVotes.reduce((vSum, v) => vSum + v.voteCount, 0);
                }, 0);
                
                return `**${user.username}** - **${totalVotes}** votes`;
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
