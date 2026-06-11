import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Bell,
  Calendar,
  ChevronDown,
  ClipboardList,
  FileText,
  Heart,
  Home,
  LogOut,
  Menu,
  ScrollText,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Separator } from "./ui/separator";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

function getGroupNav(groupId: string): NavItem[] {
  return [
    { label: "Oversikt", href: `/group/${groupId}`, icon: Home },
    { label: "Kalender", href: `/group/${groupId}/calendar`, icon: Calendar },
    { label: "Medisinlogg", href: `/group/${groupId}/log`, icon: ClipboardList },
    { label: "Oppgaver", href: `/group/${groupId}/tasks`, icon: ScrollText },
    { label: "Dokumenter", href: `/group/${groupId}/documents`, icon: FileText },
    { label: "Tidslinje", href: `/group/${groupId}/timeline`, icon: Heart },
    { label: "Team", href: `/group/${groupId}/team`, icon: Users },
  ];
}

interface KuraLayoutProps {
  children: React.ReactNode;
  groupId?: string;
}

export default function KuraLayout({ children, groupId }: KuraLayoutProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const navItems = groupId ? getGroupNav(groupId) : [];

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "K";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border/60 shadow-sm">
        <div className="container flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={isAuthenticated ? "/dashboard" : "/"}>
            <span className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <Heart className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-serif text-xl font-semibold text-foreground tracking-tight">Kura</span>
            </span>
          </Link>

          {/* Desktop right actions */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link href="/notifications">
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount != null && unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium hidden lg:block">{user?.name ?? "Bruker"}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <Home className="w-4 h-4 mr-2" /> Mine grupper
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => logout()}
                    >
                      <LogOut className="w-4 h-4 mr-2" /> Logg ut
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <a href={getLoginUrl()}>Logg inn</a>
              </Button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Group sub-nav */}
        {groupId && navItems.length > 0 && (
          <div className="border-t border-border/40 bg-sidebar">
            <div className="container overflow-x-auto">
              <nav className="flex gap-1 py-1.5 min-w-max">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = location === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <span
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/40 bg-card px-4 py-3 space-y-1">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-3 py-2 mb-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{user?.name ?? "Bruker"}</span>
                </div>
                <Separator className="mb-2" />
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                  <span className="flex items-center gap-2 py-2 text-sm text-foreground">
                    <Home className="w-4 h-4" /> Mine grupper
                  </span>
                </Link>
                <Link href="/notifications" onClick={() => setMobileOpen(false)}>
                  <span className="flex items-center gap-2 py-2 text-sm text-foreground">
                    <Bell className="w-4 h-4" /> Varsler
                    {unreadCount != null && unreadCount > 0 && (
                      <Badge className="ml-auto bg-primary text-primary-foreground text-[10px] h-5 px-1.5">
                        {unreadCount}
                      </Badge>
                    )}
                  </span>
                </Link>
                {groupId &&
                  navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                        <span className="flex items-center gap-2 py-2 text-sm text-foreground">
                          <Icon className="w-4 h-4" /> {item.label}
                        </span>
                      </Link>
                    );
                  })}
                <Separator className="my-2" />
                <button
                  className="flex items-center gap-2 py-2 text-sm text-destructive w-full"
                  onClick={() => { logout(); setMobileOpen(false); }}
                >
                  <LogOut className="w-4 h-4" /> Logg ut
                </button>
              </>
            ) : (
              <a
                href={getLoginUrl()}
                className="block py-2 text-sm font-medium text-primary"
                onClick={() => setMobileOpen(false)}
              >
                Logg inn
              </a>
            )}
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/50 py-6 mt-auto">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            <span className="font-serif text-sm font-medium text-foreground">Kura</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Koordinert omsorg for dem du er glad i. Alle data lagres kryptert og deles kun med ditt omsorgsteam.
          </p>
        </div>
      </footer>
    </div>
  );
}
