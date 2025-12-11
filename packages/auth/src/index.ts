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
  plugins: [admin(), organization()],
  trustedOrigins: env.CORS_ORIGINS,
  emailAndPassword: {
    enabled: true,
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
