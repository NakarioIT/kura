import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ExternalLink, FileText, Plus, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
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

const categoryConfig: Record<string, { label: string; color: string; bg: string }> = {
  prescription: { label: "Resept", color: "text-blue-600", bg: "bg-blue-50" },
  power_of_attorney: { label: "Fullmakt", color: "text-purple-600", bg: "bg-purple-50" },
  medical_report: { label: "Medisinsk rapport", color: "text-emerald-600", bg: "bg-emerald-50" },
  lab_result: { label: "Lab-resultat", color: "text-amber-600", bg: "bg-amber-50" },
  referral: { label: "Henvisning", color: "text-indigo-600", bg: "bg-indigo-50" },
  other: { label: "Annet", color: "text-gray-600", bg: "bg-gray-50" },
};

export default function Documents() {
  const { id } = useParams<{ id: string }>();
  const groupId = parseInt(id ?? "0");
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "", category: "other" as "prescription" | "power_of_attorney" | "medical_report" | "lab_result" | "referral" | "other", description: "",
  });

  const { data: documents, isLoading, refetch } = trpc.documents.list.useQuery(
    { careGroupId: groupId }, { enabled: isAuthenticated && !!groupId }
  );

  const uploadDoc = trpc.documents.getUploadUrl.useMutation({
    onSuccess: () => { toast.success("Dokument lastet opp!"); setOpen(false); refetch(); setSelectedFile(null); setForm({ title: "", category: "other", description: "" }); },
    onError: (e) => toast.error(e.message),
  });

  const deleteDoc = trpc.documents.delete.useMutation({
    onSuccess: () => { toast.success("Dokument slettet."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleUpload = async () => {
    if (!selectedFile || !form.title) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadDoc.mutate({
        careGroupId: groupId, title: form.title, category: form.category,
        description: form.description || undefined, fileName: selectedFile.name,
        mimeType: selectedFile.type, fileSize: selectedFile.size, fileData: base64 ?? "",
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  return (
    <KuraLayout groupId={id}>
      <div className="container py-10 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-6 h-6 text-purple-600" /> Dokumenter
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Sikker lagring av medisinske dokumenter</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all">
                <Plus className="w-4 h-4 mr-2" /> Last opp
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle className="font-serif">Last opp dokument</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div
                  className="border-2 border-dashed border-border/60 rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  {selectedFile ? (
                    <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Klikk for å velge fil</p>
                  )}
                  <input ref={fileRef} type="file" className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tittel *</Label>
                  <Input placeholder="f.eks. Resept Paracet" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
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
                <div className="space-y-1.5">
                  <Label>Beskrivelse</Label>
                  <Textarea placeholder="Valgfri beskrivelse…" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={!selectedFile || !form.title || uploadDoc.isPending} onClick={handleUpload}>
                  {uploadDoc.isPending ? "Laster opp…" : "Last opp"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        ) : !documents || documents.length === 0 ? (
          <div className="text-center py-20 kura-card">
            <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-serif text-lg font-semibold text-foreground mb-1">Ingen dokumenter ennå</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => {
              const cfg = categoryConfig[doc.category];
              return (
                <Card key={doc.id} className="kura-card hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl ${cfg?.bg} flex items-center justify-center flex-shrink-0`}>
                        <FileText className={`w-5 h-5 ${cfg?.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">{cfg?.label}</p>
                        {doc.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{doc.description}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(doc.createdAt).toLocaleDateString("nb-NO", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"
                          onClick={() => window.open(doc.fileUrl, "_blank")}>
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"
                          onClick={() => deleteDoc.mutate({ id: doc.id, careGroupId: groupId })}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
