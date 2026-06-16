interface CaliNoteProps {
  line: string;
}

/**
 * Cali's quiet presence — a soft glowing orb + one coach line.
 * Uses the design-system primary glow rather than an avatar image.
 */
export default function CaliNote({ line }: CaliNoteProps) {
  return (
    <div className="flex items-start gap-3 mb-6 animate-fade-in">
      <div className="relative shrink-0 mt-0.5">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle at 30% 30%, hsl(142 76% 56%), hsl(142 76% 38%))',
            boxShadow: '0 0 14px hsl(142 76% 46% / 0.45)',
          }}
        >
          <span className="text-[11px] font-bold text-primary-foreground">C</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-primary/70 uppercase tracking-widest mb-0.5">Cali</p>
        <p className="text-sm text-foreground/80 leading-relaxed">{line}</p>
      </div>
    </div>
  );
}
