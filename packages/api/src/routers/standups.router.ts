import { db } from "@daily-bot/db";
import {
  discordUsers,
  standupConfigs,
  standupParticipants,
} from "@daily-bot/db/schema/daily-standup";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure } from "../index";

export const standupsRouter = {
  list: publicProcedure
    .input(z.object({ organizationId: z.string() }))
    .handler(async ({ input }) => {
      const configs = await db.query.standupConfigs.findMany({
        where: (standups, { eq }) =>
          eq(standups.organizationId, input.organizationId),
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
        .insert(standupConfigs)
        .values({
          ...configData,
          isActive: true,
        })
        .returning();
      if (!newConfig) {
        throw new Error("Failed to create standup config");
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
          await db.insert(standupParticipants).values({
            standupConfigId: newConfig.id,
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
        .update(standupConfigs)
        .set(data)
        .where(eq(standupConfigs.id, id))
        .returning();

      if (participants) {
        // Clear existing participants
        await db
          .delete(standupParticipants)
          .where(eq(standupParticipants.standupConfigId, id));

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
            userId = newUser.id;
          }

          await db.insert(standupParticipants).values({
            standupConfigId: id,
            discordUserId: userId!,
          });
        }
      }

      return updated;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(standupConfigs).where(eq(standupConfigs.id, input.id));
      return { success: true };
    }),

  listDiscordUsers: publicProcedure.handler(async () =>
    db.query.discordUsers.findMany()
  ),
};
