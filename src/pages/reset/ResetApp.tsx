import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useReset } from '@/contexts/ResetContext';
import { track } from '@/lib/analytics';
import { recordIntent } from '@/lib/resetBackend';
import { Button } from '@/components/ui/button';
import CaliMascot from '@/components/reset/CaliMascot';
import { ArrowRight, Check, Activity, LineChart, Sparkles, CalendarClock } from 'lucide-react';

const APP_WAITLIST_URL = 'https://caliness-academy.de/app';

const FEATURES = [
  {
    icon: Activity,
    title: 'Täglicher Check-in',
    text: 'Jeden Morgen ein kurzer Puls — die App liest deine Daten und führt deinen Reset weiter, statt ihn enden zu lassen.',
  },
  {
    icon: Sparkles,
    title: 'Dein KI-Longevity-Coach',
    text: 'CALI denkt mit. Kein starrer Content, sondern Antworten, die sich an deinen Tag, deine Werte und dein Ziel anpassen.',
  },
  {
    icon: LineChart,
    title: 'Auswertung & Plan',
    text: 'Dein Startprofil aus Tag 1 wird zum lebenden Dashboard. Fortschritt, Muster, nächster Schritt — jede Woche neu justiert.',
  },
];

export default function ResetApp() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const { name, goal, profile, email } = useReset();
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    track('app_path_viewed', { goal: goal ?? null });
  }, [goal]);

  const handleWaitlist = () => {
    track('app_cta_clicked', { goal: goal ?? null, source: 'app_page' });
    recordIntent(email, 'app_waitlist');
    window.open(APP_WAITLIST_URL, '_blank', 'noopener,noreferrer');
    setJoined(true);
  };

  const reveal = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] },
        };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-10">
      <div className="max-w-sm mx-auto w-full">
        <button
          onClick={() => navigate('/sprint-ready')}
          className="text-xs text-muted-foreground/60 mb-6 hover:text-muted-foreground transition-colors"
        >
          ← Zurück
        </button>

        {/* Hero */}
        <motion.div {...reveal(0)}>
          <p className="text-[11px] font-semibold tracking-[3px] uppercase text-primary mb-3">
            Selbstständig weiter
          </p>
          <h1 className="font-outfit text-3xl font-bold text-foreground leading-[1.1] tracking-tight mb-3 text-balance">
            Die CALINESS App führt<br />deinen Reset jeden Tag weiter.
          </h1>
          <p className="text-sm text-muted-foreground/80 leading-relaxed">
            {name ? `${name}, der ` : 'Der '}Reset hat dir gezeigt, was funktioniert. Die App sorgt dafür, dass es nicht bei diesen 7 Tagen bleibt — als dein täglicher Longevity-Coach in der Tasche.
          </p>
        </motion.div>

        {/* Profile carry-over — ties free value to the app */}
        {profile && (
          <motion.div {...reveal(1)} className="mt-6 p-4 rounded-2xl border border-primary/20 bg-primary/5">
            <p className="text-[10px] uppercase tracking-widest text-primary/70 font-semibold mb-1.5">Dein Reset wandert mit</p>
            <p className="text-sm text-foreground/85 leading-snug">
              Dein Startprofil <span className="tabular-nums font-medium text-foreground">{profile.calLow.toLocaleString('de-DE')}–{profile.calHigh.toLocaleString('de-DE')} kcal · {profile.proteinLow}–{profile.proteinHigh} g</span> ist dein Tag-0 in der App. Du fängst nicht bei null an.
            </p>
          </motion.div>
        )}

        {/* Features */}
        <div className="mt-6 space-y-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                {...reveal(i + 2)}
                className="flex gap-3.5 p-4 rounded-2xl border border-border/40 bg-card/60"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground mb-0.5">{f.title}</p>
                  <p className="text-xs text-muted-foreground/70 leading-relaxed">{f.text}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Waitlist status / CTA */}
        <motion.div {...reveal(5)} className="mt-8">
          {/* Launch-Block — CALI prominent, Dezember-Termin, Gründerpreis */}
          <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5 mb-5 text-center">
            <CaliMascot
              src="/images/cali/cali-waitlist.png"
              alt="CALI, das CALINESS-Maskottchen"
              className="w-[160px] sm:w-[200px] h-auto mx-auto mb-4"
              style={{ filter: 'drop-shadow(0 8px 24px hsl(0 0% 0% / 0.4))' }}
            />
            <h2 className="font-outfit text-xl font-bold text-foreground mb-2">
              CALI kommt im Dezember
            </h2>
            <p className="text-sm text-muted-foreground/80 leading-relaxed">
              CALINESS ist die App, die aus dem Reset einen Alltag macht. Start im Dezember.
              Wer auf der Liste steht, bekommt den Gründerpreis — und schon vorher Beta-Zugang.
            </p>
          </div>

          <div className="flex items-center gap-2 justify-center mb-4 text-xs text-muted-foreground/60">
            <CalendarClock className="w-3.5 h-3.5 text-primary/70" />
            <span>Start im Dezember · Beta-Zugang vorab · Gründerpreis</span>
          </div>

          {joined ? (
            <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 text-center animate-fade-in">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-2">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">Du bist beim Early Access dabei.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Wir melden uns, sobald die App für dich bereit ist — du gehörst zu den Ersten.</p>
            </div>
          ) : (
            <Button
              variant="premium"
              size="lg"
              className="w-full min-h-[52px] text-base gap-2"
              onClick={handleWaitlist}
            >
              Frühzugang sichern
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}

          <p className="text-xs text-muted-foreground/40 text-center mt-3">
            Kostenloser Early Access · keine Verpflichtung
          </p>
        </motion.div>

        {/* Soft cross-link to guided path */}
        <button
          onClick={() => { track('coaching_cta_clicked', { goal: goal ?? null, source: 'app_page' }); recordIntent(email, 'coaching_cta'); navigate('/next'); }}
          className="mt-8 w-full text-center text-sm text-muted-foreground/55 hover:text-muted-foreground/80 transition-colors"
        >
          Lieber persönlich begleitet? <span className="text-primary/80">Coaching ansehen →</span>
        </button>
      </div>
    </div>
  );
}
