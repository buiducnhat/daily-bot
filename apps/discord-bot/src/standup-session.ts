import { db } from "@daily-bot/db";
import { dailyStandups } from "@daily-bot/db/schema/daily-standup";
import { EmbedBuilder } from "discord.js";
import { client } from "./client";

type StandupSession = {
  questions: string[];
  currentStepIndex: number; // 0-based index of the question being asked
  answers: Record<string, string>; // Question -> Answer
  standupConfigId?: number;
};

export const activeSessions = new Map<string, StandupSession>();

const DEFAULT_QUESTIONS = [
  "What did you do yesterday?",
  "What will you do today?",
  "Any blockers?",
];

export async function startStandup(
  discordUserId: string,
  standupConfigId: number
) {
  try {
    const user = await client.users.fetch(discordUserId);
    const config = await db.query.standupConfigs.findFirst({
      where: (configs, { eq }) => eq(configs.id, standupConfigId),
    });

    if (!config) {
      console.error(`Standup config ${standupConfigId} not found`);
      return;
    }

    const questions = config.questions || DEFAULT_QUESTIONS;

    activeSessions.set(discordUserId, {
      questions,
      currentStepIndex: 0,
      answers: {},
      standupConfigId: config.id, // Store config ID in session
    });

    await user.send(
      `Good morning! It's time for your daily check-in for **${config.name}**.\n\n1. ${questions[0]}`
    );
  } catch (error) {
    console.error(`Failed to start standup for ${discordUserId}`, error);
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
    const dbUser = await db.query.discordUsers.findFirst({
      where: (users, { eq }) => eq(users.discordId, userId),
    });

    if (dbUser && session.standupConfigId) {
      // Fetch config to check for summary channel
      const config = await db.query.standupConfigs.findFirst({
        where: (c, { eq }) => eq(c.id, session.standupConfigId!),
      });

      await db.insert(dailyStandups).values({
        discordUserId: dbUser.id,
        standupConfigId: session.standupConfigId,
        date: new Date().toISOString().substring(0, 10),
        answers: session.answers,
      });

      if (config?.channelId) {
        const guild = client.guilds.cache.get(config.guildId);
        if (guild) {
          try {
            const member = await guild.members.fetch(userId);
            const channel = await guild.channels.fetch(config.channelId);

            if (channel?.isTextBased()) {
              const embed = new EmbedBuilder()
                .setTitle(
                  `Daily Check-in - ${member?.displayName || dbUser.username}`
                )
                .setDescription(`**${config.name}**`)
                .setColor("#0099ff")
                .setTimestamp();

              for (const [q, a] of Object.entries(session.answers)) {
                embed.addFields({ name: q, value: a as string });
              }

              await channel.send({ embeds: [embed] });
            }
          } catch (e) {
            console.error("Failed to post summary", e);
          }
        }
      }
    }

    activeSessions.delete(userId);
    await message.author.send("Thanks! Your check-in has been recorded.");
  }
}
