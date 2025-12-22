import { db } from "@daily-bot/db";
import {
  checkInConfigs,
  checkInParticipants,
  checkInSessions,
  discordUsers,
} from "@daily-bot/db/schema/check-in";
import { env } from "@daily-bot/env/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure } from "../index";

export const checkInsRouter = {
  list: publicProcedure
    .input(z.object({ organizationId: z.string() }))
    .handler(async ({ input }) => {
      const configs = await db.query.checkInConfigs.findMany({
        where: (configs, { eq }) =>
          eq(configs.organizationId, input.organizationId),
        with: {
          participants: {
            with: {
              discordUser: true,
            },
          },
        },
      });
      return configs;
    }),

  responses: publicProcedure
    .input(
      z.object({
        organizationId: z.string(),
        date: z.string().optional(), // YYYY-MM-DD
        checkInId: z.number().optional(),
      })
    )
    .handler(async ({ input }) => {
      // 1. Get configs to filter by org
      const configs = await db.query.checkInConfigs.findMany({
        where: (c, { eq }) => eq(c.organizationId, input.organizationId),
      });
      const configIds = configs.map((c) => c.id);

      if (configIds.length === 0) {
        return [];
      }

      // 2. Filter config IDs if specific one requested
      let targetConfigIds = configIds;
      if (input.checkInId) {
        if (!configIds.includes(input.checkInId)) {
          return []; // Requested config not in this org
        }
        targetConfigIds = [input.checkInId];
      }

      // 3. Default date to today if not provided
      const targetDate =
        input.date || new Date().toISOString().substring(0, 10);

      // 4. Query responses
      const responses = await db.query.checkInResponses.findMany({
        where: (r, { eq, and, inArray }) =>
          and(
            inArray(r.checkInConfigId, targetConfigIds),
            eq(r.date, targetDate)
          ),
        orderBy: (r, { desc }) => desc(r.createdAt),
        with: {
          discordUser: true,
          config: true,
        },
      });

      return responses;
    }),

  remind: publicProcedure
    .input(
      z.object({
        checkInId: z.number(),
        discordUserIds: z.array(z.number()), // Internal IDs
      })
    )
    .handler(async ({ input }) => {
      const config = await db.query.checkInConfigs.findFirst({
        where: (c, { eq }) => eq(c.id, input.checkInId),
      });

      if (!config) {
        throw new Error("Check-in not found");
      }

      const questions = config.questions;
      if (!questions || questions.length === 0) {
        throw new Error("Check-in has no questions");
      }

      const users = await db.query.discordUsers.findMany({
        where: (u, { inArray }) => inArray(u.id, input.discordUserIds),
      });

      for (const user of users) {
        // Upsert session
        const existingSession = await db.query.checkInSessions.findFirst({
          where: (s, { eq }) => eq(s.discordUserId, user.id),
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
            discordUserId: user.id,
            checkInConfigId: config.id,
            questions,
            answers: {},
            currentStepIndex: 0,
          });
        }

        // Send DM
        try {
          // 1. Create DM Channel
          const dmRes = await fetch(
            "https://discord.com/api/v10/users/@me/channels",
            {
              method: "POST",
              headers: {
                Authorization: `Bot ${env.DISCORD_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ recipient_id: user.discordId }),
            }
          );

          if (!dmRes.ok) {
            console.error(
              `Failed to create DM for ${user.username}`,
              await dmRes.text()
            );
            continue;
          }

          const dmChannel = (await dmRes.json()) as { id: string };

          // 2. Send Message
          const msgRes = await fetch(
            `https://discord.com/api/v10/channels/${dmChannel.id}/messages`,
            {
              method: "POST",
              headers: {
                Authorization: `Bot ${env.DISCORD_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                content: `Good morning! It's time for your check-in for **${config.name}**.\n\n1. ${questions[0]}`,
              }),
            }
          );

          if (!msgRes.ok) {
            console.error(
              `Failed to send message to ${user.username}`,
              await msgRes.text()
            );
          }
        } catch (e) {
          console.error(`Failed to remind ${user.username}`, e);
        }
      }

      return { success: true };
    }),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const config = await db.query.checkInConfigs.findFirst({
        where: (configs, { eq }) => eq(configs.id, input.id),
        with: {
          participants: {
            with: {
              discordUser: true,
            },
          },
        },
      });

      if (!config) {
        throw new Error("Check-in not found");
      }

      return config;
    }),

  create: publicProcedure
    .input(
      z.object({
        organizationId: z.string(),
        name: z.string(),
        cron: z.string(),
        guildId: z.string(),
        channelId: z.string(),
        questions: z.array(z.string()),
        participants: z.array(
          z.object({
            id: z.string(),
            username: z.string(),
          })
        ),
      })
    )
    .handler(async ({ input }) => {
      const { participants, ...configData } = input;

      const [newConfig] = await db
        .insert(checkInConfigs)
        .values({
          ...configData,
          isActive: true,
        })
        .returning();
      if (!newConfig) {
        throw new Error("Failed to create check-in config");
      }

      if (participants.length > 0) {
        // Upsert discord users
        for (const p of participants) {
          const user = await db.query.discordUsers.findFirst({
            where: (users, { eq }) => eq(users.discordId, p.id),
          });
          let userId = user?.id;

          if (!user) {
            const [newUser] = await db
              .insert(discordUsers)
              .values({
                discordId: p.id,
                username: p.username,
              })
              .returning();
            userId = newUser!.id;
          }

          // Insert participant
          await db.insert(checkInParticipants).values({
            checkInConfigId: newConfig.id,
            discordUserId: userId!,
          });
        }
      }

      return newConfig;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        cron: z.string().optional(),
        channelId: z.string().optional(),
        questions: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
        participants: z
          .array(
            z.object({
              id: z.string(),
              username: z.string(),
            })
          )
          .optional(),
      })
    )
    .handler(async ({ input }) => {
      const { id, participants, ...data } = input;
      const [updated] = await db
        .update(checkInConfigs)
        .set(data)
        .where(eq(checkInConfigs.id, id))
        .returning();

      if (participants) {
        // Clear existing participants
        await db
          .delete(checkInParticipants)
          .where(eq(checkInParticipants.checkInConfigId, id));

        // Re-add participants
        for (const p of participants) {
          const user = await db.query.discordUsers.findFirst({
            where: (users, { eq }) => eq(users.discordId, p.id),
          });
          let userId = user?.id;

          if (!user) {
            const [newUser] = await db
              .insert(discordUsers)
              .values({
                discordId: p.id,
                username: p.username,
              })
              .returning();
            userId = newUser!.id;
          }

          await db.insert(checkInParticipants).values({
            checkInConfigId: id,
            discordUserId: userId!,
          });
        }
      }

      return updated;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(checkInConfigs).where(eq(checkInConfigs.id, input.id));
      return { success: true };
    }),

  listDiscordUsers: publicProcedure.handler(async () =>
    db.query.discordUsers.findMany()
  ),
};
