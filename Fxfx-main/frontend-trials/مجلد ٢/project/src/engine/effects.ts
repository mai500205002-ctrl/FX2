export type EffectFamily =
  | 'motion'
  | 'glow'
  | 'distortion'
  | 'material'
  | 'chromatic'
  | 'structural';

export type ControlType = 'range' | 'color' | 'select';

export interface EffectControl {
  key: string;
  label: string;
  type: ControlType;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: string[];
  default: number | string;
}

export interface Effect {
  id: string;
  name: string;
  family: EffectFamily;
  tagline: string;
  description: string;
  controls: EffectControl[];
  /** Inline CSS applied to the preview element. */
  style: (vals: Record<string, number | string>) => React.CSSProperties;
  /** Extra className applied to the preview element (for keyframe-driven effects). */
  className?: (vals: Record<string, number | string>) => string;
  /** Optional layered (pseudo) background CSS string for gradient/mask tricks. */
  background?: (vals: Record<string, number | string>) => string;
}

export const FAMILY_META: Record<
  EffectFamily,
  { label: string; blurb: string; hue: string }
> = {
  motion: { label: 'Motion', blurb: 'Kinetic, breathing, alive.', hue: '#c4f74e' },
  glow: { label: 'Glow', blurb: 'Radiance and light fields.', hue: '#7cd5ff' },
  distortion: { label: 'Distortion', blurb: 'Glitch, rupture, interference.', hue: '#f87171' },
  material: { label: 'Material', blurb: 'Surfaces, textures, finishes.', hue: '#ffb347' },
  chromatic: { label: 'Chromatic', blurb: 'Color shifts and spectra.', hue: '#a78bfa' },
  structural: { label: 'Structural', blurb: 'Form, outline, architecture.', hue: '#9aa3b5' },
};

const num = (v: number | string, fallback: number): number => {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};

export const EFFECTS: Effect[] = [
  // ── MOTION ──────────────────────────────────────────────
  {
    id: 'float',
    name: 'Float',
    family: 'motion',
    tagline: 'Weightless drift',
    description: 'Text suspended in zero gravity, bobbing gently on an endless loop.',
    controls: [
      { key: 'distance', label: 'Distance', type: 'range', min: 4, max: 40, step: 1, unit: 'px', default: 14 },
      { key: 'duration', label: 'Speed', type: 'range', min: 1, max: 8, step: 0.5, unit: 's', default: 3 },
      { key: 'weight', label: 'Weight', type: 'select', options: ['400', '500', '600', '700'], default: '600' },
    ],
    style: (v) => ({
      fontWeight: String(v.weight ?? '600'),
      animation: `fx-float ${num(v.duration, 3)}s ease-in-out infinite`,
      ['--fx-dist' as string]: `${num(v.distance, 14)}px`,
    }),
    className: () => '',
  },
  {
    id: 'pulse',
    name: 'Pulse',
    family: 'motion',
    tagline: 'Living heartbeat',
    description: 'A steady respiratory rhythm — the text expands and contracts like a breath.',
    controls: [
      { key: 'intensity', label: 'Intensity', type: 'range', min: 1, max: 12, step: 0.5, unit: '%', default: 5 },
      { key: 'duration', label: 'Speed', type: 'range', min: 0.6, max: 6, step: 0.2, unit: 's', default: 2 },
      { key: 'weight', label: 'Weight', type: 'select', options: ['400', '500', '600', '700'], default: '700' },
    ],
    style: (v) => ({
      fontWeight: String(v.weight ?? '700'),
      animation: `fx-pulse ${num(v.duration, 2)}s ease-in-out infinite`,
      ['--fx-scale' as string]: `${1 + num(v.intensity, 5) / 100}`,
    }),
  },
  {
    id: 'wave',
    name: 'Wave',
    family: 'motion',
    tagline: 'Liquid sway',
    description: 'A skewing oscillation that ripples across the type like a slow wave.',
    controls: [
      { key: 'angle', label: 'Angle', type: 'range', min: 1, max: 14, step: 0.5, unit: '°', default: 6 },
      { key: 'duration', label: 'Speed', type: 'range', min: 0.8, max: 6, step: 0.2, unit: 's', default: 2.4 },
      { key: 'weight', label: 'Weight', type: 'select', options: ['400', '500', '600', '700'], default: '600' },
    ],
    style: (v) => ({
      fontWeight: String(v.weight ?? '600'),
      animation: `fx-wave ${num(v.duration, 2.4)}s ease-in-out infinite`,
      ['--fx-skew' as string]: `${num(v.angle, 6)}deg`,
    }),
  },

  // ── GLOW ────────────────────────────────────────────────
  {
    id: 'neon',
    name: 'Neon',
    family: 'glow',
    tagline: 'Sign glow',
    description: 'Saturated tube-light radiance with a soft halo bleeding into the canvas.',
    controls: [
      { key: 'color', label: 'Color', type: 'color', default: '#c4f74e' },
      { key: 'radius', label: 'Glow radius', type: 'range', min: 4, max: 80, step: 2, unit: 'px', default: 28 },
      { key: 'strength', label: 'Strength', type: 'range', min: 0.3, max: 2, step: 0.1, default: 1 },
    ],
    style: (v) => {
      const c = String(v.color ?? '#c4f74e');
      const r = num(v.radius, 28);
      const s = num(v.strength, 1);
      return {
        color: c,
        textShadow: `0 0 ${r * 0.4}px ${c}, 0 0 ${r}px ${c}, 0 0 ${r * 1.8}px ${c}aa, 0 0 ${r * 3}px ${c}55`,
        opacity: String(s),
      };
    },
  },
  {
    id: 'aura',
    name: 'Aura',
    family: 'glow',
    tagline: 'Soft field',
    description: 'A diffuse, ambient light field that wraps the text without hard edges.',
    controls: [
      { key: 'color', label: 'Color', type: 'color', default: '#7cd5ff' },
      { key: 'spread', label: 'Spread', type: 'range', min: 20, max: 160, step: 5, unit: 'px', default: 70 },
      { key: 'weight', label: 'Weight', type: 'select', options: ['400', '500', '600', '700'], default: '500' },
    ],
    style: (v) => {
      const c = String(v.color ?? '#7cd5ff');
      const s = num(v.spread, 70);
      return {
        fontWeight: String(v.weight ?? '500'),
        color: '#f7faf9',
        textShadow: `0 0 ${s}px ${c}44, 0 0 ${s * 0.4}px ${c}22`,
      };
    },
  },
  {
    id: 'ember-glow',
    name: 'Ember',
    family: 'glow',
    tagline: 'Hot core',
    description: 'Warm incandescent glow with a bright core fading to a cooler outer field.',
    controls: [
      { key: 'color', label: 'Core', type: 'color', default: '#ffb347' },
      { key: 'radius', label: 'Radius', type: 'range', min: 6, max: 70, step: 2, unit: 'px', default: 24 },
      { key: 'flicker', label: 'Flicker', type: 'range', min: 0, max: 1, step: 1, default: 0 },
    ],
    style: (v) => {
      const c = String(v.color ?? '#ffb347');
      const r = num(v.radius, 24);
      const base: React.CSSProperties = {
        color: c,
        textShadow: `0 0 ${r * 0.5}px #fff6e0, 0 0 ${r}px ${c}, 0 0 ${r * 2}px ${c}66`,
      };
      if (num(v.flicker, 0) === 1) base.animation = 'fx-flicker 4s linear infinite';
      return base;
    },
  },

  // ── DISTORTION ──────────────────────────────────────────
  {
    id: 'glitch',
    name: 'Glitch',
    family: 'distortion',
    tagline: 'Signal break',
    description: 'Digital interference — the text tears and displaces in staccato bursts.',
    controls: [
      { key: 'color', label: 'Echo', type: 'color', default: '#f87171' },
      { key: 'offset', label: 'Offset', type: 'range', min: 1, max: 12, step: 0.5, unit: 'px', default: 4 },
      { key: 'rate', label: 'Rate', type: 'range', min: 2, max: 10, step: 0.5, unit: 's', default: 5 },
    ],
    style: (v) => {
      const c = String(v.color ?? '#f87171');
      const o = num(v.offset, 4);
      return {
        color: '#f7faf9',
        textShadow: `${o}px 0 ${c}, ${-o}px 0 #38bdf8`,
        animation: `fx-glitch ${num(v.rate, 5)}s steps(1) infinite`,
      };
    },
  },
  {
    id: 'rupture',
    name: 'Rupture',
    family: 'distortion',
    tagline: 'Split seam',
    description: 'A horizontal fault line slices the type into displaced halves.',
    controls: [
      { key: 'color', label: 'Face', type: 'color', default: '#e6e9f0' },
      { key: 'gap', label: 'Gap', type: 'range', min: 2, max: 24, step: 1, unit: 'px', default: 8 },
      { key: 'shift', label: 'Shift', type: 'range', min: 0, max: 20, step: 1, unit: 'px', default: 6 },
    ],
    style: (v) => {
      const c = String(v.color ?? '#e6e9f0');
      const g = num(v.gap, 8);
      const s = num(v.shift, 6);
      return {
        color: c,
        textShadow: `${s}px ${g / 2}px 0 ${c}88, ${-s}px ${-g / 2}px 0 #7cd5ff66`,
        clipPath: `inset(${g / 2}px 0 ${g / 2}px 0)`,
      };
    },
  },
  {
    id: 'static',
    name: 'Static',
    family: 'distortion',
    tagline: 'TV snow',
    description: 'An analog-noise scanline overlay crawling across the letterforms.',
    controls: [
      { key: 'color', label: 'Color', type: 'color', default: '#9aa3b5' },
      { key: 'speed', label: 'Speed', type: 'range', min: 1, max: 10, step: 0.5, unit: 's', default: 3 },
      { key: 'density', label: 'Density', type: 'range', min: 10, max: 60, step: 5, unit: '%', default: 30 },
    ],
    style: (v) => {
      const c = String(v.color ?? '#9aa3b5');
      const d = num(v.density, 30);
      return {
        color: c,
        backgroundImage: `repeating-linear-gradient(0deg, ${c} 0px, ${c} 1px, transparent 1px, transparent 3px)`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: `transparent`,
        animation: `fx-scan ${num(v.speed, 3)}s linear infinite`,
        ['--fx-density' as string]: `${d}%`,
      };
    },
  },

  // ── MATERIAL ────────────────────────────────────────────
  {
    id: 'chrome',
    name: 'Chrome',
    family: 'material',
    tagline: 'Polished metal',
    description: 'A mirror-finish gradient that reads as brushed, reflective chrome.',
    controls: [
      { key: 'tint', label: 'Tint', type: 'color', default: '#c4cbd8' },
      { key: 'angle', label: 'Angle', type: 'range', min: 0, max: 360, step: 15, unit: '°', default: 180 },
      { key: 'weight', label: 'Weight', type: 'select', options: ['500', '600', '700'], default: '700' },
    ],
    style: (v) => {
      const a = num(v.angle, 180);
      return {
        fontWeight: String(v.weight ?? '700'),
        backgroundImage: `linear-gradient(${a}deg, #4b5463 0%, #e6e9f0 25%, #6b7588 50%, #f7faf9 72%, #333a46 100%)`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
      };
    },
  },
  {
    id: 'gold',
    name: 'Gold',
    family: 'material',
    tagline: 'Foil leaf',
    description: 'Warm metallic foil with a soft sheen and deep amber lows.',
    controls: [
      { key: 'angle', label: 'Angle', type: 'range', min: 0, max: 360, step: 15, unit: '°', default: 180 },
      { key: 'sheen', label: 'Sheen', type: 'range', min: 0, max: 1, step: 1, default: 1 },
      { key: 'weight', label: 'Weight', type: 'select', options: ['500', '600', '700'], default: '700' },
    ],
    style: (v) => {
      const a = num(v.angle, 180);
      const base: React.CSSProperties = {
        fontWeight: String(v.weight ?? '700'),
        backgroundImage: `linear-gradient(${a}deg, #a85906 0%, #ffe8c0 30%, #ffb347 50%, #fff3d6 65%, #a85906 100%)`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        filter: 'drop-shadow(0 2px 8px rgba(255,179,71,0.25))',
      };
      if (num(v.sheen, 1) === 1) {
        base.backgroundSize = '200% auto';
        base.animation = 'fx-shimmer 4s linear infinite';
      }
      return base;
    },
  },
  {
    id: 'frost',
    name: 'Frost',
    family: 'material',
    tagline: 'Frozen glass',
    description: 'An icy translucent finish with crystalline edges and cool highlights.',
    controls: [
      { key: 'tint', label: 'Tint', type: 'color', default: '#7cd5ff' },
      { key: 'blur', label: 'Edge blur', type: 'range', min: 0, max: 4, step: 0.5, unit: 'px', default: 1.5 },
      { key: 'weight', label: 'Weight', type: 'select', options: ['400', '500', '600'], default: '500' },
    ],
    style: (v) => {
      const c = String(v.tint ?? '#7cd5ff');
      const b = num(v.blur, 1.5);
      return {
        fontWeight: String(v.weight ?? '500'),
        color: '#f7faf9',
        textShadow: `0 0 ${b}px ${c}, 0 0 ${b * 3}px ${c}88, 0 0 ${b * 6}px ${c}44`,
      };
    },
  },

  // ── CHROMATIC ───────────────────────────────────────────
  {
    id: 'spectrum',
    name: 'Spectrum',
    family: 'chromatic',
    tagline: 'Animated rainbow',
    description: 'A full-spectrum gradient that continuously rotates through the hue wheel.',
    controls: [
      { key: 'speed', label: 'Speed', type: 'range', min: 1, max: 12, step: 0.5, unit: 's', default: 4 },
      { key: 'weight', label: 'Weight', type: 'select', options: ['500', '600', '700'], default: '700' },
      { key: 'saturation', label: 'Saturation', type: 'range', min: 50, max: 100, step: 5, unit: '%', default: 85 },
    ],
    style: (v) => {
      const s = num(v.saturation, 85);
      return {
        fontWeight: String(v.weight ?? '700'),
        backgroundImage: `linear-gradient(90deg, hsl(0 ${s}% 60%), hsl(60 ${s}% 60%), hsl(120 ${s}% 55%), hsl(180 ${s}% 55%), hsl(240 ${s}% 65%), hsl(300 ${s}% 60%), hsl(360 ${s}% 60%))`,
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: `fx-shimmer ${num(v.speed, 4)}s linear infinite`,
      };
    },
  },
  {
    id: 'duotone',
    name: 'Duotone',
    family: 'chromatic',
    tagline: 'Two-tone split',
    description: 'A hard diagonal split between two colors — half and half, top to bottom.',
    controls: [
      { key: 'top', label: 'Top', type: 'color', default: '#c4f74e' },
      { key: 'bottom', label: 'Bottom', type: 'color', default: '#38bdf8' },
      { key: 'weight', label: 'Weight', type: 'select', options: ['500', '600', '700'], default: '700' },
    ],
    style: (v) => ({
      fontWeight: String(v.weight ?? '700'),
      backgroundImage: `linear-gradient(180deg, ${v.top ?? '#c4f74e'} 50%, ${v.bottom ?? '#38bdf8'} 50%)`,
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    }),
  },
  {
    id: 'cycled',
    name: 'Cycle',
    family: 'chromatic',
    tagline: 'Hue rotation',
    description: 'A solid color that continuously cycles its hue over time.',
    controls: [
      { key: 'color', label: 'Base', type: 'color', default: '#c4f74e' },
      { key: 'speed', label: 'Speed', type: 'range', min: 2, max: 16, step: 1, unit: 's', default: 6 },
      { key: 'weight', label: 'Weight', type: 'select', options: ['500', '600', '700'], default: '700' },
    ],
    style: (v) => ({
      fontWeight: String(v.weight ?? '700'),
      color: String(v.color ?? '#c4f74e'),
      animation: `fx-rainbow ${num(v.speed, 6)}s linear infinite`,
    }),
  },

  // ── STRUCTURAL ──────────────────────────────────────────
  {
    id: 'outline',
    name: 'Outline',
    family: 'structural',
    tagline: 'Hollow stroke',
    description: 'Transparent fill with a precise stroke — pure typographic skeleton.',
    controls: [
      { key: 'color', label: 'Stroke', type: 'color', default: '#e6e9f0' },
      { key: 'width', label: 'Width', type: 'range', min: 0.5, max: 4, step: 0.25, unit: 'px', default: 1.5 },
      { key: 'weight', label: 'Weight', type: 'select', options: ['500', '600', '700'], default: '700' },
    ],
    style: (v) => ({
      fontWeight: String(v.weight ?? '700'),
      color: 'transparent',
      WebkitTextStroke: `${num(v.width, 1.5)}px ${v.color ?? '#e6e9f0'}`,
    }),
  },
  {
    id: 'stack',
    name: 'Stack',
    family: 'structural',
    tagline: 'Layered echo',
    description: 'Repeated offset copies build a typographic extrusion with depth.',
    controls: [
      { key: 'color', label: 'Echo', type: 'color', default: '#c4f74e' },
      { key: 'depth', label: 'Depth', type: 'range', min: 2, max: 14, step: 1, unit: 'px', default: 6 },
      { key: 'weight', label: 'Weight', type: 'select', options: ['600', '700'], default: '700' },
    ],
    style: (v) => {
      const c = String(v.color ?? '#c4f74e');
      const d = num(v.depth, 6);
      const layers = Array.from({ length: 6 }, (_, i) => `${d * (i + 1) * 0.5}px ${d * (i + 1) * 0.4}px 0 ${c}${i === 5 ? '22' : ''}`);
      return {
        fontWeight: String(v.weight ?? '700'),
        color: '#f7faf9',
        textShadow: layers.join(', '),
      };
    },
  },
  {
    id: 'sparse',
    name: 'Sparse',
    family: 'structural',
    tagline: 'Wide tracking',
    description: 'Extreme letter-spacing that turns words into architectural columns.',
    controls: [
      { key: 'tracking', label: 'Tracking', type: 'range', min: 0.1, max: 1.5, step: 0.05, unit: 'em', default: 0.5 },
      { key: 'weight', label: 'Weight', type: 'select', options: ['200', '300', '400', '500'], default: '300' },
      { key: 'color', label: 'Color', type: 'color', default: '#c4cbd8' },
    ],
    style: (v) => ({
      fontWeight: String(v.weight ?? '300'),
      letterSpacing: `${num(v.tracking, 0.5)}em`,
      color: String(v.color ?? '#c4cbd8'),
    }),
  },
];

export const EFFECT_INDEX: Record<string, Effect> = Object.fromEntries(
  EFFECTS.map((e) => [e.id, e]),
);

export function defaultValues(effect: Effect): Record<string, number | string> {
  return Object.fromEntries(effect.controls.map((c) => [c.key, c.default]));
}

export function familyEffects(family: EffectFamily): Effect[] {
  return EFFECTS.filter((e) => e.family === family);
}

export const FAMILY_ORDER: EffectFamily[] = [
  'motion',
  'glow',
  'distortion',
  'material',
  'chromatic',
  'structural',
];
