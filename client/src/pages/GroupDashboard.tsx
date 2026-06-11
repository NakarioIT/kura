import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Activity, Calendar, CheckCircle2, ClipboardList, FileText, Heart, Users } from "lucide-react";
import { useParams, useLocation } from "wouter";
import KuraLayout from "@/components/KuraLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const quickLinks = [
  { label: "Kalender", href: "calendar", icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Medisinlogg", href: "log", icon: ClipboardList, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Oppgaver", href: "tasks", icon: CheckCircle2, color: "text-amber-600", bg: "bg-amber-50" },
  { label: "Dokumenter", href: "documents", icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
  { label: "Tidslinje", href: "timeline", icon: Activity, color: "text-rose-600", bg: "bg-rose-50" },
  { label: "Team", href: "team", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
];

export default function GroupDashboard() {
  const { id } = useParams<{ id: string }>();
  const groupId = parseInt(id ?? "0");
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = trpc.careGroups.get.useQuery(
    { careGroupId: groupId },
    { enabled: isAuthenticated && !!groupId }
  );

  const { data: recentLogs } = trpc.medicalLogs.list.useQuery(
    { careGroupId: groupId, limit: 3 },
    { enabled: isAuthenticated && !!groupId }
  );

  const { data: tasks } = trpc.tasks.list.useQuery(
    { careGroupId: groupId },
    { enabled: isAuthenticated && !!groupId }
  );

  const { data: appointments } = trpc.appointments.list.useQuery(
    { careGroupId: groupId, fromMs: Date.now() },
    { enabled: isAuthenticated && !!groupId }
  );

  const pendingTasks = tasks?.filter((t) => t.status !== "done").length ?? 0;
  const upcomingAppts = appointments?.slice(0, 3) ?? [];

  if (isLoading) {
    return (
      <KuraLayout groupId={id}>
        <div className="container py-10 max-w-5xl space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        </div>
      </KuraLayout>
    );
  }

  if (!data) return null;

  const { group } = data;

  return (
    <KuraLayout groupId={id}>
      <div className="container py-10 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground">{group.name}</h1>
              <p className="text-sm text-muted-foreground">Pasient: {group.patientName}</p>
            </div>
          </div>
          {group.patientNotes && (
            <p className="mt-3 text-sm text-muted-foreground bg-secondary/50 rounded-lg px-4 py-3 border border-border/40 max-w-2xl">
              {group.patientNotes}
            </p>
          )}
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.href}
                onClick={() => navigate(`/group/${groupId}/${link.href}`)}
                className="kura-card p-5 flex items-center gap-3 hover:shadow-md transition-all group text-left active:scale-[0.98]"
              >
                <div className={`w-10 h-10 rounded-xl ${link.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  <Icon className={`w-5 h-5 ${link.color}`} />
                </div>
                <span className="font-medium text-foreground text-sm">{link.label}</span>
              </button>
            );
          })}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upcoming appointments */}
          <Card className="kura-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" /> Kommende avtaler
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingAppts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ingen kommende avtaler.</p>
              ) : (
                <ul className="space-y-2">
                  {upcomingAppts.map((a) => (
                    <li key={a.id} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-foreground">{a.title}</span>
                        <span className="text-muted-foreground ml-2">
                          {new Date(a.startAt).toLocaleDateString("nb-NO", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 text-primary hover:text-primary/80 p-0 h-auto text-xs"
                onClick={() => navigate(`/group/${groupId}/calendar`)}
              >
                Se alle avtaler →
              </Button>
            </CardContent>
          </Card>

          {/* Recent logs */}
          <Card className="kura-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-emerald-600" /> Siste loggoppføringer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!recentLogs || recentLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ingen loggoppføringer ennå.</p>
              ) : (
                <ul className="space-y-2">
                  {recentLogs.map((l) => (
                    <li key={l.id} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-foreground">{l.title}</span>
                        <span className="text-muted-foreground ml-2">
                          {new Date(l.recordedAt).toLocaleDateString("nb-NO", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 text-primary hover:text-primary/80 p-0 h-auto text-xs"
                onClick={() => navigate(`/group/${groupId}/log`)}
              >
                Se alle oppføringer →
              </Button>
            </CardContent>
          </Card>

          {/* Tasks summary */}
          <Card className="kura-card md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600" /> Oppgaver
                {pendingTasks > 0 && (
                  <span className="ml-auto text-xs font-normal text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                    {pendingTasks} aktive
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!tasks || tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ingen oppgaver ennå.</p>
              ) : (
                <ul className="space-y-2">
                  {tasks.slice(0, 4).map((t) => (
                    <li key={t.id} className="flex items-center gap-3 text-sm">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.status === "done" ? "bg-emerald-400" : t.status === "in_progress" ? "bg-amber-400" : "bg-muted-foreground/40"}`} />
                      <span className={`font-medium ${t.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {t.title}
                      </span>
                      {t.dueAt && (
                        <span className="ml-auto text-muted-foreground text-xs">
                          {new Date(t.dueAt).toLocaleDateString("nb-NO", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 text-primary hover:text-primary/80 p-0 h-auto text-xs"
                onClick={() => navigate(`/group/${groupId}/tasks`)}
              >
                Se alle oppgaver →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </KuraLayout>
  );
}
