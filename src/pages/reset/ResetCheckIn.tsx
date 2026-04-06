import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useReset, type Rating } from '@/contexts/ResetContext';
import { SOFT_CONVERSION } from '@/lib/dayContent';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const RATINGS: { value: Rating; label: string }[] = [
  { value: 'good', label: 'Lief gut' },
  { value: 'difficult', label: 'War schwierig' },
  { value: 'failed', label: 'Nicht geschafft' },
];

export default function ResetCheckIn() {
  const { id } = useParams();
  const dayNum = Number(id);
  const navigate = useNavigate();
  const { completeDay } = useReset();

  const [selectedRating, setSelectedRating] = useState<Rating | null>(null);
  const [note, setNote] = useState('');
  const [completed, setCompleted] = useState(false);

  const conversionText = SOFT_CONVERSION[dayNum];

  const handleSubmit = () => {
    if (!selectedRating) return;
    completeDay(dayNum, selectedRating, note);
    setCompleted(true);
  };

  const handleContinue = () => {
    if (dayNum === 7) {
      navigate('/reflection');
    } else {
      navigate('/week');
    }
  };

  if (completed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="max-w-sm mx-auto w-full text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 animate-scale-in">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-outfit text-xl font-bold text-foreground mb-2">
            Tag {dayNum} erledigt. ✓
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            {dayNum < 7 ? 'Morgen geht es weiter.' : 'Zeit für deine Reflexion.'}
          </p>

          {/* Soft conversion (day 4+) */}
          {conversionText && (
            <div className="p-4 rounded-xl border border-border/30 bg-card/60 mb-8 animate-fade-in">
              <p className="text-sm text-muted-foreground/80 leading-relaxed italic">
                {conversionText}
              </p>
            </div>
          )}

          <Button
            variant="premium"
            size="lg"
            className="w-full min-h-[48px]"
            onClick={handleContinue}
          >
            Weiter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-8">
      <div className="max-w-sm mx-auto w-full flex-1 flex flex-col animate-fade-in">
        <h2 className="font-outfit text-2xl font-bold text-foreground mb-2">
          Wie lief dein Tag?
        </h2>
        <p className="text-sm text-muted-foreground mb-8">Tag {dayNum} — kurzes Feedback.</p>

        <div className="space-y-3 mb-8">
          {RATINGS.map(r => (
            <button
              key={r.value}
              onClick={() => setSelectedRating(r.value)}
              className={cn(
                'w-full text-left p-4 rounded-2xl border transition-all duration-200',
                selectedRating === r.value
                  ? 'border-primary bg-primary/10 text-foreground shadow-glow-subtle'
                  : 'border-border/60 bg-card text-card-foreground hover:border-primary/40'
              )}
            >
              <span className="font-medium text-sm">{r.label}</span>
            </button>
          ))}
        </div>

        <div className="mb-8">
          <Input
            placeholder="Was nimmst du mit? (optional)"
            value={note}
            onChange={e => setNote(e.target.value.slice(0, 100))}
            maxLength={100}
            className="bg-card border-border/60 text-foreground placeholder:text-muted-foreground/50 h-12 rounded-xl"
          />
          <p className="text-2xs text-muted-foreground/40 mt-1 text-right">{note.length}/100</p>
        </div>

        <div className="mt-auto pb-4">
          <Button
            variant="premium"
            size="lg"
            className="w-full min-h-[48px]"
            disabled={!selectedRating}
            onClick={handleSubmit}
          >
            Weiter
          </Button>
        </div>
      </div>
    </div>
  );
}
