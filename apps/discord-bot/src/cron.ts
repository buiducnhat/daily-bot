import { db } from "@daily-bot/db";
import { dailyUsers } from "@daily-bot/db/schema/daily-standup";
import { eq } from "drizzle-orm";
import cron from "node-cron";
import { startStandup } from "./standup-session";

// Run every minute to check if we should trigger standups (for demo/testing)
// In production, you'd likely want a configurable time.
// For this simple bot, let's say "Daily" means 9:00 AM.
export function setupCron() {
  cron.schedule("* * * * *", async () => {
    console.log("Running daily standup cron...");
    const users = await db
      .select()
      .from(dailyUsers)
      .where(eq(dailyUsers.isActive, true));

    for (const user of users) {
      await startStandup(user.discordId);
    }
  });
}
