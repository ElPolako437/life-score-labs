import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Clock, Zap, Flame, Moon, Heart, Dumbbell, Sun, Battery, Apple } from 'lucide-react';

const CATEGORIES = ['Alle', 'Fett', 'Schlaf', 'Stress', 'Energie', 'Routine', 'Ernährung', 'Bewegung'];

const PROTOCOLS = [
  { id: 'reset-7', name: '7-Tage CALINESS Reset', goal: 'Ganzheitlicher Neustart', duration: '7 Tage', difficulty: 'Einfach', category: 'Routine', icon: Zap, color: 'text-primary' },
  { id: 'fat-loss', name: 'Fat Loss Reset', goal: 'Körperfett reduzieren', duration: '14 Tage', difficulty: 'Mittel', category: 'Fett', icon: Flame, color: 'text-orange-400' },
  { id: 'sleep-reset', name: 'Sleep Reset', goal: 'Schlafqualität verbessern', duration: '7 Tage', difficulty: 'Einfach', category: 'Schlaf', icon: Moon, color: 'text-blue-400' },
  { id: 'stress-reset', name: 'Stress Reset', goal: 'Stresslevel senken', duration: '7 Tage', difficulty: 'Einfach', category: 'Stress', icon: Heart, color: 'text-rose-400' },
  { id: 'energy-reset', name: 'Energy Reset', goal: 'Energielevel steigern', duration: '14 Tage', difficulty: 'Mittel', category: 'Energie', icon: Battery, color: 'text-yellow-400' },
  { id: 'longevity-foundation', name: 'Longevity Foundation', goal: 'Basisprotokoll für Langlebigkeit', duration: '30 Tage', difficulty: 'Mittel', category: 'Routine', icon: Sun, color: 'text-primary' },
  { id: 'morning-routine', name: 'Morning Routine', goal: 'Optimaler Start in den Tag', duration: '14 Tage', difficulty: 'Einfach', category: 'Routine', icon: Sun, color: 'text-amber-400' },
  { id: 'high-protein', name: 'High-Protein Ernährung', goal: 'Proteinversorgung optimieren', duration: '14 Tage', difficulty: 'Mittel', category: 'Ernährung', icon: Apple, color: 'text-emerald-400' },
  { id: 'movement', name: 'Movement & Cardio', goal: 'Bewegung integrieren', duration: '14 Tage', difficulty: 'Mittel', category: 'Bewegung', icon: Dumbbell, color: 'text-primary' },
  { id: 'recovery', name: 'Recovery Optimization', goal: 'Regeneration maximieren', duration: '7 Tage', difficulty: 'Einfach', category: 'Schlaf', icon: Moon, color: 'text-indigo-400' },
];

export default function AppProtocols() {
  const [filter, setFilter] = useState('Alle');
  const navigate = useNavigate();

  const filtered = filter === 'Alle' ? PROTOCOLS : PROTOCOLS.filter(p => p.category === filter);

  return (
    <div className="px-5 pt-8 pb-4 space-y-6 animate-enter">
      <div>
        <h1 className="font-outfit text-2xl font-bold text-foreground">Protokolle</h1>
        <p className="text-sm text-muted-foreground mt-1">Wähle ein Protokoll und starte deine Transformation.</p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200',
              filter === c
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Protocol cards */}
      <div className="space-y-3">
        {filtered.map(p => (
          <button
            key={p.id}
            onClick={() => navigate(`/app/protocols/${p.id}`)}
            className="card-elegant rounded-2xl p-4 w-full text-left flex items-start gap-4 hover:border-primary/30 transition-all"
          >
            <div className="icon-container w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
              <p.icon className={cn('w-5 h-5', p.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">{p.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{p.goal}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" /> {p.duration}
                </span>
                <span className="text-[10px] text-muted-foreground">{p.difficulty}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
