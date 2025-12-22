import { db } from "@daily-bot/db";
import cron from "node-cron";
import { startStandup } from "./standup-session";

// Map to store active cron jobs: configId -> { task, cronSchedule }
const activeJobs = new Map<
  number,
  { task: cron.ScheduledTask; cronSchedule: string }
>();

export async function setupCron() {
  console.log("Starting dynamic cron scheduler...");

  // Initial load
  await refreshCronJobs();

  // Poll every 60 seconds
  setInterval(refreshCronJobs, 60 * 1000);
}

async function refreshCronJobs() {
  try {
    // Fetch all active configs
    const configs = await db.query.checkInConfigs.findMany({
      where: (configs, { eq }) => eq(configs.isActive, true),
      with: {
        participants: {
          with: {
            discordUser: true,
          },
        },
      },
    });

    const activeConfigIds = new Set<number>();

    for (const config of configs) {
      if (!config.cron) {
        continue;
      }

      activeConfigIds.add(config.id);

      const existingJob = activeJobs.get(config.id);

      // If job doesn't exist or schedule changed, (re)schedule it
      if (!existingJob || existingJob.cronSchedule !== config.cron) {
        if (existingJob) {
          console.log(
            `Rescheduling check-in for ${config.name} (Schedule changed)`
          );
          existingJob.task.stop();
        } else {
          console.log(`Scheduling new check-in for ${config.name}`);
        }

        const task = cron.schedule(config.cron, async () => {
          console.log(`Running check-in for ${config.name}`);
          for (const participant of config.participants) {
            if (participant.discordUser.isActive) {
              await startStandup(participant.discordUser.discordId, config.id);
            }
          }
        });

        activeJobs.set(config.id, { task, cronSchedule: config.cron });
      }
    }

    // Cleanup removed or inactive jobs
    for (const [id, job] of activeJobs.entries()) {
      if (!activeConfigIds.has(id)) {
        console.log(`Stopping check-in job for config ${id}`);
        job.task.stop();
        activeJobs.delete(id);
      }
    }
  } catch (error) {
    console.error("Failed to refresh cron jobs", error);
  }
}
