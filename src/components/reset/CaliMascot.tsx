import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CaliMascotProps {
  /** Bildpfad, z.B. /images/cali/cali-head.png */
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  /** true = rein dekorativ (wird von Screenreadern übersprungen) */
  decorative?: boolean;
}

/**
 * CALI — das Maskottchen. Blendet sich still aus, solange die Bilddatei fehlt,
 * damit die Slots schon im Layout stehen können, bevor die Assets hochgeladen
 * sind (kein kaputtes Bild-Icon, kein Layout-Sprung).
 */
export default function CaliMascot({ src, alt = 'CALI', className, style, decorative }: CaliMascotProps) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <img
      src={src}
      alt={decorative ? '' : alt}
      aria-hidden={decorative || undefined}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
      className={cn('object-contain select-none', className)}
      style={style}
    />
  );
}
