import { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  score: number;
  streak: number;
  weekLabel: string;
  name: string;
}

export default function ShareCard({ score, streak, weekLabel, name }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateShareImage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 600;
    const h = 400;
    canvas.width = w;
    canvas.height = h;

    // Background
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    // Green gradient accent
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, 'rgba(0, 178, 9, 0.08)');
    grad.addColorStop(1, 'rgba(0, 178, 9, 0.02)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Border
    ctx.strokeStyle = 'rgba(0, 178, 9, 0.2)';
    ctx.lineWidth = 2;
    ctx.roundRect(10, 10, w - 20, h - 20, 16);
    ctx.stroke();

    // Score ring (simplified)
    const cx = w / 2, cy = 150, r = 60;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 8;
    ctx.stroke();

    const pct = Math.min(score / 100, 1);
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * pct);
    ctx.strokeStyle = '#00B209';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Score number
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(String(Math.round(score)), cx, cy + 12);

    // Text below score
    ctx.fillStyle = '#8b949e';
    ctx.font = '14px system-ui';
    ctx.fillText('Longevity Score', cx, cy + 35);

    // Main text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px system-ui';
    ctx.fillText(`Mein CALINESS Score diese Woche: ${Math.round(score)}`, cx, 260);

    // Streak
    ctx.fillStyle = '#00B209';
    ctx.font = 'bold 16px system-ui';
    ctx.fillText(`🔥 ${streak} Tage Streak`, cx, 290);

    // Week label
    ctx.fillStyle = '#8b949e';
    ctx.font = '12px system-ui';
    ctx.fillText(weekLabel, cx, 320);

    // CALINESS branding
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = 'bold 11px system-ui';
    ctx.fillText('CALINESS · caliness.app', cx, 370);

    // Convert and share
    try {
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) { toast.error('Bild konnte nicht erstellt werden'); return; }

      if (navigator.share && navigator.canShare) {
        const file = new File([blob], 'caliness-score.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Mein CALINESS Score',
            text: `Mein CALINESS Longevity Score: ${Math.round(score)} · ${streak} Tage Streak 🔥`,
            files: [file],
          });
          return;
        }
      }

      // Fallback: download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'caliness-score.png';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Bild heruntergeladen');
    } catch (e: any) {
      if (e.name !== 'AbortError') toast.error('Teilen fehlgeschlagen');
    }
  }, [score, streak, weekLabel]);

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      <Button variant="outline" size="sm" onClick={generateShareImage} className="gap-2">
        <Share2 className="w-3.5 h-3.5" /> Teilen
      </Button>
    </>
  );
}
