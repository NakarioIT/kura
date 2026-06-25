import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { ArrowRight, Bell, Calendar, FileText, Heart, Shield, Users, ClipboardList, Activity, CheckCircle2 } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import KuraLayout from "@/components/KuraLayout";

const features = [
  { icon: Calendar, title: "Delt kalender", description: "Koordiner avtaler hos lege, hjemmesykepleie, fysioterapeut og apotek.", color: "text-blue-600", bg: "bg-blue-50" },
  { icon: ClipboardList, title: "Medisinlogg", description: "Logg medisiner, symptomer, vitale tegn og generell velvære med tidsstempler.", color: "text-emerald-600", bg: "bg-emerald-50" },
  { icon: CheckCircle2, title: "Oppgavestyring", description: "Tildel og spor omsorgsoppgaver mellom familiemedlemmer og koordinatorer.", color: "text-amber-600", bg: "bg-amber-50" },
  { icon: FileText, title: "Dokumentarkiv", description: "Last opp resepter, fullmakter og medisinske rapporter trygt.", color: "text-purple-600", bg: "bg-purple-50" },
  { icon: Activity, title: "Medisinsk tidslinje", description: "En visuell, søkbar oversikt over pasientens sykdomshistorie.", color: "text-rose-600", bg: "bg-rose-50" },
  { icon: Bell, title: "Smarte varsler", description: "Automatiske varsler til teamet ved nye avtaler og loggoppføringer.", color: "text-indigo-600", bg: "bg-indigo-50" },
];

const roles = [
  { role: "Pårørende", badge: "kura-badge-role-family", description: "Koordiner med søsken og helsepersonell.", points: ["Se og legg til avtaler", "Tildel oppgaver til søsken", "Last opp dokumenter", "Motta varsler"] },
  { role: "Pasient", badge: "kura-badge-role-patient", description: "Din medisinske historikk, samlet på ett sted.", points: ["Personlig medisinsk tidslinje", "Symptom- og medisinlogg", "Dokumentarkiv", "Full kontroll over deling"] },
  { role: "Koordinator", badge: "kura-badge-role-coordinator", description: "Profesjonell omsorgssøtte med strukturert oversikt.", points: ["Oversikt over alle grupper", "Generer legesammendrag", "Administrer teamtilgang", "Eksporter rapporter"] },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" as const } }),
};

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, loading]);

  return (
    <KuraLayout>
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-secondary/30 to-accent/20 pt-20 pb-28 md:pt-28 md:pb-36">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-72 h-72 rounded-full bg-accent/20 blur-3xl" />
        </div>
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
              <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 font-medium px-4 py-1.5">
                <Shield className="w-3.5 h-3.5 mr-1.5" /> Trygt. Strukturert. Delt.
              </Badge>
            </motion.div>
            <motion.h1 className="font-serif text-4xl md:text-6xl font-bold text-foreground leading-tight mb-6"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              Koordinert omsorg{" "}<span className="text-primary italic">for dem du er glad i</span>
            </motion.h1>
            <motion.p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18 }}>
              Kura samler pårørende, pasienter og koordinatorer i ett trygt system.
            </motion.p>
            <motion.div className="flex flex-col sm:flex-row gap-3 justify-center"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.26 }}>
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg text-base px-8">
                <a href={getLoginUrl()}>Kom i gang gratis <ArrowRight className="ml-2 w-4 h-4" /></a>
              </Button>
              <Button variant="outline" size="lg" className="border-border/60 text-foreground hover:bg-muted/60 text-base px-8 bg-card"
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
                Se funksjoner
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="features" className="kura-section bg-background">
        <div className="container">
          <div className="text-center mb-14">
            <p className="kura-label mb-3">Funksjoner</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">Alt du trenger, samlet på ett sted</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp}
                  className="kura-card p-6 hover:shadow-md transition-shadow group">
                  <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="kura-section bg-secondary/30">
        <div className="container">
          <div className="text-center mb-14">
            <p className="kura-label mb-3">Roller</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">Laget for hele omsorgsteamet</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {roles.map((r, i) => (
              <motion.div key={r.role} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp}
                className="kura-card p-7">
                <span className={r.badge}>{r.role}</span>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed mb-5">{r.description}</p>
                <ul className="space-y-2">
                  {r.points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />{p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-primary">
        <div className="container text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-primary-foreground/80" />
            <span className="kura-label text-primary-foreground/70">Personvern</span>
          </div>
          <h3 className="font-serif text-2xl font-semibold text-primary-foreground mb-3">Dine data tilhører deg</h3>
          <p className="text-primary-foreground/75 max-w-lg mx-auto text-sm leading-relaxed">
            All informasjon lagres kryptert og deles kun med de du inviterer til ditt omsorgsteam.
          </p>
        </div>
      </section>
    </KuraLayout>
  );
}
