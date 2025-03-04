const mongoose = require("mongoose");

async function placeBid(auctionId, userId, bidAmount, guildId, username) {
  // Start a MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get auction and user data
    const auction = await mongoose
      .model("Auction")
      .findOne({
        _id: auctionId,
        status: "active",
      })
      .session(session);

    const user = await mongoose
      .model("User")
      .findOne({
        discordId: userId,
      })
      .session(session);

    // Validation checks
    const validationError = await validateBid(
      auction,
      user,
      bidAmount,
      guildId
    );
    if (validationError) {
      await session.abortTransaction();
      return { success: false, error: validationError };
    }

    // Get user's server membership
    const serverMembership = user.serverMemberships.find(
      (membership) => membership.guildId === guildId
    );

    // Check if user has enough points
    if (serverMembership.points < bidAmount) {
      await session.abortTransaction();
      return {
        success: false,
        error: `Insufficient points. You have ${serverMembership.points} points.`,
      };
    }

    // Process the bid
    const bidResult = await processBid(
      auction,
      user,
      bidAmount,
      serverMembership,
      session,
      username
    );
    if (!bidResult.success) {
      await session.abortTransaction();
      return bidResult;
    }

    await session.commitTransaction();
    return {
      success: true,
      message: "Bid placed successfully",
      auction: bidResult.auction,
      updatedPoints: serverMembership.points - bidAmount,
    };
  } catch (error) {
    await session.abortTransaction();
    return {
      success: false,
      error: "An error occurred while processing the bid",
    };
  } finally {
    session.endSession();
  }
}

async function validateBid(auction, user, bidAmount, guildId) {
  // Check if auction exists and is active
  if (!auction) {
    return "Auction not found or has ended";
  }

  // Check auction status
  if (auction.status !== "active") {
    return "This auction has ended";
  }

  if (auction.quantity <= 0) {
    return "Spots are ended for this auction";
  }

  // Check if auction has expired
  if (auction.duration < new Date()) {
    return "This auction has expired";
  }

  // Check if user exists
  if (!user) {
    return "User not found";
  }

  // Check if user has server membership
  const serverMembership = user.serverMemberships.find(
    (membership) => membership.guildId === guildId
  );
  if (!serverMembership) {
    return "You are not a member of this server";
  }

  // Check minimum bid requirement
  if (bidAmount < auction.minimumBid) {
    return `Bid must be at least ${auction.minimumBid} points`;
  }

  // Check if bid is higher than current bid
  if (auction.currentBid >= bidAmount) {
    return `Bid must be higher than current bid of ${auction.currentBid} points`;
  }

  // Check if role is required and user has it
  //   if (auction.roleRequired) {
  //     // Note: You'll need to implement role checking logic here
  //     // This requires access to Discord.js client and guild object
  //     return null; // Placeholder
  //   }

  return null; // No validation errors
}

async function processBid(auction, user, bidAmount, serverMembership, session, userName) {
  try {
    // Refund previous bid if exists
    if (auction.currentBidder === user.discordId) {
      serverMembership.points += auction.currentBid;
    }

    // Refund previous highest bidder
    if (auction.currentBidder && auction.currentBidder !== user.discordId) {
      const previousBidder = await mongoose
        .model("User")
        .findOne({
          discordId: auction.currentBidder,
        })
        .session(session);

      if (previousBidder) {
        const prevBidderMembership = previousBidder.serverMemberships.find(
          (m) => m.guildId === auction.guildId
        );
        if (prevBidderMembership) {
          prevBidderMembership.points += auction.currentBid;
          await previousBidder.save({ session });
        }
      }
    }

    // Update auction with new bid
    auction.currentBid = bidAmount;
    auction.currentBidder = user.discordId;
    const bidEntry = {
      userId: user.discordId,
      userName,
      bidAmount: bidAmount,
      timestamp: new Date(),
    };

    if (user.walletAddress) {
      bidEntry.walletAddress = user.walletAddress;
    }

    auction.bidders.push(bidEntry);

    serverMembership.points -= bidAmount;

    // Add bid to user's bids (new field we'll add to schema)
    if (!user.activeBids) {
      user.activeBids = [];
    }
    user.activeBids.push({
      auctionId: auction._id,
      bidAmount: bidAmount,
      timestamp: new Date(),
    });

    auction.quantity -= 1;

    // Save all changes
    await Promise.all([auction.save({ session }), user.save({ session })]);

    return { success: true, auction };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Failed to process bid" };
  }
}

module.exports = { placeBid };
