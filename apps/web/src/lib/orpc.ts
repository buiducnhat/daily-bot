import type { appRouter } from "@daily-bot/api/routers/index";
import { env } from "@daily-bot/env/web";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error(`Error: ${error.message}`, {
        action: {
          label: "retry",
          onClick: () => {
            queryClient.invalidateQueries();
          },
        },
      });
    },
  }),
});

export const client: RouterClient<typeof appRouter> = createORPCClient(
  new RPCLink({
    url: `${env.VITE_SERVER_URL}/rpc`,
    fetch(_url, options) {
      return fetch(_url, {
        ...options,
        credentials: "include",
      });
    },
  })
);

export const orpc = createTanstackQueryUtils(client);
