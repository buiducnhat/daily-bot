import { createContext } from "@daily-bot/api/context";
import { appRouter } from "@daily-bot/api/routers/index";
import { auth } from "@daily-bot/auth";
import { db } from "@daily-bot/db";
import { organizations } from "@daily-bot/db/schema/auth";
import { env } from "@daily-bot/env/server";
import { cors } from "@elysiajs/cors";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";

const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});
const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

const app = new Elysia()
  .use(
    cors({
      origin: env.CORS_ORIGINS,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  )
  .all("/auth/*", (context) => {
    const { request, status } = context;
    if (["POST", "GET"].includes(request.method)) {
      return auth.handler(request);
    }
    return status(405);
  })
  .all("/rpc*", async (context) => {
    const { response } = await rpcHandler.handle(context.request, {
      prefix: "/rpc",
      context: await createContext({ context }),
    });
    return response ?? new Response("Not Found", { status: 404 });
  })
  .all("/api*", async (context) => {
    const { response } = await apiHandler.handle(context.request, {
      prefix: "/api-reference",
      context: await createContext({ context }),
    });
    return response ?? new Response("Not Found", { status: 404 });
  })
  .get("/", () => "OK")
  .get("/discord/callback", async ({ query, redirect }) => {
    const { code, state, guild_id, error } = query;

    // Use the first origin as the base for redirect.
    // If CORS_ORIGINS allows *, this fallback might fail, but for now we assume explicit origins.
    const frontendUrl =
      Array.isArray(env.CORS_ORIGINS) && env.CORS_ORIGINS.length > 0
        ? env.CORS_ORIGINS[0]
        : env.SERVER_URL; // Fallback?

    if (error) {
      return redirect(`${frontendUrl}/dashboard/settings?error=${error}`);
    }

    if (!(code && state && guild_id)) {
      return new Response("Missing parameters", { status: 400 });
    }

    // Exchange code to verify the request is valid
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code: code as string,
        redirect_uri: `${env.SERVER_URL}/discord/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Token verification failed", await tokenResponse.text());
      return new Response("Failed to verify code with Discord", {
        status: 400,
      });
    }

    // Trust the guild_id from the callback params now that code is valid.
    // State contains the organizationId.
    const organizationId = state as string;

    await db
      .update(organizations)
      .set({ discordGuildId: guild_id as string })
      .where(eq(organizations.id, organizationId));

    return redirect(`${frontendUrl}/dashboard/settings`);
  });

app.listen(env.SERVER_PORT, () => {
  console.log(`Server is running on ${env.SERVER_URL}`);
});
