import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Bell, Calendar, CheckCheck, ClipboardList, FileText, Heart, Users } from "lucide-react";
import { useLocation } from "wouter";
import KuraLayout from "@/components/KuraLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const typeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  appointment: { icon: Calendar, color: "text-blue-600" },
  task_assigned: { icon: ClipboardList, color: "text-amber-600" },
  medical_log: { icon: Heart, color: "text-emerald-600" },
  document: { icon: FileText, color: "text-purple-600" },
  invitation: { icon: Users, color: "text-indigo-600" },
  general: { icon: Bell, color: "text-muted-foreground" },
};

export default function Notifications() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: notifications, isLoading, refetch } = trpc.notifications.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => { toast.success("Alle varsler markert som lest."); refetch(); utils.notifications.unreadCount.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const unread = (notifications ?? []).filter(n => !n.isRead).length;

  return (
    <KuraLayout>
      <div className="container py-10 max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary" /> Varsler
            </h1>
            {unread > 0 && (
              <p className="text-muted-foreground text-sm mt-1">{unread} uleste varsler</p>
            )}
          </div>
          {unread > 0 && (
            <Button variant="outline" size="sm"
              className="border-border/60 bg-card text-foreground"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Merk alle som lest
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="text-center py-20 kura-card">
            <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-serif text-lg font-semibold text-foreground mb-1">Ingen varsler</p>
            <p className="text-muted-foreground text-sm">Du er oppdatert!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const cfg = typeConfig[n.type] ?? typeConfig.general;
              const Icon = cfg.icon;
              return (
                <div
                  key={n.id}
                  className={cn(
                    "kura-card p-4 flex items-start gap-3 cursor-pointer hover:shadow-sm transition-shadow",
                    !n.isRead && "border-primary/20 bg-primary/5"
                  )}
                  onClick={() => { if (n.linkPath) navigate(n.linkPath); }}
                >
                  <div className={cn("w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0", !n.isRead && "bg-primary/10")}>
                    <Icon className={cn("w-4 h-4", cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", !n.isRead ? "text-foreground" : "text-muted-foreground")}>
                      {n.title}
                    </p>
                    {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(n.createdAt).toLocaleString("nb-NO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </KuraLayout>
  );
}
