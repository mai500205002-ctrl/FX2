import { useEffect, useState } from 'react'

interface ProviderStats {
  healthy: boolean
  totalCalls: number
  totalFailures: number
}

interface GatewayStats {
  totalCalls: number
  cacheHits: number
  cacheHitRate: number
  dedupHits: number
  queuedCalls: number
  activeConcurrent: number
  cacheSize: number
  inflight: number
  providers: Record<string, ProviderStats>
  budgets?: { chargedUsd: number; reservedUsd: number; runCount: number; storage: string }
  routing?: { version: string }
}

interface MetricsPayload {
  providerMode: string
  gateway: GatewayStats
}

export default function GatewayMetricsPanel({ apiBase, language }: { apiBase: string; language: 'ar' | 'en' }) {
  const [metrics, setMetrics] = useState<MetricsPayload | null>(null)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    let disposed = false
    let timer = 0

    const refresh = async () => {
      try {
        const response = await fetch(`${apiBase}/api/metrics`, { cache: 'no-store' })
        if (!response.ok) throw new Error('Metrics request failed')
        const payload = await response.json() as MetricsPayload
        if (!payload.gateway || typeof payload.gateway.totalCalls !== 'number') throw new Error('Invalid metrics response')
        if (!disposed) {
          setMetrics(payload)
          setUnavailable(false)
        }
      } catch {
        if (!disposed) setUnavailable(true)
      } finally {
        if (!disposed) timer = window.setTimeout(refresh, 15_000)
      }
    }

    void refresh()
    return () => {
      disposed = true
      window.clearTimeout(timer)
    }
  }, [apiBase])

  const labels = language === 'ar'
    ? { title: 'مراقبة البوابة', calls: 'الطلبات', cacheRate: 'معدل إصابة الذاكرة', cacheHits: 'إصابات الذاكرة', cacheSize: 'حجم الذاكرة', dedupHits: 'طلبات مدمجة', active: 'قيد التنفيذ', inflight: 'طلبات جارية', queued: 'في الانتظار', spent: 'إنفاق مقدر ($)', reserved: 'محجوز ($)', unavailable: 'المقاييس غير متاحة', ready: 'سليم', configured: 'المفتاح مضبوط', notConfigured: 'المفتاح غير مضبوط', routing: 'سياسة التوجيه' }
    : { title: 'Gateway telemetry', calls: 'Requests', cacheRate: 'Cache hit rate', cacheHits: 'Cache hits', cacheSize: 'Cache size', dedupHits: 'Deduplicated', active: 'Active', inflight: 'In flight', queued: 'Queued', spent: 'Estimated spend ($)', reserved: 'Reserved ($)', unavailable: 'Metrics unavailable', ready: 'Healthy', configured: 'Key configured', notConfigured: 'Key not configured', routing: 'Routing policy' }

  const gateway = metrics?.gateway
  const configured = metrics?.providerMode === 'Gemini'
  const providerHealthy = gateway?.providers.Gemini?.healthy

  const values = [
    { label: labels.calls, value: gateway?.totalCalls ?? '—' },
    { label: labels.cacheRate, value: gateway ? `${(gateway.cacheHitRate * 100).toFixed(1)}%` : '—' },
    { label: labels.cacheHits, value: gateway?.cacheHits ?? '—' },
    { label: labels.cacheSize, value: gateway?.cacheSize ?? '—' },
    { label: labels.dedupHits, value: gateway?.dedupHits ?? '—' },
    { label: labels.active, value: gateway?.activeConcurrent ?? '—' },
    { label: labels.inflight, value: gateway?.inflight ?? '—' },
    { label: labels.queued, value: gateway?.queuedCalls ?? '—' },
    { label: labels.spent, value: gateway?.budgets?.chargedUsd.toFixed(4) ?? '—' },
    { label: labels.reserved, value: gateway?.budgets?.reservedUsd.toFixed(4) ?? '—' },
  ]

  return (
    <section className="stage gateway-metrics" aria-labelledby="gateway-metrics-title" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="stage-header">
        <h2 className="stage-title" id="gateway-metrics-title">{labels.title}</h2>
        <span className={`gateway-provider${providerHealthy === false || unavailable ? ' is-unavailable' : ''}`} aria-live="polite">
          <span className="gateway-provider-dot" aria-hidden="true" />
          Gemini · {unavailable ? labels.unavailable : !configured ? labels.notConfigured : providerHealthy === false ? labels.unavailable : providerHealthy ? labels.ready : labels.configured}
        </span>
      </div>
      {gateway?.routing && <p className="gateway-routing">{labels.routing}: {gateway.routing.version}</p>}
      <div className="gateway-metrics-grid" aria-live="polite">
        {values.map(item => (
          <div className="gateway-metric" key={item.label}>
            <span className="gateway-metric-label">{item.label}</span>
            <strong className="gateway-metric-value">{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}