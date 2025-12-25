import { db } from "@daily-bot/db";
import { checkInResponses } from "@daily-bot/db/schema/check-in";
import { cache } from "@daily-bot/kv";
import { EmbedBuilder } from "discord.js";
import { client } from "./client";

const DEFAULT_QUESTIONS = [
  "What did you do yesterday?",
  "What will you do today?",
  "Any blockers?",
];

interface CheckInSession {
  checkInConfigId: number;
  questions: string[];
  answers: Record<string, string>;
  currentStepIndex: number;
  userId: number; // DB user ID
}

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

    const sessionKey = `checkin:session:${discordUserId}`;

    await cache.set(
      sessionKey,
      {
        checkInConfigId: config.id,
        questions,
        answers: {},
        currentStepIndex: 0,
        userId: dbUser.id,
      },
      60 * 60 * 24 * 1000 // 1 day TTL
    );

    await user.send(
      `Good morning! It's time for your check-in for **${config.name}**.\n\n1. ${questions[0]}`
    );
  } catch (error) {
    console.error(`Failed to start check-in for ${discordUserId}`, error);
  }
}

export async function handleStandupMessage(message: any) {
  try {
    console.log(
      "handleStandupMessage called",
      message.author.id,
      message.content
    );
    const userId = message.author.id;

    // Idempotency: Lock message for 10 seconds
    // @ts-expect-error - access inner client
    const redis = cache.stores[0].client;

    if (redis) {
      const lockKey = `lock:message:${message.id}`;
      // Use raw redis client for atomic SET NX
      const locked = await redis.set(lockKey, "1", { NX: true, EX: 10 });
      if (!locked) {
        console.log("Message already processed (locked)", message.id);
        return;
      }
    }

    const sessionKey = `checkin:session:${userId}`;
    const session = await cache.get<CheckInSession>(sessionKey);

    if (!session) {
      console.log("No active session found for user", userId);
      return;
    }

    console.log(
      "Session found",
      session.checkInConfigId,
      "Step:",
      session.currentStepIndex
    );

    const currentQuestion = session.questions[session.currentStepIndex];
    if (!currentQuestion) {
      return;
    }

    // Update answers
    const newAnswers = {
      ...session.answers,
      [currentQuestion]: message.content,
    };

    const nextIndex = session.currentStepIndex + 1;

    if (nextIndex < session.questions.length) {
      // Update session
      await cache.set(
        sessionKey,
        {
          ...session,
          answers: newAnswers,
          currentStepIndex: nextIndex,
        },
        60 * 60 * 24 * 1000 // Reset TTL
      );

      const nextQuestion = session.questions[nextIndex];
      await message.channel.send(`${nextIndex + 1}. ${nextQuestion}`);
    } else {
      // Finished
      const config = await db.query.checkInConfigs.findFirst({
        where: (c, { eq }) => eq(c.id, session.checkInConfigId),
      });

      console.log(
        "Check-in finished. Config:",
        config?.name,
        "ChannelId:",
        config?.channelId
      );

      // Save to DB
      await db.insert(checkInResponses).values({
        discordUserId: session.userId,
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
              const embeds: EmbedBuilder[] = [];

              const userEmbed = new EmbedBuilder()
                .setAuthor({
                  name: member.displayName,
                  iconURL: member.user.avatarURL() ?? undefined,
                })
                .setColor("#5865F2");
              embeds.push(userEmbed);

              for (const [q, a] of Object.entries(newAnswers)) {
                const qEmbed = new EmbedBuilder()
                  .addFields({ name: q, value: a })
                  .setColor("#5865F2");
                embeds.push(qEmbed);
              }

              console.log("Sending summary to channel", config.channelId);
              await channel.send({
                embeds,
                content: `Here is your check-in summary for **${config.name}**`,
              });
            }
          } catch (e) {
            console.error("Failed to post summary", e);
          }
        }
      }

      // Clear session
      await cache.del(sessionKey);
      console.log("Sending completion DM to", message.author.id);
      await message.channel.send("Thanks! Your check-in has been recorded.");
    }
  } catch (error) {
    console.error("Error in handleStandupMessage:", error);
  }
}
