// Import necessary modules
const mongoose = require("mongoose");
const User = require("../../models/Users"); // Adjust the path to your model file

module.exports = {
  name: "create_user",
  description: "Creates a user with dummy data in the database.",

  callback: async (client, interaction) => {
    await interaction.deferReply();

    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        discordId: interaction.user.id,
      });
      if (existingUser) {
        return interaction.editReply("User already exists in the database.");
      }

      // Create a new user with dummy data
      const newUser = new User({
        discordId: interaction.user.id,
        walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
        hyperBlockPoints: 100,
        socialAccounts: {
          twitter: {
            id: "123456789",
            username: "dummyUser",
            profileUrl: "https://twitter.com/dummyUser",
          },
        },
        mintWallets: {
          ethereum: "0xabcdefabcdefabcdefabcdefabcdefabcdef",
          solana: "4f3B9Ee1D8E6C5a6Aa6c9B85A7E6BDFD",
        },
        serverMemberships: [
          {
            guildId: interaction.guild.id,
            joinedAt: new Date(),
            points: 50,
            activeRaids: 2,
            completedTasks: 5,
          },
        ],
        lastActive: new Date(),
      });

      // Save the new user to the database
      await newUser.save();

      interaction.editReply("User created successfully with dummy data!");
    } catch (error) {
      console.error("Error creating user:", error);
      interaction.editReply("An error occurred while creating the user.");
    }
  },
};
