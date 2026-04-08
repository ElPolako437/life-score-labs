import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SOFT_CONVERSION, RETENTION_HOOKS } from '@/lib/dayContent';
import { Check, ArrowRight } from 'lucide-react';

const INSTAGRAM_DM_URL = 'https://ig.me/m/caliness_?text=SPRINT';

const SOCIAL_PROOF: Record<number, string> = {
  1: 'Du hast angefangen. Die meisten tun es nicht.',
  2: 'Du bist weiter als 60% aller Teilnehmer.',
  3: 'Du bist weiter als 71% aller Teilnehmer.',
  4: 'Du bist in der oberen Hälfte. Sehr wenige schaffen Tag 4.',
  5: 'Du bist weiter als 82% aller Teilnehmer.',
  6: 'Du bist fast am Ziel. Weniger als 15% kommen bis hier.',
  7: 'Du hast es durchgezogen. Das zählt.',
};

export default function ResetCheckIn() {
  const { id } = useParams();
  const dayNum = Number(id);
  const navigate = useNavigate();

  const conversionEntry = SOFT_CONVERSION[dayNum];
  const retentionHook = RETENTION_HOOKS[dayNum];

  const handleContinue = () => {
    if (dayNum === 7) {
      navigate('/reflection');
    } else {
      navigate('/week');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="max-w-sm mx-auto w-full text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 animate-scale-in">
          <Check className="w-8 h-8 text-primary" />
        </div>

        <h2 className="font-outfit text-xl font-bold text-foreground mb-1">
          Tag {dayNum} geschafft.
        </h2>

        {SOCIAL_PROOF[dayNum] && (
          <p className="text-sm text-primary font-medium mb-1">{SOCIAL_PROOF[dayNum]}</p>
        )}

        <p className="text-sm text-muted-foreground mb-6">
          {dayNum < 7 ? 'Morgen geht es weiter.' : 'Zeit für deine Reflexion.'}
        </p>

        {/* Retention hook (days 1–2) */}
        {retentionHook && (
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 mb-6 animate-fade-in text-left">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1.5">Morgen</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{retentionHook}</p>
          </div>
        )}

        {/* Soft conversion (days 3–6) */}
        {conversionEntry && (
          <div className="p-4 rounded-xl border border-border/30 bg-card/60 mb-6 animate-fade-in">
            <p className="text-sm text-muted-foreground/80 leading-relaxed italic">
              {conversionEntry.text}
            </p>
            {conversionEntry.cta && (
              <button
                onClick={() => window.open(INSTAGRAM_DM_URL, '_blank')}
                className="mt-3 flex items-center gap-1.5 text-xs text-primary/80 hover:text-primary transition-colors"
              >
                Sprint kennenlernen <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        <Button
          variant="premium"
          size="lg"
          className="w-full min-h-[48px]"
          onClick={handleContinue}
        >
          {dayNum === 7 ? 'Reset auswerten →' : `Tag ${dayNum + 1} morgen →`}
        </Button>
      </div>
    </div>
  );
}
