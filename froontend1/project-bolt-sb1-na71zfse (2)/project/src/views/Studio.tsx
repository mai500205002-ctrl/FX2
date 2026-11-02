import { useEffect, useMemo, useState } from 'react';
import {
  Save,
  Download,
  RotateCcw,
  Check,
  AlertTriangle,
  Type,
  SlidersHorizontal,
  Code2,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  EFFECTS,
  EFFECT_INDEX,
  FAMILY_META,
  FAMILY_ORDER,
  familyEffects,
  defaultValues,
  type EffectControl,
} from '@/engine/effects';
import { exportCSS } from '@/engine/render';
import TextPreview from '@/components/TextPreview';
import { supabase } from '@/lib/supabase';
export interface StudioSeed {
  effectId: string;
  text?: string;
}

interface Props {
  seed: StudioSeed | null;
  onClearSeed: () => void;
}

const DEFAULT_TEXT = 'TEXTFX';

export default function Studio({ seed, onClearSeed }: Props) {
  const [effectId, setEffectId] = useState('neon');
  const [text, setText] = useState(DEFAULT_TEXT);
  const [values, setValues] = useState<Record<string, number | string>>(() =>
    defaultValues(EFFECT_INDEX['neon']),
  );
  const [rightTab, setRightTab] = useState<'controls' | 'export'>('controls');
  const [saved, setSaved] = useState<null | { ok: boolean; msg: string }>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Apply incoming seeds (from Command Center / Library / Graph / Archive)
  useEffect(() => {
    if (!seed) return;
    if (seed.effectId && EFFECT_INDEX[seed.effectId]) {
      setEffectId(seed.effectId);
      setValues(defaultValues(EFFECT_INDEX[seed.effectId]));
    }
    if (typeof seed.text === 'string' && seed.text.length > 0) setText(seed.text);
    onClearSeed();
  }, [seed, onClearSeed]);

  const effect = EFFECT_INDEX[effectId];

  const updateValue = (key: string, v: number | string) => {
    setValues((prev) => ({ ...prev, [key]: v }));
  };

  const resetEffect = () => {
    setValues(defaultValues(effect));
  };

  const css = useMemo(() => exportCSS(effect, values), [effect, values]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(null);
    const title = `${effect.name} · ${text.slice(0, 16) || 'Untitled'}`;
    const { error } = await supabase.from('creations').insert({
      title,
      text,
      effect_id: effect.id,
      values,
      family: effect.family,
    });
    setSaving(false);
    setSaved(error ? { ok: false, msg: 'Save failed' } : { ok: true, msg: 'Saved to Archive' });
    setTimeout(() => setSaved(null), 2600);
  };

  const handleCopyCSS = async () => {
    try {
      await navigator.clipboard.writeText(css);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleDownloadCSS = () => {
    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `textfx-${effect.id}.css`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex">
      {/* Left — effect picker */}
      <aside className="w-[256px] shrink-0 border-r border-white/[0.06] bg-base-900/50 overflow-y-auto no-scrollbar">
        <div className="px-4 py-4 border-b border-white/[0.06]">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-base-500">
            Engine
          </div>
          <div className="font-display text-sm font-medium mt-0.5">Effects</div>
        </div>
        <div className="p-3 space-y-4">
          {FAMILY_ORDER.map((fam) => {
            const meta = FAMILY_META[fam];
            const items = familyEffects(fam);
            return (
              <div key={fam}>
                <div className="flex items-center gap-2 px-1.5 mb-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: meta.hue }} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-base-400">
                    {meta.label}
                  </span>
                </div>
                <div className="space-y-1">
                  {items.map((e) => {
                    const active = e.id === effectId;
                    return (
                      <button
                        key={e.id}
                        onClick={() => {
                          setEffectId(e.id);
                          setValues(defaultValues(e));
                        }}
                        className={cn(
                          'w-full text-left rounded-lg px-3 py-2 transition-colors',
                          active
                            ? 'bg-white/[0.07] text-base-50 ring-hairline'
                            : 'text-base-300 hover:bg-white/[0.03] hover:text-base-100',
                        )}
                      >
                        <div className="text-[13px] font-medium leading-tight">{e.name}</div>
                        <div className="text-[11px] text-base-500 leading-tight mt-0.5">
                          {e.tagline}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Center — preview */}
      <section className="flex-1 min-w-0 flex flex-col">
        {/* Text input bar */}
        <div className="border-b border-white/[0.06] px-6 py-3 flex items-center gap-3 bg-base-900/30">
          <Type size={15} className="text-base-400 shrink-0" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your text…"
            className="flex-1 min-w-0 bg-transparent text-base-100 placeholder:text-base-500 text-sm font-display outline-none"
          />
          <span className="font-mono text-[10px] text-base-500 hidden sm:block tabular-nums">
            {text.length} chars
          </span>
          <button
            onClick={() => setText(DEFAULT_TEXT)}
            className="font-mono text-[11px] text-base-400 hover:text-base-100 transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Canvas */}
        <div className="relative flex-1 min-h-0 overflow-hidden bg-base-950 bg-grid-fine">
          <div className="absolute inset-0 bg-radial-glow opacity-70" />
          <div className="absolute top-4 left-4 flex items-center gap-2 text-base-500">
            <Eye size={12} />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em]">Live preview</span>
          </div>
          <div className="absolute top-4 right-4 font-mono text-[10px] text-base-500 uppercase tracking-[0.18em]">
            {effect.name} · {effect.family}
          </div>
          <div className="relative h-full grid place-items-center p-8">
            <TextPreview
              effect={effect}
              text={text}
              values={values}
              size="lg"
              className="w-full max-w-4xl"
            />
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-base-500">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em]">
              {FAMILY_META[effect.family].blurb}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em]">
              {EFFECTS.length} effects available
            </span>
          </div>
        </div>

        {/* Action bar */}
        <div className="border-t border-white/[0.06] px-6 py-3.5 flex items-center gap-3 bg-base-900/40">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-signal-300 hover:bg-signal-200 disabled:opacity-60 text-base-950 font-medium text-sm px-3.5 py-2 transition-colors"
          >
            <Save size={15} />
            {saving ? 'Saving…' : 'Save to Archive'}
          </button>
          <button
            onClick={handleDownloadCSS}
            className="inline-flex items-center gap-2 rounded-lg ring-hairline bg-white/[0.04] hover:bg-white/[0.07] text-base-100 text-sm px-3.5 py-2 transition-colors"
          >
            <Download size={15} />
            Export CSS
          </button>
          <button
            onClick={resetEffect}
            className="inline-flex items-center gap-2 rounded-lg ring-hairline bg-white/[0.02] hover:bg-white/[0.05] text-base-300 hover:text-base-100 text-sm px-3.5 py-2 transition-colors"
          >
            <RotateCcw size={15} />
            Reset
          </button>
          {saved && (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 text-[12px] font-mono',
                saved.ok ? 'text-success' : 'text-error',
              )}
            >
              {saved.ok ? <Check size={13} /> : <AlertTriangle size={13} />}
              {saved.msg}
            </span>
          )}
        </div>
      </section>

      {/* Right — controls / export */}
      <aside className="w-[320px] shrink-0 border-l border-white/[0.06] bg-base-900/50 flex flex-col">
        <div className="flex border-b border-white/[0.06]">
          <TabBtn active={rightTab === 'controls'} onClick={() => setRightTab('controls')} icon={SlidersHorizontal} label="Controls" />
          <TabBtn active={rightTab === 'export'} onClick={() => setRightTab('export')} icon={Code2} label="Export" />
        </div>

        {rightTab === 'controls' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div>
              <div className="font-display text-base font-medium">{effect.name}</div>
              <div className="text-[12px] text-base-400 mt-1 leading-relaxed">
                {effect.description}
              </div>
            </div>
            <div className="h-px bg-white/[0.06]" />
            <div className="space-y-5">
              {effect.controls.map((c) => (
                <Control
                  key={c.key}
                  control={c}
                  value={values[c.key] ?? c.default}
                  onChange={(v) => updateValue(c.key, v)}
                />
              ))}
            </div>
          </div>
        )}

        {rightTab === 'export' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div>
              <div className="font-display text-base font-medium">CSS export</div>
              <div className="text-[12px] text-base-400 mt-1 leading-relaxed">
                Copy the generated rule and apply the class to any element.
              </div>
            </div>
            <pre className="rounded-xl ring-hairline bg-base-950 p-4 text-[11px] font-mono leading-relaxed text-base-200 overflow-auto whitespace-pre-wrap break-all">
              {css}
            </pre>
            <div className="flex gap-2">
              <button
                onClick={handleCopyCSS}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-signal-300 hover:bg-signal-200 text-base-950 text-sm font-medium px-3 py-2 transition-colors"
              >
                <Check size={14} className={cn(!copied && 'hidden')} />
                {copied ? 'Copied' : 'Copy CSS'}
              </button>
              <button
                onClick={handleDownloadCSS}
                className="inline-flex items-center gap-2 rounded-lg ring-hairline bg-white/[0.04] hover:bg-white/[0.07] text-base-100 text-sm px-3 py-2 transition-colors"
              >
                <Download size={14} />
                .css
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof SlidersHorizontal;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center justify-center gap-2 py-3 text-[12px] font-medium transition-colors border-b-2',
        active
          ? 'text-signal-300 border-signal-300'
          : 'text-base-400 border-transparent hover:text-base-100',
      )}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function Control({
  control,
  value,
  onChange,
}: {
  control: EffectControl;
  value: number | string;
  onChange: (v: number | string) => void;
}) {
  if (control.type === 'color') {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[12px] text-base-300">{control.label}</label>
          <span className="font-mono text-[10px] text-base-500 uppercase">{String(value)}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-12 rounded-md bg-transparent cursor-pointer ring-hairline"
          />
          <input
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 rounded-lg ring-hairline bg-base-950 px-3 py-2 text-[12px] font-mono text-base-200 outline-none focus:ring-signal-300/40"
          />
        </div>
      </div>
    );
  }

  if (control.type === 'select') {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[12px] text-base-300">{control.label}</label>
          <span className="font-mono text-[10px] text-base-500 uppercase">{String(value)}</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {control.options?.map((opt) => (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={cn(
                'rounded-lg py-1.5 text-[11px] font-mono transition-colors',
                String(value) === opt
                  ? 'bg-signal-300 text-base-950 font-semibold'
                  : 'ring-hairline bg-white/[0.03] text-base-300 hover:text-base-100',
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // range
  const min = control.min ?? 0;
  const max = control.max ?? 100;
  const step = control.step ?? 1;
  const pct = ((Number(value) - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[12px] text-base-300">{control.label}</label>
        <span className="font-mono text-[11px] text-base-200 tabular-nums">
          {value}
          {control.unit ? <span className="text-base-500">{control.unit}</span> : null}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Number(value)}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5
                   [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-signal-300
                   [&::-webkit-slider-thumb]:shadow-signal [&::-webkit-slider-thumb]:cursor-pointer"
        style={{
          background: `linear-gradient(to right, #c4f74e ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
        }}
      />
    </div>
  );
}
