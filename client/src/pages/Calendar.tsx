import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Clock, MapPin, Plus, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

const categoryConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  doctor: { label: "Lege", color: "text-blue-700", bg: "bg-blue-50", dot: "bg-blue-500" },
  home_care: { label: "Hjemmesykepleie", color: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  physiotherapy: { label: "Fysioterapi", color: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-500" },
  pharmacy: { label: "Apotek", color: "text-purple-700", bg: "bg-purple-50", dot: "bg-purple-500" },
  hospital: { label: "Sykehus", color: "text-rose-700", bg: "bg-rose-50", dot: "bg-rose-500" },
  other: { label: "Annet", color: "text-gray-600", bg: "bg-gray-50", dot: "bg-gray-400" },
};

export default function Calendar() {
  const { id } = useParams<{ id: string }>();
  const groupId = parseInt(id ?? "0");
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [form, setForm] = useState({
    title: "", category: "doctor" as "doctor" | "home_care" | "physiotherapy" | "pharmacy" | "hospital" | "other",
    description: "", location: "", startAt: "", endAt: "", allDay: false,
  });

  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);

  const { data: appointments, isLoading, refetch } = trpc.appointments.list.useQuery(
    { careGroupId: groupId, fromMs: monthStart.getTime(), toMs: monthEnd.getTime() },
    { enabled: isAuthenticated && !!groupId }
  );

  const createAppt = trpc.appointments.create.useMutation({
    onSuccess: () => { toast.success("Avtale opprettet!"); setOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteAppt = trpc.appointments.delete.useMutation({
    onSuccess: () => { toast.success("Avtale slettet."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!form.title || !form.startAt) return;
    createAppt.mutate({
      careGroupId: groupId, title: form.title, category: form.category,
      description: form.description || undefined, location: form.location || undefined,
      startAt: new Date(form.startAt).getTime(),
      endAt: form.endAt ? new Date(form.endAt).getTime() : undefined,
      allDay: form.allDay,
    });
  };

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const monthLabel = currentMonth.toLocaleString("nb-NO", { month: "long", year: "numeric" });

  const apptsByDay: Record<number, typeof appointments> = {};
  (appointments ?? []).forEach(a => {
    const day = new Date(a.startAt).getDate();
    if (!apptsByDay[day]) apptsByDay[day] = [];
    apptsByDay[day]!.push(a);
  });

  const daysInMonth = monthEnd.getDate();
  const firstDow = (monthStart.getDay() + 6) % 7; // Monday-first

  return (
    <KuraLayout groupId={id}>
      <div className="container py-10 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground flex items-center gap-2">
              <CalIcon className="w-6 h-6 text-blue-600" /> Kalender
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Koordiner avtaler for omsorgsteamet</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all">
                <Plus className="w-4 h-4 mr-2" /> Ny avtale
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle className="font-serif">Ny avtale</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Tittel *</Label>
                  <Input placeholder="f.eks. Legetime Dr. Hansen" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Kategori</Label>
                  <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v as typeof form.category }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Start *</Label>
                    <Input type="datetime-local" value={form.startAt} onChange={(e) => setForm(f => ({ ...f, startAt: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Slutt</Label>
                    <Input type="datetime-local" value={form.endAt} onChange={(e) => setForm(f => ({ ...f, endAt: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Sted</Label>
                  <Input placeholder="f.eks. Oslo legesenter" value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Beskrivelse</Label>
                  <Textarea placeholder="Ytterligere informasjon…" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={!form.title || !form.startAt || createAppt.isPending} onClick={handleCreate}>
                  {createAppt.isPending ? "Lagrer…" : "Lagre"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="kura-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-serif font-semibold text-foreground capitalize">{monthLabel}</span>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"].map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          {isLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDow }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayAppts = apptsByDay[day] ?? [];
                const isToday = new Date().getDate() === day &&
                  new Date().getMonth() === currentMonth.getMonth() &&
                  new Date().getFullYear() === currentMonth.getFullYear();
                return (
                  <div key={day} className={cn(
                    "min-h-[60px] p-1 rounded-lg border border-transparent hover:border-border/50 transition-colors",
                    isToday && "bg-primary/5 border-primary/20"
                  )}>
                    <span className={cn("text-xs font-medium block text-center mb-1",
                      isToday ? "text-primary font-bold" : "text-muted-foreground")}>{day}</span>
                    {dayAppts.map(a => {
                      const cfg = categoryConfig[a.category];
                      return (
                        <div key={a.id} className={cn("text-xs px-1 py-0.5 rounded mb-0.5 truncate cursor-default", cfg?.bg, cfg?.color)}
                          title={a.title}>{a.title}</div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="font-serif font-semibold text-foreground">
            {(appointments ?? []).length === 0 ? "Ingen avtaler denne måneden" : "Alle avtaler denne måneden"}
          </h2>
          {(appointments ?? []).map(a => {
            const cfg = categoryConfig[a.category];
            return (
              <Card key={a.id} className="kura-card hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("w-2 h-2 rounded-full mt-2 flex-shrink-0", cfg?.dot)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{cfg?.label}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(a.startAt).toLocaleString("nb-NO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {a.location && <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />{a.location}</span>}
                      </div>
                      {a.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive flex-shrink-0"
                      onClick={() => deleteAppt.mutate({ id: a.id, careGroupId: groupId })}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </KuraLayout>
  );
}
