const cron = require("node-cron");
const { EmbedBuilder } = require("discord.js");
const mongoose = require("mongoose");
const Auction = require("../../models/Auction");
const Guilds = require("../../models/Guilds");
const fs = require("fs");
const path = require("path");
async function endAuction(auction, client) {
  try {
    // Find the guild where the auction is hosted
    const guild = client.guilds.cache.get(auction.guildId);
    if (!guild) {
      console.error(`Guild not found for auction ${auction._id}`);
      return;
    }

    // Get the guild document
    const guildDoc = await Guilds.findOne({ guildId: auction.guildId });

    console.log(guildDoc);
    if (!guildDoc) {
      console.error(`Guild document not found for auction ${auction._id}`);
      return;
    }

    // Get the channel where the auction end message should be sent
    const channel = guild.channels.cache.get(
      guildDoc.botConfig.channels.hypeLogs
    );

    const auctionChannel = guild.channels.cache.get(guildDoc.botConfig.userChannels.auctions)
    if (!channel) {
      console.error(`Channel not found for auction ${auction._id}`);
      return;
    }

    if (!auctionChannel) {
      console.error(`Channel not found for auction ${auction._id}`);
      return;
    }

    // Determine the winner
    let winner;
    if (auction.bidders.length > 0) {
      const winningBid = auction.bidders.reduce((max, bid) =>
        bid.bidAmount > max.bidAmount ? bid : max
      );
      winner = await mongoose.model("User").findOne({
        discordId: winningBid.userId,
      });
    }

    const endTimeUnix = Math.floor(new Date(auction.duration).getTime() / 1000);
    // Create the auction end message
    const endEmbed = new EmbedBuilder()
      .setTitle("Auction Ended")
      .setColor("#ff0000")
      .setDescription(`The auction for ${auction.name} has ended.`)
      .addFields(
        {
          name: "Highest Bidder",
          value: winner ? `<@${winner.discordId}>` : "No bids",
        },
        { name: "Quantity", value: `${auction.quantity}` },
        { name: "Chain", value: auction.chain },
        { name: "Description", value: auction.description || "No description" },
        {
          name: "Auction Duration",
          value: `<t:${endTimeUnix}:R>`,
        }
      );
      
    // Update the auction status and winner
    auction.status = "ended";
    if (winner) {
      const winnerUser = await client.users.fetch(winner.discordId);
      const winnerUsername = winnerUser.username;
      auction.winner = {
        userId: winner.discordId,
        userName : winnerUsername,
        winningBid: winner.winningBid,
      };

      // Assign the winner's role if specified
      if (auction.roleForWinner) {
        try {
          const winnerMember = await guild.members.fetch(winner.discordId);
          await winnerMember.roles.add(auction.roleForWinner);
        } catch (error) {
          console.error(`Failed to assign role`, error);
        }
      }
    }
    await auction.save();
              if (guildDoc?.botConfig?.userChannels?.leaderboard) {
                const leaderboardChannelId = guildDoc.botConfig.userChannels.leaderboard;
                const leaderboardChannel = await client.channels.fetch(leaderboardChannelId);
      
                if (leaderboardChannel) {
                  await leaderboardChannel.send({ embeds: [endEmbed] });
                }
              }

    // Send the auction end message to the channel
    await auctionChannel.send({ embeds: [endEmbed] });

    const csvFilePath = await saveAuctionResultsToCSV(auction, winner);

    await channel.send({ files: [csvFilePath] });

    console.log(`Auction ${auction._id} has ended.`);
  } catch (error) {
    console.log(error);
  }
}

async function saveAuctionResultsToCSV(auction, winner) {
  try {
    // Construct the CSV data
    const csvData = [
      [
        "Auction Name",
        "Highest Bidder",
        "Winning Bid",
        "Quantity",
        "Chain",
        "Description",
        "Auction Duration",
      ],
      [
        auction.name,
        winner ? `<@${winner.discordId}>` : "No bids",
        winner ? `${winner.winningBid} points` : "No bids",
        auction.quantity,
        auction.chain,
        auction.description || "No description",
        `${(auction.duration - new Date()) / (1000 * 60 * 60 * 24)} days`,
      ],
    ];

    // Add the bidders list
    for (const bid of auction.bidders) {
      const user = await mongoose
        .model("User")
        .findOne({ discordId: bid.userId });
      csvData.push([
        `<@${user.discordId}>`,
        `${bid.bidAmount} points`,
        bid.timestamp.toISOString(),
      ]);
    }

    // Save the CSV file
    const csvFilePath = path.join(
      __dirname,
      `auction-${auction._id}-results.csv`
    );
    await fs.promises.writeFile(
      csvFilePath,
      csvData.map((row) => row.join(",")).join("\n")
    );

    console.log(`Auction results saved to CSV for auction ${auction._id}`);
    return csvFilePath;
  } catch (error) {
    console.error(
      `Error saving auction results to CSV for auction ${auction._id}:`,
      error
    );
    return null;
  }
}
module.exports = { endAuction };
