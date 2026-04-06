import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useReset } from '@/contexts/ResetContext';

export default function ResetNext() {
  const navigate = useNavigate();
  const { resetAll } = useReset();

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

        <h1 className="font-outfit text-2xl font-bold text-foreground mb-4">
          Du hast Klarheit. Jetzt fehlt der Plan.
        </h1>

        <p className="text-sm text-muted-foreground leading-relaxed mb-10">
          Der Reset hat dir gezeigt, was funktioniert und wo es hakt. Der nächste Schritt ist der CALINESS 14-Tage Sprint: individuell, begleitet, mit klarer Struktur.
          <br /><br />
          Kein Programm von der Stange — sondern ein Plan, der zu deinem Leben passt. Persönliche Einordnung, individuelle Anpassung, direkte Begleitung.
        </p>

        <div className="space-y-3">
          <Button
            variant="premium"
            size="lg"
            className="w-full min-h-[48px]"
            onClick={() => window.open('https://ig.me/m/caliness_', '_blank')}
          >
            Sprint starten — Schreib mir auf Instagram
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full min-h-[48px]"
            onClick={() => window.open('https://www.instagram.com/caliness_/', '_blank')}
          >
            Ich möchte erst mehr erfahren
          </Button>

          <button
            onClick={handleReset}
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors mt-4 block mx-auto"
          >
            Reset wiederholen
          </button>
        </div>
      </div>
    </div>
  );
}
