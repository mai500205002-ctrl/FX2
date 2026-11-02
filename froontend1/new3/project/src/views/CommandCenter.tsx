import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Wand2,
  Library,
  Workflow,
  Bot,
  Archive,
  Sparkles,
  Cpu,
  Layers,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RouteId } from '@/App';
import type { StudioSeed } from '@/views/Studio';
import {
  EFFECTS,
  FAMILY_META,
  FAMILY_ORDER,
  familyEffects,
} from '@/engine/effects';
import TextPreview from '@/components/TextPreview';
import { supabase, type CreationRow } from '@/lib/supabase';

interface Props {
  onOpenStudio: (seed: StudioSeed) => void;
  onNavigate: (r: RouteId) => void;
}

export default function CommandCenter({ onOpenStudio, onNavigate }: Props) {
  const [recent, setRecent] = useState<CreationRow[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('creations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
      if (active && !error) setRecent((data as CreationRow[]) ?? []);
      if (active) setLoadingRecent(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const totalEffects = EFFECTS.length;
  const totalFamilies = FAMILY_ORDER.length;

  return (
    <div className="animate-appear">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute inset-0 bg-radial-glow" />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-signal-300/10 blur-3xl" />

        <div className="relative px-8 py-14 md:px-14 md:py-20 max-w-6xl">
          <div className="flex items-center gap-2 mb-5">
            <span className="flex items-center gap-1.5 rounded-full ring-hairline bg-white/[0.04] px-3 py-1">
              <Sparkles size={12} className="text-signal-300" />
              <span className="font-mono text-[11px] text-base-300 uppercase tracking-[0.18em]">
                Creative Intelligence OS
              </span>
            </span>
          </div>
          <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-balance max-w-3xl">
            The operating system
            <br />
            for{' '}
            <span className="text-signal-300">generative text effects</span>.
          </h2>
          <p className="mt-5 text-base-300 max-w-xl text-[15px] leading-relaxed">
            Compose, preview, and archive living typography. {totalEffects} effects across{' '}
            {totalFamilies} families — motion, glow, distortion, material, chromatic, and structural.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenStudio({ effectId: 'neon' })}
              className="group inline-flex items-center gap-2 rounded-xl bg-signal-300 hover:bg-signal-200 text-base-950 font-medium text-sm px-4 py-2.5 transition-colors duration-200 shadow-signal"
            >
              <Wand2 size={16} />
              Launch Studio
              <ArrowUpRight size={15} className="opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
            <button
              onClick={() => onNavigate('studio')}
              className="inline-flex items-center gap-2 rounded-xl ring-hairline bg-white/[0.03] hover:bg-white/[0.06] text-base-100 font-medium text-sm px-4 py-2.5 transition-colors duration-200"
            >
              <Library size={16} />
              Browse Effects
            </button>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="px-8 md:px-14 py-8 border-b border-white/[0.06]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Layers} label="Effects" value={String(totalEffects)} accent="signal" />
          <StatCard icon={Cpu} label="Families" value={String(totalFamilies)} accent="sky" />
          <StatCard
            icon={Archive}
            label="Saved"
            value={loadingRecent ? '—' : String(recent.length === 0 ? 0 : recent.length)}
            accent="ember"
            hint={loadingRecent ? 'Loading' : 'Recent 3 shown'}
          />
          <StatCard icon={Activity} label="Engine" value="v1.0" accent="neutral" hint="Local render" />
        </div>
      </section>

      {/* Quick actions + Recent */}
      <section className="px-8 md:px-14 py-10 grid lg:grid-cols-3 gap-6">
        {/* Quick launch families */}
        <div className="lg:col-span-2">
          <SectionHeader title="Quick launch" subtitle="Jump into a family" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {FAMILY_ORDER.map((fam) => {
              const meta = FAMILY_META[fam];
              const sample = familyEffects(fam)[0];
              return (
                <button
                  key={fam}
                  onClick={() => onOpenStudio({ effectId: sample.id })}
                  className="group relative overflow-hidden rounded-xl2 ring-hairline bg-base-850 hover:bg-base-800 transition-colors duration-300 p-5 text-left"
                >
                  <div
                    className="absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"
                    style={{ background: meta.hue }}
                  />
                  <div className="relative">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-base-500">
                      Family
                    </div>
                    <div className="font-display text-lg font-medium mt-1" style={{ color: meta.hue }}>
                      {meta.label}
                    </div>
                    <div className="text-[12px] text-base-400 mt-1">{meta.blurb}</div>
                    <div className="mt-4 h-14 rounded-lg bg-base-950/60 ring-hairline overflow-hidden">
                      {sample && (
                        <TextPreview
                          effect={sample}
                          text="TEXTFX"
                          values={Object.fromEntries(
                            sample.controls.map((c) => [c.key, c.default]),
                          )}
                          size="sm"
                          className="h-full py-2"
                          textClassName="!text-base"
                        />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent */}
        <div>
          <SectionHeader title="Recent archive" subtitle="Last 3 saves" />
          <div className="mt-4 space-y-2.5">
            {loadingRecent && (
              <div className="rounded-xl ring-hairline bg-base-850 p-4 text-base-400 text-sm">
                Loading recent creations…
              </div>
            )}
            {!loadingRecent && recent.length === 0 && (
              <div className="rounded-xl ring-hairline bg-base-850 p-5 text-center">
                <Archive size={20} className="mx-auto text-base-500" />
                <div className="mt-2 text-sm text-base-300">Nothing saved yet</div>
                <div className="text-[12px] text-base-500 mt-0.5">
                  Save a composition in the Studio.
                </div>
              </div>
            )}
            {!loadingRecent &&
              recent.map((c) => {
                const fx = EFFECTS.find((e) => e.id === c.effect_id);
                return (
                  <button
                    key={c.id}
                    onClick={() => onOpenStudio({ effectId: c.effect_id, text: c.text })}
                    className="w-full text-left rounded-xl ring-hairline bg-base-850 hover:bg-base-800 transition-colors p-3.5 flex items-center gap-3"
                  >
                    <div className="h-11 w-11 rounded-lg bg-base-950/60 ring-hairline grid place-items-center shrink-0 overflow-hidden">
                      {fx && (
                        <TextPreview
                          effect={fx}
                          text={c.text.slice(0, 1) || 'T'}
                          values={c.values}
                          size="sm"
                          className="p-0 h-full"
                          textClassName="!text-sm"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{c.title}</div>
                      <div className="text-[11px] text-base-500 truncate font-mono">
                        {c.effect_id} · {new Date(c.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <ArrowUpRight size={14} className="text-base-500 shrink-0" />
                  </button>
                );
              })}
          </div>
        </div>
      </section>

      {/* Explore row */}
      <section className="px-8 md:px-14 pb-14">
        <SectionHeader title="Explore" subtitle="Other surfaces" />
        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          <ExploreCard
            icon={Workflow}
            title="Pipeline"
            body="Run a brief through insight, concept, and script."
            onClick={() => onNavigate('pipeline')}
          />
          <ExploreCard
            icon={Bot}
            title="Agent"
            body="Autonomous goal-driven creative runs."
            onClick={() => onNavigate('agent')}
          />
          <ExploreCard
            icon={Archive}
            title="Archive"
            body="All your saved compositions, ready to reopen."
            onClick={() => onNavigate('archive')}
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: typeof Cpu;
  label: string;
  value: string;
  hint?: string;
  accent: 'signal' | 'sky' | 'ember' | 'neutral';
}) {
  const color =
    accent === 'signal'
      ? 'text-signal-300'
      : accent === 'sky'
        ? 'text-sky2-400'
        : accent === 'ember'
          ? 'text-ember-300'
          : 'text-base-200';
  return (
    <div className="rounded-xl ring-hairline bg-base-900 p-4">
      <div className="flex items-center justify-between">
        <Icon size={16} className={color} />
        <span className="font-mono text-[10px] text-base-500 uppercase tracking-[0.18em]">
          {label}
        </span>
      </div>
      <div className="mt-3 font-display text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="text-[11px] text-base-500 mt-0.5">{hint}</div>}
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <h3 className="font-display text-lg font-medium tracking-tight">{title}</h3>
      <span className="font-mono text-[11px] text-base-500 uppercase tracking-[0.16em]">
        {subtitle}
      </span>
    </div>
  );
}

function ExploreCard({
  icon: Icon,
  title,
  body,
  onClick,
}: {
  icon: typeof Library;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-xl2 ring-hairline bg-base-900 hover:bg-base-850 transition-colors p-5 text-left"
    >
      <Icon size={18} className="text-base-300 group-hover:text-signal-300 transition-colors" />
      <div className="mt-3 font-display font-medium">{title}</div>
      <div className="text-[13px] text-base-400 mt-1 leading-relaxed">{body}</div>
    </button>
  );
}
