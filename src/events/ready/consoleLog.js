const { ActivityType, EmbedBuilder } = require("discord.js");
const { default: mongoose } = require("mongoose");
const cron = require("node-cron");
const Giveaway = require("../../models/raffles");
const {
  initAuctionExpirationSystem,
  endAuction,
} = require("../../utils/jobs/auctionJob");
const Auction = require("../../models/Auction");

function selectRandomWinners(participants, numWinners) {
  // Step 1: Create a weighted pool that preserves each entry's chance
  // but tracks which user each entry belongs to
  const weightedPool = [...participants];
  
  // Step 2: Shuffle the weighted pool to randomize selection
  const shuffledPool = weightedPool.sort(() => 0.5 - Math.random());
  
  // Step 3: Select winners ensuring no user is picked twice
  const winners = [];
  const selectedUserIds = new Set();
  
  // Keep drawing until we have enough winners or exhausted all participants
  let poolIndex = 0;
  while (winners.length < numWinners && poolIndex < shuffledPool.length) {
    const currentEntry = shuffledPool[poolIndex];
    
    // If this user hasn't been selected yet, add them to winners
    if (!selectedUserIds.has(currentEntry.userId)) {
      winners.push(currentEntry);
      selectedUserIds.add(currentEntry.userId);
    }
    
    poolIndex++;
  }
  
  return winners;
}

function createWinnerEmbed(giveaway, winners) {
  return new EmbedBuilder()
    .setTitle(`🎉 Giveaway Ended: ${giveaway.raffleTitle}`)
    .setDescription(`Congratulations to the winners!`)
    .addFields(
      {
        name: "Winners",
        value: winners.map((w) => `<@${w.userId}>`).join("\n") || "No winners",
      },
      {
        name: "Prize",
        value: `Entry Cost: ${giveaway.entryCost} ${giveaway.chain}`,
      },
      { name: "Total Participants", value: `${giveaway.totalParticipants}` }
    )
    .setColor("#00FF00")
    .setTimestamp();
}

async function notifyWinner(userId, giveaway, client) {
  try {
    const user = await client.users.fetch(userId);
    const winnerEmbed = new EmbedBuilder()
      .setTitle("🎉 Congratulations! You Won!")
      .setDescription(`You have won the giveaway: ${giveaway.raffleTitle}`)
      .addFields(
        { name: "Prize", value: `${giveaway.entryCost} ${giveaway.chain}` },
        { name: "Notes", value: giveaway.notes || "No additional notes" }
      )
      .setColor("#00FF00")
      .setTimestamp();

    await user.send({ embeds: [winnerEmbed] });
  } catch (error) {
    console.error(`Failed to DM winner ${userId}:`, error);
  }
}
module.exports = async (client) => {
  console.log(`${client.user.tag} is online.`);
  try {
    const MONGO_URI = process.env.MONGO_URI;
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("📦 Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }

  client.user.setPresence({
    activities: [
      {
        name: `Launching soon 🍾!`,
        type: ActivityType.Playing,
      },
    ],
  });

  cron.schedule("* * * * *", () => {
    processExpiredGiveaways(client).catch((error) => {
      console.error("Error in cron job:", error);
    });
  });

  cron.schedule("* * * * *", async () => {
    try {
      // Find all active auctions that have expired
      const expiredAuctions = await Auction.find({
        status: "active",
        duration: { $lte: new Date() },
      });

      for (const auction of expiredAuctions) {
        await endAuction(auction, client);
      }
    } catch (error) {
      console.error("Error in auction expiration system:", error);
    }
  });

  console.log("Auction expiration system initialized");
};

async function processExpiredGiveaways(client) {
  try {
    console.log("starting the giveaway job");
    // Find all non-expired giveaways that have ended
    const expiredGiveaways = await Giveaway.find({
      isExpired: false,
      endTime: { $lte: new Date() },
    });

    for (const giveaway of expiredGiveaways) {
      try {
        // Select winners
        const winners = selectRandomWinners(
          giveaway.participants,
          giveaway.numWinners
        );

        // Update giveaway with winners and mark as expired
        giveaway.winners = winners.map((participant) => ({
          userId: participant.userId,
          userName: participant.userName,
        }));
        giveaway.isExpired = true;
        await giveaway.save();

        // Get the channel
        const channel = await client.channels.fetch(giveaway.channelId);
        if (!channel) continue;

        // Send winner announcement to channel
        const winnerEmbed = createWinnerEmbed(giveaway, winners);
        await channel.send({ embeds: [winnerEmbed] });

        // Notify winners via DM
        for (const winner of winners) {
          await notifyWinner(winner.userId, giveaway, client);
        }

        // If there's a winner role to assign
        if (giveaway.winnerRole) {
          const guild = await client.guilds.fetch(giveaway.guildId);
          for (const winner of winners) {
            try {
              const member = await guild.members.fetch(winner.userId);
              await member.roles.add(giveaway.winnerRole);
            } catch (error) {
              console.error(
                `Failed to assign role to ${winner.userId}:`,
                error
              );
            }
          }
        }
      } catch (error) {
        console.error(`Error processing giveaway ${giveaway._id}:`, error);
      }
    }
  } catch (error) {
    console.error("Error in processExpiredGiveaways:", error);
  }
}
