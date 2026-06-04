import { useNavigate } from 'react-router-dom';
import { useReset } from '@/contexts/ResetContext';
import { Button } from '@/components/ui/button';

// Placeholder — wird in Schritt 4 ausgebaut (pillarConnections.ts + Akkordeon-Blöcke A–D)

export default function ResetSynthesis() {
  const navigate = useNavigate();
  const { name } = useReset();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-10">
      <div className="max-w-sm mx-auto w-full text-center animate-fade-in">
        <div className="flex justify-center mb-8">
          <img src="/images/caliness-logo-white.png" alt="CALINESS" className="h-10 opacity-80" />
        </div>

        <p className="text-[11px] font-semibold tracking-[3px] uppercase text-primary mb-4">
          Tag 5 von 5
        </p>

        <h1 className="font-outfit text-2xl font-bold text-foreground mb-4 leading-tight">
          {name ? `${name}, deine Auswertung` : 'Deine Auswertung'}
          <br />
          <span className="text-primary">ist in Vorbereitung.</span>
        </h1>

        <p className="text-sm text-muted-foreground/70 leading-relaxed mb-8">
          Die vollständige Säulen-Auswertung mit deinen persönlichen Mustern und dem Sprint-Angebot folgt in der nächsten Version. Du hast alle 4 Säulen abgeschlossen.
        </p>

        <Button
          variant="premium"
          size="lg"
          className="w-full min-h-[52px] gap-2 mb-4"
          onClick={() => navigate('/next')}
        >
          Zum Sprint-Angebot
        </Button>

        <button
          onClick={() => navigate('/week')}
          className="text-xs text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
        >
          ← Zurück zur Übersicht
        </button>
      </div>
    </div>
  );
}
