CREATE TABLE `daily_configs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`guild_id` text NOT NULL,
	`summary_channel_id` text,
	`admin_role_id` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_configs_guild_id_unique` ON `daily_configs` (`guild_id`);--> statement-breakpoint
CREATE TABLE `daily_standups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`date` text NOT NULL,
	`yesterday` text NOT NULL,
	`today` text NOT NULL,
	`blockers` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `daily_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `daily_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`discord_id` text NOT NULL,
	`username` text NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_users_discord_id_unique` ON `daily_users` (`discord_id`);