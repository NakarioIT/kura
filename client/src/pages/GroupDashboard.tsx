import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Activity, Calendar, CheckSquare, ClipboardList, FileText, Heart, Users } from "lucide-react";
import { useParams, useLocation } from "wouter";
import KuraLayout from "@/components/KuraLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const quickLinks = [
  { label: "Kalender", path: "/calendar", icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Medisinlogg", path: "/log", icon: ClipboardList, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Oppgaver", path: "/tasks", icon: CheckSquare, color: "text-amber-600", bg: "bg-amber-50" },
  { label: "Dokumenter", path: "/documents", icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
  { label: "Tidslinje", path: "/timeline", icon: Activity, color: "text-rose-600", bg: "bg-rose-50" },
  { label: "Team", path: "/team", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
];

export default function GroupDashboard() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data, isLoading } = trpc.careGroups.get.useQuery(
    { careGroupId: parseInt(id ?? "0") },
    { enabled: isAuthenticated && !!id }
  );

  const { data: recentLogs } = trpc.medicalLogs.list.useQuery(
    { careGroupId: parseInt(id ?? "0"), limit: 3 },
    { enabled: isAuthenticated && !!id }
  );

  const { data: tasks } = trpc.tasks.list.useQuery(
    { careGroupId: parseInt(id ?? "0") },
    { enabled: isAuthenticated && !!id }
  );

  const openTasks = (tasks ?? []).filter(t => t.status !== "done");

  return (
    <KuraLayout groupId={id}>
      <div className="container py-10 max-w-4xl">
        {isLoading ? (
          <Skeleton className="h-24 rounded-xl mb-8" />
        ) : data ? (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold text-foreground">{data.group.name}</h1>
                <p className="text-muted-foreground text-sm">Pasient: {data.group.patientName}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Card
                key={link.path}
                className="kura-card cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
                onClick={() => navigate(`/group/${id}${link.path}`)}
              >
                <CardContent className="p-5 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${link.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${link.color}`} />
                  </div>
                  <span className="font-medium text-foreground text-sm">{link.label}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="kura-card p-5">
            <h2 className="font-serif font-semibold text-foreground mb-3 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-emerald-600" /> Siste loggoppføringer
            </h2>
            {!recentLogs || recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ingen oppføringer ennå.</p>
            ) : (
              <div className="space-y-2">
                {recentLogs.map(l => (
                  <div key={l.id} className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">{l.title}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(l.recordedAt).toLocaleDateString("nb-NO", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="kura-card p-5">
            <h2 className="font-serif font-semibold text-foreground mb-3 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-amber-600" /> Åpne oppgaver
            </h2>
            {openTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ingen åpne oppgaver.</p>
            ) : (
              <div className="space-y-2">
                {openTasks.slice(0, 3).map(t => (
                  <div key={t.id} className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">{t.title}</span>
                    <span className={`text-xs ml-auto px-1.5 py-0.5 rounded ${
                      t.priority === "high" ? "bg-rose-50 text-rose-600" :
                      t.priority === "medium" ? "bg-amber-50 text-amber-600" :
                      "bg-emerald-50 text-emerald-600"
                    }`}>{t.priority}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </KuraLayout>
  );
}
