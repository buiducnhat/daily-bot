"use client";

import { Link, useLocation } from "@tanstack/react-router";
import {
  AudioWaveform,
  ChevronsUpDown,
  GalleryVerticalEnd,
  LayoutDashboard,
  Plus,
  Settings,
} from "lucide-react";
import type * as React from "react";
import { NavUser } from "@/components/nav-user";
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

const data = {
  navMain: [
    {
      title: "Overview",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Daily Check-in",
      url: "/dashboard/check-ins",
      icon: AudioWaveform,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings,
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
                <SidebarMenuButton
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  size="lg"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    {activeOrg?.logo ? (
                      <img
                        alt={activeOrg.name}
                        className="size-4"
                        src={activeOrg.logo}
                      />
                    ) : (
                      <GalleryVerticalEnd className="size-4" />
                    )}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {activeOrg?.name ?? "Select Organization"}
                    </span>
                    <span className="truncate text-xs">
                      {activeOrg?.slug ?? "No Organization"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto" />
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
                        <GalleryVerticalEnd className="size-4 shrink-0" />
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
                  <Link to="/create-organization">
                    <div className="flex size-6 items-center justify-center rounded-md border">
                      <Plus className="size-4" />
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
