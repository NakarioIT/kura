import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { CheckCircle2, Heart, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [groupId, setGroupId] = useState<number | null>(null);

  const acceptInvite = trpc.careGroups.acceptInvite.useMutation({
    onSuccess: (data) => {
      setGroupId(data.careGroupId);
      setStatus("success");
    },
    onError: (e) => {
      setErrorMsg(e.message);
      setStatus("error");
    },
  });

  useEffect(() => {
    if (!loading && isAuthenticated && token && status === "idle") {
      setStatus("loading");
      acceptInvite.mutate({ token });
    }
  }, [loading, isAuthenticated, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-foreground mb-3">Du er invitert til Kura</h1>
          <p className="text-muted-foreground mb-6">Logg inn for å akseptere invitasjonen og bli med i omsorgsteamet.</p>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 w-full">
            <a href={getLoginUrl()}>Logg inn for å fortsette</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-sm mx-auto px-4">
        {status === "loading" && (
          <><Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Aksepterer invitasjon…</p></>
        )}
        {status === "success" && (
          <><CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="font-serif text-xl font-bold text-foreground mb-2">Velkommen til teamet!</h2>
          <p className="text-muted-foreground mb-6">Du er nå med i omsorgsteamet.</p>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => navigate(groupId ? `/group/${groupId}` : "/dashboard")}
          >
            Gå til gruppen
          </Button></>
        )}
        {status === "error" && (
          <><XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="font-serif text-xl font-bold text-foreground mb-2">Noe gikk galt</h2>
          <p className="text-muted-foreground mb-6">{errorMsg}</p>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>Gå til dashboard</Button></>
        )}
      </div>
    </div>
  );
}
