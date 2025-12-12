CREATE TABLE `discord_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`discord_id` text NOT NULL,
	`username` text NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `discord_users_discord_id_unique` ON `discord_users` (`discord_id`);--> statement-breakpoint
CREATE TABLE `standup_configs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`cron` text NOT NULL,
	`guild_id` text NOT NULL,
	`channel_id` text NOT NULL,
	`questions` text NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `standup_participants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`standup_config_id` integer NOT NULL,
	`discord_user_id` integer NOT NULL,
	FOREIGN KEY (`standup_config_id`) REFERENCES `standup_configs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`discord_user_id`) REFERENCES `discord_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
DROP TABLE `daily_configs`;--> statement-breakpoint
DROP TABLE `daily_users`;--> statement-breakpoint
ALTER TABLE `daily_standups` ADD `standup_config_id` integer NOT NULL REFERENCES standup_configs(id);--> statement-breakpoint
ALTER TABLE `daily_standups` ADD `discord_user_id` integer NOT NULL REFERENCES discord_users(id);--> statement-breakpoint
ALTER TABLE `daily_standups` DROP COLUMN `user_id`;