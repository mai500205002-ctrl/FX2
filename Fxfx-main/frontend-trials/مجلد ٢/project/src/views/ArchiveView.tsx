import { useCallback, useEffect, useState } from 'react';
import {
  Archive as ArchiveIcon,
  Trash2,
  ArrowUpRight,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EFFECT_INDEX, FAMILY_META } from '@/engine/effects';
import TextPreview from '@/components/TextPreview';
import { supabase, type CreationRow } from '@/lib/supabase';
import type { StudioSeed } from '@/views/Studio';

interface Props {
  onOpen: (seed: StudioSeed) => void;
}

export default function ArchiveView({ onOpen }: Props) {
  const [rows, setRows] = useState<CreationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('creations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setError('Could not load archive.');
    setRows((data as CreationRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from('creations').delete().eq('id', id);
    setDeletingId(null);
    if (error) {
      setError('Delete failed.');
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="animate-appear">
      <section className="px-8 md:px-14 py-8 border-b border-white/[0.06] flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <ArchiveIcon size={18} className="text-signal-300" />
            <h2 className="font-display text-3xl font-semibold tracking-tight">Archive</h2>
          </div>
          <p className="mt-2 text-base-400 text-[14px] max-w-xl">
            Saved compositions stored in your workspace. Click to reopen in the Studio.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg ring-hairline bg-white/[0.03] hover:bg-white/[0.06] text-base-200 text-sm px-3 py-2 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </section>

      <section className="px-8 md:px-14 py-8">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg ring-1 ring-error/30 bg-error/10 text-error text-sm px-4 py-3">
            <AlertTriangle size={15} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 rounded-xl2 ring-hairline bg-base-900 animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl2 ring-hairline bg-base-900 p-14 text-center">
            <ArchiveIcon size={26} className="mx-auto text-base-500" />
            <div className="mt-3 font-display text-lg">No saved creations yet</div>
            <div className="text-[13px] text-base-400 mt-1">
              Head to the Studio, compose an effect, and save it to build your archive.
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.map((c) => {
              const fx = EFFECT_INDEX[c.effect_id];
              const meta = fx ? FAMILY_META[fx.family] : null;
              return (
                <div
                  key={c.id}
                  className="group relative overflow-hidden rounded-xl2 ring-hairline bg-base-900 hover:bg-base-850 transition-colors flex flex-col"
                >
                  <button
                    onClick={() => onOpen({ effectId: c.effect_id, text: c.text })}
                    className="relative h-36 bg-base-950 bg-grid-fine overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-radial-glow opacity-50" />
                    {fx ? (
                      <TextPreview
                        effect={fx}
                        text={c.text}
                        values={c.values}
                        size="sm"
                        textClassName="!text-xl"
                        className="relative h-full"
                      />
                    ) : (
                      <div className="grid place-items-center h-full text-base-500 text-xs font-mono">
                        unknown effect
                      </div>
                    )}
                    <span className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight size={15} className="text-signal-300" />
                    </span>
                  </button>
                  <div className="p-4 border-t border-white/[0.06] flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{c.title}</div>
                      <div className="text-[11px] text-base-500 font-mono mt-1 flex items-center gap-2">
                        {meta && (
                          <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.hue }} />
                            {fx?.name}
                          </span>
                        )}
                        · {new Date(c.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      aria-label="Delete"
                      className="shrink-0 rounded-md p-1.5 text-base-500 hover:text-error hover:bg-error/10 transition-colors"
                    >
                      <Trash2 size={14} className={cn(deletingId === c.id && 'animate-pulse')} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
