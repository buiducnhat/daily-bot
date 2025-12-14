import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Configure daily check-in settings")
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("The channel to post check-in summaries")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: any) {
  await interaction.reply({
    content: "Please use the Daily Bot Dashboard to configure check-ins.",
    ephemeral: true,
  });
}
