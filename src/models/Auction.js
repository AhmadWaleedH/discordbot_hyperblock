const mongoose = require("mongoose");

const auctionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    }, // Name of the item being auctioned
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    chain: {
      type: String,
      required: true,
    }, // Blockchain or other identifier for the item
    duration: {
      type: Date,
      required: true,
    }, // Auction end time
    roleForWinner: {
      type: String,
      required: false,
    }, // Role ID that will be assigned to the winner
    guildId: {
      type: String,
      required: true,
    }, // ID of the server where the auction is hosted
    description: {
      type: String,
    }, // Optional description of the item
    roleRequired: {
      type: String,
    }, // Optional role needed to bid
    minimumBid: {
      type: Number,
      default: 0,
    }, // Minimum bid value
    blindAuction: {
      type: Boolean,
      default: false,
    },
    currentBid: {
      type: Number,
      default: 0,
    }, // Current highest bid
    currentBidder: {
      type: String,
    }, // ID of the current highest bidder
    bidders: [
      {
        userId: {
          type: String,
          required: true,
        }, // ID of the user who placed the bid
        bidAmount: {
          type: Number,
          required: true,
        }, // Amount of the bid
        walletAddress: {
          type: String,
          required: false,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        }, // Time the bid was placed
      },
    ],
    status: {
      type: String,
      enum: ["active", "ended", "cancelled"],
      default: "active",
    }, // Status of the auction
    winner: {
      userId: {
        type: String,
      }, // ID of the winner
      winningBid: {
        type: Number,
      }, // Winning bid amount
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Auction", auctionSchema);
