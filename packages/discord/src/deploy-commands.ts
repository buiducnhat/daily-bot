import { env } from "@daily-bot/env/server";
import { REST, Routes } from "discord.js";
import { data as assignCommand } from "./commands/assign";
import { data as questionsCommand } from "./commands/questions";
import { data as setupCommand } from "./commands/setup";

const commands = [
  setupCommand.toJSON(),
  assignCommand.toJSON(),
  questionsCommand.toJSON(),
];

const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
