import { db } from "@daily-bot/db";
import { organizations } from "@daily-bot/db/schema/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../index";

const DISCORD_API_URL = "https://discord.com/api";

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

export const discordRouter = {
  listUserGuilds: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;

    // Get Discord access token from accounts table
    const account = await db.query.accounts.findFirst({
      where: (accounts, { eq, and }) =>
        and(eq(accounts.userId, userId), eq(accounts.providerId, "discord")),
    });

    if (!account?.accessToken) {
      throw new Error("Discord account not connected");
    }

    const response = await fetch(`${DISCORD_API_URL}/users/@me/guilds`, {
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Discord token expired, please sign in again");
      }
      throw new Error("Failed to fetch Discord guilds");
    }

    const guilds = (await response.json()) as DiscordGuild[];

    // Filter for guilds where user has MANAGE_GUILD (0x20) permission
    // permissions is a string bitfield
    return guilds.filter((guild) => {
      const permissions = BigInt(guild.permissions);
      const MANAGE_GUILD = 0x20n;
      const ADMINISTRATOR = 0x8n;
      return (
        (permissions & MANAGE_GUILD) === MANAGE_GUILD ||
        (permissions & ADMINISTRATOR) === ADMINISTRATOR ||
        guild.owner
      );
    });
  }),

  connectGuild: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        discordGuildId: z.string(),
      })
    )
    .handler(async ({ input }) => {
      // Verify user is part of the organization (and maybe role check? keeping simple for now)
      // Since protectedProcedure checks for active session, we rely on middleware permissions or explicit checks if needed.
      // For now we assume if they can access this org context, they can edit it.

      await db
        .update(organizations)
        .set({ discordGuildId: input.discordGuildId })
        .where(eq(organizations.id, input.organizationId));

      return { success: true };
    }),

  disconnectGuild: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .handler(async ({ input }) => {
      await db
        .update(organizations)
        .set({ discordGuildId: null })
        .where(eq(organizations.id, input.organizationId));

      return { success: true };
    }),

  getGuildChannels: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .handler(async ({ input }) => {
      const org = await db.query.organizations.findFirst({
        where: (orgs, { eq }) => eq(orgs.id, input.organizationId),
      });

      if (!org?.discordGuildId) {
        throw new Error("Organization not connected to Discord");
      }

      const response = await fetch(
        `${DISCORD_API_URL}/guilds/${org.discordGuildId}/channels`,
        {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch guild channels");
      }

      const channels = (await response.json()) as any[];
      // Filter for text channels (type 0)
      return channels
        .filter((c) => c.type === 0)
        .map((c) => ({ id: c.id, name: c.name }));
    }),

  getGuildMembers: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .handler(async ({ input }) => {
      const org = await db.query.organizations.findFirst({
        where: (orgs, { eq }) => eq(orgs.id, input.organizationId),
      });

      if (!org?.discordGuildId) {
        throw new Error("Organization not connected to Discord");
      }

      const response = await fetch(
        `${DISCORD_API_URL}/guilds/${org.discordGuildId}/members?limit=1000`,
        {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch guild members");
      }

      const members = (await response.json()) as any[];
      return members
        .map((m) => ({
          id: m.user.id,
          username: m.user.username,
          discriminator: m.user.discriminator,
          avatar: m.user.avatar,
          bot: m.user.bot,
        }))
        .filter((m) => !m.bot); // Filter out bots
    }),

  getGuild: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .handler(async ({ input }) => {
      const org = await db.query.organizations.findFirst({
        where: (orgs, { eq }) => eq(orgs.id, input.organizationId),
      });

      if (!org?.discordGuildId) {
        return null;
      }

      const response = await fetch(
        `${DISCORD_API_URL}/guilds/${org.discordGuildId}`,
        {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
          },
        }
      );

      if (!response.ok) {
        // If bot is not in guild or other error, just return null or basic info?
        // If we can't fetch it, maybe it's not connected properly or bot kicked.
        return null;
      }

      const guild = (await response.json()) as DiscordGuild;
      return guild;
    }),
};
