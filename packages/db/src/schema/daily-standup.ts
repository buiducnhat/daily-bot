import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const dailyUsers = sqliteTable("daily_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  discordId: text("discord_id").notNull().unique(),
  username: text("username").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const dailyStandups = sqliteTable("daily_standups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .references(() => dailyUsers.id)
    .notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  answers: text("answers", { mode: "json" })
    .notNull()
    .$type<Record<string, string>>(), // { "Question": "Answer" }
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const dailyConfigs = sqliteTable("daily_configs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  guildId: text("guild_id").notNull().unique(),
  summaryChannelId: text("summary_channel_id"),
  adminRoleId: text("admin_role_id"),
  questions: text("questions", { mode: "json" }).$type<string[]>(), // ["Q1", "Q2", "Q3"]
});
