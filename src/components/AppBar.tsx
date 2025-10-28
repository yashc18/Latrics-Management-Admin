import { useState } from "react";
import { Search, HelpCircle, LogOut, User, X } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function AppBar() {
  const navigate = useNavigate();
  const { logout, adminData } = useAuth();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-2 px-3 md:h-16 md:gap-4 md:px-4">
        <SidebarTrigger className="text-foreground" />
        
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md md:h-8 md:w-8">
            <img 
              src="/latrics-logo.png" 
              alt="Latrics Logo" 
              className="h-6 w-6 md:h-7 md:w-7"
            />
          </div>
          <h1 className="text-base font-semibold text-foreground md:text-lg">
            <span className="hidden sm:inline">Latrics Admin</span>
            <span className="sm:hidden">Latrics</span>
          </h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Desktop Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-64 pl-9"
              aria-label="Global search"
            />
          </div>

          {/* Mobile Search Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            aria-label="Toggle search"
          >
            {mobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full transition-opacity hover:opacity-80"
                aria-label="User menu"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                    AD
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{adminData?.name || "Admin User"}</DropdownMenuLabel>
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                {adminData?.email}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                Help
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {mobileSearchOpen && (
        <div className="border-t px-3 py-2 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-9"
              aria-label="Mobile search"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
}
