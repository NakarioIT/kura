import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Copy, Mail, Plus, Shield, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { useParams } from "wouter";
import KuraLayout from "@/components/KuraLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

export default function Team() {
  const { id } = useParams<{ id: string }>();
  const groupId = parseInt(id ?? "0");
  const { isAuthenticated, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ token: string } | null>(null);
  const [form, setForm] = useState({ email: "", careRole: "family_member" as "family_member" | "patient" | "care_coordinator" });

  const { data: members, isLoading, refetch } = trpc.careGroups.members.useQuery(
    { careGroupId: groupId }, { enabled: isAuthenticated && !!groupId }
  );

  const invite = trpc.careGroups.invite.useMutation({
    onSuccess: (data) => { setInviteResult(data); toast.success("Invitasjon opprettet!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const removeMember = trpc.careGroups.removeMember.useMutation({
    onSuccess: () => { toast.success("Medlem fjernet."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const inviteLink = inviteResult ? `${window.location.origin}/invite/${inviteResult.token}` : null;

  return (
    <KuraLayout groupId={id}>
      <div className="container py-10 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-600" /> Omsorgsteam
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Administrer teammedlemmer og tilganger</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setInviteResult(null); setForm({ email: "", careRole: "family_member" }); } }}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all">
                <Plus className="w-4 h-4 mr-2" /> Inviter
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle className="font-serif">Inviter teammedlem</DialogTitle></DialogHeader>
              {!inviteResult ? (
                <>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label>E-postadresse</Label>
                      <Input type="email" placeholder="navn@eksempel.no" value={form.email}
                        onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Rolle</Label>
                      <Select value={form.careRole} onValueChange={(v) => setForm(f => ({ ...f, careRole: v as typeof form.careRole }))}>
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
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={!form.email || invite.isPending}
                      onClick={() => invite.mutate({ careGroupId: groupId, email: form.email, careRole: form.careRole })}>
                      {invite.isPending ? "Sender…" : "Send invitasjon"}
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <div className="py-4 space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <p className="text-sm font-medium text-emerald-800 mb-1">Invitasjon opprettet!</p>
                    <p className="text-xs text-emerald-700">Del denne lenken. Gyldig i 7 dager.</p>
                  </div>
                  <div className="flex gap-2">
                    <Input value={inviteLink ?? ""} readOnly className="text-xs font-mono" />
                    <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(inviteLink ?? ""); toast.success("Lenke kopiert!"); }}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <DialogFooter>
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => { setOpen(false); setInviteResult(null); }}>Ferdig</Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : !members || members.length === 0 ? (
          <div className="text-center py-20 kura-card">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-serif text-lg font-semibold text-foreground mb-1">Ingen teammedlemmer ennå</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((m) => {
              const name = m.user?.name ?? m.displayName ?? `Bruker #${m.userId}`;
              const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
              const isCurrentUser = m.userId === user?.id;
              return (
                <Card key={m.id} className="kura-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground text-sm">{name}</span>
                          {isCurrentUser && <span className="text-xs text-muted-foreground">(deg)</span>}
                          <span className={roleBadgeClass[m.careRole]}>{roleLabels[m.careRole]}</span>
                        </div>
                        {m.user?.email && (
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                            <Mail className="w-3 h-3" /> {m.user.email}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          {m.canEdit && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Shield className="w-3 h-3" /> Kan redigere</span>}
                          {m.canInvite && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Plus className="w-3 h-3" /> Kan invitere</span>}
                        </div>
                      </div>
                      {!isCurrentUser && (
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive flex-shrink-0"
                          onClick={() => removeMember.mutate({ careGroupId: groupId, memberId: m.id })}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
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
