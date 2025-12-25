import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { Spinner } from "./components/ui/spinner";
import { orpc, queryClient } from "./lib/orpc";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    context: { orpc, queryClient },
    defaultPendingComponent: () => (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="size-10" />
      </div>
    ),
    defaultNotFoundComponent: () => <div>Not Found</div>,
    Wrap: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
  return router;
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
