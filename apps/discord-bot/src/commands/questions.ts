import { db } from "@daily-bot/db";
import { dailyConfigs } from "@daily-bot/db/schema/daily-standup";
import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { eq } from "drizzle-orm";

export const data = new SlashCommandBuilder()
  .setName("questions")
  .setDescription("Configure daily standup questions")
  .addStringOption((option) =>
    option
      .setName("list")
      .setDescription("Comma-separated list of questions")
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: any) {
  const list = interaction.options.getString("list");
  const guildId = interaction.guildId;

  if (!guildId) {
    return interaction.reply({
      content: "This command can only be used in a server.",
      ephemeral: true,
    });
  }

  const questions = list
    .split(",")
    .map((q: string) => q.trim())
    .filter((q: string) => q.length > 0);

  if (questions.length === 0) {
    return interaction.reply({
      content: "Please provide at least one question.",
      ephemeral: true,
    });
  }

  // Upsert config
  const existing = await db
    .select()
    .from(dailyConfigs)
    .where(eq(dailyConfigs.guildId, guildId))
    .get();

  if (existing) {
    await db
      .update(dailyConfigs)
      .set({ questions })
      .where(eq(dailyConfigs.guildId, guildId));
  } else {
    await db.insert(dailyConfigs).values({ guildId, questions });
  }

  await interaction.reply({
    content: `Updated standup questions:\n${questions.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n")}`,
    ephemeral: true,
  });
}
