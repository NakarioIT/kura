import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { ArrowRight, Heart, Plus, Users } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import KuraLayout from "@/components/KuraLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const roleLabels: Record<string, string> = {
  family_member: "Pårørende",
  patient: "Pasient",
  care_coordinator: "Koordinator",
};

const roleBadgeClass: Record<string, string> = {
  family_member: "kura-badge-role-family",
  patient: "kura-badge-role-patient",
  care_coordinator: "kura-badge-role-coordinator",
};

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
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
      setForm({ name: "", patientName: "", patientDob: "", patientNotes: "", myRole: "family_member" });
      refetch();
      navigate(`/group/${data.careGroupId}`);
    },
    onError: (err) => toast.error(err.message),
  });

  if (!loading && !isAuthenticated) {
    return (
      <KuraLayout>
        <div className="container py-24 text-center">
          <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-semibold mb-3">Logg inn for å bruke Kura</h2>
          <p className="text-muted-foreground mb-6">Du må logge inn for å se dine omsorgsgrupper.</p>
          <Button asChild>
            <a href={getLoginUrl()}>Logg inn</a>
          </Button>
        </div>
      </KuraLayout>
    );
  }

  return (
    <KuraLayout>
      <div className="container py-10 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">
              Hei, {user?.name?.split(" ")[0] ?? "der"} 👋
            </h1>
            <p className="text-muted-foreground mt-1">Dine omsorgsgrupper</p>
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
                <DialogDescription>
                  En omsorgsgruppe samler familien og helsepersonell rundt én person.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Gruppenavn</Label>
                  <Input
                    placeholder="f.eks. Familie Hansen"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Pasientens navn</Label>
                  <Input
                    placeholder="f.eks. Kari Hansen"
                    value={form.patientName}
                    onChange={(e) => setForm((f) => ({ ...f, patientName: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Fødselsdato (valgfri)</Label>
                  <Input
                    type="date"
                    value={form.patientDob}
                    onChange={(e) => setForm((f) => ({ ...f, patientDob: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Notater om pasienten (valgfri)</Label>
                  <Textarea
                    placeholder="Relevante diagnoser, allergier, etc."
                    value={form.patientNotes}
                    onChange={(e) => setForm((f) => ({ ...f, patientNotes: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Min rolle i gruppen</Label>
                  <Select
                    value={form.myRole}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, myRole: v as typeof form.myRole }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="family_member">Pårørende / Familiemedlem</SelectItem>
                      <SelectItem value="patient">Pasient</SelectItem>
                      <SelectItem value="care_coordinator">Omsorgskoordinator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Avbryt
                </Button>
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={!form.name || !form.patientName || createGroup.isPending}
                  onClick={() => createGroup.mutate(form)}
                >
                  {createGroup.isPending ? "Oppretter…" : "Opprett gruppe"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Groups grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        ) : groups && groups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {groups.map((g, i) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              >
                <Card
                  className="kura-card hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => navigate(`/group/${g.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Heart className="w-5 h-5 text-primary" />
                      </div>
                      <span className={roleBadgeClass[g.membership.careRole]}>
                        {roleLabels[g.membership.careRole]}
                      </span>
                    </div>
                    <CardTitle className="font-serif text-lg mt-3">{g.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      Pasient: {g.patientName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      {g.patientDob && (
                        <span className="text-xs text-muted-foreground">
                          Født: {new Date(g.patientDob).toLocaleDateString("nb-NO")}
                        </span>
                      )}
                      <span className="ml-auto flex items-center gap-1 text-xs text-primary font-medium group-hover:gap-2 transition-all">
                        Åpne <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 kura-card">
            <Heart className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
              Ingen omsorgsgrupper ennå
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Opprett din første gruppe for å begynne å koordinere omsorg med familien din.
            </p>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" /> Opprett omsorgsgruppe
            </Button>
          </div>
        )}
      </div>
    </KuraLayout>
  );
}
