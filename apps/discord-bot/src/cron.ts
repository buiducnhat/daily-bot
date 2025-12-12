import { db } from "@daily-bot/db";
import cron from "node-cron";
import { startStandup } from "./standup-session";

export async function setupCron() {
  console.log("Setting up cron jobs...");
  const configs = await db.query.standupConfigs.findMany({
    where: (configs, { eq }) => eq(configs.isActive, true),
    with: {
      participants: {
        with: {
          discordUser: true,
        },
      },
    },
  });

  for (const config of configs) {
    if (!config.cron) {
      continue;
    }
    try {
      cron.schedule(config.cron, async () => {
        console.log(`Running standup for ${config.name}`);
        for (const participant of config.participants) {
          if (participant.discordUser.isActive) {
            await startStandup(participant.discordUser.discordId, config.id);
          }
        }
      });
      console.log(`Scheduled ${config.name} at ${config.cron}`);
    } catch (e) {
      console.error(`Invalid cron for ${config.name}: ${config.cron}`, e);
    }
  }
}
