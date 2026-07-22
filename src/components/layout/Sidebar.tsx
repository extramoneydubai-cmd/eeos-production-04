import { NavLink, useLocation } from "react-router";
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
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
} from "lucide-react";
import { routes, routeGroups, getRoutesByGroup } from "@/lib/routes";
import logo from "@/assets/logo.svg";

export function AppSidebar() {
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="px-3 py-3">
        <div className="flex items-center justify-between">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2.5 overflow-hidden"
          >
            <img
              src={logo}
              alt=""
              width={22}
              height={22}
              className="shrink-0"
            />
            <span
              className={`text-sm font-medium tracking-tight whitespace-nowrap transition-opacity duration-200 ${
                collapsed ? "opacity-0 w-0" : "opacity-100"
              }`}
            >
              eeos
            </span>
          </NavLink>
          <button
            onClick={toggleSidebar}
            className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft
              className={`h-4 w-4 transition-transform duration-200 ${
                collapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {routeGroups.map((group) => {
          const groupRoutes = getRoutesByGroup(group);
          if (groupRoutes.length === 0) return null;

          return (
            <SidebarGroup key={group}>
              <SidebarGroupLabel className="px-3 text-[10px] uppercase tracking-widest text-muted-foreground/60">
                {group}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {groupRoutes.map((item) => {
                    const isActive = location.pathname === item.href || 
                      (item.href !== "/dashboard" && location.pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.label}
                          className="text-sm"
                        >
                          <NavLink to={item.href} className="relative">
                            <Icon className="h-4 w-4" />
                            <span className="flex-1">{item.label}</span>
                            {item.isPlaceholder && !collapsed && (
                              <Badge
                                variant="outline"
                                className="ml-auto text-[8px] px-1 py-0 h-3.5 border-border/40 text-muted-foreground/50 font-normal uppercase tracking-wider"
                              >
                                Soon
                              </Badge>
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="px-3 py-2">
        <p
          className={`text-[10px] text-muted-foreground/40 transition-opacity duration-200 ${
            collapsed ? "opacity-0" : "opacity-100"
          }`}
        >
          &copy; {new Date().getFullYear()} eeos v1.0.0-beta
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
