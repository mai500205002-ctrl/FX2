/**
 * TextFX v5 — Mobile-First Production Frontend
 * Features: ErrorBoundary · dark/light persistence · fetch + AbortController
 *           auto-scroll refs · aria attributes · safe-area · no embedded secrets
 */
import React, { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react'
import { jsPDF } from 'jspdf'
import AgentSaaSPanel from './components/AgentSaaSPanel'
import BrowserAgentPanel, { type BrowserAttachment } from './components/BrowserAgentPanel'
import GatewayMetricsPanel from './components/GatewayMetricsPanel'
import { backendFetch } from './backend-fetch'

// ─────────────────────────────────────────────────────────────────────────────
// ErrorBoundary
// ─────────────────────────────────────────────────────────────────────────────
interface EBState { hasError: boolean; message: string }
class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { hasError: false, message: '' }

  static getDerivedStateFromError(err: Error): EBState {
    return { hasError: true, message: err.message }
  }
  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error(JSON.stringify({ level:'error', ts: new Date().toISOString(),
      msg: 'ErrorBoundary caught', error: err.message, componentStack: info.componentStack }))
  }
  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.message}</p>
          <button className="btn btn-primary" onClick={() => this.setState({ hasError:false, message:'' })}>
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface AgentVoice {
  agent: 'Creative Rebel' | 'Strategy Master' | 'Picky Client'
  stance: string; sharpCritique: string; contribution: string
  trendAngle?: string; liveEventCite?: string
}
interface AgentDebate {
  voices: AgentVoice[]
  conflictPoint: string; resolution: string; debateSummary: string
  trendConnection?: string
  finalMasterpiece: {
    headline: string; tagline: string; coreIdea: string
    emotionalTruth: string; creativeDevice: string; visualNotes: string
  }
}
type ProviderId = 'auto'|'openrouter'|'openai'|'gemini'|'grok'
interface ProviderOption {
  id: Exclude<ProviderId, 'auto'>
  label: string
  configured: boolean
  models: string[]
}
interface EvidenceReference {
  evidenceId: string
  sourceUrl: string
  title: string
  text: string
  retrievedAt: string
  contentHash: string
  reviewStatus: 'unreviewed'
}
interface GenerationInfo {
  mode: string
  providers?: string[]
  models?: string[]
  provider?: string
  model?: string
}
interface InsightData {
  mainInsight: string
  lateralThinkingBreakdown: {
    provocation:    { provocation:string; reversal:string; opportunity:string }
    analogies:      { sourceField:string; metaphor:string }[]
    randomStimulus: { randomWord:string; unexpectedAngle:string; visualMetaphor:string }
    oppositeThinking: { desirableMiddle:string; paradox:string }
    agentDebate?: AgentDebate
  }
  constraints: string[]; opportunities: string[]
  metaphoricFraming:string; emotionalTruth:string; creativeMethod:string
  evidenceReferences?: EvidenceReference[]
  generation?: GenerationInfo
}
interface ConceptData {
  title:string; tagline:string; coreIdea:string
  visualNotes:string; creativeDevice:string; emotionalArc:string; targetParadox:string
  evidenceReferences?: EvidenceReference[]
  generation?: GenerationInfo
}
interface ScriptData {
  script:string; beats:string[]; cameraLanguage:string
  narrativeStrategy:string; emotionalTurning:string
  evidenceReferences?: EvidenceReference[]
  generation?: GenerationInfo
}
type Iteration = {
  timestamp:number; brief:string; archetype:string
  brandVoice:{ formalLevel:number; metaphorLevel:number; intensity:number }
  language:'en'|'ar'
  insight:InsightData|null; concept:ConceptData|null; script:ScriptData|null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function hasStrings(value: unknown, fields: string[]): boolean {
  return isRecord(value) && fields.every(field => typeof value[field] === 'string')
}

function hasStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}

function validGeneration(value: unknown): boolean {
  return value === undefined || (isRecord(value) && typeof value.mode === 'string' &&
    (value.provider === undefined || typeof value.provider === 'string') &&
    (value.model === undefined || typeof value.model === 'string') &&
    (value.providers === undefined || hasStringArray(value.providers)) &&
    (value.models === undefined || hasStringArray(value.models)))
}

function validEvidenceReferences(value: unknown): boolean {
  return value === undefined || (Array.isArray(value) && value.every(reference =>
    hasStrings(reference, ['evidenceId', 'sourceUrl', 'title', 'text', 'retrievedAt', 'contentHash']) &&
    isRecord(reference) && reference.reviewStatus === 'unreviewed'))
}

function validInsight(value: unknown): value is InsightData {
  if (!isRecord(value) || typeof value.mainInsight !== 'string' ||
      !hasStringArray(value.constraints) || !hasStringArray(value.opportunities) ||
      !hasStrings(value, ['metaphoricFraming', 'emotionalTruth', 'creativeMethod']) ||
      !validGeneration(value.generation) || !validEvidenceReferences(value.evidenceReferences)) return false
  const breakdown = value.lateralThinkingBreakdown
  if (!isRecord(breakdown) || !hasStrings(breakdown.provocation, ['provocation', 'reversal', 'opportunity']) ||
      !Array.isArray(breakdown.analogies) || !breakdown.analogies.every(item => hasStrings(item, ['sourceField', 'metaphor'])) ||
      !hasStrings(breakdown.randomStimulus, ['randomWord', 'unexpectedAngle', 'visualMetaphor']) ||
      !hasStrings(breakdown.oppositeThinking, ['desirableMiddle', 'paradox'])) return false
  const debate = breakdown.agentDebate
  if (debate === undefined) return true
  if (!isRecord(debate) || !Array.isArray(debate.voices) ||
      !debate.voices.every(voice => hasStrings(voice, ['agent', 'stance', 'sharpCritique', 'contribution'])) ||
      !hasStrings(debate, ['conflictPoint', 'resolution', 'debateSummary'])) return false
  return debate.finalMasterpiece === undefined || hasStrings(debate.finalMasterpiece,
    ['headline', 'tagline', 'coreIdea', 'emotionalTruth', 'creativeDevice', 'visualNotes'])
}

function validConcept(value: unknown): value is ConceptData {
  return hasStrings(value, ['title', 'tagline', 'coreIdea', 'visualNotes', 'creativeDevice', 'emotionalArc', 'targetParadox']) &&
    validGeneration(isRecord(value) ? value.generation : undefined) &&
    validEvidenceReferences(isRecord(value) ? value.evidenceReferences : undefined)
}

function validScript(value: unknown): value is ScriptData {
  return isRecord(value) && typeof value.script === 'string' && hasStringArray(value.beats) &&
    hasStrings(value, ['cameraLanguage', 'narrativeStrategy', 'emotionalTurning']) &&
    validGeneration(value.generation) && validEvidenceReferences(value.evidenceReferences)
}

function GenerationProvenance({ generation }: { generation?: GenerationInfo }) {
  const providers = generation?.providers || (generation?.provider ? [generation.provider] : [])
  const models = generation?.models || (generation?.model ? [generation.model] : [])
  if (!providers.length && !models.length) return null
  return <p className="generation-provenance" aria-live="polite">
    Provider response: {providers.join(', ') || 'unknown'} · Model: {models.join(', ') || 'unknown'}
  </p>
}

function EvidenceProvenance({ references }: { references?: EvidenceReference[] }) {
  if (!references?.length) return null
  return <details className="evidence-provenance">
    <summary>Unreviewed research sources ({references.length})</summary>
    <ul>
      {references.map(reference => (
        <li key={reference.evidenceId}>
          <a href={reference.sourceUrl} target="_blank" rel="noopener noreferrer">{reference.title || reference.sourceUrl}</a>
          {' · '}<code>{reference.evidenceId}</code>
          {' · '}<code>{reference.contentHash.slice(0, 16)}</code>
        </li>
      ))}
    </ul>
    <small>Retrieved page text is untrusted and has not been independently reviewed.</small>
  </details>
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider requests are never retried automatically: a lost response may follow a paid completion.
// ─────────────────────────────────────────────────────────────────────────────
async function apiFetch(url:string, options:RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 180_000)
  const abortFromCaller = () => controller.abort()
  if (options.signal?.aborted) controller.abort()
  else options.signal?.addEventListener('abort', abortFromCaller, { once: true })
  try {
    const res = await backendFetch(url, { ...options, signal: controller.signal })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status, body: text })
    }
    return res
  } catch (err: unknown) {
    const error = err as Error
    if (error.name === 'AbortError') throw Object.assign(new Error('TIMEOUT'), { code:'TIMEOUT' })
    throw err
  } finally {
    clearTimeout(timer)
    options.signal?.removeEventListener('abort', abortFromCaller)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// i18n
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  en: {
    title:'TEXTFX', tagline:'The Elite Creative Director for Lateral Thinking & Copywriting',
    brandPersonality:'Brand Soul & Archetype',
    tone:'Tone', languageStyle:'Metaphor Scale', intensity:'Intensity',
    briefTitle:'The Brief', briefPlaceholder:'Describe the product, human tension, and creative goal…',
    generateBtn:'Ignite Insight', thinking:'Deep Processing…', writing:'Manifesting…',
    insightTitle:'Strategic Insight', convertBtn:'Evolve to Concept',
    conceptTitle:'Creative Conception', writeScriptBtn:'Manifest Script', scriptTitle:'Cinematic Script',
    emotionalBeats:'Emotional Beats', cameraLanguage:'Visual Aesthetics',
    copyScript:'Copy Script', exportPdf:'Export PDF',
    reversals:'Logic Inversions', metaphors:'Symbolic Links',
    creativeDevice:'Strategic Device', emotionalArc:'The Arc',
    savedIterations:'Archive', clear:'Clear',
    formal:'Formal', casual:'Casual', balanced:'Balanced',
    metaphorical:'Metaphorical', literal:'Literal', mixed:'Mixed',
    high:'High', subtle:'Subtle', standard:'Standard',
    networkErr:'⚠️ Cannot reach server. Check your connection.',
    timeoutErr:'⏳ Request timed out — the AI is busy. Try again.',
    serverErr: '⚠️ Server error. Try again.',
    retry:'Retry',
    navBrief:'Brief', navInsight:'Insight', navConcept:'Concept', navScript:'Script',
    heroBadge:'AI Creative Director · Lab',
    heroA:'The AI that thinks like a', heroB:'Creative Director.',
    heroSub:'Turn a brief into a lateral insight, a concept, and a cinematic script — through five thinking engines.',
    heroCta:'Start a Brief', heroCta2:'View Pipeline',
    pipelineLabel:'The Pipeline', enginesLabel:'The Engines', enginesTitleA:'5 Engines.', enginesTitleB:'One insight.',
    pending:'Pending', active:'Ready', done:'Done',
    stBrief:'Creative brief', stInsight:'Lateral insight', stConcept:'Concept mapping', stScript:'Script writing',
    e1:'Provocation', e2:'Analogies', e3:'Random Stimulus', e4:'Opposite Thinking', e5:'Constraint Reversal',
    e1d:'Flip the assumption', e2d:'Cross-domain links', e3d:'Force a connection', e4d:'Extremes & paradox', e5d:'Invert the problem',
    reversal:'Reversal', opportunity:'Opportunity', randomWord:'Random word', angle:'Unexpected angle',
    paradox:'Paradox', middle:'Desirable middle', constraintsL:'Constraints', opportunitiesL:'Opportunities',
    emotionalTruth:'Emotional Truth', tagline2:'Tagline', visualNotes:'Visual Notes',
    narrative:'Narrative Strategy', copied:'Copied', dismiss:'Dismiss', archiveEmpty:'Restore',
    footer:'AI Creative Director · Web Lab',
    marquee:['Brief → Insight → Concept → Script','5 Lateral Thinking Engines','Arabic & English','RTL Ready','PDF Export'],
    debateLabel:'The Room', debateHint:'Three voices fight for the idea before it leaves the room.',
    roleRebel:'Creative Rebel', roleStrategist:'Strategy Master', rolePicky:'Picky Client',
    stanceL:'Stance', critiqueL:'Sharp Critique', contributionL:'Contribution',
    conflictL:'The Conflict', resolutionL:'The Resolution', summaryL:'Verdict',
    revealL:'What Survived the Room',
    modelPickerBtn:'Model', modelAuto:'Auto', modelAutoDesc:'TextFX picks the best engine for the job',
    modelOpenRouter:'OpenRouter', modelOpenRouterDesc:'Routes to any model behind your OpenRouter key',
    modelOpenAI:'GPT (OpenAI)', modelOpenAIDesc:'OpenAI models via your API key',
    modelGemini:'Gemini', modelGeminiDesc:'Google Gemini via your API key',
    modelGrok:'Grok', modelGrokDesc:'xAI Grok via your API key',
    authTitle:'Connect to TextFX', authDescription:'Enter the server access key to start a secure session.',
    authKeyLabel:'Server access key', authSubmit:'Continue', authChecking:'Checking server session…',
    authRetry:'Retry connection', authFailure:'Authentication failed. Check the key and server origin.',
    authSecureRequired:'Use HTTPS to enter a server key outside localhost.',
    authUnavailable:'Could not connect to the authentication service.', authExpired:'Your session expired. Sign in again.',
    authSignOut:'Sign out',
  },
  ar: {
    title:'TEXTFX', tagline:'المحرك الإبداعي النخبوي للتفكير الجانبي وصناعة المحتوى',
    brandPersonality:'روح العلامة والشخصية',
    tone:'النبرة', languageStyle:'مقياس المجاز', intensity:'الحدة',
    briefTitle:'الملخص الإبداعي', briefPlaceholder:'حدد المنتج، التوتر الإنساني، والهدف الإبداعي…',
    generateBtn:'إشعال البصيرة', thinking:'جاري المعالجة العميقة…', writing:'جاري التجلي…',
    insightTitle:'البصيرة الاستراتيجية', convertBtn:'تطوير إلى مفهوم',
    conceptTitle:'التصور الإبداعي', writeScriptBtn:'تحويل لسيناريو', scriptTitle:'التجلي السينمائي',
    emotionalBeats:'النبضات العاطفية', cameraLanguage:'الجماليات البصرية',
    copyScript:'نسخ النص', exportPdf:'تصدير PDF',
    reversals:'انقلابات المنطق', metaphors:'الروابط الرمزية',
    creativeDevice:'الأداة الاستراتيجية', emotionalArc:'المسار العاطفي',
    savedIterations:'الأرشيف', clear:'مسح',
    formal:'رسمي', casual:'عفوي', balanced:'متوازن',
    metaphorical:'مجازي', literal:'حرفي', mixed:'مختلط',
    high:'مرتفع', subtle:'هادئ', standard:'قياسي',
    networkErr:'⚠️ لا يمكن الوصول للخادم. تحقق من الاتصال.',
    timeoutErr:'⏳ انتهت مهلة الطلب — الذكاء الاصطناعي مشغول. حاول مجدداً.',
    serverErr: '⚠️ خطأ في الخادم. حاول مجدداً.',
    retry:'إعادة المحاولة',
    navBrief:'الملخص', navInsight:'البصيرة', navConcept:'المفهوم', navScript:'السيناريو',
    heroBadge:'مدير إبداعي بالذكاء الاصطناعي · المختبر',
    heroA:'الذكاء الذي يفكر مثل', heroB:'مدير إبداعي.',
    heroSub:'حوّل الملخص إلى بصيرة جانبية ثم مفهوم ثم سيناريو سينمائي عبر خمسة محركات تفكير.',
    heroCta:'ابدأ الملخص', heroCta2:'عرض المسار',
    pipelineLabel:'المسار', enginesLabel:'المحركات', enginesTitleA:'٥ محركات.', enginesTitleB:'بصيرة واحدة.',
    pending:'بالانتظار', active:'جاهز', done:'تم',
    stBrief:'الملخص الإبداعي', stInsight:'البصيرة الجانبية', stConcept:'تخطيط المفهوم', stScript:'كتابة السيناريو',
    e1:'الاستفزاز', e2:'التشبيهات', e3:'المحفز العشوائي', e4:'التفكير المعاكس', e5:'عكس القيود',
    e1d:'اقلب الافتراض', e2d:'روابط بين المجالات', e3d:'افرض اتصالاً', e4d:'الأقصى والمفارقة', e5d:'اعكس المشكلة',
    reversal:'العكس', opportunity:'الفرصة', randomWord:'الكلمة العشوائية', angle:'زاوية غير متوقعة',
    paradox:'المفارقة', middle:'الوسط المرغوب', constraintsL:'القيود', opportunitiesL:'الفرص',
    emotionalTruth:'الحقيقة العاطفية', tagline2:'الشعار', visualNotes:'ملاحظات بصرية',
    narrative:'استراتيجية السرد', copied:'تم النسخ', dismiss:'إغلاق', archiveEmpty:'استعادة',
    footer:'مدير إبداعي بالذكاء الاصطناعي · مختبر الويب',
    marquee:['الملخص ← البصيرة ← المفهوم ← السيناريو','خمسة محركات للتفكير الجانبي','عربي وإنجليزي','دعم RTL','تصدير PDF'],
    debateLabel:'الغرفة', debateHint:'ثلاثة أصوات بتتناقش على الفكرة قبل ما تخرج من الغرفة.',
    roleRebel:'المتمرد الإبداعي', roleStrategist:'خبير الاستراتيجية', rolePicky:'العميل الصعب',
    stanceL:'الموقف', critiqueL:'النقد الحاد', contributionL:'الإضافة',
    conflictL:'نقطة الخلاف', resolutionL:'الحل', summaryL:'الحكم النهائي',
    revealL:'اللي نجا من الغرفة',
    modelPickerBtn:'الموديل', modelAuto:'تلقائي', modelAutoDesc:'TextFX بيختار أفضل محرك للمهمة',
    modelOpenRouter:'OpenRouter', modelOpenRouterDesc:'يوجّه لأي موديل من خلال مفتاح OpenRouter بتاعك',
    modelOpenAI:'جي بي تي (OpenAI)', modelOpenAIDesc:'موديلات OpenAI بمفتاحك الخاص',
    modelGemini:'Gemini', modelGeminiDesc:'جوجل Gemini بمفتاحك الخاص',
    modelGrok:'Grok', modelGrokDesc:'xAI Grok بمفتاحك الخاص',
    authTitle:'الاتصال بـ TextFX', authDescription:'أدخل مفتاح وصول الخادم لبدء جلسة آمنة.',
    authKeyLabel:'مفتاح وصول الخادم', authSubmit:'متابعة', authChecking:'جارٍ التحقق من جلسة الخادم…',
    authRetry:'إعادة الاتصال', authFailure:'فشل تسجيل الدخول. تحقق من المفتاح وعنوان الخادم.',
    authSecureRequired:'استخدم HTTPS لإدخال مفتاح الخادم خارج localhost.',
    authUnavailable:'تعذر الاتصال بخدمة المصادقة.', authExpired:'انتهت الجلسة. سجّل الدخول مرة أخرى.',
    authSignOut:'تسجيل الخروج',
  }
} as const
type Lang = keyof typeof T

const ARCHETYPES = [
  { name:'The Outlaw',   nameAr:'المتمرد',        icon:'💀', desc:'Rebellious, rule-breaking', descAr:'متمرد، يكسر القواعد' },
  { name:'The Magician', nameAr:'الساحر',         icon:'✨', desc:'Visionary, transformative',  descAr:'رؤيوي، تحويلي' },
  { name:'The Hero',     nameAr:'البطل',          icon:'🛡️', desc:'Courageous, masterful',      descAr:'شجاع، متمكن' },
  { name:'The Lover',    nameAr:'المحب',          icon:'❤️', desc:'Intimate, passionate',       descAr:'حميمي، شغوف' },
  { name:'The Jester',   nameAr:'المهرج',         icon:'🤡', desc:'Playful, disruptive',        descAr:'مرح، متمرد' },
  { name:'The Everyman', nameAr:'الإنسان العادي', icon:'🤝', desc:'Reliable, connected',        descAr:'موثوق، مرتبط بالناس' },
  { name:'The Caregiver',nameAr:'الراعي',         icon:'🤲', desc:'Nurturing, protective',      descAr:'حاضن، حامي' },
  { name:'The Ruler',    nameAr:'الحاكم',         icon:'👑', desc:'Authoritative, stable',      descAr:'سلطوي، مستقر' },
  { name:'The Creator',  nameAr:'المبدع',         icon:'🎨', desc:'Innovative, original',       descAr:'مبتكر، أصيل' },
  { name:'The Innocent', nameAr:'البريء',         icon:'☀️', desc:'Optimistic, pure',           descAr:'متفائل، نقي' },
  { name:'The Sage',     nameAr:'الحكيم',         icon:'🧠', desc:'Wise, analytical',           descAr:'حكيم، تحليلي' },
  { name:'The Explorer', nameAr:'المستكشف',       icon:'🧭', desc:'Adventurous, free',          descAr:'مغامر، حر' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Scroll helper
// ─────────────────────────────────────────────────────────────────────────────
function scrollTo(ref: React.RefObject<HTMLElement | null>) {
  setTimeout(() => {
    ref.current?.scrollIntoView({ behavior:'smooth', block:'start' })
    ref.current?.setAttribute('tabIndex','-1')
    ref.current?.focus({ preventScroll: true })
  }, 120)
}

// ─────────────────────────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────────────────────────
function App() {
  // ── Electron IPC backend bootstrap ─────────────────────────────────────────
  const [backendOrigin, setBackendOrigin] = useState<string>(
    () => {
      const url = import.meta.env.VITE_API_URL
      return url || ''
    }
  )
  const API = backendOrigin

  // On startup: if running inside Electron, get the actual port from main process
  useEffect(() => {
    if (!window.fx) return
    window.fx.getBackendInfo().then(info => {
      const origin = `${info.protocol}://${info.host}:${info.port}`
      setBackendOrigin(origin)
    }).catch(err => console.warn('window.fx.getBackendInfo failed:', err))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [brief,  setBrief]  = useState('')
  const [provider, setProvider] = useState<ProviderId>('auto')
  const [providerOptions, setProviderOptions] = useState<ProviderOption[]>([])
  const [sessionStatus, setSessionStatus] = useState<{ authRequired: boolean; authenticated: boolean } | null>(null)
  const [authCheckAttempt, setAuthCheckAttempt] = useState(0)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [authBusy, setAuthBusy] = useState(false)
  const [model, setModel] = useState('')
  const [showModelPicker, setShowModelPicker] = useState(false)
  const modelPickerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!showModelPicker) return
    const onDocClick = (e: MouseEvent) => {
      if (modelPickerRef.current && !modelPickerRef.current.contains(e.target as Node)) setShowModelPicker(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [showModelPicker])
  const [insight, setInsight] = useState<InsightData|null>(null)
  const [concept, setConcept] = useState<ConceptData|null>(null)
  const [script,  setScript]  = useState<ScriptData|null>(null)
  const [browserAttachment, setBrowserAttachment] = useState<BrowserAttachment | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string|null>(null)
  const [iterations, setIterations] = useState<Iteration[]>([])
  const requestSequence = useRef(0)
  const activeRequest = useRef<AbortController|null>(null)

  useEffect(() => () => {
    requestSequence.current++
    activeRequest.current?.abort()
    activeRequest.current = null
  }, [])

  useEffect(() => {
    let disposed = false
    backendFetch(`${API}/api/session`, { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Session status request failed')
        const status = await response.json() as { authRequired?: unknown; authenticated?: unknown }
        if (typeof status.authRequired !== 'boolean' || typeof status.authenticated !== 'boolean') {
          throw new Error('Session status response was invalid')
        }
        if (!disposed) {
          setSessionStatus({ authRequired: status.authRequired, authenticated: status.authenticated })
          setAuthError(null)
        }
      })
      .catch(() => {
        if (!disposed) setAuthError(t.authUnavailable)
      })
    return () => { disposed = true }
  }, [API, authCheckAttempt])

  useEffect(() => {
    let disposed = false
    backendFetch(`${API}/api/key-status`, { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error(`Provider status request failed (${response.status}).`)
        const payload = await response.json() as { providers?: ProviderOption[] }
        if (!Array.isArray(payload.providers)) throw new Error('Provider status response was invalid.')
        const options = payload.providers.filter(item =>
          item && ['gemini', 'openai', 'openrouter', 'grok'].includes(item.id) &&
          typeof item.configured === 'boolean' && Array.isArray(item.models) &&
          item.models.every(value => typeof value === 'string'),
        )
        if (!disposed) setProviderOptions(options)
      })
      .catch(error => {
        if (!disposed) console.warn('Provider status unavailable:', error instanceof Error ? error.message : 'unknown error')
      })
    return () => { disposed = true }
  }, [API])

  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem('textfx_dark') !== 'false'
  })
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'en'
    return (localStorage.getItem('textfx_lang') as Lang) || 'en'
  })
  const [archetype,    setArchetype]    = useState('The Sage')
  const [formalLevel,  setFormalLevel]  = useState(5)
  const [metaphorLevel,setMetaphorLevel]= useState(5)
  const [intensity,    setIntensity]    = useState(5)

  const lastAction = useRef<null | (() => void)>(null)
  const [copied, setCopied] = useState(false)
  const briefRef    = useRef<HTMLElement>(null)
  const pipelineRef = useRef<HTMLElement>(null)
  const insightRef = useRef<HTMLElement>(null)
  const conceptRef = useRef<HTMLElement>(null)
  const scriptRef  = useRef<HTMLElement>(null)

  const t    = T[lang]
  const isRtl = lang === 'ar'
  const selectedProvider = providerOptions.find(option => option.id === provider)
  const selectedModel = provider === 'auto' ? undefined : model || selectedProvider?.models[0]
  const browserHeaders: Record<string, string> = browserAttachment
    ? { 'X-TextFX-Browser-Token': `Bearer ${browserAttachment.token}` }
    : {}

  useEffect(() => {
    document.documentElement.dir  = isRtl ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
    localStorage.setItem('textfx_lang', lang)
  }, [lang, isRtl])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('textfx_dark', String(dark))
  }, [dark])

  useEffect(() => {
    const saved = localStorage.getItem('textfx_iterations')
    if (saved) { try { setIterations(JSON.parse(saved)) } catch { /* ignore */ } }
  }, [])

  function handleError(err: unknown) {
    const e = err as { code?:string; message?:string; status?:number; body?:string }
    if (e?.status === 401 && sessionStatus?.authRequired) {
      invalidatePipeline()
      setSessionStatus({ authRequired: true, authenticated: false })
      setAuthError(t.authExpired)
      return
    }
    if (e?.code === 'TIMEOUT' || e?.message === 'TIMEOUT') return setError(t.timeoutErr)
    if (e?.message?.includes('NETWORK') || e?.message?.includes('Failed to fetch')) return setError(t.networkErr)
    if (e?.body) {
      try {
        const body = JSON.parse(e.body) as { error?: string }
        if (body.error) return setError(body.error)
      } catch { /* non-JSON server response */ }
    }
    setError(t.serverErr)
    console.error(JSON.stringify({ level:'error', ts:new Date().toISOString(), error: e?.message }))
  }

  async function submitApiKey(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!apiKeyInput.trim() || authBusy) return
    const apiUrl = new URL(API || window.location.href, window.location.href)
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(apiUrl.hostname)
    if (!window.fx && apiUrl.protocol !== 'https:' && !loopback) {
      setApiKeyInput('')
      setAuthError(t.authSecureRequired)
      return
    }
    setAuthBusy(true)
    setAuthError(null)
    try {
      const response = await backendFetch(`${API}/api/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyInput }),
      })
      if (!response.ok) throw new Error('AUTH_FAILED')
      const status = await response.json() as { authRequired?: unknown; authenticated?: unknown }
      if (status.authRequired !== true || status.authenticated !== true) throw new Error('AUTH_FAILED')
      setApiKeyInput('')
      setSessionStatus({ authRequired: true, authenticated: true })
    } catch {
      setApiKeyInput('')
      setAuthError(t.authFailure)
    } finally {
      setAuthBusy(false)
    }
  }

  async function signOut() {
    try { await backendFetch(`${API}/api/session`, { method: 'DELETE' }) } catch { /* local UI still signs out */ }
    invalidatePipeline()
    setSessionStatus({ authRequired: true, authenticated: false })
  }

  function invalidatePipeline() {
    requestSequence.current++
    activeRequest.current?.abort()
    activeRequest.current = null
    setLoading(false)
    setError(null)
    setInsight(null)
    setConcept(null)
    setScript(null)
  }

  function beginRequest() {
    activeRequest.current?.abort()
    const controller = new AbortController()
    const id = ++requestSequence.current
    activeRequest.current = controller
    setLoading(true)
    setError(null)
    return { id, controller }
  }

  function finishRequest(id: number) {
    if (requestSequence.current !== id) return
    activeRequest.current = null
    setLoading(false)
  }

  function isCurrentRequest(id: number) {
    return requestSequence.current === id
  }

  function isAbortError(error: unknown) {
    return error instanceof Error && error.name === 'AbortError'
  }

  const doGenerateInsight = async () => {
    lastAction.current = doGenerateInsight
    const { id, controller } = beginRequest()
    setInsight(null); setConcept(null); setScript(null)
    try {
      const res = await apiFetch(`${API}/api/insight`, {
        method:'POST', signal:controller.signal, headers:{'Content-Type':'application/json', ...browserHeaders},
        body: JSON.stringify({
          brief, archetype, language:lang, brandVoice:{ formalLevel,metaphorLevel,intensity },
          provider, model:selectedModel, browserResearchId:browserAttachment?.runId,
        })
      })
      const data: unknown = await res.json()
      if (!isCurrentRequest(id)) return
      if (!validInsight(data)) {
        throw new Error('The server returned an invalid insight result.')
      }
      setInsight(data); setConcept(null); setScript(null)
      scrollTo(insightRef)
    } catch (e) { if (isCurrentRequest(id) && !isAbortError(e)) handleError(e) }
    finally { finishRequest(id) }
  }

  const doConvertConcept = async () => {
    lastAction.current = doConvertConcept
    const { id, controller } = beginRequest()
    setConcept(null); setScript(null)
    try {
      const res = await apiFetch(`${API}/api/concept`, {
        method:'POST', signal:controller.signal, headers:{'Content-Type':'application/json', ...browserHeaders},
        body: JSON.stringify({
          insight, archetype, language:lang, brandVoice:{ formalLevel,metaphorLevel,intensity },
          provider, model:selectedModel, browserResearchId:browserAttachment?.runId,
        })
      })
      const data: unknown = await res.json()
      if (!isCurrentRequest(id)) return
      if (!validConcept(data)) {
        throw new Error('The server returned an invalid concept result.')
      }
      setConcept(data); setScript(null)
      scrollTo(conceptRef)
    } catch (e) { if (isCurrentRequest(id) && !isAbortError(e)) handleError(e) }
    finally { finishRequest(id) }
  }

  const doWriteScript = async () => {
    lastAction.current = doWriteScript
    const { id, controller } = beginRequest()
    setScript(null)
    try {
      const res = await apiFetch(`${API}/api/script`, {
        method:'POST', signal:controller.signal, headers:{'Content-Type':'application/json', ...browserHeaders},
        body: JSON.stringify({
          concept, archetype, language:lang, brandVoice:{ formalLevel,metaphorLevel,intensity },
          provider, model:selectedModel, browserResearchId:browserAttachment?.runId,
        })
      })
      const data: unknown = await res.json()
      if (!isCurrentRequest(id)) return
      if (!validScript(data)) {
        throw new Error('The server returned an invalid script result.')
      }
      setScript(data)
      const iter: Iteration = { timestamp:Date.now(), brief, archetype, language:lang, brandVoice:{formalLevel,metaphorLevel,intensity}, insight, concept, script:data }
      const updated = [iter, ...iterations].slice(0,10)
      setIterations(updated)
      localStorage.setItem('textfx_iterations', JSON.stringify(updated))
      scrollTo(scriptRef)
    } catch (e) { if (isCurrentRequest(id) && !isAbortError(e)) handleError(e) }
    finally { finishRequest(id) }
  }

  const doCopy = async () => {
    if (!script) return
    try { await navigator.clipboard.writeText(script.script); setCopied(true); setTimeout(() => setCopied(false), 1600) }
    catch { /* clipboard unavailable */ }
  }

  const goTo = (r: React.RefObject<HTMLElement | null>) =>
    r.current?.scrollIntoView({ behavior:'smooth', block:'start' })

  const stepState = (i: number) => {
    const doneArr = [brief.trim().length > 0 && !!insight, !!insight && !!concept, !!concept && !!script, !!script]
    if (doneArr[i]) return 'done'
    const prevDone = i === 0 ? true : doneArr[i-1]
    return prevDone ? 'active' : 'pending'
  }
  const steps = [
    { n:'01', title:t.briefTitle,   desc:t.stBrief,   ref:briefRef },
    { n:'02', title:t.insightTitle, desc:t.stInsight, ref:insightRef },
    { n:'03', title:t.conceptTitle, desc:t.stConcept, ref:conceptRef },
    { n:'04', title:t.scriptTitle,  desc:t.stScript,  ref:scriptRef },
  ]
  const lb = insight?.lateralThinkingBreakdown
  const engines = [
    { n:'01', name:t.e1, title:t.e1d, body: lb?.provocation ? [[t.reversal, lb.provocation.reversal],[t.opportunity, lb.provocation.opportunity]] : [] },
    { n:'02', name:t.e2, title:t.e2d, body: (lb?.analogies||[]).map(a => [a.sourceField, a.metaphor]) },
    { n:'03', name:t.e3, title:t.e3d, body: lb?.randomStimulus ? [[t.randomWord, lb.randomStimulus.randomWord],[t.angle, lb.randomStimulus.unexpectedAngle]] : [] },
    { n:'04', name:t.e4, title:t.e4d, body: lb?.oppositeThinking ? [[t.middle, lb.oppositeThinking.desirableMiddle],[t.paradox, lb.oppositeThinking.paradox]] : [] },
    { n:'05', name:t.e5, title:t.e5d, body: [...(insight?.constraints||[]).map(c => [t.constraintsL, c]), ...(insight?.opportunities||[]).map(o => [t.opportunitiesL, o])] },
  ] as { n:string; name:string; title:string; body:string[][] }[]

  const debate = lb?.agentDebate
  const roleMeta: Record<AgentVoice['agent'], { label:string; mod:string }> = {
    'Creative Rebel':  { label: t.roleRebel,      mod: 'rebel' },
    'Strategy Master': { label: t.roleStrategist, mod: 'strategist' },
    'Picky Client':    { label: t.rolePicky,      mod: 'picky' },
  }

  const doExport = () => {
    const doc = new jsPDF()
    doc.setFontSize(16); doc.text('TextFX Masterpiece', 10, 15)
    doc.setFontSize(10); doc.text(`Brief: ${brief}`, 10, 28)
    if (insight) doc.text(`Insight: ${insight.mainInsight}`, 10, 40, { maxWidth:190 })
    if (concept) { doc.text(`Concept: ${concept.title} — ${concept.tagline}`, 10,55); doc.text(concept.coreIdea, 10,68,{maxWidth:190}) }
    if (script)  doc.text(script.script, 10, 90, { maxWidth:190 })
    doc.save('textfx-masterpiece.pdf')
  }

  const mq = [...t.marquee, ...t.marquee, ...t.marquee, ...t.marquee]

  if (!sessionStatus) {
    return <div className={`app-root${dark ? ' dark' : ' light'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <main className="auth-gate" role="main" aria-live="polite">
        <h1 className="stage-title">{t.authTitle}</h1>
        {authError
          ? <><p role="alert">{authError}</p><button className="btn btn-primary" onClick={() => { setSessionStatus(null); setAuthError(null); setAuthCheckAttempt(value => value + 1) }}>{t.authRetry}</button></>
          : <p role="status">{t.authChecking}</p>}
      </main>
    </div>
  }

  if (sessionStatus.authRequired && !sessionStatus.authenticated) {
    return <div className={`app-root${dark ? ' dark' : ' light'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <main className="auth-gate" role="main">
        <h1 className="stage-title">{t.authTitle}</h1>
        <p>{t.authDescription}</p>
        {authError && <p className="error-banner" role="alert">{authError}</p>}
        <form className="auth-form" onSubmit={event => void submitApiKey(event)}>
          <label htmlFor="server-access-key">{t.authKeyLabel}</label>
          <input id="server-access-key" className="textarea" type="password" autoComplete="off"
            value={apiKeyInput} onChange={event => setApiKeyInput(event.target.value)} />
          <button className="btn btn-primary" type="submit" disabled={authBusy || !apiKeyInput.trim()}>
            {authBusy ? t.thinking : t.authSubmit}
          </button>
        </form>
      </main>
    </div>
  }

  return (
    <>
    <div className={`app-root${dark ? ' dark' : ' light'}`} dir={isRtl ? 'rtl' : 'ltr'}>

      {loading && (
        <div className="loading-overlay" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          <p className="loading-label">{t.thinking}</p>
        </div>
      )}

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="nav" role="navigation" aria-label="Primary">
        <div className="nav-logo">TEXT<span>FX</span></div>
        <div className="nav-links">
          {steps.map(s => (
            <button key={s.n} className="nav-link" onClick={() => goTo(s.ref)}
              disabled={s.ref === insightRef ? !insight : s.ref === conceptRef ? !concept : s.ref === scriptRef ? !script : false}>
              {s.title}
            </button>
          ))}
        </div>
        <div className="nav-actions" role="toolbar" aria-label="App controls">
          {sessionStatus.authRequired && <button className="nav-cta" onClick={() => void signOut()}>{t.authSignOut}</button>}
          <button className="nav-cta"
            aria-label={lang === 'en' ? 'Switch to Arabic' : 'Switch to English'}
            onClick={() => setLang(l => l === 'en' ? 'ar' : 'en')}>
            {lang === 'en' ? 'عربي' : 'EN'}
          </button>
          <button className="nav-cta nav-cta-ghost"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={dark}
            onClick={() => setDark(d => !d)}>
            {dark ? '☀' : '☾'}
          </button>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <header className="hero" role="banner">
        <div className="hero-bg-text" aria-hidden="true">FX</div>
        <div className="hero-badge">{t.heroBadge}</div>
        <h1 className="hero-title">{t.heroA}<br /><em>{t.heroB}</em></h1>
        <p className="hero-sub">{t.heroSub}</p>
        <div className="hero-actions">
          <button className="btn btn-primary" onClick={() => goTo(briefRef)}>{t.heroCta}</button>
          <button className="btn btn-link" onClick={() => goTo(pipelineRef)}>{t.heroCta2}</button>
        </div>
      </header>

      <div className="marquee-wrap" aria-hidden="true">
        <div className="marquee-inner">
          {mq.map((m, i) => (<span key={i} className="marquee-chunk"><span className="marquee-item">{m}</span><span className="marquee-sep">✦</span></span>))}
        </div>
      </div>

      {error && (
        <div className="error-banner" role="alert" aria-live="assertive">
          <span>{error}</span>
          <div className="error-actions">
            <button className="btn btn-ghost" onClick={() => { setError(null); lastAction.current?.() }}>{t.retry}</button>
            <button className="btn btn-ghost" aria-label={t.dismiss} onClick={() => setError(null)}>✕</button>
          </div>
        </div>
      )}

      <main className="main" role="main">

        {/* ── Pipeline ───────────────────────────────────────── */}
        <section className="stage pipeline" ref={pipelineRef} aria-label={t.pipelineLabel}>
          <div className="section-label">{t.pipelineLabel}</div>
          <ol className="pipeline-row">
            {steps.map((s, i) => {
              const st = stepState(i)
              return (
                <li key={s.n} className={`pipeline-step ${st}`}>
                  <div className="step-num">{st === 'done' ? '✓' : s.n}</div>
                  <div className="step-content">
                    <h4>{s.title}</h4>
                    <p>{s.desc}</p>
                    <span className="step-state">{st === 'done' ? t.done : st === 'active' ? t.active : t.pending}</span>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>

        {/* ── Stage 01: Archetype + Voice ─────────────────────── */}
        <section className="stage" aria-labelledby="stage-01-title">
          <div className="stage-header">
            <span className="stage-number" aria-hidden="true">01</span>
            <h2 className="stage-title" id="stage-01-title">{t.brandPersonality}</h2>
          </div>
          <div className="pane">
            <div className="archetype-grid" role="radiogroup" aria-label="Brand Archetype">
              {ARCHETYPES.map(a => (
                <button key={a.name} role="radio" aria-checked={archetype === a.name}
                  className={`arch-card${archetype === a.name ? ' active' : ''}`}
                  onClick={() => setArchetype(a.name)}
                  tabIndex={archetype === a.name ? 0 : -1}>
                  <span className="arch-icon" aria-hidden="true">{a.icon}</span>
                  <span className="arch-name">{isRtl ? a.nameAr : a.name}</span>
                  <span className="arch-desc">{isRtl ? a.descAr : a.desc}</span>
                </button>
              ))}
            </div>
            <div className="voice-grid" role="group" aria-label="Brand Voice Controls">
              {[
                { id:'tone',      label:t.tone,          val:formalLevel,    set:setFormalLevel,    lo:t.casual,  hi:t.formal,       mid:t.balanced },
                { id:'metaphor',  label:t.languageStyle, val:metaphorLevel,  set:setMetaphorLevel,  lo:t.literal, hi:t.metaphorical, mid:t.mixed },
                { id:'intensity', label:t.intensity,     val:intensity,      set:setIntensity,      lo:t.subtle,  hi:t.high,         mid:t.standard },
              ].map(ctrl => (
                <div key={ctrl.id} className="slider-control">
                  <label className="slider-label" htmlFor={ctrl.id}>
                    <span>{ctrl.label}</span>
                    <span className="slider-val" aria-live="polite">{ctrl.val > 7 ? ctrl.hi : ctrl.val < 3 ? ctrl.lo : ctrl.mid}</span>
                  </label>
                  <input id={ctrl.id} type="range" min="0" max="10" value={ctrl.val} className="slider"
                    aria-valuenow={ctrl.val} aria-valuemin={0} aria-valuemax={10}
                    onChange={e => ctrl.set(parseInt(e.target.value))} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stage 02: Brief ─────────────────────────────────── */}
        <section className="stage" ref={briefRef} aria-labelledby="stage-02-title" tabIndex={-1}>
          <div className="stage-header">
            <span className="stage-number" aria-hidden="true">02</span>
            <h2 className="stage-title" id="stage-02-title">{t.briefTitle}</h2>
          </div>
          <div className="pane">
            <textarea className="textarea" value={brief} onChange={e => {
              if (brief !== e.target.value) invalidatePipeline()
              setBrief(e.target.value)
            }}
              placeholder={t.briefPlaceholder} dir="auto" rows={6}
              aria-label={t.briefTitle} aria-required="true" />
            <div className="model-picker" ref={modelPickerRef}>
              <button type="button" className={`model-picker-trigger${provider !== 'auto' ? ' active' : ''}`}
                onClick={() => setShowModelPicker(s => !s)}
                aria-haspopup="listbox" aria-expanded={showModelPicker}>
                <span className="model-picker-plus" aria-hidden="true">+</span>
                <span className="model-picker-label">{t.modelPickerBtn}</span>
                <span className="model-picker-current">
                  {provider === 'auto' ? t.modelAuto : provider === 'openrouter' ? t.modelOpenRouter : provider === 'openai' ? t.modelOpenAI : provider === 'gemini' ? t.modelGemini : t.modelGrok}
                </span>
              </button>
              {showModelPicker && (
                <div className="model-picker-panel" role="listbox" aria-label={t.modelPickerBtn}>
                  {([
                    ['auto',       t.modelAuto,       t.modelAutoDesc],
                    ['openrouter', t.modelOpenRouter, t.modelOpenRouterDesc],
                    ['openai',     t.modelOpenAI,      t.modelOpenAIDesc],
                    ['gemini',     t.modelGemini,      t.modelGeminiDesc],
                    ['grok',       t.modelGrok,        t.modelGrokDesc],
                  ] as [ProviderId,string,string][]).map(([id, label, desc]) => (
                    <button key={id} type="button" role="option" aria-selected={provider === id}
                      className={`model-picker-opt${provider === id ? ' selected' : ''}`}
                      onClick={() => {
                        const nextModel = id === 'auto' ? '' : providerOptions.find(option => option.id === id)?.models[0] || ''
                        if (provider !== id || model !== nextModel) invalidatePipeline()
                        setProvider(id)
                        setModel(nextModel)
                        setShowModelPicker(false)
                      }}>
                      <span className="model-picker-opt-name">
                        {label}{id !== 'auto' && providerOptions.find(option => option.id === id)?.configured === false ? ' · not configured' : ''}
                      </span>
                      <span className="model-picker-opt-desc">{desc}</span>
                    </button>
                  ))}
                  {provider !== 'auto' && (
                    <label className="model-picker-model">
                      <span>{t.modelPickerBtn}</span>
                      <select
                        aria-label={`${t.modelPickerBtn} ${selectedProvider?.label || provider}`}
                        value={model}
                        onChange={event => {
                          if (model !== event.target.value) invalidatePipeline()
                          setModel(event.target.value)
                        }}
                      >
                        <option value="">Server default</option>
                        {(selectedProvider?.models || []).map(availableModel => (
                          <option key={availableModel} value={availableModel}>{availableModel}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              )}
            </div>
            <div className="btn-row">
              <button className="btn btn-primary btn-full" onClick={doGenerateInsight}
                disabled={!brief.trim() || loading} aria-busy={loading}>
                {loading ? t.thinking : t.generateBtn}
              </button>
            </div>
          </div>
        </section>

        {/* ── Stage 03: Insight + five engines ────────────────── */}
        {insight && (
          <section className="stage" ref={insightRef} aria-labelledby="stage-03-title" tabIndex={-1}>
            <div className="stage-header">
              <span className="stage-number" aria-hidden="true">03</span>
              <h2 className="stage-title" id="stage-03-title">{t.insightTitle}</h2>
            </div>
            <div className="pane">
              <blockquote className="insight-hero" dir="auto">{insight.mainInsight}</blockquote>
              <GenerationProvenance generation={insight.generation} />
              <EvidenceProvenance references={insight.evidenceReferences} />

              <div className="section-label">{t.enginesLabel}</div>
              <div className="tech-grid">
                {engines.map(e => (
                  <article key={e.n} className="tech-card">
                    <div className="tech-num" aria-hidden="true">{e.n}</div>
                    <div className="tech-name">{e.name}</div>
                    <div className="tech-title">{e.title}</div>
                    <dl className="tech-body" dir="auto">
                      {e.body.filter(r => r[1]).map((r, i) => (<div key={i}><dt>{r[0]}</dt><dd>{r[1]}</dd></div>))}
                    </dl>
                  </article>
                ))}
              </div>

              {debate && debate.voices?.length >= 3 && (
                <div className="debate-block">
                  <div className="section-label">{t.debateLabel}</div>
                  <p className="debate-hint">{t.debateHint}</p>
                  <div className="debate-grid">
                    {debate.voices.map(v => {
                      const meta = roleMeta[v.agent] || { label: v.agent, mod: 'picky' }
                      return (
                        <article key={v.agent} className={`debate-card debate-card--${meta.mod}`}>
                          <div className="debate-role">{meta.label}</div>
                          <dl className="debate-body" dir="auto">
                            <div><dt>{t.stanceL}</dt><dd>{v.stance}</dd></div>
                            <div><dt>{t.critiqueL}</dt><dd>{v.sharpCritique}</dd></div>
                            <div><dt>{t.contributionL}</dt><dd>{v.contribution}</dd></div>
                          </dl>
                        </article>
                      )
                    })}
                  </div>
                  <div className="debate-verdict" dir="auto">
                    <div className="technique"><h3 className="technique-label">{t.conflictL}</h3><p className="technique-text">{debate.conflictPoint}</p></div>
                    <div className="technique"><h3 className="technique-label">{t.resolutionL}</h3><p className="technique-text">{debate.resolution}</p></div>
                    {debate.debateSummary && (<p className="debate-summary">{debate.debateSummary}</p>)}
                  </div>
                  {debate.finalMasterpiece && (
                    <blockquote className="debate-reveal" dir="auto">
                      <div className="section-label">{t.revealL}</div>
                      <h3 className="debate-reveal-headline">{debate.finalMasterpiece.headline}</h3>
                      <p className="debate-reveal-tagline">“{debate.finalMasterpiece.tagline}”</p>
                    </blockquote>
                  )}
                </div>
              )}

              {(insight.metaphoricFraming || insight.emotionalTruth) && (
                <div className="two-col">
                  {insight.metaphoricFraming && (<div className="technique"><h3 className="technique-label">{t.metaphors}</h3><p className="technique-text" dir="auto">{insight.metaphoricFraming}</p></div>)}
                  {insight.emotionalTruth && (<div className="technique"><h3 className="technique-label">{t.emotionalTruth}</h3><p className="technique-text" dir="auto">{insight.emotionalTruth}</p></div>)}
                </div>
              )}
              <div className="btn-row">
                <button className="btn btn-secondary-accent btn-full" onClick={doConvertConcept}
                  disabled={loading} aria-busy={loading}>{loading ? t.thinking : t.convertBtn}</button>
              </div>
            </div>
          </section>
        )}

        {/* ── Stage 04: Concept ───────────────────────────────── */}
        {concept && (
          <section className="stage" ref={conceptRef} aria-labelledby="stage-04-title" tabIndex={-1}>
            <div className="stage-header">
              <span className="stage-number" aria-hidden="true">04</span>
              <h2 className="stage-title" id="stage-04-title">{t.conceptTitle}</h2>
            </div>
            <div className="pane">
              <GenerationProvenance generation={concept.generation} />
              <EvidenceProvenance references={concept.evidenceReferences} />
              <h3 className="concept-title" dir="auto">{concept.title}</h3>
              <p className="concept-tagline" dir="auto">“{concept.tagline}”</p>
              <div className="concept-body" dir="auto"><p>{concept.coreIdea}</p></div>
              <div className="two-col">
                <div className="technique"><h3 className="technique-label">{t.creativeDevice}</h3><p className="technique-text" dir="auto">{concept.creativeDevice}</p></div>
                <div className="technique"><h3 className="technique-label">{t.emotionalArc}</h3><p className="technique-text" dir="auto">{concept.emotionalArc}</p></div>
              </div>
              {(concept.visualNotes || concept.targetParadox) && (
                <div className="two-col">
                  {concept.visualNotes && (<div className="technique"><h3 className="technique-label">{t.visualNotes}</h3><p className="technique-text" dir="auto">{concept.visualNotes}</p></div>)}
                  {concept.targetParadox && (<div className="technique"><h3 className="technique-label">{t.paradox}</h3><p className="technique-text" dir="auto">{concept.targetParadox}</p></div>)}
                </div>
              )}
              <div className="btn-row">
                <button className="btn btn-accent btn-full" onClick={doWriteScript}
                  disabled={loading} aria-busy={loading}>{loading ? t.writing : t.writeScriptBtn}</button>
              </div>
            </div>
          </section>
        )}

        {/* ── Stage 05: Script ────────────────────────────────── */}
        {script && (
          <section className="stage" ref={scriptRef} aria-labelledby="stage-05-title" tabIndex={-1}>
            <div className="stage-header">
              <span className="stage-number" aria-hidden="true">05</span>
              <h2 className="stage-title" id="stage-05-title">{t.scriptTitle}</h2>
            </div>
            <div className="pane">
              <GenerationProvenance generation={script.generation} />
              <EvidenceProvenance references={script.evidenceReferences} />
              <pre className="script-block" dir="auto" aria-label={t.scriptTitle}>{script.script}</pre>
              <div className="two-col" style={{marginTop:'24px'}}>
                <div className="technique">
                  <h3 className="technique-label">{t.emotionalBeats}</h3>
                  <ul className="technique-list" dir="auto">{(script.beats||[]).map((b,i) => <li key={i}>{b}</li>)}</ul>
                </div>
                <div className="technique">
                  <h3 className="technique-label">{t.cameraLanguage}</h3>
                  <p className="technique-text" dir="auto">{script.cameraLanguage}</p>
                </div>
              </div>
              {script.narrativeStrategy && (
                <div className="technique" style={{marginTop:'16px'}}>
                  <h3 className="technique-label">{t.narrative}</h3>
                  <p className="technique-text" dir="auto">{script.narrativeStrategy}</p>
                </div>
              )}
              <div className="btn-row btn-col">
                <button className="btn btn-secondary btn-full" onClick={doCopy} aria-label={t.copyScript}>{copied ? t.copied : t.copyScript}</button>
                <button className="btn btn-secondary btn-full" onClick={doExport} aria-label={t.exportPdf}>{t.exportPdf}</button>
              </div>
            </div>
          </section>
        )}

        <BrowserAgentPanel apiBase={API} language={lang} onAttach={setBrowserAttachment} />
        <AgentSaaSPanel apiBase={API} browserAttachment={browserAttachment} />
        <GatewayMetricsPanel apiBase={API} language={lang} />

        {/* ── Archive ─────────────────────────────────────────── */}
        {iterations.length > 0 && (
          <section className="stage archive" aria-labelledby="archive-title">
            <div className="stage-header">
              <h2 className="stage-title" id="archive-title">{t.savedIterations}</h2>
              <button className="btn btn-ghost" aria-label={t.clear}
                onClick={() => { setIterations([]); localStorage.removeItem('textfx_iterations') }}>{t.clear}</button>
            </div>
            <div className="archive-grid">
              {iterations.map(it => (
                <button key={it.timestamp} className="archive-card"
                  onClick={() => { invalidatePipeline(); setBrief(it.brief); setInsight(it.insight); setConcept(it.concept); setScript(it.script) }}
                  aria-label={`${t.archiveEmpty}: ${it.brief.slice(0,40)}`}>
                  <span className="arc-time">{new Date(it.timestamp).toLocaleTimeString()}</span>
                  <span className="arc-brief" dir="auto">{it.brief.slice(0,40)}…</span>
                  <span className="arc-arch">{it.archetype}</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <div className="footer-logo">TEXTFX</div>
        <div className="footer-copy">{t.footer}</div>
      </footer>
    </div>
    </>
  )
}

export default function Root() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  )
}
