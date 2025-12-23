import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

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
  await interaction.reply({
    content: "Please use the Daily Bot Dashboard to manage participants.",
    ephemeral: true,
  });
}
