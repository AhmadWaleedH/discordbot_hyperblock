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
    },
    roleForWinnerName: {
      type: String,
      required: false,
    },
    guildId: {
      type: String,
      required: true,
    },
    guildName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
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
        }, 
        userName: {
          type: String,
          required: true,
        },
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
      userName: {
        type: String,
      },
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
