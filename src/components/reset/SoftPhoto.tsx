import { cn } from '@/lib/utils';

interface SoftPhotoProps {
  src: string;
  alt: string;
  /** Extra classes for the outer container (e.g. margins). */
  className?: string;
  /** Blur strength in px (default 1.4 — subtle, atmospheric, hides AI tells). */
  blur?: number;
}

/**
 * Renders a brand photo as a soft, atmospheric band rather than a sharp,
 * scrutinizable photo: a gentle blur + a gradient scrim that fades the image
 * into the dark UI. Reads as mood/background, integrates premium, and avoids
 * pixel-peeping. The slight scale prevents the blur from revealing soft edges.
 */
export default function SoftPhoto({ src, alt, className, blur = 1.4 }: SoftPhotoProps) {
  return (
    <div className={cn('relative w-full overflow-hidden rounded-2xl border border-border/40', className)}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full h-auto object-cover"
        style={{ filter: `blur(${blur}px) brightness(0.9) saturate(1.05)`, transform: 'scale(1.05)' }}
      />
      {/* Scrim: fade top + bottom into the app background so it sits like atmosphere */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, hsl(var(--background) / 0.5) 0%, transparent 28%, transparent 58%, hsl(var(--background) / 0.8) 100%)',
        }}
      />
    </div>
  );
}
