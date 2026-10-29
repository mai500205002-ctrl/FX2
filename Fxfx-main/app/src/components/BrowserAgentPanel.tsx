import React, { useState } from 'react'
import { backendFetch } from '../backend-fetch'

export interface BrowserAttachment { runId: string; token: string }
interface Research {
  runId: string; status: string; goal: string; completedAt: string
  evidence: Array<{ evidenceId: string; title: string; sourceUrl: string; text: string; retrievedAt: string; contentHash: string; truncated: boolean }>
  errors: Array<{ url: string; code: string; message: string }>
}
export default function BrowserAgentPanel({ apiBase, language, onAttach }: { apiBase: string; language: 'ar' | 'en'; onAttach: (value: BrowserAttachment | null) => void }) {
  const ar = language === 'ar'
  const [token, setToken] = useState('')
  const [goal, setGoal] = useState('')
  const [urls, setUrls] = useState('https://example.com/')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [research, setResearch] = useState<Research | null>(null)
  const [runId, setRunId] = useState('')
  const [attached, setAttached] = useState(false)
  const labels = ar ? {
    title: 'وكيل المتصفح — بحث للقراءة فقط', intro: 'قراءة روابط محددة من نطاقات يسمح بها الخادم. بلا بحث تلقائي أو نقر أو تسجيل دخول أو نشر. محتوى الصفحات غير موثوق وليس اعتمادًا للادعاءات.',
    token: 'رمز الوصول المحلي للمتصفح', goal: 'هدف البحث', urls: 'روابط HTTPS — رابط في كل سطر، حتى 3 روابط', run: 'قراءة الصفحات', restore: 'استرجاع نسخة محفوظة', id: 'معرّف البحث', export: 'تنزيل البحث JSON', attach: 'استخدام كمراجع غير معتمدة في تشغيل الوكيل التالي', detach: 'فصل المراجع', remove: 'حذف النسخة المحفوظة', busy: 'جارٍ التنفيذ…', note: 'الرمز يحتفظ به في الذاكرة المؤقتة فقط. يلزم إعداد الخادم وتثبيت Chromium أولًا. إرفاق البحث يجعل النتيجة محتاجة لمراجعة بشرية.',
  } : {
    title: 'Browser Agent — read-only research', intro: 'Reads supplied URLs on server-allowed hosts. No autonomous search, clicks, login or publication. Page content is untrusted, not claim approval.',
    token: 'Local browser access token', goal: 'Research goal', urls: 'HTTPS URLs — one per line, maximum 3', run: 'Read pages', restore: 'Restore saved snapshot', id: 'Research ID', export: 'Download research JSON', attach: 'Use as unreviewed references in the next agent run', detach: 'Detach references', remove: 'Delete saved snapshot', busy: 'Working…', note: 'Token stays in temporary memory only. Server configuration and Chromium installation are required. Attached research forces a human-review verdict.',
  }
  async function request(action: 'run' | 'restore' | 'delete') {
    setBusy(true); setError(''); setAttached(false); onAttach(null)
    try {
      const id = action === 'delete' ? research?.runId : runId.trim()
      const response = await backendFetch(`${apiBase}/api/browser/${action === 'run' ? 'research' : `runs/${encodeURIComponent(id || '')}`}`, {
        method: action === 'run' ? 'POST' : action === 'delete' ? 'DELETE' : 'GET',
        headers: { 'Content-Type': 'application/json', 'X-TextFX-Browser-Token': `Bearer ${token}` },
        ...(action === 'run' ? { body: JSON.stringify({ goal, urls: urls.split('\n').map(s => s.trim()).filter(Boolean) }) } : {}),
      })
      if (action === 'delete' && response.status === 204) { setResearch(null); setRunId(''); return }
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`)
      setResearch(data.research); setRunId(data.research.runId)
    } catch (e) { setError(e instanceof Error ? e.message : 'Browser request failed') }
    finally { setBusy(false) }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(research, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a'); a.href = url; a.download = `textfx-research-${research?.runId}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <section className="stage browser-agent" dir={ar ? 'rtl' : 'ltr'} aria-labelledby="browser-agent-title">
    <div className="stage-header"><h2 id="browser-agent-title" className="stage-title">{labels.title}</h2></div>
    <div className="pane browser-form">
      <p>{labels.intro}</p>
      <label>{labels.token}<input style={{ width: '100%' }} type="password" autoComplete="off" value={token} onChange={e => { setToken(e.target.value); onAttach(null); setAttached(false) }} /></label>
      <label>{labels.goal}<input style={{ width: '100%' }} maxLength={1000} value={goal} onChange={e => setGoal(e.target.value)} /></label>
      <label>{labels.urls}<textarea style={{ width: '100%' }} rows={3} dir="ltr" value={urls} onChange={e => setUrls(e.target.value)} /></label>
      <p><small>{labels.note}</small></p>
      <div className="btn-row"><button className="btn btn-primary" disabled={busy || !goal.trim() || !token} onClick={() => void request('run')}>{busy ? labels.busy : labels.run}</button></div>
      <label>{labels.id}<input dir="ltr" style={{ width: '100%' }} value={runId} onChange={e => setRunId(e.target.value)} /></label>
      <div className="btn-row"><button className="btn btn-secondary" disabled={busy || !runId.trim() || !token} onClick={() => void request('restore')}>{labels.restore}</button></div>
      {error && <p role="alert">{error}</p>}
      {research && <div aria-live="polite">
        <p><strong>{research.status}</strong> · <code>{research.runId}</code></p>
        <div className="btn-row browser-actions"><button className="btn btn-secondary" onClick={download}>{labels.export}</button>
        <button className="btn btn-secondary" disabled={busy || !research.evidence.length} onClick={() => { const next = !attached; setAttached(next); onAttach(next ? { runId: research.runId, token } : null) }}>{attached ? labels.detach : labels.attach}</button>
        <button className="btn btn-ghost" disabled={busy} onClick={() => void request('delete')}>{labels.remove}</button></div>
        {research.evidence.map(item => <article key={item.evidenceId}>
          <h3><a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">{item.title || item.sourceUrl}</a></h3>
          <small>{item.retrievedAt} · unreviewed {item.truncated ? '· truncated' : ''}</small>
          <details><summary>{ar ? 'النص والبصمة' : 'Text and fingerprint'}</summary><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }} dir="auto">{item.text}</pre><code style={{ overflowWrap: 'anywhere' }}>{item.contentHash}</code></details>
        </article>)}
        {research.errors.map((item, index) => <p key={index} role="status">{item.url} — {item.code}: {item.message}</p>)}
      </div>}
    </div>
  </section>
}
