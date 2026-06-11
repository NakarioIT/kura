import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Activity, FileDown, Heart, Pill, Plus, Star, Stethoscope, Syringe, TestTube, Trash2,
} from "lucide-react";
import { useState } from "react";
import { useParams } from "wouter";
import KuraLayout from "@/components/KuraLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const eventTypeConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; dot: string }> = {
  diagnosis: { label: "Diagnose", icon: Stethoscope, color: "text-rose-700", bg: "bg-rose-50", dot: "bg-rose-500" },
  treatment: { label: "Behandling", icon: Activity, color: "text-blue-700", bg: "bg-blue-50", dot: "bg-blue-500" },
  surgery: { label: "Operasjon", icon: Syringe, color: "text-purple-700", bg: "bg-purple-50", dot: "bg-purple-500" },
  hospitalization: { label: "Innleggelse", icon: Heart, color: "text-orange-700", bg: "bg-orange-50", dot: "bg-orange-500" },
  medication_start: { label: "Medisin startet", icon: Pill, color: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  medication_stop: { label: "Medisin avsluttet", icon: Pill, color: "text-gray-600", bg: "bg-gray-50", dot: "bg-gray-400" },
  test_result: { label: "Testresultat", icon: TestTube, color: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-500" },
  milestone: { label: "Milepæl", icon: Star, color: "text-indigo-700", bg: "bg-indigo-50", dot: "bg-indigo-500" },
  note: { label: "Notat", icon: Activity, color: "text-gray-600", bg: "bg-gray-50", dot: "bg-gray-400" },
};

export default function Timeline() {
  const { id } = useParams<{ id: string }>();
  const groupId = parseInt(id ?? "0");
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  type EventType = "diagnosis" | "treatment" | "surgery" | "hospitalization" | "medication_start" | "medication_stop" | "test_result" | "milestone" | "note";
  const [form, setForm] = useState({
    eventType: "note" as EventType,
    title: "",
    body: "",
    provider: "",
    icdCode: "",
    eventDate: new Date().toISOString().slice(0, 10),
    isKeyEvent: false,
  });

  const { data: events, isLoading, refetch } = trpc.timeline.list.useQuery(
    { careGroupId: groupId },
    { enabled: isAuthenticated && !!groupId }
  );

  const { data: groupData } = trpc.careGroups.get.useQuery(
    { careGroupId: groupId },
    { enabled: isAuthenticated && !!groupId }
  );

  const createEvent = trpc.timeline.create.useMutation({
    onSuccess: () => { toast.success("Hendelse lagt til!"); setOpen(false); refetch(); resetForm(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteEvent = trpc.timeline.delete.useMutation({
    onSuccess: () => { toast.success("Hendelse slettet."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () =>
    setForm({ eventType: "note", title: "", body: "", provider: "", icdCode: "",
      eventDate: new Date().toISOString().slice(0, 10), isKeyEvent: false });

  const handleCreate = () => {
    if (!form.title || !form.eventDate) return;
    createEvent.mutate({
      careGroupId: groupId,
      eventType: form.eventType as EventType,
      title: form.title,
      body: form.body || undefined,
      provider: form.provider || undefined,
      icdCode: form.icdCode || undefined,
      eventDate: new Date(form.eventDate).getTime(),
      isKeyEvent: form.isKeyEvent,
    });
  };

  // Group events by year
  const grouped = (events ?? []).reduce<Record<string, typeof events>>((acc, e) => {
    const year = new Date(e.eventDate).getFullYear().toString();
    if (!acc[year]) acc[year] = [];
    acc[year]!.push(e);
    return acc;
  }, {});

  const keyEvents = (events ?? []).filter(e => e.isKeyEvent);

  // Generate doctor summary
  const generateSummary = () => {
    const patient = groupData?.group;
    const lines: string[] = [];
    lines.push(`MEDISINSK SAMMENDRAG — ${patient?.patientName ?? "Pasient"}`);
    if (patient?.patientDob) lines.push(`Fødselsdato: ${patient.patientDob}`);
    lines.push(`Generert: ${new Date().toLocaleDateString("nb-NO")}`);
    lines.push("─".repeat(50));
    if (patient?.patientNotes) {
      lines.push(`\nBAKGRUNN\n${patient.patientNotes}`);
    }
    if (keyEvents.length > 0) {
      lines.push("\nNØKKELHENDELSER");
      keyEvents.forEach(e => {
        const cfg = eventTypeConfig[e.eventType];
        lines.push(`• [${new Date(e.eventDate).toLocaleDateString("nb-NO")}] ${cfg?.label ?? e.eventType}: ${e.title}`);
        if (e.provider) lines.push(`  Behandler: ${e.provider}`);
        if (e.icdCode) lines.push(`  ICD-kode: ${e.icdCode}`);
        if (e.body) lines.push(`  ${e.body}`);
      });
    }
    lines.push("\nKRONOLOGISK HISTORIKK");
    (events ?? []).forEach(e => {
      const cfg = eventTypeConfig[e.eventType];
      lines.push(`\n${new Date(e.eventDate).toLocaleDateString("nb-NO")} — ${cfg?.label ?? e.eventType}: ${e.title}`);
      if (e.provider) lines.push(`Behandler: ${e.provider}`);
      if (e.icdCode) lines.push(`ICD: ${e.icdCode}`);
      if (e.body) lines.push(e.body);
    });
    return lines.join("\n");
  };

  const downloadSummary = () => {
    const text = generateSummary();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kura-sammendrag-${groupData?.group.patientName?.replace(/\s+/g, "-") ?? "pasient"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Sammendrag lastet ned!");
  };

  return (
    <KuraLayout groupId={id}>
      <div className="container py-10 max-w-3xl">
        <div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground flex items-center gap-2">
              <Activity className="w-6 h-6 text-rose-600" /> Medisinsk tidslinje
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Kronologisk sykdomshistorie</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowSummary(!showSummary)}
              className="border-border/60 text-foreground bg-card">
              <FileDown className="w-4 h-4 mr-2" /> Legesammendrag
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all">
                  <Plus className="w-4 h-4 mr-2" /> Ny hendelse
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-serif">Legg til hendelse</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label>Type hendelse</Label>
                    <Select value={form.eventType} onValueChange={(v) => setForm(f => ({ ...f, eventType: v as typeof form.eventType }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(eventTypeConfig).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tittel *</Label>
                    <Input placeholder="f.eks. Diagnose: Type 2 diabetes" value={form.title}
                      onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Dato *</Label>
                    <Input type="date" value={form.eventDate}
                      onChange={(e) => setForm(f => ({ ...f, eventDate: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Behandler / Sykehus</Label>
                      <Input placeholder="f.eks. Dr. Andersen" value={form.provider}
                        onChange={(e) => setForm(f => ({ ...f, provider: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>ICD-kode</Label>
                      <Input placeholder="f.eks. E11" value={form.icdCode}
                        onChange={(e) => setForm(f => ({ ...f, icdCode: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Detaljer</Label>
                    <Textarea placeholder="Ytterligere informasjon…" value={form.body}
                      onChange={(e) => setForm(f => ({ ...f, body: e.target.value }))} rows={3} />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch id="keyEvent" checked={form.isKeyEvent}
                      onCheckedChange={(v) => setForm(f => ({ ...f, isKeyEvent: v }))} />
                    <Label htmlFor="keyEvent" className="cursor-pointer">
                      Nøkkelhendelse (vises i legesammendrag)
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={!form.title || !form.eventDate || createEvent.isPending} onClick={handleCreate}>
                    {createEvent.isPending ? "Lagrer…" : "Lagre"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Doctor summary panel */}
        {showSummary && (
          <div className="kura-card p-6 mb-8 border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-semibold text-foreground">Legesammendrag</h2>
              <Button size="sm" onClick={downloadSummary}
                className="bg-primary text-primary-foreground hover:bg-primary/90">
                <FileDown className="w-4 h-4 mr-2" /> Last ned
              </Button>
            </div>
            <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap bg-secondary/50 rounded-lg p-4 max-h-64 overflow-y-auto">
              {generateSummary()}
            </pre>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20 kura-card">
            <Activity className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-serif text-lg font-semibold text-foreground mb-1">Ingen hendelser ennå</p>
            <p className="text-muted-foreground text-sm">Legg til diagnoser, behandlinger og milepæler.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped)
              .sort(([a], [b]) => parseInt(b) - parseInt(a))
              .map(([year, yearEvents]) => (
                <div key={year}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-serif text-2xl font-bold text-primary">{year}</span>
                    <div className="flex-1 h-px bg-border/60" />
                  </div>
                  <div className="relative pl-6">
                    {/* Vertical line */}
                    <div className="absolute left-2 top-2 bottom-2 w-px bg-border/60" />
                    <div className="space-y-4">
                      {(yearEvents ?? []).map((e) => {
                        const cfg = eventTypeConfig[e.eventType];
                        const Icon = cfg?.icon ?? Activity;
                        return (
                          <div key={e.id} className="relative">
                            {/* Dot */}
                            <div className={cn(
                              "absolute -left-4 top-4 w-3 h-3 rounded-full border-2 border-background",
                              cfg?.dot ?? "bg-gray-400",
                              e.isKeyEvent && "w-4 h-4 -left-[18px] ring-2 ring-primary/30"
                            )} />
                            <div className={cn("kura-card p-4 hover:shadow-sm transition-shadow", e.isKeyEvent && "border-primary/30 bg-primary/5")}>
                              <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-lg ${cfg?.bg} flex items-center justify-center flex-shrink-0`}>
                                  <Icon className={`w-4 h-4 ${cfg?.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-foreground text-sm">{e.title}</span>
                                    {e.isKeyEvent && (
                                      <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                                    )}
                                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${cfg?.bg} ${cfg?.color}`}>
                                      {cfg?.label}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(e.eventDate).toLocaleDateString("nb-NO", { day: "numeric", month: "long" })}
                                    </span>
                                    {e.provider && <span className="text-xs text-muted-foreground">{e.provider}</span>}
                                    {e.icdCode && <span className="text-xs font-mono text-muted-foreground bg-secondary px-1.5 rounded">{e.icdCode}</span>}
                                  </div>
                                  {e.body && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{e.body}</p>}
                                </div>
                                <Button variant="ghost" size="icon"
                                  className="text-muted-foreground hover:text-destructive flex-shrink-0"
                                  onClick={() => deleteEvent.mutate({ id: e.id, careGroupId: groupId })}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </KuraLayout>
  );
}
