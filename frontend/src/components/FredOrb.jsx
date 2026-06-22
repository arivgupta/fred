// FredOrb — FRED's living presence.
//
// One element represents FRED everywhere: landing hero, sidebar, chat avatar,
// empty states. It's pure CSS (see .fred-orb in styles/index.css) so it's
// instant and works offline. The mark is the pure living evergreen sphere —
// no letter inside (à la Siri / Pine). `state` drives the animation:
//   idle | listening | thinking | working | speaking
//
// Usage: <FredOrb size={72} state="idle" />
//
// Note: the legacy `glyph` prop is accepted but ignored so existing call sites
// keep working; FRED no longer renders a glyph inside the orb.

export default function FredOrb({ size = 72, state = 'idle', glyph, className = '', title }) {
  const style = { '--orb': typeof size === 'number' ? `${size}px` : size };
  return (
    <span
      className={`fred-orb is-${state} ${className}`}
      style={style}
      role="img"
      aria-label={title || 'FRED'}
      title={title}
    >
      <span className="fred-orb__ring" aria-hidden="true" />
      <span className="fred-orb__sheen" aria-hidden="true" />
    </span>
  );
}
