import { env } from "@daily-bot/env/server";
import {
  ChannelType,
  Events,
  type Interaction,
  type Message,
} from "discord.js";
import { client } from "./client";
import * as assignCommand from "./commands/assign";
import * as questionsCommand from "./commands/questions";
import * as setupCommand from "./commands/setup";
import { setupCron } from "./cron";
import { handleStandupMessage } from "./standup-session";

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
  setupCron();
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  if (interaction.commandName === "setup") {
    try {
      await setupCommand.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error executing this command!",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "There was an error executing this command!",
          ephemeral: true,
        });
      }
    }
  } else if (interaction.commandName === "assign") {
    try {
      await assignCommand.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error executing this command!",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "There was an error executing this command!",
          ephemeral: true,
        });
      }
    }
  } else if (interaction.commandName === "questions") {
    try {
      await questionsCommand.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error executing this command!",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "There was an error executing this command!",
          ephemeral: true,
        });
      }
    }
  }
});

client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) {
    return;
  }
  if (message.channel.type === ChannelType.DM) {
    await handleStandupMessage(message);
  }
});

client.login(env.DISCORD_TOKEN);
