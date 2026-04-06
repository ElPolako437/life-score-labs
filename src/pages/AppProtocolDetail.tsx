import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const RESET_DAYS = [
  {
    day: 1, title: 'Tag 1 – Der Neustart',
    tasks: ['2,5L Wasser trinken', '30 Min Spaziergang', '2 proteinreiche Mahlzeiten', 'Kein Alkohol', 'Vor 23:00 schlafen', '5 Min Atemübung'],
  },
  {
    day: 2, title: 'Tag 2 – Momentum',
    tasks: ['2,5L Wasser trinken', '30 Min Bewegung', 'Protein zu jeder Mahlzeit', 'Kein Zucker', 'Bildschirm aus ab 21:30', '10 Min Dehnung'],
  },
  {
    day: 3, title: 'Tag 3 – Vertiefung',
    tasks: ['3L Wasser trinken', '45 Min Aktivität', 'Gemüse zu jeder Mahlzeit', 'Keine Fertigprodukte', 'Vor 22:30 im Bett', 'Dankbarkeits-Journal'],
  },
  {
    day: 4, title: 'Tag 4 – Halbzeit',
    tasks: ['3L Wasser trinken', '30 Min Krafttraining', 'Proteinziel erreichen', 'Kein Koffein nach 14:00', 'Vor 23:00 schlafen', 'Kalt duschen (30s)'],
  },
  {
    day: 5, title: 'Tag 5 – Konstanz',
    tasks: ['2,5L Wasser trinken', '30 Min Spaziergang', '2 proteinreiche Mahlzeiten', 'Kein Alkohol', '8h Schlafziel', '10 Min Meditation'],
  },
  {
    day: 6, title: 'Tag 6 – Intensität',
    tasks: ['3L Wasser trinken', '45 Min Training', 'Proteinziel + Gemüse', 'Kein Social Media vor 10:00', 'Schlafprotokoll einhalten', 'Reflexion schreiben'],
  },
  {
    day: 7, title: 'Tag 7 – Abschluss',
    tasks: ['2,5L Wasser trinken', '30 Min aktive Erholung', 'Saubere Ernährung', 'Dankbarkeit praktizieren', 'Wochenreflexion', 'Nächstes Protokoll planen'],
  },
];

export default function AppProtocolDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { protocolProgress, startProtocol, toggleProtocolDay } = useApp();
  const [selectedDay, setSelectedDay] = useState(0);
  const [reflection, setReflection] = useState('');

  const progress = protocolProgress.find(p => p.protocolId === (id || 'reset-7'));
  const started = !!progress;

  const handleStart = () => {
    startProtocol(id || 'reset-7');
  };

  return (
    <div className="px-5 pt-6 pb-4 space-y-6 animate-enter">
      {/* Back */}
      <button onClick={() => navigate('/app/protocols')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Zurück</span>
      </button>

      {/* Header */}
      <div>
        <span className="text-xs text-primary font-semibold tracking-wider uppercase">7-Tage Protokoll</span>
        <h1 className="font-outfit text-2xl font-bold text-foreground mt-1">7-Tage CALINESS Reset</h1>
        <p className="text-sm text-muted-foreground mt-2">Ein ganzheitlicher Neustart für Schlaf, Bewegung, Ernährung und mentale Balance. Ideal für den Einstieg.</p>
      </div>

      {/* Day selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {RESET_DAYS.map((d, i) => (
          <button
            key={i}
            onClick={() => setSelectedDay(i)}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-all duration-200',
              selectedDay === i
                ? 'bg-primary text-primary-foreground'
                : progress?.completedDays.includes(i + 1)
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-secondary text-muted-foreground'
            )}
          >
            {d.day}
          </button>
        ))}
      </div>

      {/* Day content */}
      <div className="card-elegant rounded-2xl p-5 space-y-4">
        <h3 className="font-outfit text-lg font-semibold text-foreground">{RESET_DAYS[selectedDay].title}</h3>
        <div className="space-y-3">
          {RESET_DAYS[selectedDay].tasks.map((task, i) => {
            const dayCompleted = progress?.completedDays.includes(selectedDay + 1);
            return (
              <div key={i} className="flex items-center gap-3">
                <div className={cn(
                  'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all',
                  dayCompleted ? 'bg-primary border-primary' : 'border-border/60'
                )}>
                  {dayCompleted && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <span className={cn('text-sm', dayCompleted ? 'text-muted-foreground line-through' : 'text-foreground')}>{task}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reflection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Reflexion</label>
        <Textarea
          placeholder="Wie war dein Tag? Was lief gut? Was willst du morgen besser machen?"
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          className="bg-secondary/40 border-border/40 min-h-[80px]"
        />
      </div>

      {/* Actions */}
      {!started ? (
        <Button variant="premium" size="lg" className="w-full" onClick={handleStart}>Protokoll starten</Button>
      ) : (
        <Button
          variant="premium"
          size="lg"
          className="w-full"
          onClick={() => toggleProtocolDay(id || 'reset-7', selectedDay + 1)}
        >
          {progress?.completedDays.includes(selectedDay + 1) ? 'Tag als offen markieren' : 'Tag abschließen'}
        </Button>
      )}
    </div>
  );
}
