import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  Calendar,
  FileText,
  Heart,
  Shield,
  Users,
  ClipboardList,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import KuraLayout from "@/components/KuraLayout";

const features = [
  {
    icon: Calendar,
    title: "Delt kalender",
    description:
      "Koordiner avtaler hos lege, hjemmesykepleie, fysioterapeut og apotek — synlig for hele omsorgsteamet i sanntid.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: ClipboardList,
    title: "Medisinlogg",
    description:
      "Logg medisiner, symptomer, vitale tegn og generell velvære med tidsstempler. Aldri mer usikkerhet om hva som ble gitt.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: CheckCircle2,
    title: "Oppgavestyring",
    description:
      "Tildel og spor omsorgsoppgaver mellom familiemedlemmer og koordinatorer. Alle vet hvem som gjør hva.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: FileText,
    title: "Dokumentarkiv",
    description:
      "Last opp resepter, fullmakter og medisinske rapporter trygt. Alltid tilgjengelig for hele teamet.",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: Activity,
    title: "Medisinsk tidslinje",
    description:
      "En visuell, søkbar oversikt over pasientens sykdomshistorie — diagnoser, behandlinger og milepæler.",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    icon: Bell,
    title: "Smarte varsler",
    description:
      "Automatiske varsler til teamet ved nye avtaler, tildelte oppgaver og loggoppføringer fra andre.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
];

const roles = [
  {
    role: "Pårørende",
    badge: "kura-badge-role-family",
    description:
      "Koordiner med søsken og helsepersonell. Del ansvar, hold oversikt over avtaler og oppgaver, og få varsler om endringer.",
    points: ["Se og legg til avtaler", "Tildel oppgaver til søsken", "Last opp dokumenter", "Motta varsler"],
  },
  {
    role: "Pasient",
    badge: "kura-badge-role-patient",
    description:
      "Din medisinske historikk, samlet på ett sted. Del kun det du ønsker med ditt omsorgsteam.",
    points: ["Personlig medisinsk tidslinje", "Symptom- og medisinlogg", "Dokumentarkiv", "Full kontroll over deling"],
  },
  {
    role: "Koordinator",
    badge: "kura-badge-role-coordinator",
    description:
      "Profesjonell omsorgsstøtte med strukturert oversikt. Generer legevennlige oppsummeringer på sekunder.",
    points: ["Oversikt over alle grupper", "Generer legesammendrag", "Administrer teamtilgang", "Eksporter rapporter"],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" as const },
  }),
};

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, loading]);

  return (
    <KuraLayout>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-secondary/30 to-accent/20 pt-20 pb-28 md:pt-28 md:pb-36">
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-72 h-72 rounded-full bg-accent/20 blur-3xl" />
        </div>

        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 font-medium px-4 py-1.5">
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                Trygt. Strukturert. Delt.
              </Badge>
            </motion.div>

            <motion.h1
              className="font-serif text-4xl md:text-6xl font-bold text-foreground leading-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            >
              Koordinert omsorg{" "}
              <span className="text-primary italic">for dem du er glad i</span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18, ease: "easeOut" }}
            >
              Kura samler pårørende, pasienter og koordinatorer i ett trygt system. Del avtaler,
              medisinjournaler og oppgaver — alltid oppdatert, alltid tilgjengelig.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-3 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.26, ease: "easeOut" }}
            >
              <Button
                asChild
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all active:scale-[0.97] text-base px-8"
              >
                <a href={getLoginUrl()}>
                  Kom i gang gratis <ArrowRight className="ml-2 w-4 h-4" />
                </a>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-border/60 text-foreground hover:bg-muted/60 text-base px-8 bg-card"
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              >
                Se funksjoner
              </Button>
            </motion.div>
          </div>

          {/* Stats row */}
          <motion.div
            className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {[
              { value: "100%", label: "Kryptert" },
              { value: "3", label: "Roller" },
              { value: "∞", label: "Teammedlemmer" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-serif text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="kura-section bg-background">
        <div className="container">
          <div className="text-center mb-14">
            <p className="kura-label mb-3">Funksjoner</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              Alt du trenger, samlet på ett sted
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Fra daglig medisinlogg til legevennlige oppsummeringer — Kura dekker hele omsorgskjeden.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={fadeUp}
                  className="kura-card p-6 hover:shadow-md transition-shadow group"
                >
                  <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
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

      {/* ── Roles ────────────────────────────────────────────────────────── */}
      <section className="kura-section bg-secondary/30">
        <div className="container">
          <div className="text-center mb-14">
            <p className="kura-label mb-3">Roller</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              Laget for hele omsorgsteamet
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {roles.map((r, i) => (
              <motion.div
                key={r.role}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                className="kura-card p-7"
              >
                <span className={r.badge}>{r.role}</span>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed mb-5">{r.description}</p>
                <ul className="space-y-2">
                  {r.points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Doctor summary callout ────────────────────────────────────────── */}
      <section className="kura-section bg-background">
        <div className="container">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/5 via-secondary/20 to-accent/10 rounded-2xl border border-primary/10 p-10 md:p-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Activity className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-4">
              Legesammendrag på 30 sekunder
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
              Kura genererer strukturerte, utskriftsvennlige helseoppsummeringer optimalisert for rask lesing.
              Gi legen full oversikt uten å måtte gjenfortelle historien på nytt.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md active:scale-[0.97] transition-all"
            >
              <a href={getLoginUrl()}>
                Start gratis <ArrowRight className="ml-2 w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Privacy callout ──────────────────────────────────────────────── */}
      <section className="py-12 bg-primary">
        <div className="container text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-primary-foreground/80" />
            <span className="kura-label text-primary-foreground/70">Personvern</span>
          </div>
          <h3 className="font-serif text-2xl font-semibold text-primary-foreground mb-3">
            Dine data tilhører deg
          </h3>
          <p className="text-primary-foreground/75 max-w-lg mx-auto text-sm leading-relaxed">
            All informasjon lagres kryptert og deles kun med de du inviterer til ditt omsorgsteam.
            Ingen tredjeparter, ingen reklame.
          </p>
        </div>
      </section>
    </KuraLayout>
  );
}
