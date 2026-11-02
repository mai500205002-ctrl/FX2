'use client'

import { RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { backend, type Metrics, type SaaSPlan, type Tenant, type Usage } from '@/lib/fx/backend-api'
import { extraDictionaries } from '@/lib/fx/i18n-extra'
import { cn } from '@/lib/utils'
import { FxButton } from '../primitives'
import { useWorkspace } from '../workspace-provider'

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold tabular-nums" dir="ltr">{value}</div>
    </div>
  )
}

const fmtUptime = (ms: number) => {
  const m = Math.floor(ms / 60000)
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`
}

export function ControlView() {
  const { state } = useWorkspace()
  const c = extraDictionaries[state.locale].control
  const [online, setOnline] = useState<boolean | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [keyOk, setKeyOk] = useState<boolean | null>(null)
  const [keyVal, setKeyVal] = useState('')
  const [keyErr, setKeyErr] = useState<string | null>(null)
  const [plans, setPlans] = useState<SaaSPlan[]>([])
  const [plan, setPlan] = useState<SaaSPlan['id']>('starter')
  const [company, setCompany] = useState('')
  const [tenant, setTenant] = useState<{ tenant: Tenant; usage: Usage } | null>(null)

  const refresh = useCallback(async () => {
    backend.health().then(() => setOnline(true)).catch(() => setOnline(false))
    backend.metrics().then(setMetrics).catch(() => setMetrics(null))
    backend.keyStatus().then((k) => setKeyOk(k.configured)).catch(() => setKeyOk(null))
    backend.saasPlans().then((p) => setPlans(p.plans)).catch(() => {})
  }, [])
  useEffect(() => void refresh(), [refresh])

  const saveKey = async () => {
    setKeyErr(null)
    try {
      await backend.setKey(keyVal.trim())
      setKeyVal('')
      refresh()
    } catch (e) {
      setKeyErr(e instanceof Error ? e.message : String(e))
    }
  }
  const register = async () => {
    try {
      setTenant(await backend.register(company.trim(), plan))
    } catch {
      /* surfaced by offline badge */
    }
  }

  const routes = Object.entries(metrics?.routes ?? {}).sort((a, b) => b[1].requests - a[1].requests).slice(0, 8)

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{c.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
        </div>
        <FxButton size="sm" variant="ghost" onClick={refresh}><RefreshCw aria-hidden /> {c.refresh}</FxButton>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title={c.server}>
          <div role="status" className="mb-4 flex items-center gap-2 text-sm">
            <span aria-hidden className={cn('size-2 rounded-full', online ? 'bg-success' : online === false ? 'bg-destructive' : 'bg-muted-foreground')} />
            {online ? c.online : online === false ? c.offline : '…'}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Stat label={c.provider} value={metrics?.providerMode ?? '—'} />
            <Stat label={c.uptime} value={metrics ? fmtUptime(metrics.uptime.ms) : '—'} />
            <Stat label={c.requests} value={metrics?.totals.requests ?? '—'} />
          </div>
        </Card>

        <Card title={c.key}>
          <p className="mb-3 text-sm">{keyOk ? c.keyOk : keyOk === false ? c.keyNo : '—'}</p>
          <div className="flex gap-2">
            <input
              type="password"
              dir="ltr"
              autoComplete="off"
              value={keyVal}
              onChange={(e) => setKeyVal(e.target.value)}
              placeholder={c.keyPh}
              aria-label={c.key}
              className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring"
            />
            <FxButton variant="primary" disabled={!keyVal.startsWith('sk-')} onClick={saveKey}>{c.keySave}</FxButton>
            {keyOk ? <FxButton onClick={() => backend.deleteKey().then(refresh)}>{c.keyRemove}</FxButton> : null}
          </div>
          {keyErr ? <p role="alert" className="mt-2 text-xs text-destructive">{keyErr}</p> : null}
          <p className="mt-2 text-xs text-muted-foreground">{c.keyHint}</p>
        </Card>
      </div>

      <Card title={c.metrics}>
        <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label={c.errors} value={`${metrics?.totals.errorRate ?? 0}%`} />
          <Stat label={c.gateway} value={metrics?.gateway?.totalCalls ?? 0} />
          <Stat label={c.cache} value={`${metrics?.gateway?.cacheHitRate ?? 0}%`} />
          <Stat label={c.requests} value={metrics?.totals.requests ?? 0} />
        </div>
        {routes.length ? (
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr><th className="py-1 text-start font-normal">{c.route}</th><th className="text-end font-normal">{c.requests}</th><th className="text-end font-normal">{c.avg}</th><th className="text-end font-normal">p95</th></tr>
            </thead>
            <tbody dir="ltr" className="font-mono text-xs">
              {routes.map(([r, s]) => (
                <tr key={r} className="border-t border-border"><td className="py-1.5">{r}</td><td className="text-end">{s.requests}</td><td className="text-end">{s.avgMs}ms</td><td className="text-end">{s.p95Ms}ms</td></tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </Card>

      <Card title={c.saas}>
        <div className="grid gap-3 md:grid-cols-3">
          {plans.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={plan === p.id}
              onClick={() => setPlan(p.id)}
              className={cn('rounded-md border p-3 text-start transition-colors', plan === p.id ? 'border-foreground bg-accent' : 'border-border hover:border-border-strong')}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{p.name}</span>
                {p.recommended ? <span className="rounded-full bg-signal/15 px-2 py-0.5 text-[10px] text-signal">{c.recommended}</span> : null}
              </div>
              <div className="my-1 text-lg font-semibold tabular-nums" dir="ltr">${p.priceMonthlyUsd}<span className="text-xs font-normal text-muted-foreground">{c.month}</span></div>
              <p className="text-xs text-muted-foreground">{p.description}</p>
              <p className="mt-2 text-xs tabular-nums" dir="ltr">{p.limits.agentRunsPerMonth} runs · {p.limits.aiCallsPerMonth} calls</p>
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder={c.company}
            aria-label={c.company}
            className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring"
          />
          <FxButton variant="signal" disabled={!company.trim()} onClick={register}>{c.register}</FxButton>
        </div>
        {tenant ? (
          <div className="mt-4 grid grid-cols-3 gap-4 rounded-md border border-border p-3">
            <Stat label={c.company} value={tenant.tenant.companyName} />
            <Stat label={c.runs} value={tenant.usage.agentRuns} />
            <Stat label={c.calls} value={tenant.usage.aiCallsEstimate} />
          </div>
        ) : null}
        <p className="mt-3 text-xs text-muted-foreground">{c.demoNote}</p>
      </Card>
    </div>
  )
}
