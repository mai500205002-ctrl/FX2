import { useMemo, useState } from 'react';
import { Search, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  EFFECTS,
  FAMILY_META,
  FAMILY_ORDER,
  type EffectFamily,
  defaultValues,
} from '@/engine/effects';
import TextPreview from '@/components/TextPreview';

interface Props {
  onOpenEffect: (id: string) => void;
}

export default function LibraryView({ onOpenEffect }: Props) {
  const [query, setQuery] = useState('');
  const [family, setFamily] = useState<EffectFamily | 'all'>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EFFECTS.filter((e) => {
      if (family !== 'all' && e.family !== family) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.tagline.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.family.toLowerCase().includes(q)
      );
    });
  }, [query, family]);

  return (
    <div className="animate-appear">
      {/* Header */}
      <section className="px-8 md:px-14 py-10 border-b border-white/[0.06]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight">Effect Library</h2>
            <p className="mt-2 text-base-400 text-[14px] max-w-xl">
              {EFFECTS.length} effects across {FAMILY_ORDER.length} families. Every preview is live — click to open in the Studio.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl ring-hairline bg-base-900 px-3 py-2 w-full sm:w-72">
            <Search size={15} className="text-base-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search effects…"
              className="flex-1 bg-transparent text-sm text-base-100 placeholder:text-base-500 outline-none"
            />
          </div>
        </div>

        {/* Family filter chips */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Chip active={family === 'all'} onClick={() => setFamily('all')} label="All" dot="#9aa3b5" />
          {FAMILY_ORDER.map((f) => (
            <Chip
              key={f}
              active={family === f}
              onClick={() => setFamily(f)}
              label={FAMILY_META[f].label}
              dot={FAMILY_META[f].hue}
            />
          ))}
        </div>
      </section>

      {/* Grid */}
      <section className="px-8 md:px-14 py-8">
        {filtered.length === 0 ? (
          <div className="rounded-xl2 ring-hairline bg-base-900 p-12 text-center">
            <div className="text-base-300">No effects match “{query}”.</div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((e) => {
              const meta = FAMILY_META[e.family];
              return (
                <button
                  key={e.id}
                  onClick={() => onOpenEffect(e.id)}
                  className="group relative overflow-hidden rounded-xl2 ring-hairline bg-base-900 hover:bg-base-850 transition-colors text-left flex flex-col"
                >
                  {/* Preview */}
                  <div className="relative h-40 bg-base-950 bg-grid-fine overflow-hidden">
                    <div className="absolute inset-0 bg-radial-glow opacity-60" />
                    <TextPreview
                      effect={e}
                      text="TEXTFX"
                      values={defaultValues(e)}
                      size="sm"
                      className="relative h-full"
                      textClassName="!text-2xl"
                    />
                  </div>
                  {/* Meta */}
                  <div className="p-4 border-t border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: meta.hue }} />
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-base-500">
                        {meta.label}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="font-display font-medium">{e.name}</div>
                      <ArrowUpRight
                        size={15}
                        className="text-base-500 group-hover:text-signal-300 transition-colors"
                      />
                    </div>
                    <div className="text-[12px] text-base-400 mt-1 leading-relaxed">
                      {e.tagline}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  dot: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors',
        active
          ? 'bg-white/[0.08] text-base-50 ring-hairline'
          : 'bg-white/[0.02] text-base-400 hover:text-base-100 ring-hairline',
      )}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: dot }} />
      {label}
    </button>
  );
}
