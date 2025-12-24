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
import { Avatar, AvatarImage } from "@/components/ui/avatar";
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

  const { data: session } = authClient.useSession();
  const { data: orgs } = authClient.useListOrganizations();

  const activeOrgId = session?.session.activeOrganizationId;
  const activeOrg = orgs?.find((org) => org.id === activeOrgId);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar>
                    <AvatarImage
                      className="rounded-lg bg-white"
                      src={activeOrg?.logo || "/logo.webp"}
                    />
                  </Avatar>

                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {activeOrg?.name ?? "Select Organization"}
                    </span>
                    <span className="truncate text-xs">
                      {activeOrg?.slug ?? "No Organization"}
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
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      {org.logo ? (
                        <img
                          alt={org.name}
                          className="size-4 shrink-0"
                          src={org.logo}
                        />
                      ) : (
                        <IconSelector className="size-4 shrink-0" />
                      )}
                    </div>
                    {org.name}
                    {org.id === activeOrgId && (
                      <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
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
        {session?.user && (
          <NavUser
            user={{
              name: session.user.name,
              email: session.user.email,
              image: session.user.image || undefined,
            }}
          />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
