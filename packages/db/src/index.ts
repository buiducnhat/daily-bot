import { env } from "@daily-bot/env/server";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

const client = createClient({
  url: env.DATABASE_URL || "",
});

export const db = drizzle({ client });
