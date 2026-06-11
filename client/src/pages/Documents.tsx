import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Download, FileText, Plus, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
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
import { Progress } from "@/components/ui/progress";

const categoryLabels: Record<string, string> = {
  prescription: "Resept",
  power_of_attorney: "Fullmakt",
  medical_report: "Medisinsk rapport",
  lab_result: "Laboratoriesvar",
  referral: "Henvisning",
  other: "Annet",
};
const categoryColors: Record<string, string> = {
  prescription: "text-blue-600 bg-blue-50",
  power_of_attorney: "text-purple-600 bg-purple-50",
  medical_report: "text-emerald-600 bg-emerald-50",
  lab_result: "text-amber-600 bg-amber-50",
  referral: "text-rose-600 bg-rose-50",
  other: "text-gray-600 bg-gray-50",
};

function formatBytes(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function Documents() {
  const { id } = useParams<{ id: string }>();
  const groupId = parseInt(id ?? "0");
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  type DocCategory = "prescription" | "power_of_attorney" | "medical_report" | "lab_result" | "referral" | "other";
  const [form, setForm] = useState({
    title: "",
    category: "other" as DocCategory,
    description: "",
    file: null as File | null,
  });

  const { data: docs, isLoading, refetch } = trpc.documents.list.useQuery(
    { careGroupId: groupId },
    { enabled: isAuthenticated && !!groupId }
  );

  const uploadDoc = trpc.documents.getUploadUrl.useMutation({
    onSuccess: () => { toast.success("Dokument lastet opp!"); setOpen(false); refetch(); resetForm(); setUploading(false); setProgress(0); },
    onError: (e) => { toast.error(e.message); setUploading(false); setProgress(0); },
  });

  const deleteDoc = trpc.documents.delete.useMutation({
    onSuccess: () => { toast.success("Dokument slettet."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setForm({ title: "", category: "other", description: "", file: null });
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!form.file || !form.title) return;
    setUploading(true);
    setProgress(30);
    const reader = new FileReader();
    reader.onload = (e) => {
      setProgress(60);
      const base64 = (e.target?.result as string).split(",")[1] ?? "";
      uploadDoc.mutate({
        careGroupId: groupId,
        title: form.title,
        category: form.category,
        description: form.description || undefined,
        fileName: form.file!.name,
        mimeType: form.file!.type,
        fileSize: form.file!.size,
        fileData: base64,
      });
      setProgress(90);
    };
    reader.readAsDataURL(form.file);
  };

  return (
    <KuraLayout groupId={id}>
      <div className="container py-10 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-6 h-6 text-purple-600" /> Dokumenter
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Resepter, fullmakter og medisinske rapporter</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all">
                <Upload className="w-4 h-4 mr-2" /> Last opp
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-serif">Last opp dokument</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Tittel *</Label>
                  <Input placeholder="f.eks. Resept Paracet 500mg" value={form.title}
                    onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Kategori</Label>
                  <Select value={form.category}   onValueChange={(v) => setForm(f => ({ ...f, category: v as DocCategory }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Beskrivelse</Label>
                  <Textarea placeholder="Valgfrie notater…" value={form.description}
                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label>Fil *</Label>
                  <div
                    className="border-2 border-dashed border-border/60 rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
                    onClick={() => fileRef.current?.click()}
                  >
                    {form.file ? (
                      <div>
                        <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
                        <p className="text-sm font-medium text-foreground">{form.file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatBytes(form.file.size)}</p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Klikk for å velge fil</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">PDF, bilder, Word-dokumenter</p>
                      </div>
                    )}
                    <input ref={fileRef} type="file" className="hidden"
                      onChange={(e) => setForm(f => ({ ...f, file: e.target.files?.[0] ?? null }))} />
                  </div>
                </div>
                {uploading && <Progress value={progress} className="h-1.5" />}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={!form.title || !form.file || uploading} onClick={handleUpload}>
                  {uploading ? "Laster opp…" : "Last opp"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : !docs || docs.length === 0 ? (
          <div className="text-center py-20 kura-card">
            <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-serif text-lg font-semibold text-foreground mb-1">Ingen dokumenter ennå</p>
            <p className="text-muted-foreground text-sm">Last opp resepter, fullmakter og rapporter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map((doc) => (
              <Card key={doc.id} className="kura-card hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${categoryColors[doc.category]}`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-sm">{doc.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[doc.category]}`}>
                          {categoryLabels[doc.category]}
                        </span>
                      </div>
                      {doc.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{doc.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">{doc.fileName}</span>
                        {doc.fileSize && <span className="text-xs text-muted-foreground">{formatBytes(doc.fileSize)}</span>}
                        <span className="text-xs text-muted-foreground">
                          {new Date(doc.createdAt).toLocaleDateString("nb-NO", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" asChild>
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => deleteDoc.mutate({ id: doc.id, careGroupId: groupId })}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
