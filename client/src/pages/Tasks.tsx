import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Circle, Clock, Plus, ScrollText, Trash2 } from "lucide-react";
import { useState } from "react";
import { useParams } from "wouter";
import KuraLayout from "@/components/KuraLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Lav", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  medium: { label: "Middels", color: "text-amber-600 bg-amber-50 border-amber-200" },
  high: { label: "Høy", color: "text-rose-600 bg-rose-50 border-rose-200" },
};

const statusConfig = [
  { key: "pending", label: "Å gjøre", icon: Circle, color: "text-muted-foreground" },
  { key: "in_progress", label: "Pågår", icon: Clock, color: "text-amber-600" },
  { key: "done", label: "Ferdig", icon: CheckCircle2, color: "text-emerald-600" },
] as const;

export default function Tasks() {
  const { id } = useParams<{ id: string }>();
  const groupId = parseInt(id ?? "0");
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium" as "low" | "medium" | "high", assignedToUserId: "", dueAt: "" });

  const { data: tasks, isLoading, refetch } = trpc.tasks.list.useQuery({ careGroupId: groupId }, { enabled: isAuthenticated && !!groupId });
  const { data: members } = trpc.careGroups.members.useQuery({ careGroupId: groupId }, { enabled: isAuthenticated && !!groupId });

  const createTask = trpc.tasks.create.useMutation({
    onSuccess: () => { toast.success("Oppgave opprettet!"); setOpen(false); refetch(); setForm({ title: "", description: "", priority: "medium", assignedToUserId: "", dueAt: "" }); },
    onError: (e) => toast.error(e.message),
  });

  const updateTask = trpc.tasks.update.useMutation({ onSuccess: () => refetch(), onError: (e) => toast.error(e.message) });
  const deleteTask = trpc.tasks.delete.useMutation({ onSuccess: () => { toast.success("Oppgave slettet."); refetch(); }, onError: (e) => toast.error(e.message) });

  const cycleStatus = (task: NonNullable<typeof tasks>[0]) => {
    const next: Record<string, "pending" | "in_progress" | "done"> = { pending: "in_progress", in_progress: "done", done: "pending" };
    updateTask.mutate({ id: task.id, careGroupId: groupId, status: next[task.status], completedAt: next[task.status] === "done" ? Date.now() : null });
  };

  const grouped = statusConfig.map((s) => ({ ...s, tasks: (tasks ?? []).filter((t) => t.status === s.key) }));

  return (
    <KuraLayout groupId={id}>
      <div className="container py-10 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground flex items-center gap-2">
              <ScrollText className="w-6 h-6 text-amber-600" /> Oppgaver
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Tildel og spor omsorgsoppgaver</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all">
                <Plus className="w-4 h-4 mr-2" /> Ny oppgave
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle className="font-serif">Opprett oppgave</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Tittel *</Label>
                  <Input placeholder="f.eks. Hent medisiner fra apotek" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Beskrivelse</Label>
                  <Textarea placeholder="Ytterligere detaljer…" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Prioritet</Label>
                    <Select value={form.priority} onValueChange={(v) => setForm(f => ({ ...f, priority: v as typeof form.priority }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Lav</SelectItem>
                        <SelectItem value="medium">Middels</SelectItem>
                        <SelectItem value="high">Høy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Frist</Label>
                    <Input type="date" value={form.dueAt} onChange={(e) => setForm(f => ({ ...f, dueAt: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Tildel til</Label>
                  <Select value={form.assignedToUserId} onValueChange={(v) => setForm(f => ({ ...f, assignedToUserId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Velg teammedlem" /></SelectTrigger>
                    <SelectContent>
                      {(members ?? []).map((m) => (
                        <SelectItem key={m.userId} value={String(m.userId)}>{m.user?.name ?? m.displayName ?? `Bruker #${m.userId}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={!form.title || createTask.isPending}
                  onClick={() => createTask.mutate({ careGroupId: groupId, title: form.title, description: form.description || undefined, priority: form.priority, assignedToUserId: form.assignedToUserId ? parseInt(form.assignedToUserId) : undefined, dueAt: form.dueAt ? new Date(form.dueAt).getTime() : undefined })}>
                  {createTask.isPending ? "Oppretter…" : "Opprett"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">{[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {grouped.map((col) => {
              const Icon = col.icon;
              return (
                <div key={col.key}>
                  <div className={`flex items-center gap-2 mb-3 ${col.color}`}>
                    <Icon className="w-4 h-4" />
                    <span className="font-semibold text-sm">{col.label}</span>
                    <span className="ml-auto text-xs bg-secondary text-muted-foreground rounded-full px-2 py-0.5">{col.tasks.length}</span>
                  </div>
                  <div className="space-y-3">
                    {col.tasks.length === 0 ? (
                      <div className="kura-card p-4 text-center"><p className="text-xs text-muted-foreground">Ingen oppgaver</p></div>
                    ) : col.tasks.map((t) => (
                      <Card key={t.id} className="kura-card hover:shadow-sm transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-2">
                            <button onClick={() => cycleStatus(t)} className={`mt-0.5 flex-shrink-0 transition-colors ${col.color} hover:opacity-70`}>
                              <Icon className="w-4 h-4" />
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium leading-snug ${t.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.title}</p>
                              {t.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>}
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${priorityConfig[t.priority]?.color}`}>
                                  {priorityConfig[t.priority]?.label}
                                </span>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive flex-shrink-0 -mr-1"
                              onClick={() => deleteTask.mutate({ id: t.id, careGroupId: groupId })}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </KuraLayout>
  );
}
