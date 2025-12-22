import { db } from "@daily-bot/db";
import {
  checkInResponses,
  checkInSessions,
} from "@daily-bot/db/schema/check-in";
import { EmbedBuilder } from "discord.js";
import { eq } from "drizzle-orm";
import { client } from "./client";

const DEFAULT_QUESTIONS = [
  "What did you do yesterday?",
  "What will you do today?",
  "Any blockers?",
];

export async function startStandup(
  discordUserId: string,
  checkInConfigId: number
) {
  try {
    const user = await client.users.fetch(discordUserId);
    const config = await db.query.checkInConfigs.findFirst({
      where: (configs, { eq }) => eq(configs.id, checkInConfigId),
    });

    if (!config) {
      console.error(`Check-in config ${checkInConfigId} not found`);
      return;
    }

    const questions = config.questions || DEFAULT_QUESTIONS;

    // Get DB user ID
    const dbUser = await db.query.discordUsers.findFirst({
      where: (users, { eq }) => eq(users.discordId, discordUserId),
    });

    if (!dbUser) {
      console.error(`Discord user ${discordUserId} not found in DB`);
      return;
    }

    // Upsert session
    const existingSession = await db.query.checkInSessions.findFirst({
      where: (sessions, { eq }) => eq(sessions.discordUserId, dbUser.id),
    });

    if (existingSession) {
      await db
        .update(checkInSessions)
        .set({
          checkInConfigId: config.id,
          questions,
          answers: {},
          currentStepIndex: 0,
        })
        .where(eq(checkInSessions.id, existingSession.id));
    } else {
      await db.insert(checkInSessions).values({
        discordUserId: dbUser.id,
        checkInConfigId: config.id,
        questions,
        answers: {},
        currentStepIndex: 0,
      });
    }

    await user.send(
      `Good morning! It's time for your check-in for **${config.name}**.\n\n1. ${questions[0]}`
    );
  } catch (error) {
    console.error(`Failed to start check-in for ${discordUserId}`, error);
  }
}

export async function handleStandupMessage(message: any) {
  console.log(
    "handleStandupMessage called",
    message.author.id,
    message.content
  );
  const userId = message.author.id;

  // Get DB user
  const dbUser = await db.query.discordUsers.findFirst({
    where: (users, { eq }) => eq(users.discordId, userId),
  });

  if (!dbUser) {
    console.log("User not found in DB", userId);
    return;
  }

  const session = await db.query.checkInSessions.findFirst({
    where: (sessions, { eq }) => eq(sessions.discordUserId, dbUser.id),
  });

  if (!session) {
    console.log("No active session found for user", dbUser.id);
    return;
  }

  console.log(
    "Session found",
    session.id,
    "Step:",
    session.currentStepIndex,
    "Questions:",
    session.questions
  );

  const currentQuestion = session.questions[session.currentStepIndex];
  if (!currentQuestion) {
    return;
  }

  // Update answers
  const newAnswers = { ...session.answers, [currentQuestion]: message.content };

  const nextIndex = session.currentStepIndex + 1;

  if (nextIndex < session.questions.length) {
    // Update session
    await db
      .update(checkInSessions)
      .set({
        answers: newAnswers,
        currentStepIndex: nextIndex,
      })
      .where(eq(checkInSessions.id, session.id));

    const nextQuestion = session.questions[nextIndex];
    await message.author.send(`${nextIndex + 1}. ${nextQuestion}`);
  } else {
    // Finished
    const config = await db.query.checkInConfigs.findFirst({
      where: (c, { eq }) => eq(c.id, session.checkInConfigId),
    });

    await db.insert(checkInResponses).values({
      discordUserId: dbUser.id,
      checkInConfigId: session.checkInConfigId,
      date: new Date().toISOString().substring(0, 10),
      answers: newAnswers,
    });

    if (config?.channelId) {
      const guild = client.guilds.cache.get(config.guildId);
      if (guild) {
        try {
          const member = await guild.members.fetch(userId);
          const channel = await guild.channels.fetch(config.channelId);

          if (channel?.isTextBased()) {
            const embed = new EmbedBuilder()
              .setTitle(`Check-in - ${member?.displayName || dbUser.username}`)
              .setDescription(`**${config.name}**`)
              .setColor("#0099ff")
              .setTimestamp();

            for (const [q, a] of Object.entries(newAnswers)) {
              embed.addFields({ name: q, value: a as string });
            }

            await channel.send({ embeds: [embed] });
          }
        } catch (e) {
          console.error("Failed to post summary", e);
        }
      }
    }

    // Clear session
    await db.delete(checkInSessions).where(eq(checkInSessions.id, session.id));
    await message.author.send("Thanks! Your check-in has been recorded.");
  }
}
