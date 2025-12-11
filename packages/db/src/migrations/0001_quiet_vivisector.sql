ALTER TABLE `daily_configs` ADD `questions` text;--> statement-breakpoint
ALTER TABLE `daily_standups` ADD `answers` text NOT NULL;--> statement-breakpoint
ALTER TABLE `daily_standups` DROP COLUMN `yesterday`;--> statement-breakpoint
ALTER TABLE `daily_standups` DROP COLUMN `today`;--> statement-breakpoint
ALTER TABLE `daily_standups` DROP COLUMN `blockers`;