import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { organizations } from "./auth";

export const discordUsers = sqliteTable("discord_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  discordId: text("discord_id").notNull().unique(),
  username: text("username").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const standupConfigs = sqliteTable("standup_configs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }), // Better Auth organizations table
  name: text("name").notNull(),
  cron: text("cron").notNull(), // e.g. "0 9 * * 1-5"
  guildId: text("guild_id").notNull(),
  channelId: text("channel_id").notNull(),
  questions: text("questions", { mode: "json" }).notNull().$type<string[]>(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const standupParticipants = sqliteTable("standup_participants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  standupConfigId: integer("standup_config_id")
    .references(() => standupConfigs.id, { onDelete: "cascade" })
    .notNull(),
  discordUserId: integer("discord_user_id")
    .references(() => discordUsers.id, { onDelete: "cascade" })
    .notNull(),
});

export const dailyStandups = sqliteTable("daily_standups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  standupConfigId: integer("standup_config_id")
    .references(() => standupConfigs.id, { onDelete: "cascade" })
    .notNull(),
  discordUserId: integer("discord_user_id")
    .references(() => discordUsers.id, { onDelete: "cascade" })
    .notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  answers: text("answers", { mode: "json" })
    .notNull()
    .$type<Record<string, string>>(), // { "Question": "Answer" }
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Deprecated or removed dailyConfigs in favor of standupConfigs
// Leaving it commented out for now or removing entirely if we want a clean break.
// export const dailyConfigs = ...
import { relations } from "drizzle-orm";

// ... usage ...

export const standupConfigsRelations = relations(
  standupConfigs,
  ({ many }) => ({
    participants: many(standupParticipants),
  })
);

export const standupParticipantsRelations = relations(
  standupParticipants,
  ({ one }) => ({
    config: one(standupConfigs, {
      fields: [standupParticipants.standupConfigId],
      references: [standupConfigs.id],
    }),
    discordUser: one(discordUsers, {
      fields: [standupParticipants.discordUserId],
      references: [discordUsers.id],
    }),
  })
);

export const discordUsersRelations = relations(discordUsers, ({ many }) => ({
  participations: many(standupParticipants),
}));
