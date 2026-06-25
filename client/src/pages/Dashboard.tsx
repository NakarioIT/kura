import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Heart, Plus, Users } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
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

const roleLabels: Record<string, string> = {
  family_member: "Pårørende",
  patient: "Pasient",
  care_coordinator: "Koordinator",
};

export default function Dashboard() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    patientName: "",
    patientDob: "",
    patientNotes: "",
    myRole: "family_member" as "family_member" | "patient" | "care_coordinator",
  });

  const { data: groups, isLoading, refetch } = trpc.careGroups.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createGroup = trpc.careGroups.create.useMutation({
    onSuccess: (data) => {
      toast.success("Omsorgsgruppe opprettet!");
      setOpen(false);
      refetch();
      navigate(`/group/${data.careGroupId}`);
    },
    onError: (e) => toast.error(e.message),
  });

  if (loading) return (
    <KuraLayout>
      <div className="container py-10"><Skeleton className="h-40 rounded-xl" /></div>
    </KuraLayout>
  );

  if (!isAuthenticated) return (
    <KuraLayout>
      <div className="container py-20 text-center">
        <h2 className="font-serif text-2xl font-bold mb-4">Logg inn for å fortsette</h2>
        <Button asChild className="bg-primary text-primary-foreground">
          <a href={getLoginUrl()}>Logg inn</a>
        </Button>
      </div>
    </KuraLayout>
  );

  return (
    <KuraLayout>
      <div className="container py-10 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Mine omsorgsgrupper</h1>
            <p className="text-muted-foreground text-sm mt-1">Administrer omsorg for dine nærmeste</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all">
                <Plus className="w-4 h-4 mr-2" /> Ny gruppe
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-serif">Opprett omsorgsgruppe</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Gruppenavn *</Label>
                  <Input placeholder="f.eks. Familie Hansen" value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Pasientens navn *</Label>
                  <Input placeholder="f.eks. Kari Hansen" value={form.patientName}
                    onChange={(e) => setForm(f => ({ ...f, patientName: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Fødselsdato (valgfritt)</Label>
                  <Input type="date" value={form.patientDob}
                    onChange={(e) => setForm(f => ({ ...f, patientDob: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Notater (valgfritt)</Label>
                  <Textarea placeholder="Bakgrunn, diagnoser, viktig info…" value={form.patientNotes}
                    onChange={(e) => setForm(f => ({ ...f, patientNotes: e.target.value }))} rows={3} />
                </div>
                <div className="space-y-1.5">
                  <Label>Min rolle</Label>
                  <Select value={form.myRole} onValueChange={(v) => setForm(f => ({ ...f, myRole: v as typeof form.myRole }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="family_member">Pårørende / Familiemedlem</SelectItem>
                      <SelectItem value="patient">Pasient</SelectItem>
                      <SelectItem value="care_coordinator">Omsorgskoordinator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={!form.name || !form.patientName || createGroup.isPending}
                  onClick={() => createGroup.mutate(form)}
                >
                  {createGroup.isPending ? "Oppretter…" : "Opprett"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : !groups || groups.length === 0 ? (
          <div className="text-center py-20 kura-card">
            <Heart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-serif text-lg font-semibold text-foreground mb-1">Ingen grupper ennå</p>
            <p className="text-muted-foreground text-sm mb-6">Opprett din første omsorgsgruppe for å komme i gang.</p>
            <Button className="bg-primary text-primary-foreground" onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Opprett gruppe
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {groups.map((g) => (
              <Card
                key={g.id}
                className="kura-card cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
                onClick={() => navigate(`/group/${g.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Heart className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif font-semibold text-foreground">{g.name}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">Pasient: {g.patientName}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {roleLabels[g.membership.careRole] ?? g.membership.careRole}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </KuraLayout>
  );
}
