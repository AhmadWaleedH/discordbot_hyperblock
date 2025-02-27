const { EmbedBuilder } = require("discord.js");
const ms = require("ms");

function generateContestEmbed(contest, client) {
  // Format duration into a readable string
  const timeRemaining = contest.duration - new Date();
  const formattedDuration = ms(timeRemaining, { long: true });

  // Create a map to track votes per message author
  const authorVotesMap = new Map();
  
  // Process votes to count them by message author instead of by voter
  contest.votes.forEach(async (voteEntry) => {
    // Calculate total votes for this message
    const totalVotesForMessage = voteEntry.userVotes.reduce(
      (acc, userVote) => acc + userVote.voteCount, 
      0
    );
    
    try {
      // Fetch the message to get its author
      const channel = client.channels.cache.get(contest.channelId);
      if (channel) {
        // Try to get the message from cache or fetch it
        let message;
        try {
          message = channel.messages.cache.get(voteEntry.messageId) || 
                   await channel.messages.fetch(voteEntry.messageId);
        } catch (error) {
          console.error(`Error fetching message ${voteEntry.messageId}:`, error);
          return; // Skip this message if it can't be fetched
        }
        
        if (message) {
          const authorId = message.author.id;
          
          // Add votes to the author's total
          if (authorVotesMap.has(authorId)) {
            authorVotesMap.set(authorId, authorVotesMap.get(authorId) + totalVotesForMessage);
          } else {
            authorVotesMap.set(authorId, totalVotesForMessage);
          }
        }
      }
    } catch (error) {
      console.error("Error processing votes for leaderboard:", error);
    }
  });

  // Convert map to array for sorting
  let leaderboard = Array.from(authorVotesMap.entries()).map(([userId, votes]) => ({
    userId,
    votes
  }));

  // Sort leaderboard by total votes, descending order
  leaderboard.sort((a, b) => b.votes - a.votes);

  // Format the leaderboard for display in the embed
  let leaderboardText = leaderboard
    .map((user, index) => {
      return `${index + 1}. <@${user.userId}> - **${user.votes}** votes`;
    })
    .join("\n");

  // If leaderboard is empty, show a message indicating no votes
  if (leaderboardText.length === 0) {
    leaderboardText = "No votes yet!";
  }

  // Counting the number of participants (unique message authors)
  const numberOfParticipants = authorVotesMap.size;

  // Counting the total votes
  const totalVotes = contest.votes.reduce(
    (acc, vote) =>
      acc +
      vote.userVotes.reduce(
        (subAcc, userVote) => subAcc + userVote.voteCount,
        0
      ),
    0
  );

  // Creating the embed
  const contestEmbed = new EmbedBuilder()
    .setTitle(`🏆 **${contest.title}** 🏆`)
    .setDescription(contest.description)
    .setColor("#00FF00") // Custom color for the embed
    .addFields(
      {
        name: "⏳ **Duration**",
        value: `Ends in: **${formattedDuration}**`,
        inline: true,
      },
      {
        name: "🎉 **Number of Winners**",
        value: `**${contest.numberOfWinners}**`,
        inline: true,
      },
      {
        name: "💰 **Points for Participants**",
        value: `**${contest.pointsForParticipants}** points`,
        inline: false,
      },
      {
        name: "🏅 **Points for Winners**",
        value: `**${contest.pointsForWinners.join(", ")}**`,
        inline: true,
      },
      {
        name: "👥 **Number of Participants**",
        value: `**${numberOfParticipants}** participants`,
        inline: true,
      },
      {
        name: "🔢 **Total Votes**",
        value: `**${totalVotes}** votes`,
        inline: false,
      }
    )
    .addFields({
      name: "🏆 **Leaderboard**",
      value: leaderboardText,
      inline: false,
    })
    .setFooter({ text: `Good luck to all participants! 🎉` });

  return contestEmbed;
}

module.exports = { generateContestEmbed };
