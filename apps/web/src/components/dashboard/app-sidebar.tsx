"use client";

import {
  IconCalendar,
  IconLayoutDashboard,
  IconPlus,
  IconSelector,
  IconSettings,
} from "@tabler/icons-react";
import { Link, useLocation } from "@tanstack/react-router";
import type * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { NavUser } from "./nav-user";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconLayoutDashboard,
    },
    {
      title: "Check-ins",
      url: "/dashboard/check-ins",
      icon: IconCalendar,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: IconSettings,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = useLocation({
    select: (location) => location.pathname,
  });

  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const { data: orgs, isPending: isOrgsPending } =
    authClient.useListOrganizations();

  const activeOrgId = session?.session.activeOrganizationId;
  const activeOrg = orgs?.find((org) => org.id === activeOrgId);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {isOrgsPending ? (
              <div className="flex items-center gap-2 p-2">
                <Skeleton className="size-8 rounded-lg" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg">
                    <Avatar className="rounded-lg after:rounded-lg">
                      <AvatarImage
                        alt={activeOrg?.name ?? "Organization"}
                        className="rounded-lg"
                        src={activeOrg?.logo ?? undefined}
                      />
                      <AvatarFallback className="rounded-lg bg-stone-200 text-lg dark:bg-stone-700">
                        {activeOrg?.name?.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {activeOrg?.name ?? "Select Organization"}
                      </span>
                      <span className="truncate text-xs">
                        {activeOrg?.slug ?? "n/a"}
                      </span>
                    </div>
                    <IconSelector className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="bottom"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="text-muted-foreground text-xs">
                    Organizations
                  </DropdownMenuLabel>
                  {orgs?.map((org, index) => (
                    <DropdownMenuItem
                      className="gap-2 p-2"
                      key={org.id}
                      onClick={() => {
                        authClient.organization.setActive({
                          organizationId: org.id,
                        });
                      }}
                    >
                      <Avatar className="size-6 rounded-sm after:rounded-sm">
                        <AvatarImage
                          alt={org.name}
                          className="rounded-sm"
                          src={org.logo || ""}
                        />
                        <AvatarFallback className="rounded-sm">
                          {org.name?.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {org.name}
                      {org.id === activeOrgId && (
                        <DropdownMenuShortcut>
                          ⌘{index + 1}
                        </DropdownMenuShortcut>
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="gap-2 p-2">
                    <Link to="/dashboard/create-organization">
                      <div className="flex size-6 items-center justify-center rounded-md border">
                        <IconPlus className="size-4" />
                      </div>
                      <div className="font-medium text-muted-foreground">
                        Add Organization
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {isSessionPending ? (
          <div className="flex items-center gap-2 p-2">
            <Skeleton className="size-8 rounded-lg" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ) : session?.user ? (
          <NavUser
            user={{
              name: session.user.name,
              email: session.user.email,
              image: session.user.image || undefined,
            }}
          />
        ) : null}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
