import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useReset } from '@/contexts/ResetContext';
import type { Goal, Hurdle } from '@/contexts/ResetContext';
import { ArrowRight } from 'lucide-react';

const INSTAGRAM_DM_URL = 'https://ig.me/m/caliness_?text=SPRINT';

const PERSONALIZED_INSIGHT: Record<Goal, Record<Hurdle, string>> = {
  energy: {
    stress: 'Du hast gesehen, dass dir mehr Ruhe im Alltag sofort mehr Energie gibt.',
    time: 'Du hast gemerkt, dass wenige klare Ankerpunkte reichen, um deinen Tag zu stabilisieren.',
    nutrition: 'Du hast erlebt, wie stark dein Energielevel auf Mahlzeiten-Struktur reagiert.',
    consistency: 'Du hast bewiesen, dass du einen Rhythmus aufbauen kannst — jetzt braucht er einen Rahmen.',
    evening: 'Du hast gesehen, dass ein strukturierter Tag den Abend verändert — und damit deine Energie.',
  },
  fatloss: {
    stress: 'Du hast gesehen, dass Fettverlust mit einem ruhigeren System beginnt, nicht mit weniger Essen.',
    time: 'Du hast erlebt, dass einfache Struktur mehr bringt als aufwendige Pläne.',
    nutrition: 'Du hast gemerkt, wie dein Körper auf klare Mahlzeiten reagiert — weniger Heißhunger, mehr Kontrolle.',
    consistency: 'Du hast bewiesen, dass du dranbleiben kannst — jetzt fehlt der persönliche Plan dafür.',
    evening: 'Du hast erlebt, dass der Abend nicht an Disziplin scheitert, sondern an fehlender Tagesstruktur.',
  },
  structure: {
    stress: 'Du hast gesehen, dass weniger Reize sofort mehr Klarheit bringen.',
    time: 'Du hast erlebt, dass Struktur keine Stunde am Tag braucht — sondern die richtigen Ankerpunkte.',
    nutrition: 'Du hast gemerkt, dass feste Mahlzeiten deinen gesamten Tagesrhythmus verändern.',
    consistency: 'Du hast bewiesen, dass du 7 Tage Struktur halten kannst — jetzt baust du darauf auf.',
    evening: 'Du hast gesehen, dass ein strukturierter Tag den Abend trägt, nicht umgekehrt.',
  },
  sleep: {
    stress: 'Du hast erlebt, dass weniger Reize tagsüber direkt deinen Schlaf verbessern.',
    time: 'Du hast gesehen, dass eine feste Schlafenszeit wichtiger ist als mehr Zeit im Bett.',
    nutrition: 'Du hast gemerkt, wie stark Mahlzeiten-Timing deinen Schlaf beeinflusst.',
    consistency: 'Du hast bewiesen, dass dein Körper auf Rhythmus reagiert — jetzt braucht er Konstanz.',
    evening: 'Du hast erlebt, dass ein bewusster Abend den Schlaf verändert — nicht Willenskraft.',
  },
};

const BENEFITS = [
  { text: 'Persönlicher Fahrplan statt Rätselraten' },
  { text: 'Anpassung an deinen Alltag statt Standardplan' },
  { text: 'Direkte Begleitung statt wieder allein anfangen' },
];

export default function ResetNext() {
  const navigate = useNavigate();
  const { goal, hurdle, resetAll } = useReset();

  const insight = goal && hurdle ? PERSONALIZED_INSIGHT[goal]?.[hurdle] : null;

  const handleReset = () => {
    resetAll();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="max-w-sm mx-auto w-full text-center animate-fade-in">
        <img
          src="/images/caliness-logo-white.png"
          alt=""
          className="w-12 h-12 object-contain opacity-50 mx-auto mb-8"
        />

        <h1 className="font-outfit text-2xl font-bold text-foreground mb-4 leading-tight">
          Der Reset war der Einstieg.
          <br />
          <span className="text-primary">Der Sprint ist dein Plan.</span>
        </h1>

        {/* Personalized insight */}
        {insight && (
          <p className="text-sm text-foreground/80 leading-relaxed mb-4 italic">
            {insight}
          </p>
        )}

        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          Der CALINESS 14-Tage Sprint macht aus dieser Woche einen persönlichen Fahrplan — angepasst an deinen Alltag, deine Hürden und dein Ziel.
        </p>

        {/* Benefits */}
        <div className="space-y-3 mb-10 text-left">
          {BENEFITS.map((b, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card/60"
            >
              <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                <span className="text-primary text-xs font-bold">✓</span>
              </div>
              <span className="text-sm text-foreground/90">{b.text}</span>
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        <Button
          variant="premium"
          size="lg"
          className="w-full min-h-[52px] text-base gap-2"
          onClick={() => window.open(INSTAGRAM_DM_URL, '_blank')}
        >
          Persönlichen Sprint starten
          <ArrowRight className="w-4 h-4" />
        </Button>

        {/* Human touch */}
        <div className="flex items-center gap-3 mt-8 justify-center">
          <img
            src="/images/david-sarah.png"
            alt="David & Sarah"
            loading="lazy"
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover grayscale brightness-75"
          />
          <p className="text-xs text-muted-foreground/60 text-left leading-snug">
            David & Sarah — wir schauen uns<br />deine Situation persönlich an.
          </p>
        </div>

        {/* Secondary CTA */}
        <button
          onClick={() => window.open('https://www.instagram.com/caliness_/', '_blank')}
          className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors mt-5 block mx-auto"
        >
          So läuft der Sprint ab →
        </button>

        {/* Reset wiederholen — minimal */}
        <button
          onClick={handleReset}
          className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors mt-10 block mx-auto"
        >
          Reset wiederholen
        </button>
      </div>
    </div>
  );
}
