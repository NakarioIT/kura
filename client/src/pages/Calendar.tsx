import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Calendar as CalIcon, MapPin, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useParams } from "wouter";
import KuraLayout from "@/components/KuraLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const categoryLabels: Record<string, string> = {
  doctor: "Lege",
  home_care: "Hjemmesykepleie",
  physiotherapy: "Fysioterapi",
  pharmacy: "Apotek",
  hospital: "Sykehus",
  other: "Annet",
};
const categoryColors: Record<string, string> = {
  doctor: "bg-blue-100 text-blue-700 border-blue-200",
  home_care: "bg-emerald-100 text-emerald-700 border-emerald-200",
  physiotherapy: "bg-purple-100 text-purple-700 border-purple-200",
  pharmacy: "bg-amber-100 text-amber-700 border-amber-200",
  hospital: "bg-rose-100 text-rose-700 border-rose-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function Calendar() {
  const { id } = useParams<{ id: string }>();
  const groupId = parseInt(id ?? "0");
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "doctor" as "doctor" | "home_care" | "physiotherapy" | "pharmacy" | "hospital" | "other",
    description: "",
    location: "",
    startAt: "",
    endAt: "",
    allDay: false,
  });

  const { data: appointments, isLoading, refetch } = trpc.appointments.list.useQuery(
    { careGroupId: groupId },
    { enabled: isAuthenticated && !!groupId }
  );

  const createAppt = trpc.appointments.create.useMutation({
    onSuccess: () => { toast.success("Avtale lagt til!"); setOpen(false); refetch(); resetForm(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteAppt = trpc.appointments.delete.useMutation({
    onSuccess: () => { toast.success("Avtale slettet."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () =>
    setForm({ title: "", category: "doctor", description: "", location: "", startAt: "", endAt: "", allDay: false });

  const handleCreate = () => {
    if (!form.title || !form.startAt) return;
    createAppt.mutate({
      careGroupId: groupId,
      title: form.title,
      category: form.category,
      description: form.description || undefined,
      location: form.location || undefined,
      startAt: new Date(form.startAt).getTime(),
      endAt: form.endAt ? new Date(form.endAt).getTime() : undefined,
      allDay: form.allDay,
    });
  };

  // Group appointments by month
  const grouped = (appointments ?? []).reduce<Record<string, typeof appointments>>((acc, a) => {
    const key = new Date(a.startAt).toLocaleDateString("nb-NO", { month: "long", year: "numeric" });
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(a);
    return acc;
  }, {});

  return (
    <KuraLayout groupId={id}>
      <div className="container py-10 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground flex items-center gap-2">
              <CalIcon className="w-6 h-6 text-blue-600" /> Kalender
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Alle avtaler for omsorgsteamet</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all">
                <Plus className="w-4 h-4 mr-2" /> Ny avtale
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-serif">Legg til avtale</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Tittel *</Label>
                  <Input placeholder="f.eks. Legetime hos Dr. Andersen" value={form.title}
                    onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Kategori</Label>
                  <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v as typeof form.category }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Start *</Label>
                    <Input type="datetime-local" value={form.startAt}
                      onChange={(e) => setForm(f => ({ ...f, startAt: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Slutt</Label>
                    <Input type="datetime-local" value={form.endAt}
                      onChange={(e) => setForm(f => ({ ...f, endAt: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Sted</Label>
                  <Input placeholder="f.eks. Legesenteret, Storgata 1" value={form.location}
                    onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Beskrivelse</Label>
                  <Textarea placeholder="Notater, forberedelser, etc." value={form.description}
                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={!form.title || !form.startAt || createAppt.isPending}
                  onClick={handleCreate}>
                  {createAppt.isPending ? "Lagrer…" : "Lagre avtale"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20 kura-card">
            <CalIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-serif text-lg font-semibold text-foreground mb-1">Ingen avtaler ennå</p>
            <p className="text-muted-foreground text-sm">Legg til den første avtalen for omsorgsteamet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([month, appts]) => (
              <div key={month}>
                <h2 className="font-serif text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 capitalize">
                  {month}
                </h2>
                <div className="space-y-3">
                  {(appts ?? []).map((a) => (
                    <Card key={a.id} className="kura-card hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="text-center min-w-[48px]">
                            <div className="text-2xl font-bold text-foreground leading-none">
                              {new Date(a.startAt).getDate()}
                            </div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {new Date(a.startAt).toLocaleDateString("nb-NO", { weekday: "short" })}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground text-sm">{a.title}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${categoryColors[a.category]}`}>
                                {categoryLabels[a.category]}
                              </span>
                            </div>
                            {a.location && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3" /> {a.location}
                              </div>
                            )}
                            {a.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</p>
                            )}
                            <div className="text-xs text-muted-foreground mt-1">
                              {a.allDay ? "Heldagsavtale" : new Date(a.startAt).toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}
                              {a.endAt && !a.allDay && ` – ${new Date(a.endAt).toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}`}
                            </div>
                          </div>
                          <Button
                            variant="ghost" size="icon"
                            className="text-muted-foreground hover:text-destructive flex-shrink-0"
                            onClick={() => deleteAppt.mutate({ id: a.id, careGroupId: groupId })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </KuraLayout>
  );
}
