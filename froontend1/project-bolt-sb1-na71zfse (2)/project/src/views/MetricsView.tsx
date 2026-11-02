import { useCallback, useEffect, useState } from 'react';
import { Activity, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { api, ApiError, type MetricsResponse } from '@/lib/api';

export default function MetricsView() {
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.getMetrics());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  const routeEntries = data ? Object.entries(data).filter(([k]) => k !== 'gateway') : [];
  const gw = data?.gateway;

  return (
    <div className="animate-appear px-8 md:px-12 py-8 max-w-5xl">
      <div className="flex items-center gap-2.5 mb-2">
        <Activity size={18} className="text-signal-300" />
        <h2 className="font-display text-2xl font-semibold tracking-tight">Metrics</h2>
        <button
          onClick={load}
          className="ml-auto inline-flex items-center gap-2 rounded-lg ring-hairline bg-white/[0.03] hover:bg-white/[0.06] text-base-200 text-sm px-3 py-2 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>
      <p className="text-[13px] text-base-400">
        Live system health from <span className="font-mono">/api/metrics</span>. Auto-refreshes every 5s.
      </p>

      {error && (
        <div className="mt-5 flex items-start gap-2 rounded-lg ring-1 ring-error/30 bg-error/10 text-error text-[13px] px-4 py-3">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <div>
            <div className="font-medium">Could not load metrics</div>
            <div className="text-[12px] opacity-90 mt-0.5">{error}</div>
            <div className="text-[11px] opacity-70 mt-1 font-mono">Backend at {api.base}</div>
          </div>
        </div>
      )}

      {loading && !data && (
        <div className="mt-10 grid place-items-center">
          <Loader2 size={24} className="text-signal-300 animate-spin" />
        </div>
      )}

      {data && (
        <>
          {/* Gateway stats */}
          {gw && (
            <section className="mt-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-base-500 mb-3">
                LLM Gateway
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Total calls" value={gw.totalCalls} />
                <Stat label="Cache hits" value={gw.cacheHits} />
                <Stat label="Cache hit rate" value={`${gw.cacheHitRate}%`} />
                <Stat label="Dedup hits" value={gw.dedupHits} />
                <Stat label="Queued" value={gw.queuedCalls} />
                <Stat label="Active concurrent" value={gw.activeConcurrent} />
                <Stat label="Cache size" value={gw.cacheSize} />
                <Stat label="In-flight" value={gw.inflight} />
              </div>

              {gw.providers && (
                <div className="mt-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-base-500 mb-2">
                    Providers
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(gw.providers).map(([name, p]) => {
                      const prov = p as Record<string, unknown>;
                      const healthy = prov.healthy !== false;
                      return (
                        <div key={name} className="rounded-xl ring-hairline bg-base-900 p-4">
                          <div className="flex items-center justify-between">
                            <span className="font-display font-medium text-[14px]">{name}</span>
                            <span
                              className={`h-2 w-2 rounded-full ${healthy ? 'bg-success' : 'bg-error'}`}
                            />
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono text-base-400">
                            <div>calls: {String(prov.totalCalls ?? 0)}</div>
                            <div>failures: {String(prov.totalFailures ?? 0)}</div>
                            <div>retries: {String(prov.totalRetries ?? 0)}</div>
                            <div>timeouts: {String(prov.totalTimeouts ?? 0)}</div>
                            <div>tokens: {String(prov.totalTokens ?? 0)}</div>
                            <div>cost: ${String(prov.estimatedCostUsd ?? 0)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Route metrics */}
          {routeEntries.length > 0 && (
            <section className="mt-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-base-500 mb-3">
                Route metrics
              </div>
              <div className="rounded-xl2 ring-hairline bg-base-900 overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left">
                      <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-base-500">Route</th>
                      <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-base-500">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routeEntries.map(([route, val]) => (
                      <tr key={route} className="border-b border-white/[0.04] last:border-0">
                        <td className="px-4 py-3 font-mono text-[12px] text-base-200">{route}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-base-400">
                          {typeof val === 'object' && val ? JSON.stringify(val) : String(val)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl ring-hairline bg-base-900 p-4">
      <div className="font-display text-xl font-semibold tabular-nums">{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-base-500 mt-1">
        {label}
      </div>
    </div>
  );
}
