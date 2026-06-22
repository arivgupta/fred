// FredOrb — FRED's living presence.
//
// Not a solid sphere: a soft, hazy, flowing field of green light (think the
// Notion / Apple-Intelligence "noodling" look), in FRED's evergreen palette.
//
// Two renderers, picked by size for performance:
//   • Large / hero orbs  -> a real animated WebGL mesh gradient
//     (@paper-design/shaders-react) for that gorgeous flowing haze.
//   • Small inline orbs (nav, chat avatars) -> a lightweight CSS haze that
//     matches, so we never spin up a WebGL context per chat bubble.
//
// Both dissolve at the edges (soft-masked) so there's no hard sphere, and both
// react to `state`: idle | listening | thinking | working | speaking.
//
// The legacy `glyph` prop is accepted but ignored (no letter inside anymore).

import { MeshGradient } from '@paper-design/shaders-react';

// px size at/above which we upgrade to the WebGL mesh. Below this, CSS haze.
const RICH_MIN = 96;

// FRED's evergreen haze: a little pine for depth, lots of emerald/jade body,
// spring/mint highlights, and aqua/teal for iridescence — bright and lush.
const ORB_COLORS = ['#0b5c40', '#13a870', '#22d79e', '#7df0c8', '#34e4d6', '#aaffdd'];

// surface churn by state — calm when idle, lively when working
const SPEED = { idle: 0.16, listening: 0.55, thinking: 1.0, working: 1.5, speaking: 0.8 };

export default function FredOrb({ size = 72, state = 'idle', rich, glyph, className = '', title }) {
  const px = typeof size === 'number' ? size : parseInt(size, 10) || 72;
  const useMesh = rich ?? px >= RICH_MIN;
  const style = { '--orb': typeof size === 'number' ? `${size}px` : size };

  return (
    <span
      className={`fred-orb is-${state}${useMesh ? ' fred-orb--mesh' : ''} ${className}`}
      style={style}
      role="img"
      aria-label={title || 'FRED'}
      title={title}
    >
      <span className="fred-orb__ring" aria-hidden="true" />
      {useMesh ? (
        <span className="fred-orb__mesh" aria-hidden="true">
          <MeshGradient
            colors={ORB_COLORS}
            distortion={0.85}
            swirl={0.4}
            speed={SPEED[state] ?? 0.3}
            style={{ width: '100%', height: '100%' }}
          />
        </span>
      ) : (
        <span className="fred-orb__sheen" aria-hidden="true" />
      )}
    </span>
  );
}
