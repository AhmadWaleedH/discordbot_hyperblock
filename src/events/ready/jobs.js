const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const Contest = require("../../models/Contests");
const User = require("../../models/Users");
const Guilds = require("../../models/Guilds")
const cron = require("node-cron");
const Tweet = require("../../models/tweet");

const axios = require('axios');
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

            // **2. Determine winners based on content creators with most votes**
            // Calculate total votes for each message

            const allParticipants = [...new Set(contest.votes.map(vote => vote.authorId).filter(id => id))];
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
            contest.deletionTime = new Date(Date.now() + 2 * 60 * 1000);
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
                  name: "💥 **Points for Participation**",
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



              const guildData = await Guilds.findOne({ guildId: contest.guildId });
              if (guildData?.botConfig?.userChannels?.leaderboard) {
                const leaderboardChannelId = guildData.botConfig.userChannels.leaderboard;
                const leaderboardChannel = await client.channels.fetch(leaderboardChannelId);
      
                if (leaderboardChannel) {
                  await leaderboardChannel.send({ embeds: [contestEmbed] });
                }
              }
            // Send the final message to the contest channel
            await channel.send({ embeds: [contestEmbed] });
          }
        }
      }
    } catch (error) {
      console.error("Error running cron job:", error);
    }
  });


  cron.schedule("* * * * *", async () => {
    try {
      const contestsToDelete = await Contest.find({
        deletionTime: { $lte: new Date() }, // Find contests where deletionTime has passed
      });
  
      for (const contest of contestsToDelete) {
        const guild = await client.guilds.fetch(contest.guildId);
        const channel = await guild.channels.fetch(contest.channelId);
  
        if (channel) {
          await channel.delete();
          console.log(`Deleted channel ${contest.channelId} from guild ${guild.name}.`);
        }
  
        // Remove contest entry from database (optional)
        await Contest.deleteOne({ _id: contest._id });
      }
    } catch (error) {
      console.error("Error deleting expired contest channels:", error);
    }
  });

  

  cron.schedule('* * * * *', async ()  => {
    checkTweetParticipation(client);
  });
};




async function checkTweetParticipation(client) {
  try {
    console.log("Checking for expired tweets...");
    const now = new Date();
    
    // Find tweets where timeRemaining has passed
    const expiredTweets = await Tweet.find({ timeRemaining: { $lte: now },  isExpired: false });
    
    if (expiredTweets.length > 0) {
      let userPoints = {};
      for (const tweet of expiredTweets) {
        console.log(tweet);
        // Prepare Twitter API request
        const options = {
          method: 'GET',
          headers: { Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}` }
        };

        let likingUsers = [];
        let retweetingUsers = [];
        console.log(tweet.action === 'like');
        // Check liking users if action requires like
        if (tweet.action === 'like' || tweet.action === 'like_retweet') {
          try {
            const likeResponse = await axios.get(
              `https://api.twitter.com/2/tweets/${tweet.tweetId}/liking_users`, 
              options
            );
            console.log(likeResponse);
            likingUsers = likeResponse.data.data || [];
          } catch (likeError) {
            console.error('Error fetching liking users:', likeError);
            continue;
          }
        }

        // Check retweeting users if action requires retweet
        if (tweet.action === 'retweet' || tweet.action === 'like_retweet') {
          try {
            const retweetResponse = await axios.get(
              `https://api.twitter.com/2/tweets/${tweet.tweetId}/retweeted_by`, 
              options
            );
            console.log(retweetResponse.data.data);
            retweetingUsers = retweetResponse.data.data || [];
          } catch (retweetError) {
            console.error('Error fetching retweeting users:', retweetError);
            continue;
          }
        }

        // Process participants
        for (const participant of tweet.participants) {
          // Find the user's X (Twitter) account details
          const user = await User.findOne({ 'discordId': participant.userId });
          
          if (user) {
            // Find the specific server membership
            const serverMembership = user.serverMemberships.find(
              membership => membership.guildId === tweet.guildId
            );

            if (serverMembership) {
              let pointsEarned = 0;

              // Check participation based on action
              switch (tweet.action) {
                case 'like':
                  if (likingUsers.some(u => u.id === participant.twitterId)) {
                    pointsEarned = 10; // Points for liking
                  }
                  break;
                
                case 'retweet':
                  console.log("jere");
                  if (retweetingUsers.some(u => u.id === participant.twitterId)) {
                    console.log("hello")
                    pointsEarned = 10; // Points for retweeting
                  }
                  break;
                
                case 'like_retweet':
                  const likedTweet = likingUsers.some(u => u.id === participant.twitterId);
                  const retweetedTweet = retweetingUsers.some(u => u.id === participant.twitterId);
                  
                  if (likedTweet && retweetedTweet) {
                    pointsEarned = 20; // More points for both actions
                  }
                  break;
              }

              // Assign points if earned
              if (pointsEarned > 0) {
                serverMembership.points += pointsEarned;
                serverMembership.completedTasks += 1;
                
                await user.save();
                
                console.log(`Assigned ${pointsEarned} points to user ${user.discordUsername} for tweet participation`);

                if (!userPoints[tweet.guildId]) userPoints[tweet.guildId] = [];
                userPoints[tweet.guildId].push({
                  username: user.discordUsername,
                  points: serverMembership.points
                });
              }
            }
          }
        }

        // Mark tweet as processed
        tweet.isExpired = true;
        await tweet.save();
      }

      await sendLeaderboardEmbeds(client, userPoints);
    } else {
      console.log("No expired tweets found.");
    }
  } catch (error) {
    console.error("Error checking tweet participation:", error);
  }
}



async function sendLeaderboardEmbeds(client, userPoints) {
  for (const guildId in userPoints) {
    const guildData = await Guilds.findOne({ guildId });

    if (!guildData || !guildData.botConfig?.userChannels?.leaderboard) continue;

    const leaderboardChannelId = guildData.botConfig.userChannels.leaderboard;
    const channel = await client.channels.fetch(leaderboardChannelId).catch(() => null);
    if (!channel) continue;

    // Sort users by points (highest first)
    const sortedUsers = userPoints[guildId].sort((a, b) => b.points - a.points);

    const embed = new EmbedBuilder()
      .setTitle("🏆 Leaderboard Update")
      .setColor("#FFD700")
      .setDescription(
        sortedUsers.map((user, index) => `**${index + 1}. ${user.username}** - ${user.points} points`).join("\n")
      )
      .setFooter({ text: "Keep participating to climb the leaderboard!" });

    await channel.send({ embeds: [embed] });
  }
}
