import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  Send,
  Activity,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "User Requests", url: "/users/requests", icon: Users },
  { title: "Templates", url: "/templates", icon: FileText },
  { title: "Submissions", url: "/submissions", icon: Send },
  { title: "Activity Monitor", url: "/activity", icon: Activity },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className={open ? "w-60" : "w-16"} collapsible="icon">
      <SidebarContent className="pt-2">
        {/* Logo Section */}
        <div className="flex items-center justify-center px-3 py-4 border-b border-sidebar-border">
          {open ? (
            <div className="flex items-center gap-2">
              <img 
                src="/latrics-logo.png" 
                alt="Latrics Logo" 
                className="h-8 w-8"
              />
              <span className="font-semibold text-sidebar-foreground">Latrics Admin</span>
            </div>
          ) : (
            <img 
              src="/latrics-logo.png" 
              alt="Latrics Logo" 
              className="h-8 w-8"
            />
          )}
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-semibold px-3">
            {open ? "Navigation" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className="min-h-[44px]"
                  >
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary font-medium min-h-[44px]"
                          : "hover:bg-sidebar-accent/50 min-h-[44px]"
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {open && <span className="text-sm md:text-base">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
