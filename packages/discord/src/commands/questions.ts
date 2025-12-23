import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

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
  await interaction.reply({
    content:
      "Please use the Daily Bot Dashboard to configure standup questions.",
    ephemeral: true,
  });
}
