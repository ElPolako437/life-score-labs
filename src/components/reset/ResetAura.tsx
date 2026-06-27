/**
 * Ambient living backdrop for the whole Reset funnel. Two slowly-drifting,
 * breathing brand-green glows sit behind all content — turning the flat dark
 * void into a premium, alive surface. Purely decorative, non-interactive,
 * GPU-friendly (transform/opacity only), and disabled under reduced motion.
 */
export default function ResetAura() {
  return (
    <div className="reset-aura" aria-hidden="true">
      <div className="reset-aura__blob reset-aura__blob--a" />
      <div className="reset-aura__blob reset-aura__blob--b" />
    </div>
  );
}
