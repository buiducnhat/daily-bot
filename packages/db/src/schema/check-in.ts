import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { organizations } from "./auth";

export const discordUsers = sqliteTable("discord_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  discordId: text("discord_id").notNull().unique(),
  username: text("username").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const checkInConfigs = sqliteTable("checkin_configs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  cron: text("cron").notNull(), // e.g. "0 9 * * 1-5"
  guildId: text("guild_id").notNull(),
  channelId: text("channel_id").notNull(),
  questions: text("questions", { mode: "json" }).notNull().$type<string[]>(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const checkInParticipants = sqliteTable("checkin_participants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  checkInConfigId: integer("checkin_config_id")
    .references(() => checkInConfigs.id, { onDelete: "cascade" })
    .notNull(),
  discordUserId: integer("discord_user_id")
    .references(() => discordUsers.id, { onDelete: "cascade" })
    .notNull(),
});

export const checkInResponses = sqliteTable("checkin_responses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  checkInConfigId: integer("checkin_config_id")
    .references(() => checkInConfigs.id, { onDelete: "cascade" })
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

export const checkInSessions = sqliteTable("checkin_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  checkInConfigId: integer("checkin_config_id")
    .references(() => checkInConfigs.id, { onDelete: "cascade" })
    .notNull(),
  discordUserId: integer("discord_user_id")
    .references(() => discordUsers.id, { onDelete: "cascade" })
    .notNull(),
  questions: text("questions", { mode: "json" }).notNull().$type<string[]>(),
  answers: text("answers", { mode: "json" })
    .notNull()
    .$type<Record<string, string>>(),
  currentStepIndex: integer("current_step_index").notNull().default(0),
  updatedAt: text("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => sql`CURRENT_TIMESTAMP`),
});

export const checkInConfigsRelations = relations(
  checkInConfigs,
  ({ many }) => ({
    participants: many(checkInParticipants),
    responses: many(checkInResponses),
  })
);

export const checkInParticipantsRelations = relations(
  checkInParticipants,
  ({ one }) => ({
    config: one(checkInConfigs, {
      fields: [checkInParticipants.checkInConfigId],
      references: [checkInConfigs.id],
    }),
    discordUser: one(discordUsers, {
      fields: [checkInParticipants.discordUserId],
      references: [discordUsers.id],
    }),
  })
);

export const checkInResponsesRelations = relations(
  checkInResponses,
  ({ one }) => ({
    config: one(checkInConfigs, {
      fields: [checkInResponses.checkInConfigId],
      references: [checkInConfigs.id],
    }),
    discordUser: one(discordUsers, {
      fields: [checkInResponses.discordUserId],
      references: [discordUsers.id],
    }),
  })
);

export const discordUsersRelations = relations(discordUsers, ({ many }) => ({
  participations: many(checkInParticipants),
  responses: many(checkInResponses),
}));
