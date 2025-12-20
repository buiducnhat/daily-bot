import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AnimatedThemeToggler } from "@/components/animated-theme-toggler";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getUser } from "@/functions/get-user";

export const Route = createFileRoute("/dashboard/(with-sidebar)")({
  component: DashboardLayout,
  beforeLoad: async () => {
    const session = await getUser();
    return { session };
  },
  loader: ({ context }) => {
    if (!context.session) {
      throw redirect({
        to: "/auth/sign-in",
      });
    }
  },
});

function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="h-4 w-px bg-border" />

          <div className="flex flex-1 justify-end gap-2">
            <AnimatedThemeToggler />
          </div>
        </header>
        <div className="max-h-[calc(100vh-64px)] overflow-y-auto p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
