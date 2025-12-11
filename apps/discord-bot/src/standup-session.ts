import { db } from "@daily-bot/db";
import {
  dailyConfigs,
  dailyStandups,
} from "@daily-bot/db/schema/daily-standup";
import { EmbedBuilder } from "discord.js";
import { client } from "./client";

type StandupSession = {
  questions: string[];
  currentStepIndex: number; // 0-based index of the question being asked
  answers: Record<string, string>; // Question -> Answer
};

export const activeSessions = new Map<string, StandupSession>();

const DEFAULT_QUESTIONS = [
  "What did you do yesterday?",
  "What will you do today?",
  "Any blockers?",
];

export async function startStandup(userId: string) {
  try {
    const user = await client.users.fetch(userId);

    // Fetch configuration.
    // Complexity: User might be in multiple guilds.
    // Ideally we should know which guild we are running standup for.
    // The current cron iterates all users.
    // Let's assume for now we use the first config found that has questions.
    // Or we should allow specifying guild in `startStandup` if our data model supported it (mapping user <-> guild).
    // Our schema: `daily_users` is global. `dailyConfigs` is per guild.
    // We'll pick the first config with questions, or default.

    // Simplification: Fetch first config available or use default.
    const config = await db.select().from(dailyConfigs).limit(1).get();
    const questions = config?.questions || DEFAULT_QUESTIONS;

    activeSessions.set(userId, {
      questions,
      currentStepIndex: 0,
      answers: {},
    });

    await user.send(
      `Good morning! It's time for your daily standup.\n\n1. ${questions[0]}`
    );
  } catch (error) {
    console.error(`Failed to start standup for ${userId}`, error);
  }
}

export async function handleStandupMessage(message: any) {
  const userId = message.author.id;
  const session = activeSessions.get(userId);

  if (!session) {
    return;
  }

  const currentQuestion = session.questions[session.currentStepIndex];
  if (!currentQuestion) {
    return;
  }
  session.answers[currentQuestion] = message.content;

  const nextIndex = session.currentStepIndex + 1;

  if (nextIndex < session.questions.length) {
    session.currentStepIndex = nextIndex;
    const nextQuestion = session.questions[nextIndex];
    await message.author.send(`${nextIndex + 1}. ${nextQuestion}`);
  } else {
    // Finished
    const dbUser = await db.query.dailyUsers.findFirst({
      where: (users, { eq }) => eq(users.discordId, userId),
    });

    if (dbUser) {
      await db.insert(dailyStandups).values({
        userId: dbUser.id,
        date: new Date().toISOString().substring(0, 10),
        answers: session.answers,
      });

      // Post to summary channel
      // We iterate all configs to find matching guilds/channels
      const configs = await db.select().from(dailyConfigs);
      for (const config of configs) {
        // Only use config if it matches the questions we just asked?
        // Or just post to all configured channels.
        // Let's post to all valid channels.
        const guild = client.guilds.cache.get(config.guildId);
        if (guild && config.summaryChannelId) {
          try {
            const member = await guild.members.fetch(userId);
            if (member) {
              const channel = await guild.channels.fetch(
                config.summaryChannelId
              );
              if (channel?.isTextBased()) {
                const embed = new EmbedBuilder()
                  .setTitle(`Daily Standup - ${member.displayName}`)
                  .setColor("#0099ff")
                  .setTimestamp();

                // Add fields dynamically
                for (const [q, a] of Object.entries(session.answers)) {
                  embed.addFields({ name: q, value: a as string });
                }

                await channel.send({ embeds: [embed] });
              }
            }
          } catch (_e) {
            // User not in this guild or other error
          }
        }
      }
    }

    activeSessions.delete(userId);
    await message.author.send("Thanks! Your standup has been recorded.");
  }
}
