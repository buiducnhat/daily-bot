ALTER TABLE `standup_configs` RENAME TO `checkin_configs`;--> statement-breakpoint
CREATE TABLE `checkin_participants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`checkin_config_id` integer NOT NULL,
	`discord_user_id` integer NOT NULL,
	FOREIGN KEY (`checkin_config_id`) REFERENCES `checkin_configs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`discord_user_id`) REFERENCES `discord_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `checkin_responses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`checkin_config_id` integer NOT NULL,
	`discord_user_id` integer NOT NULL,
	`date` text NOT NULL,
	`answers` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`checkin_config_id`) REFERENCES `checkin_configs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`discord_user_id`) REFERENCES `discord_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
DROP TABLE `daily_standups`;--> statement-breakpoint
DROP TABLE `standup_participants`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_checkin_configs` (
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
INSERT INTO `__new_checkin_configs`("id", "organization_id", "name", "cron", "guild_id", "channel_id", "questions", "is_active", "created_at") SELECT "id", "organization_id", "name", "cron", "guild_id", "channel_id", "questions", "is_active", "created_at" FROM `checkin_configs`;--> statement-breakpoint
DROP TABLE `checkin_configs`;--> statement-breakpoint
ALTER TABLE `__new_checkin_configs` RENAME TO `checkin_configs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;