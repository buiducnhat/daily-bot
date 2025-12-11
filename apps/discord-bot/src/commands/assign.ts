import { db } from "@daily-bot/db";
import { dailyUsers } from "@daily-bot/db/schema/daily-standup";
import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { eq } from "drizzle-orm";

export const data = new SlashCommandBuilder()
  .setName("assign")
  .setDescription("Assign a user to the daily standup")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("The user to assign")
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: any) {
  const user = interaction.options.getUser("user");
  const guildId = interaction.guildId;

  if (!guildId) {
    return interaction.reply({
      content: "This command can only be used in a server.",
      ephemeral: true,
    });
  }

  // Check if user exists
  const existing = await db
    .select()
    .from(dailyUsers)
    .where(eq(dailyUsers.discordId, user.id))
    .get();

  if (existing) {
    if (existing.isActive) {
      await interaction.reply({
        content: `${user} is already assigned.`,
        ephemeral: true,
      });
    } else {
      await db
        .update(dailyUsers)
        .set({ isActive: true })
        .where(eq(dailyUsers.discordId, user.id));
      await interaction.reply({
        content: `${user} re-assigned to daily standup.`,
        ephemeral: true,
      });
    }
  } else {
    await db.insert(dailyUsers).values({
      discordId: user.id,
      username: user.username,
      isActive: true,
    });
    await interaction.reply({
      content: `${user} assigned to daily standup.`,
      ephemeral: true,
    });
  }
}
