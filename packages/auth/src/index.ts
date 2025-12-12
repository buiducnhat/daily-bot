import { db } from "@daily-bot/db";
import * as schema from "@daily-bot/db/schema/auth";
import { env } from "@daily-bot/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, organization } from "better-auth/plugins";

export const auth = betterAuth({
  appName: "Daily Bot",
  baseURL: env.SERVER_URL,
  basePath: "/auth",
  database: drizzleAdapter(db, {
    provider: "sqlite",
    usePlural: true,
    schema,
  }),
  secret: env.AUTH_SECRET,
  plugins: [
    admin(),
    organization({
      schema: {
        organization: {
          additionalFields: {
            discordGuildId: {
              type: "string",
              input: true,
              required: false,
            },
          },
        },
      },
    }),
  ],
  trustedOrigins: env.CORS_ORIGINS,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    discord: {
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
      scope: ["guilds"],
      permissions: 34_359_920_640,
    },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
  },
});

export const Roles = {
  ADMIN: "admin",
  ORGANIZATION: "organization",
};
