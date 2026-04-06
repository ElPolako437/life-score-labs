import { useState } from 'react';
import { useApp, type WearableEntry } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Watch, Activity, Heart, Moon, Wind, TrendingUp } from 'lucide-react';
import PremiumPaywall from '@/components/app/PremiumPaywall';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const SOURCES = ['Garmin', 'Apple Watch', 'Oura', 'Whoop', 'Manuell'];

export default function AppWearables() {
  const { isPremium, wearableEntries, addWearableEntry } = useApp();
  const navigate = useNavigate();

  const [steps, setSteps] = useState(8000);
  const [hrv, setHrv] = useState(45);
  const [restingHR, setRestingHR] = useState(62);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [spo2, setSpo2] = useState(97);
  const [source, setSource] = useState('Garmin');
  const [saved, setSaved] = useState(false);

  if (!isPremium) {
    return <PremiumPaywall feature="Wearable-Tracking" />;
  }

  const handleSave = () => {
    const entry: WearableEntry = {
      date: new Date().toISOString().split('T')[0],
      steps,
      hrv,
      restingHR,
      sleepHours,
      spo2,
      source,
    };
    addWearableEntry(entry);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const lastEntry = wearableEntries[wearableEntries.length - 1];

  return (
    <div className="px-5 pt-8 pb-24 space-y-6 animate-enter">
      <div>
        <div className="flex items-center gap-2">
          <Watch className="w-5 h-5 text-primary" />
          <h1 className="font-outfit text-2xl font-bold text-foreground">Wearable-Daten</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Trage deine heutigen Wearable-Werte ein</p>
      </div>

      {/* Source Selection */}
      <div>
        <span className="text-sm text-foreground block mb-3">Datenquelle</span>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map(s => (
            <button
              key={s}
              onClick={() => setSource(s)}
              className={cn(
                'rounded-xl border px-3 py-2 text-xs font-medium transition-all',
                source === s
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/50 bg-card text-muted-foreground'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-6">
        <MetricSlider
          icon={TrendingUp}
          label="Schritte"
          value={steps}
          onChange={setSteps}
          min={0}
          max={30000}
          step={500}
          display={steps.toLocaleString()}
        />
        <MetricSlider
          icon={Activity}
          label="HRV (ms)"
          value={hrv}
          onChange={setHrv}
          min={10}
          max={120}
          display={`${hrv} ms`}
          hint="Höher = bessere Erholung"
        />
        <MetricSlider
          icon={Heart}
          label="Ruhepuls"
          value={restingHR}
          onChange={setRestingHR}
          min={35}
          max={100}
          display={`${restingHR} bpm`}
          hint="Niedriger = fitter"
        />
        <MetricSlider
          icon={Moon}
          label="Schlafstunden"
          value={sleepHours}
          onChange={setSleepHours}
          min={3}
          max={12}
          step={0.5}
          display={`${sleepHours}h`}
        />
        <MetricSlider
          icon={Wind}
          label="SpO2"
          value={spo2}
          onChange={setSpo2}
          min={85}
          max={100}
          display={`${spo2}%`}
          hint="Sauerstoffsättigung"
        />
      </div>

      <Button variant="premium" size="lg" className="w-full" onClick={handleSave}>
        {saved ? '✓ Gespeichert' : 'Daten speichern'}
      </Button>

      {/* Last Entry */}
      {lastEntry && (
        <div className="card-elegant rounded-2xl p-4 space-y-2">
          <span className="text-xs text-muted-foreground">Letzter Eintrag · {lastEntry.date} · {lastEntry.source}</span>
          <div className="grid grid-cols-3 gap-3">
            {lastEntry.hrv != null && <MiniStat label="HRV" value={`${lastEntry.hrv} ms`} />}
            {lastEntry.restingHR != null && <MiniStat label="Puls" value={`${lastEntry.restingHR} bpm`} />}
            {lastEntry.spo2 != null && <MiniStat label="SpO2" value={`${lastEntry.spo2}%`} />}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricSlider({ icon: Icon, label, value, onChange, min, max, step = 1, display, hint }: {
  icon: React.ElementType;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  display: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <span className="text-sm text-foreground">{label}</span>
        </div>
        <span className="font-outfit text-lg font-bold text-foreground">{display}</span>
      </div>
      <Slider value={[value]} onValueChange={v => onChange(v[0])} min={min} max={max} step={step} />
      {hint && <span className="text-xs text-muted-foreground mt-1 block">{hint}</span>}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
