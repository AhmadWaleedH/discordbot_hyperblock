require("dotenv").config();
const path = require("path");
const { Client, IntentsBitField, ActivityType } = require("discord.js");
const WOK = require("wokcommands");
const { default: mongoose } = require("mongoose");

// __dirname is available directly in CommonJS
const { DefaultCommands } = WOK;
const { TOKEN, MONGO_URI } = process.env;
/**
 * @type { Client }
 */
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.MessageContent,
  ],
  //   partials: [Partials.Message, Partials.Reaction],
});

client.on("ready", async (readyClient) => {
  console.log(`${readyClient.user.username} is running`);

  await mongoose.connect(MONGO_URI);
  client.user.setPresence({
    activities: [
      {
        name: `Launching soon 🍾!`,
        type: ActivityType.Playing,
      },
    ],
  });

  new WOK({
    client,
    commandsDir: path.join(__dirname, "commands"),
    events: {
      dir: path.join(__dirname, "events"),
    },
    disabledDefaultCommands: [
      DefaultCommands.ChannelCommand,
      DefaultCommands.CustomCommand,
      DefaultCommands.Prefix,
      DefaultCommands.ToggleCommand,
      DefaultCommands.RequiredPermissions,
      DefaultCommands.RequiredRoles,
    ],
    cooldownConfig: {
      errorMessage: "Please wait {TIME} before doing that again.",
      botOwnersBypass: false,
      dbfromd: 300,
    },
  });
});

client.login(TOKEN);
