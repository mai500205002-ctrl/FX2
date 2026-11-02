import { useMemo, useState } from 'react';
import { ArrowUpRight, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  EFFECTS,
  FAMILY_META,
  FAMILY_ORDER,
  type EffectFamily,
  familyEffects,
  defaultValues,
} from '@/engine/effects';
import TextPreview from '@/components/TextPreview';

interface Props {
  onOpenEffect: (id: string) => void;
}

// Radial layout: each family is a cluster center arranged on a circle;
// its effects orbit the family center.
const RADIUS_FAMILY = 240;
const RADIUS_EFFECT = 92;

interface NodePos {
  id: string;
  label: string;
  x: number;
  y: number;
  hue: string;
  kind: 'family' | 'effect';
  family: EffectFamily;
}

export default function CreativeGraph({ onOpenEffect }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const { nodes, links, viewW, viewH } = useMemo(() => {
    const cx = 460;
    const cy = 380;
    const nodes: NodePos[] = [];
    const links: { from: string; to: string }[] = [];

    FAMILY_ORDER.forEach((fam, i) => {
      const angle = (i / FAMILY_ORDER.length) * Math.PI * 2 - Math.PI / 2;
      const fx = cx + Math.cos(angle) * RADIUS_FAMILY;
      const fy = cy + Math.sin(angle) * RADIUS_FAMILY;
      const famId = `fam:${fam}`;
      const meta = FAMILY_META[fam];
      nodes.push({
        id: famId,
        label: meta.label,
        x: fx,
        y: fy,
        hue: meta.hue,
        kind: 'family',
        family: fam,
      });

      const items = familyEffects(fam);
      items.forEach((eff, j) => {
        const ea = angle + ((j - (items.length - 1) / 2) * Math.PI) / 7;
        const ex = fx + Math.cos(ea) * RADIUS_EFFECT;
        const ey = fy + Math.sin(ea) * RADIUS_EFFECT;
        nodes.push({
          id: eff.id,
          label: eff.name,
          x: ex,
          y: ey,
          hue: meta.hue,
          kind: 'effect',
          family: fam,
        });
        links.push({ from: famId, to: eff.id });
      });
    });

    return { nodes, links, viewW: 920, viewH: 760 };
  }, []);

  const byId = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);

  const hoveredNode = hovered ? byId[hovered] : null;
  const selectedNode = selected ? byId[selected] : null;
  const focused = selectedNode ?? hoveredNode;
  const isLinked = (id: string) => {
    if (!focused) return true;
    if (focused.id === id) return true;
    if (focused.kind === 'family') {
      return links.some(
        (l) => (l.from === focused.id && l.to === id) || (l.to === focused.id && l.from === id),
      );
    }
    // effect: highlight its family + siblings
    const famId = `fam:${focused.family}`;
    return id === famId || byId[id]?.family === focused.family;
  };

  const linkedLink = (l: { from: string; to: string }) => {
    if (!focused) return true;
    return [l.from, l.to].includes(focused.id) || (focused.kind === 'effect' && (l.from === `fam:${focused.family}` || l.to === `fam:${focused.family}`));
  };

  const previewEffect = useMemo(() => {
    if (!focused || focused.kind !== 'effect') return null;
    return EFFECTS.find((e) => e.id === focused.id) ?? null;
  }, [focused]);

  return (
    <div className="animate-appear h-full flex flex-col">
      <section className="px-8 md:px-14 py-8 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <Share2 size={18} className="text-signal-300" />
          <h2 className="font-display text-3xl font-semibold tracking-tight">Creative Graph</h2>
        </div>
        <p className="mt-2 text-base-400 text-[14px] max-w-2xl">
          Every effect mapped to its family. Hover to inspect, click to open in the Studio.
        </p>
      </section>

      <div className="flex-1 min-h-0 grid lg:grid-cols-[1fr_320px]">
        {/* Graph canvas */}
        <div className="relative overflow-auto bg-base-950 bg-grid-fine">
          <div className="absolute inset-0 bg-radial-glow opacity-50 pointer-events-none" />
          <svg
            viewBox={`0 0 ${viewW} ${viewH}`}
            className="w-full h-full min-w-[680px] min-h-[620px]"
          >
            {/* Links */}
            {links.map((l, i) => {
              const a = byId[l.from];
              const b = byId[l.to];
              if (!a || !b) return null;
              const active = linkedLink(l);
              return (
                <line
                  key={i}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={a.hue}
                  strokeWidth={active ? 1.4 : 0.6}
                  strokeOpacity={active ? 0.5 : 0.12}
                  className="transition-all duration-300"
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((n) => {
              const active = isLinked(n.id);
              const isFam = n.kind === 'family';
              const r = isFam ? 28 : 16;
              const isFocus = focused?.id === n.id;
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x} ${n.y})`}
                  className="cursor-pointer transition-opacity duration-300"
                  style={{ opacity: active ? 1 : 0.35 }}
                  onMouseEnter={() => setHovered(n.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => {
                    if (isFam) {
                      const first = familyEffects(n.family)[0];
                      if (first) onOpenEffect(first.id);
                    } else {
                      onOpenEffect(n.id);
                    }
                  }}
                >
                  {/* halo */}
                  {isFocus && (
                    <circle r={r + 10} fill={n.hue} opacity={0.12} />
                  )}
                  <circle
                    r={r}
                    fill={isFam ? `${n.hue}22` : '#111419'}
                    stroke={n.hue}
                    strokeWidth={isFam ? 2 : 1.25}
                    className="transition-all duration-300"
                  />
                  {isFam ? (
                    <text
                      textAnchor="middle"
                      dy="0.35em"
                      className="font-display"
                      fontSize={11}
                      fontWeight={600}
                      fill={n.hue}
                      style={{ pointerEvents: 'none' }}
                    >
                      {n.label.slice(0, 4)}
                    </text>
                  ) : (
                    <circle r={4} fill={n.hue} style={{ pointerEvents: 'none' }} />
                  )}
                  <text
                    textAnchor="middle"
                    y={r + 14}
                    fontSize={isFam ? 11 : 10}
                    fontWeight={isFam ? 600 : 500}
                    fill={isFam ? '#e6e9f0' : '#9aa3b5'}
                    className="font-display"
                    style={{ pointerEvents: 'none' }}
                  >
                    {n.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Inspector */}
        <aside className="border-l border-white/[0.06] bg-base-900/50 p-5 flex flex-col">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-base-500">
            Inspector
          </div>
          {!focused && (
            <div className="mt-6 text-sm text-base-400 leading-relaxed">
              Hover or click a node to inspect its effect.
            </div>
          )}
          {focused && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: focused.hue }} />
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-base-400">
                  {focused.kind === 'family' ? 'Family' : 'Effect'} · {FAMILY_META[focused.family].label}
                </span>
              </div>
              <div className="font-display text-xl font-semibold">{focused.label}</div>
              <div className="text-[13px] text-base-400 leading-relaxed">
                {focused.kind === 'family'
                  ? FAMILY_META[focused.family].blurb
                  : EFFECTS.find((e) => e.id === focused.id)?.description}
              </div>

              {previewEffect && (
                <div className="rounded-xl ring-hairline bg-base-950 bg-grid-fine h-32 grid place-items-center overflow-hidden">
                  <TextPreview
                    effect={previewEffect}
                    text="TEXTFX"
                    values={defaultValues(previewEffect)}
                    size="sm"
                    textClassName="!text-xl"
                    className="h-full"
                  />
                </div>
              )}

              <button
                onClick={() => {
                  if (focused.kind === 'effect') onOpenEffect(focused.id);
                  else {
                    const first = familyEffects(focused.family)[0];
                    if (first) onOpenEffect(first.id);
                  }
                }}
                className={cn(
                  'w-full inline-flex items-center justify-center gap-2 rounded-lg',
                  'bg-signal-300 hover:bg-signal-200 text-base-950 font-medium text-sm px-3.5 py-2.5 transition-colors',
                )}
              >
                Open in Studio
                <ArrowUpRight size={14} />
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
