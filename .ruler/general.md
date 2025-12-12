# General rules

This is a daily-bot project created with Better-T-Stack CLI.

## Project Structure

This is a monorepo with the following structure:

- **`apps/server/`** - Backend server (Elysia)
- **`apps/web/`** - Web app (Tanstack Start)
- **`apps/discord-bot/`** - Discord bot (Discord.js)

- **`packages/api/`** - Shared API logic and types
- **`packages/db/`** - Database schema and utilities
- **`packages/auth/`** - Better auth configuration, with organization plugin
- **`packages/env/`** - Environment variables

## Available Scripts

- `bun run dev` - Start all apps in development mode
- `bun run dev:server` - Start only the server
- `bun run dev:web` - Start only the web app
- `bun run dev:discord-bot` - Start only the discord bot

## Database Commands

All database operations should be run from the server workspace:

- `bun run db:push` - Push schema changes to database
- `bun run db:studio` - Open database studio
- `bun run db:generate` - Generate Drizzle files
- `bun run db:migrate` - Run database migrations

Database schema files are located in `apps/server/src/db/schema/`

## API Structure

- oRPC endpoints are in `apps/server/src/api/`
- Client-side API utils are in `apps/web/src/utils/api.ts`

## Techstack

- Backend: Elysia
- Database: SQLite
- ORM: Drizzle
- Authentication: Better Auth
- API: oRPC
- Web: Tanstack Start
- Discord: Discord.js
