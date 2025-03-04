require("dotenv").config();
const { Client, IntentsBitField, Partials } = require("discord.js");
const eventHandler = require("./handlers/eventHandler");
const userCooldowns = new Map();
const User = require("./models/Users");
const Guilds = require("./models/Guilds");
const Contest = require("./models/Contests");
const EmbedMessages = require("./models/EmbedMessages");
const { generateContestEmbed } = require("./utils/embeds/contestEmbed");
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildMessageReactions,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.GuildMember,
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

    const { channelId, cooldown, points } = guildConfig.botConfig.chats;
    if (channelId !== message.channel.id) return;

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
        discordUsername: message.author.username,
        discordUserAvatarURL: message.author.displayAvatarURL(),
        status: "active",
        serverMemberships: [
          {
            guildId: message.guild.id,
            guildName: message.guild.name,
            guildIcon: message.guild.iconURL(),
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
          guildName: message.guild.name,
          guildIcon: message.guild.iconURL(),
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
client.on("messageCreate", async (message) => {
  // Ignore messages from bots or that are not in text channels
  if (message.author.bot || message.channel.type !== 0) return;

  try {
    // Fetch all active contests with a channelId
    const contests = await Contest.find({
      isActive: true,
      channelId: { $exists: true },
    });

    // Check if the message was sent in one of those contest channels
    const contest = contests.find((c) => c.channelId === message.channel.id);

    if (contest) {
      if (new Date() > contest.duration) {
        return;
      }
      // Add a ⬆️ (upvote) reaction to the message
      await message.react("⬆️");

      // Check if the contest already has a vote record for this message
      let contestEntry = contest.votes.find(
        (vote) => vote.messageId === message.id
      );

      if (!contestEntry) {
        // If no vote entry for this message, create one
        contestEntry = {
          messageId: message.id,
          authorId: message.author.id,  // Store the message author ID
          userVotes: [],
        };
        contest.votes.push(contestEntry);
      }

      // Save the updated contest document
      await contest.save();
    }
  } catch (error) {
    console.error("Error processing messageCreate event:", error);
  }
});

// Contest FUN ART EVENT MESSAGE ADD EVENT
client.on("messageCreate", async (message) => {
  // Ignore messages from bots or that are not in text channels
  if (message.author.bot || message.channel.type !== 0) return;

  try {
    // Fetch all active contests with a channelId
    const contests = await Contest.find({
      isActive: true,
      channelId: { $exists: true },
    });

    // Check if the message was sent in one of those contest channels
    const contest = contests.find((c) => c.channelId === message.channel.id);

    if (contest) {
      if (new Date() > contest.duration) {
        return;
      }
      // Add a ⬆️ (upvote) reaction to the message
      await message.react("⬆️");

      // Check if the contest already has a vote record for this message
      let contestEntry = contest.votes.find(
        (vote) => vote.messageId === message.id
      );

      if (!contestEntry) {
        // If no vote entry for this message, create one
        contestEntry = {
          messageId: message.id,
          authorId: message.author.id,
          userVotes: [],
        };
        contest.votes.push(contestEntry);
      }

      // Save the updated contest document
      await contest.save();
    }
  } catch (error) {
    console.error("Error processing messageCreate event:", error);
  }
});

// Handle reaction adds to track user votes

// Handle reaction add (vote)
client.on("messageReactionAdd", async (reaction, user) => {
  if (reaction.emoji.name !== "⬆️") return; // Only track upvote reactions
  if (user.bot) return; // Ignore reactions from bots

  try {
    // Find the contest that corresponds to the channel the reaction was added to
    const contest = await Contest.findOne({
      isActive: true,
      channelId: reaction.message.channel.id,
    });

    if (contest) {
      if (new Date() > contest.duration) {
        // If the current time is past the contest's end time, do nothing
        return;
      }

      // First, check if the user has voted on ANY other message in this contest
      let userPreviousVoteEntry = null;
      let userPreviousVoteIndex = -1;

      for (let i = 0; i < contest.votes.length; i++) {
        const entry = contest.votes[i];
        // Skip the current message we're voting on
        if (entry.messageId === reaction.message.id) continue;
        
        // Check if user has a vote in this entry
        const userVoteIndex = entry.userVotes.findIndex(vote => vote.userId === user.id);
        if (userVoteIndex !== -1) {
          userPreviousVoteEntry = entry;
          userPreviousVoteIndex = userVoteIndex;
          
          // Found a previous vote, so get the message it was on
          try {
            const previousVotedMessage = await reaction.message.channel.messages.fetch(entry.messageId);
            
            // Remove the user's reaction from the previous message
            const previousReaction = previousVotedMessage.reactions.cache.get("⬆️");
            if (previousReaction) {
              await previousReaction.users.remove(user.id);
            }
            
            // Remove the user's vote from the votes array
            entry.userVotes.splice(userVoteIndex, 1);
          } catch (error) {
            console.error("Error removing previous reaction:", error);
            // If the message doesn't exist anymore, just remove the vote from the array
            entry.userVotes.splice(userVoteIndex, 1);
          }
          
          break; // Exit after finding and handling the first previous vote
        }
      }

      // Now handle the new vote on the current message
      const contestEntry = contest.votes.find(
        (vote) => vote.messageId === reaction.message.id
      );

      if (contestEntry) {
        // Check if the user has already voted on this specific message
        const userVote = contestEntry.userVotes.find(
          (vote) => vote.userId === user.id
        );

        if (userVote) {
          // If user has already voted on this message, increment the vote count
          userVote.voteCount += 1;
        } else {
          // If the user hasn't voted on this message, add a new vote record
          contestEntry.userVotes.push({
            userId: user.id,
            voteCount: 1, // First time vote
          });
        }

        // Save the updated contest entry
        await contest.save();

        // Update the embed message
        const embedMessage = await EmbedMessages.findOne({
          itemId: contest._id,
        });

        if (embedMessage) {
          // Fetch the message object using the messageId from the database
          const channel = await client.channels.fetch(embedMessage.channelId);
          const message = await channel.messages.fetch(embedMessage.messageId);

          // Regenerate the updated contest embed
          const updatedEmbed = generateContestEmbed(contest, client);

          // Edit the message with the updated embed
          await message.edit({
            content: `Welcome to the contest: **${contest.title}**! Please review the details below and choose your action.`,
            embeds: [updatedEmbed],
          });
        }
      }
    }
  } catch (error) {
    console.error("Error handling reaction add:", error);
  }
});

// Handle reaction remove (unvote)
client.on("messageReactionRemove", async (reaction, user) => {
  if (reaction.emoji.name !== "⬆️") return; // Only track upvote reactions
  if (user.bot) return; // Ignore reactions from bots

  try {
    // Find the contest that corresponds to the channel the reaction was removed from
    const contest = await Contest.findOne({
      isActive: true,
      channelId: reaction.message.channel.id,
    });

    if (contest) {
      if (new Date() > contest.duration) {
        // If the current time is past the contest's end time, do nothing
        return;
      }
      // Find the contest entry for the specific message
      const contestEntry = contest.votes.find(
        (vote) => vote.messageId === reaction.message.id
      );

      if (contestEntry) {
        // Find the user's previous vote record
        const userVoteIndex = contestEntry.userVotes.findIndex(
          (vote) => vote.userId === user.id
        );

        if (userVoteIndex !== -1) {
          // Get the vote before we remove it
          const userVote = contestEntry.userVotes[userVoteIndex];
          
          // Decrement the vote count if user removes the reaction
          userVote.voteCount -= 1;

          // If vote count goes below 1, remove the vote record
          if (userVote.voteCount <= 0) {
            contestEntry.userVotes.splice(userVoteIndex, 1);
          }

          // Save the updated contest entry
          await contest.save();
          
          // Update the embed
          const embedMessage = await EmbedMessages.findOne({
            itemId: contest._id,
          });

          if (embedMessage) {
            // Fetch the message object using the messageId from the database
            const channel = await client.channels.fetch(embedMessage.channelId);
            const message = await channel.messages.fetch(
              embedMessage.messageId
            );

            // Regenerate the updated contest embed
            const updatedEmbed = generateContestEmbed(contest, client);

            // Edit the message with the updated embed
            await message.edit({
              content: `Welcome to the contest: **${contest.title}**! Please review the details below and choose your action.`,
              embeds: [updatedEmbed],
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Error handling reaction remove:", error);
  }
});

client.login(process.env.TOKEN);
