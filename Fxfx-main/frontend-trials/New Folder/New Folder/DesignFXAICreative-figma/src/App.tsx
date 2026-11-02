import { useCallback, useEffect, useState } from 'react'
import { COPY, initialWork, type Ctx, type Lang, type View, type Work } from './content'
import { Ribbon, TopBar } from './components/Shell'
import Directions from './views/Directions'
import Home from './views/Home'
import Brief from './views/Brief'
import Engines from './views/Engines'
import Insight from './views/Insight'
import Concept from './views/Concept'
import Script from './views/Script'
import Output from './views/Output'

export default function App() {
  const [lang, setLang] = useState<Lang>('en')
  const [view, setView] = useState<View>('directions')
  const [works, setWorks] = useState<Record<Lang, Work>>(() => ({ en: initialWork(COPY.en), ar: initialWork(COPY.ar) }))
  const [msg, setMsg] = useState('')
  const t = COPY[lang]

  useEffect(() => {
    document.documentElement.dir = t.dir
    document.documentElement.lang = lang
  }, [lang, t.dir])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [view])

  useEffect(() => {
    if (!msg) return
    const id = setTimeout(() => setMsg(''), 2800)
    return () => clearTimeout(id)
  }, [msg])

  const setWork = useCallback((f: (w: Work) => Work) => setWorks((all) => ({ ...all, [lang]: f(all[lang]) })), [lang])

  const c: Ctx = { t, lang, work: works[lang], setWork, go: setView, toast: setMsg }

  const reset = () => {
    setWorks((all) => ({ ...all, [lang]: initialWork(t) }))
    setMsg(t.ui.ou_reset)
    setView('brief')
  }

  if (view === 'directions') return <Directions onEnter={() => setView('home')} />

  return (
    <div className="min-h-screen">
      <TopBar c={c} view={view} lang={lang} setLang={setLang} />
      <Ribbon c={c} view={view} />
      <main key={`${view}-${lang}`} className="rise">
        {view === 'home' && <Home c={c} />}
        {view === 'brief' && <Brief c={c} />}
        {view === 'engines' && <Engines c={c} />}
        {view === 'insight' && <Insight c={c} />}
        {view === 'concept' && <Concept c={c} />}
        {view === 'script' && <Script c={c} />}
        {view === 'output' && <Output c={c} onReset={reset} />}
      </main>
      {msg && (
        <div role="status" className="rise fixed bottom-24 left-1/2 z-50 -translate-x-1/2 bg-bone px-5 py-3 text-[13px] text-bg">
          {msg}
        </div>
      )}
    </div>
  )
}
