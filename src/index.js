require("dotenv").config();
const { Client, IntentsBitField } = require("discord.js");
const eventHandler = require("./handlers/eventHandler");
const userCooldowns = new Map();
const User = require("./models/Users");
const Guilds = require("./models/Guilds");
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

eventHandler(client);

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  try {
    const guildConfig = await Guilds.findOne({
      guildId: message.guild.id,
    });
    if (!guildConfig) return;

    const { channels, cooldown, points } = guildConfig.botConfig.chats;
    if (!channels.includes(message.channel.id)) return;

    const cooldownKey = `${message.author.id}-${message.guild.id}`;
    const userCooldown = userCooldowns.get(cooldownKey);
    const now = Date.now();

    if (userCooldown && userCooldown > now) {
      return;
    }

    userCooldowns.set(cooldownKey, now + cooldown);

    let user = await User.findOne({
      discordId: message.author.id,
    });

    if (!user) {
      user = new User({
        discordId: message.author.id,
        status: "active",
        serverMemberships: [
          {
            guildId: message.guild.id,
            joinedAt: new Date(),
            points: 0,
            activeRaids: 0,
            completedTasks: 0,
          },
        ],
      });
    } else {
      let serverMembership = user.serverMemberships.find(
        (membership) => membership.guildId === message.guild.id
      );

      if (!serverMembership) {
        serverMembership = {
          guildId: message.guild.id,
          joinedAt: new Date(),
          points: 0,
          activeRaids: 0,
          completedTasks: 0,
        };
        user.serverMemberships.push(serverMembership);
      }
    }

    // Add points to user's server membership
    const membershipIndex = user.serverMemberships.findIndex(
      (membership) => membership.guildId === message.guild.id
    );

    if (membershipIndex !== -1) {
      user.serverMemberships[membershipIndex].points += points;
      user.lastActive = new Date();

      // Optionally notify user about points earned (uncomment if needed)
      await message.reply(`You earned ${points} points!`);
    }

    // Save user changes
    await user.save();
  } catch (error) {
    console.error("Error in messageCreate event:", error);
  }
});

client.login(process.env.TOKEN);
