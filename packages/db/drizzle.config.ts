import { env } from "@daily-bot/env/server";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema",
  out: "./src/migrations",
  dialect: "turso",
  dbCredentials: {
    url: env.DATABASE_URL || "",
    authToken: env.DATABASE_TOKEN,
  },
});
