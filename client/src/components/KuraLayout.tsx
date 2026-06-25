import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import {
  Activity,
  Bell,
  Calendar,
  CheckSquare,
  ChevronLeft,
  ClipboardList,
  FileText,
  Heart,
  LogOut,
  Menu,
  Moon,
  Sun,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

type KuraLayoutProps = {
  children: React.ReactNode;
  groupId?: string;
};

const groupNavItems = [
  { label: "Oversikt", path: "", icon: Heart },
  { label: "Kalender", path: "/calendar", icon: Calendar },
  { label: "Medisinlogg", path: "/log", icon: ClipboardList },
  { label: "Oppgaver", path: "/tasks", icon: CheckSquare },
  { label: "Dokumenter", path: "/documents", icon: FileText },
  { label: "Tidslinje", path: "/timeline", icon: Activity },
  { label: "Team", path: "/team", icon: Users },
];

export default function KuraLayout({ children, groupId }: KuraLayoutProps) {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => navigate("/"),
  });

  const { data: unreadData } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });
  const unreadCount = unreadData ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur border-b border-border/40 shadow-sm">
        <div className="container flex items-center justify-between h-16">
          <button
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-serif text-xl font-bold text-foreground group-hover:text-primary transition-colors">
              Kura
            </span>
          </button>

          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate("/notifications")}
                  className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>
                <span className="text-sm text-muted-foreground px-1">{user?.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout.mutate()}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <a href={getLoginUrl()}>Logg inn</a>
              </Button>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {groupId && (
          <div className="border-t border-border/30 bg-card/60">
            <div className="container">
              <div className="flex gap-1 overflow-x-auto py-1 no-scrollbar">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground whitespace-nowrap rounded transition-colors"
                >
                  <ChevronLeft className="w-3 h-3" /> Tilbake
                </button>
                {groupNavItems.map((item) => {
                  const href = `/group/${groupId}${item.path}`;
                  const active = location === href;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(href)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-lg transition-colors",
                        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-background/95 backdrop-blur pt-16">
          <div className="container py-6 flex flex-col gap-4">
            <button onClick={toggleTheme} className="flex items-center gap-2 text-muted-foreground">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {theme === "dark" ? "Lys modus" : "Mørk modus"}
            </button>
            {isAuthenticated ? (
              <>
                <button onClick={() => { navigate("/notifications"); setMobileOpen(false); }} className="flex items-center gap-2 text-foreground">
                  <Bell className="w-4 h-4" /> Varsler {unreadCount > 0 && `(${unreadCount})`}
                </button>
                <button onClick={() => { logout.mutate(); setMobileOpen(false); }} className="flex items-center gap-2 text-muted-foreground">
                  <LogOut className="w-4 h-4" /> Logg ut
                </button>
              </>
            ) : (
              <a href={getLoginUrl()} className="text-primary font-medium">Logg inn</a>
            )}
          </div>
        </div>
      )}

      <main>{children}</main>
    </div>
  );
}
