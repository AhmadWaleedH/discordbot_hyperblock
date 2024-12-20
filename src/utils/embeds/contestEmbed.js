const { EmbedBuilder } = require("discord.js");
const ms = require("ms");

function generateContestEmbed(contest) {
  // Format duration into a readable string
  const timeRemaining = contest.duration - new Date();
  const formattedDuration = ms(timeRemaining, { long: true });

  // Counting the number of participants
  const numberOfParticipants = contest.votes.reduce(
    (acc, vote) => acc + vote.userVotes.length,
    0
  );

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

  // Compile the leaderboard with total votes for each user
  let leaderboard = [];
  contest.votes.forEach((voteEntry) => {
    voteEntry.userVotes.forEach((userVote) => {
      const userIndex = leaderboard.findIndex(
        (user) => user.userId === userVote.userId
      );
      if (userIndex === -1) {
        leaderboard.push({
          userId: userVote.userId,
          votes: userVote.voteCount,
        });
      } else {
        leaderboard[userIndex].votes += userVote.voteCount;
      }
    });
  });

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
