import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Activity, ClipboardList, Pill, Plus, Smile, StickyNote, Trash2 } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const typeConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  medication: { label: "Medisin", icon: Pill, color: "text-blue-600", bg: "bg-blue-50" },
  symptom: { label: "Symptom", icon: Activity, color: "text-rose-600", bg: "bg-rose-50" },
  vital: { label: "Vitale tegn", icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50" },
  wellbeing: { label: "Velvære", icon: Smile, color: "text-amber-600", bg: "bg-amber-50" },
  note: { label: "Notat", icon: StickyNote, color: "text-purple-600", bg: "bg-purple-50" },
};

export default function MedicalLog() {
  const { id } = useParams<{ id: string }>();
  const groupId = parseInt(id ?? "0");
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    entryType: "note" as "medication" | "symptom" | "vital" | "wellbeing" | "note",
    title: "", body: "", medicationName: "", medicationDose: "", medicationGiven: true,
    vitalSystolic: "", vitalDiastolic: "", vitalPulse: "", vitalTemp: "", vitalWeight: "", vitalOxygen: "",
    severity: "3", recordedAt: new Date().toISOString().slice(0, 16),
  });

  const { data: logs, isLoading, refetch } = trpc.medicalLogs.list.useQuery(
    { careGroupId: groupId, limit: 100 }, { enabled: isAuthenticated && !!groupId }
  );

  const createLog = trpc.medicalLogs.create.useMutation({
    onSuccess: () => { toast.success("Oppføring lagret!"); setOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteLog = trpc.medicalLogs.delete.useMutation({
    onSuccess: () => { toast.success("Oppføring slettet."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!form.title) return;
    createLog.mutate({
      careGroupId: groupId, entryType: form.entryType, title: form.title,
      body: form.body || undefined, medicationName: form.medicationName || undefined,
      medicationDose: form.medicationDose || undefined,
      medicationGiven: form.entryType === "medication" ? form.medicationGiven : undefined,
      vitalSystolic: form.vitalSystolic ? parseInt(form.vitalSystolic) : undefined,
      vitalDiastolic: form.vitalDiastolic ? parseInt(form.vitalDiastolic) : undefined,
      vitalPulse: form.vitalPulse ? parseInt(form.vitalPulse) : undefined,
      vitalTemp: form.vitalTemp || undefined, vitalWeight: form.vitalWeight || undefined,
      vitalOxygen: form.vitalOxygen ? parseInt(form.vitalOxygen) : undefined,
      severity: ["symptom", "wellbeing"].includes(form.entryType) ? parseInt(form.severity) : undefined,
      recordedAt: new Date(form.recordedAt).getTime(),
    });
  };

  const filtered = (logs ?? []).filter(l => filter === "all" || l.entryType === filter);

  return (
    <KuraLayout groupId={id}>
      <div className="container py-10 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-emerald-600" /> Medisinlogg
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Logg medisiner, symptomer og vitale tegn</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all">
                <Plus className="w-4 h-4 mr-2" /> Ny oppføring
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="font-serif">Ny loggoppføring</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={form.entryType} onValueChange={(v) => setForm(f => ({ ...f, entryType: v as typeof form.entryType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Tittel *</Label>
                  <Input placeholder="Kort beskrivelse" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tidspunkt</Label>
                  <Input type="datetime-local" value={form.recordedAt} onChange={(e) => setForm(f => ({ ...f, recordedAt: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Notater</Label>
                  <Textarea placeholder="Ytterligere detaljer…" value={form.body} onChange={(e) => setForm(f => ({ ...f, body: e.target.value }))} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={!form.title || createLog.isPending} onClick={handleCreate}>
                  {createLog.isPending ? "Lagrer…" : "Lagre"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={filter} onValueChange={setFilter} className="mb-6">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="all">Alle</TabsTrigger>
            {Object.entries(typeConfig).map(([k, v]) => <TabsTrigger key={k} value={k}>{v.label}</TabsTrigger>)}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 kura-card">
            <ClipboardList className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-serif text-lg font-semibold text-foreground mb-1">Ingen oppføringer</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((l) => {
              const cfg = typeConfig[l.entryType];
              const Icon = cfg?.icon ?? StickyNote;
              return (
                <Card key={l.id} className="kura-card hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg ${cfg?.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${cfg?.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground text-sm">{l.title}</span>
                          <span className="text-xs text-muted-foreground">{cfg?.label}</span>
                          {l.severity && <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">Nivå {l.severity}/5</span>}
                        </div>
                        {l.body && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{l.body}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(l.recordedAt).toLocaleString("nb-NO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive flex-shrink-0"
                        onClick={() => deleteLog.mutate({ id: l.id, careGroupId: groupId })}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </KuraLayout>
  );
}
