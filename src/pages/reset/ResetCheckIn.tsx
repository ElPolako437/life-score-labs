import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SOFT_CONVERSION, RETENTION_HOOKS } from '@/lib/dayContent';
import { useReset } from '@/contexts/ResetContext';
import InstallPromptSheet from '@/components/InstallPromptSheet';
import { isMobile, isStandalone } from '@/lib/installPrompt';
import { Check, ArrowRight } from 'lucide-react';

const GOAL_LABEL: Record<string, string> = {
  energy: 'mehr Energie',
  fatloss: 'Fettverlust',
  structure: 'mehr Struktur',
  sleep: 'besseren Schlaf',
};

const SOCIAL_PROOF: Record<number, string> = {
  1: 'Du hast angefangen. Die meisten tun es nicht.',
  2: 'Du gehörst jetzt zu den 40%, die Tag 2 schaffen.',
  3: 'Du gehörst jetzt zu den 29%, die Tag 3 schaffen.',
  4: 'Du gehörst jetzt zu den Wenigen, die Tag 4 erreichen.',
  5: 'Du gehörst jetzt zu den 18%, die Tag 5 schaffen.',
  6: 'Du gehörst jetzt zu den 15%, die fast am Ziel sind.',
  7: 'Du hast es durchgezogen. Du gehörst zur Elite.',
};

export default function ResetCheckIn() {
  const { id } = useParams();
  const dayNum = Number(id);
  const navigate = useNavigate();
  const { goal, homescreenHintShown, markHomescreenHintShown } = useReset();
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    if (dayNum === 1 && !homescreenHintShown && isMobile() && !isStandalone()) {
      const timer = setTimeout(() => {
        setShowInstall(true);
        markHomescreenHintShown();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const instagramUrl = goal
    ? `https://ig.me/m/caliness_?text=${encodeURIComponent(`CALINESS SPRINT ${GOAL_LABEL[goal]}`)}`
    : 'https://ig.me/m/caliness_?text=CALINESS+SPRINT';

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
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 mb-4 animate-fade-in text-left">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1.5">Morgen</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{retentionHook}</p>
          </div>
        )}

        {/* WhatsApp reminder — days 1–2: full card (no competing elements) */}
        {dayNum <= 2 && (
          <div className="p-4 rounded-xl border border-border/40 bg-card/60 mb-6 animate-fade-in text-left">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Nicht vergessen</p>
            <p className="text-sm text-foreground/80 mb-3">Soll ich dich morgen an Tag {dayNum + 1} erinnern?</p>
            <button
              onClick={() => window.open(`https://wa.me/4917685912445?text=${encodeURIComponent(`REMINDER TAG ${dayNum + 1}`)}`, '_blank')}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all duration-200"
              style={{ background: 'hsl(142 76% 46% / 0.08)', borderColor: 'hsl(142 76% 46% / 0.3)' }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-[#25D366]" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="text-sm font-medium text-[#25D366]">Ja, erinnere mich per WhatsApp</span>
            </button>
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
                onClick={() => window.open(instagramUrl, '_blank')}
                className="mt-3 flex items-center gap-1.5 text-xs text-primary/80 hover:text-primary transition-colors"
              >
                Caliness-Sprint kennenlernen <ArrowRight className="w-3 h-3" />
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
          {dayNum === 7 ? '7 Tage. Jetzt dein Ergebnis →' : `Tag ${dayNum + 1} morgen →`}
        </Button>

        {/* WA reminder days 3–6: subtle link below CTA */}
        {dayNum >= 3 && dayNum < 7 && (
          <button
            onClick={() => window.open(`https://wa.me/4917685912445?text=${encodeURIComponent(`REMINDER TAG ${dayNum + 1}`)}`, '_blank')}
            className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors mx-auto"
          >
            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current text-[#25D366]/60" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Erinnere mich morgen per WhatsApp
          </button>
        )}
      </div>

      {showInstall && (
        <InstallPromptSheet onDismiss={() => setShowInstall(false)} />
      )}
    </div>
  );
}
