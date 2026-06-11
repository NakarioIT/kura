import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Heart, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import KuraLayout from "@/components/KuraLayout";
import { Button } from "@/components/ui/button";

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptInvite = trpc.careGroups.acceptInvite.useMutation({
    onSuccess: (data) => {
      setAccepted(true);
      setTimeout(() => navigate(`/group/${data.careGroupId}`), 2000);
    },
    onError: (e) => setError(e.message),
  });

  useEffect(() => {
    if (!loading && isAuthenticated && token && !accepted && !error) {
      acceptInvite.mutate({ token });
    }
  }, [loading, isAuthenticated, token]);

  return (
    <KuraLayout>
      <div className="container py-24 max-w-md mx-auto text-center">
        <div className="kura-card p-10">
          {loading || acceptInvite.isPending ? (
            <>
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
              <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
                Behandler invitasjon…
              </h2>
              <p className="text-muted-foreground text-sm">Vennligst vent.</p>
            </>
          ) : !isAuthenticated ? (
            <>
              <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
                Du er invitert til Kura
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                Logg inn for å akseptere invitasjonen og bli med i omsorgsteamet.
              </p>
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 w-full">
                <a href={getLoginUrl()}>Logg inn for å akseptere</a>
              </Button>
            </>
          ) : accepted ? (
            <>
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
              <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
                Du er med i gruppen!
              </h2>
              <p className="text-muted-foreground text-sm">
                Du blir videresendt til gruppen om et øyeblikk…
              </p>
            </>
          ) : error ? (
            <>
              <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
                Invitasjon ugyldig
              </h2>
              <p className="text-muted-foreground text-sm mb-6">{error}</p>
              <Button onClick={() => navigate("/dashboard")}
                className="bg-primary text-primary-foreground hover:bg-primary/90">
                Gå til dashboard
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </KuraLayout>
  );
}
