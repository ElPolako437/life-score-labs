import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useReset } from '@/contexts/ResetContext';
import type { Goal, Hurdle } from '@/contexts/ResetContext';
import { ArrowRight, ChevronDown, Share2, Check } from 'lucide-react';
import { useState } from 'react';
import { track } from '@/lib/analytics';

const INSTAGRAM_DM_URL = 'https://ig.me/m/caliness_?text=SPRINT';

const GOAL_CTA: Record<Goal, string> = {
  energy: 'Meine Energie zurückholen',
  fatloss: 'Meinen Fettabbau-Plan anfragen',
  structure: 'Meine Struktur aufbauen',
  sleep: 'Meinen Schlaf-Sprint anfragen',
};

const GOAL_LABEL: Record<Goal, string> = {
  energy: 'mehr Energie',
  fatloss: 'Fettverlust',
  structure: 'mehr Struktur',
  sleep: 'besseren Schlaf',
};

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

const WEAKEST_TEXT: Record<string, string> = {
  energy: 'Dein Reset zeigt: Die Struktur steht — aber deine Energie ist noch instabil. Das liegt selten an Schlaf oder Ernährung allein. Es braucht eine individuelle Einordnung.',
  sleep: 'Rhythmus aufzubauen war ein guter Start — aber Schlafqualität hängt von mehr ab als einer festen Uhrzeit. Im Sprint schauen wir uns an, was genau bei dir die Regeneration blockiert.',
  calm: 'Wenn die Ruhe noch fehlt, obwohl du alles richtig machst — dann liegt es meist an Mustern, die tiefer sitzen als Routinen.',
  eating: 'Essen ist oft der letzte Bereich, der sich stabilisiert — weil er am stärksten von Stress, Schlaf und Emotionen beeinflusst wird.',
  body: 'Wenn sich dein Körper trotz guter Routinen nicht anders anfühlt, fehlt oft die individuelle Feinjustierung.',
  all_good: 'Dein Fundament ist stabil. Die Frage ist jetzt: Willst du darauf aufbauen oder zurück in alte Muster fallen?',
};

const DIMENSION_LABELS: Record<string, string> = {
  energy: 'Energie',
  sleep: 'Schlafqualität',
  calm: 'Innere Ruhe',
  eating: 'Essverhalten',
  body: 'Körpergefühl',
};

const BENEFITS = [
  'In 14 Tagen weißt du genau, was dein Körper braucht',
  'Persönliche Begleitung — keine App, ein Mensch',
  'Aufgebaut auf deinen 7 Tagen, nicht bei null',
];

const FAQ = [
  {
    q: 'Was kostet der Sprint?',
    a: 'Der Sprint startet ab 149€ — einmalig, kein Abo. Dafür bekommst du einen ganzheitlichen, individuellen Plan und 2 Wochen persönliche Begleitung durch David oder Sarah.',
  },
  {
    q: 'Wie viel Zeit brauche ich täglich?',
    a: '20–30 Minuten. Kein Gym, keine langen Sessions — strukturierter Alltag reicht.',
  },
  {
    q: 'Was passiert nach meiner Nachricht?',
    a: 'Du erhältst innerhalb von 24h eine persönliche Antwort von David oder Sarah.',
  },
];

export default function ResetNext() {
  const navigate = useNavigate();
  const { goal, hurdle, reflection, resetAll, name } = useReset();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [shared, setShared] = useState(false);

  const whatsappText = goal
    ? `Hallo, ich habe den CALINESS 7-Tage Reset abgeschlossen. Mein Ziel ist ${GOAL_LABEL[goal]}. Ich bin interessiert am Sprint.`
    : 'Hallo, ich habe den CALINESS 7-Tage Reset abgeschlossen und möchte mehr über den Sprint erfahren.';
  const whatsappUrl = `https://wa.me/4917685912445?text=${encodeURIComponent(whatsappText)}`;
  const instagramUrl = goal
    ? `https://ig.me/m/caliness_?text=${encodeURIComponent(`SPRINT ${GOAL_LABEL[goal]}`)}`
    : INSTAGRAM_DM_URL;

  const ctaLabel = goal ? GOAL_CTA[goal] : 'Jetzt Sprint anfragen';

  const handleCta = (channel: 'instagram' | 'whatsapp') => {
    track('sprint_cta_clicked', { channel, goal: goal ?? null });
    window.open(channel === 'instagram' ? instagramUrl : whatsappUrl, '_blank');
  };

  const handleShare = async () => {
    const lines = reflection ? [
      '🎯 Mein CALINESS 7-Tage Reset Ergebnis:',
      '',
      `Energie: ${reflection.energy}/5`,
      `Schlafqualität: ${reflection.sleep}/5`,
      `Innere Ruhe: ${reflection.calm}/5`,
      `Essverhalten: ${reflection.eating}/5`,
      `Körpergefühl: ${reflection.body}/5`,
      '',
      '7 Tage · täglich ~10 Minuten',
      'caliness.de',
    ].join('\n') : '7-Tage Reset von CALINESS — caliness.de';

    try {
      if (navigator.share) {
        await navigator.share({ text: lines });
      } else {
        await navigator.clipboard.writeText(lines);
      }
      track('result_shared');
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch {}
  };

  const insight = goal && hurdle ? PERSONALIZED_INSIGHT[goal]?.[hurdle] : null;

  const weakestKey = (() => {
    if (!reflection) return null;
    const dims = [
      { key: 'energy', val: reflection.energy },
      { key: 'sleep', val: reflection.sleep },
      { key: 'calm', val: reflection.calm },
      { key: 'eating', val: reflection.eating },
      { key: 'body', val: reflection.body },
    ];
    const allGood = dims.every(d => d.val >= 3);
    if (allGood) return 'all_good';
    return dims.reduce((a, b) => (a.val <= b.val ? a : b)).key;
  })();

  const weakestText = weakestKey ? WEAKEST_TEXT[weakestKey] : null;

  const handleReset = () => {
    resetAll();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-10">
      <div className="max-w-sm mx-auto w-full animate-fade-in">
        <img
          src="/images/caliness-logo-white.png"
          alt=""
          className="w-10 h-10 object-contain opacity-40 mx-auto mb-8"
        />

        {/* Reflection result summary */}
        {reflection && (
          <div className="mb-8 p-4 rounded-xl border border-border/40 bg-card/60">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Dein Reset-Ergebnis</p>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-primary transition-colors"
              >
                {shared ? <Check className="w-3.5 h-3.5 text-primary" /> : <Share2 className="w-3.5 h-3.5" />}
                {shared ? 'Kopiert!' : 'Teilen'}
              </button>
            </div>
            <div className="space-y-2.5">
              {(['energy', 'sleep', 'calm', 'eating', 'body'] as const).map(key => {
                const val = reflection[key as keyof typeof reflection] as number;
                const isStrong = val >= 4;
                const isWeak = val <= 2;
                return (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xs ${isStrong ? 'text-primary font-semibold' : isWeak ? 'text-foreground/50' : 'text-muted-foreground'}`}>
                        {DIMENSION_LABELS[key]}
                      </span>
                      <span className={`text-xs font-bold ${isStrong ? 'text-primary' : isWeak ? 'text-foreground/40' : 'text-muted-foreground'}`}>
                        {val}/5
                      </span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isStrong ? 'bg-primary' : isWeak ? 'bg-foreground/20' : 'bg-foreground/40'}`}
                        style={{ width: `${(val / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <h1 className="font-outfit text-2xl font-bold text-foreground mb-4 leading-tight">
          {name ? `${name}, der Reset war der Einstieg.` : 'Der Reset war der Einstieg.'}
          <br />
          <span className="text-primary">Der Sprint ist dein Plan.</span>
        </h1>

        {/* Weakest-area personalized text */}
        {weakestText && (
          <p className="text-sm text-foreground/80 leading-relaxed mb-4">
            {weakestText}
          </p>
        )}

        {/* Personalized insight */}
        {insight && (
          <p className="text-sm text-muted-foreground/70 leading-relaxed mb-6 italic">
            {insight}
          </p>
        )}

        <p className="text-sm text-muted-foreground leading-relaxed mb-2 font-medium">
          Du hast jetzt Klarheit. Was dir fehlt, ist ein Plan.
        </p>

        {/* Sprint Preview — taste of the premium */}
        <div className="mb-8 mt-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">So sieht der Sprint aus</p>
          <div className="space-y-2">
            {[
              { step: '01', text: 'Wir analysieren dein Reset-Ergebnis gemeinsam — deine Stärken, deine Schwachstelle, dein Körpertyp.' },
              { step: '02', text: 'Du bekommst deinen persönlichen 14-Tage Plan — aufgebaut auf diesen 7 Tagen, nicht bei null.' },
              { step: '03', text: 'Tägliche Check-ins mit direktem Feedback von David oder Sarah. Keine App — ein Mensch.' },
              { step: '04', text: 'Am Ende weißt du genau was dein Körper braucht. Nicht "iss besser" — sondern was konkret für dich funktioniert.' },
            ].map(item => (
              <div key={item.step} className="flex gap-3 items-start p-3 rounded-xl bg-card/40 border border-border/30">
                <span className="text-xs font-bold text-primary/60 mt-0.5 shrink-0">{item.step}</span>
                <p className="text-sm text-muted-foreground/80 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-3 mb-8 mt-4">
          {BENEFITS.map((b, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card/60"
            >
              <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                <span className="text-primary text-xs font-bold">✓</span>
              </div>
              <span className="text-sm text-foreground/90">{b}</span>
            </div>
          ))}
        </div>

        {/* Testimonials — BEFORE CTA to overcome objections */}
        <div className="space-y-3 mb-5">
          <div className="p-4 rounded-xl border border-border/30 bg-card/50">
            <p className="text-sm text-muted-foreground/80 italic leading-relaxed mb-3">
              „Ich habe 3 Jahre lang probiert abzunehmen. Beim Sprint habe ich endlich verstanden warum es nie geklappt hat. In 14 Tagen 3,2 kg runter — ohne Hunger."
            </p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-primary">LM</span>
              </div>
              <p className="text-xs text-muted-foreground/50">Laura M., 31 — München</p>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-border/30 bg-card/50">
            <p className="text-sm text-muted-foreground/80 italic leading-relaxed mb-3">
              „Der Reset hat gezeigt, dass mein Energieproblem nichts mit Schlaf zu tun hat. Der Sprint hat das konkret behoben. Ich bin morgens zum ersten Mal seit Jahren wirklich wach."
            </p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-primary">MT</span>
              </div>
              <p className="text-xs text-muted-foreground/50">Markus T., 38 — Hamburg</p>
            </div>
          </div>
        </div>

        {/* Human touch — BEFORE CTA */}
        <div className="flex items-center gap-3 justify-center mb-4">
          <div className="flex -space-x-3">
            <img
              src="/images/david.jpg"
              alt="David"
              loading="lazy"
              width={44}
              height={44}
              className="w-11 h-11 rounded-full object-cover grayscale brightness-75 ring-2 ring-background"
            />
            <img
              src="/images/sarah.jpg"
              alt="Sarah"
              loading="lazy"
              width={44}
              height={44}
              className="w-11 h-11 rounded-full object-cover grayscale brightness-75 ring-2 ring-background"
            />
          </div>
          <p className="text-xs text-muted-foreground/60 text-left leading-snug">
            David & Sarah — wir schauen uns<br />
            deine Situation persönlich an.
          </p>
        </div>

        {/* Quantified scarcity */}
        <p className="text-xs text-muted-foreground/50 text-center mb-3">
          David & Sarah nehmen maximal 10 neue Sprint-Teilnehmer pro Monat auf.
        </p>

        {/* Cost of inaction */}
        <div className="p-3 rounded-xl border border-border/20 bg-card/40 mb-5">
          <p className="text-xs text-muted-foreground/60 text-center leading-relaxed">
            78% der Reset-Teilnehmer ohne Anschlussplan fallen innerhalb von 21 Tagen in alte Muster zurück. Du hast 7 Tage investiert — der Sprint sichert diesen Fortschritt.
          </p>
        </div>

        {/* Primary CTA — goal-specific label */}
        <Button
          variant="premium"
          size="lg"
          className="w-full min-h-[52px] text-base gap-2 mb-3"
          onClick={() => handleCta('instagram')}
        >
          {ctaLabel}
          <ArrowRight className="w-4 h-4" />
        </Button>

        {/* Secondary CTA — WhatsApp personalized */}
        <button
          onClick={() => window.open(whatsappUrl, '_blank')}
          className="w-full min-h-[48px] rounded-xl border border-border/40 bg-card/60 flex items-center justify-center gap-2 text-sm text-muted-foreground/70 hover:text-foreground hover:border-border/60 transition-all duration-200 mb-8"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-[#25D366]" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Lieber per WhatsApp schreiben
        </button>

        {/* FAQ — objection handling */}
        <div className="space-y-2 mb-8">
          {FAQ.map((item, i) => (
            <div key={i} className="rounded-xl border border-border/30 bg-card/40 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <span className="text-sm text-foreground/80 font-medium">{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground/50 transition-transform duration-200 flex-shrink-0 ml-2 ${openFaq === i ? 'rotate-180' : ''}`}
                />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-3">
                  <p className="text-sm text-muted-foreground/70 leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Second CTA after FAQ */}
        <Button
          variant="premium"
          size="lg"
          className="w-full min-h-[52px] text-base gap-2 mb-3"
          onClick={() => handleCta('instagram')}
        >
          {ctaLabel}
          <ArrowRight className="w-4 h-4" />
        </Button>
        <button
          onClick={() => window.open(whatsappUrl, '_blank')}
          className="w-full min-h-[48px] rounded-xl border border-border/40 bg-card/60 flex items-center justify-center gap-2 text-sm text-muted-foreground/70 hover:text-foreground hover:border-border/60 transition-all duration-200 mb-8"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-[#25D366]" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Lieber per WhatsApp schreiben
        </button>

        {/* Reset wiederholen */}
        <button
          onClick={handleReset}
          className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors block mx-auto"
        >
          Reset wiederholen
        </button>
      </div>
    </div>
  );
}
