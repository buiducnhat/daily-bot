import { db } from "@daily-bot/db";
import { dailyConfigs } from "@daily-bot/db/schema/daily-standup";
import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { eq } from "drizzle-orm";

export const data = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Configure daily standup settings")
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("The channel to post standup summaries")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: any) {
  const channel = interaction.options.getChannel("channel");
  const guildId = interaction.guildId;

  if (!guildId) {
    return interaction.reply({
      content: "This command can only be used in a server.",
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
      .set({ summaryChannelId: channel.id })
      .where(eq(dailyConfigs.guildId, guildId));
  } else {
    await db
      .insert(dailyConfigs)
      .values({ guildId, summaryChannelId: channel.id });
  }

  await interaction.reply({
    content: `Standup summary channel set to ${channel}`,
    ephemeral: true,
  });
}
