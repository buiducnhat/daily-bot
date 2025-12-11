/** biome-ignore-all lint/suspicious/useAwait: <> */
/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: <> */
import type { Context as ElysiaContext } from "elysia";

export type CreateContextOptions = {
  context: ElysiaContext;
};

export async function createContext({ context }: CreateContextOptions) {
  // biome-ignore lint/nursery/noUnusedExpressions: <>
  context;
  // No auth configured
  return {
    session: null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
