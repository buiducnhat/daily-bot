import { Roles } from "@daily-bot/auth";
import { ORPCError, os, type RouterClient } from "@orpc/server";
import type { Context } from "./context";
import type { appRouter } from "./routers";

export const o = os.$context<Context>();

export const publicProcedure = o;

const requireAuth = o.middleware(({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED");
  }
  return next({
    context: {
      session: context.session,
    },
  });
});

const requireAdmin = o.middleware(({ context, next }) => {
  if (context.session?.user.role !== Roles.ADMIN) {
    throw new ORPCError("UNAUTHORIZED");
  }
  return next({
    context: {
      session: context.session,
    },
  });
});

export const protectedProcedure = publicProcedure.use(requireAuth);
export const adminProcedure = protectedProcedure.use(requireAdmin);

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
