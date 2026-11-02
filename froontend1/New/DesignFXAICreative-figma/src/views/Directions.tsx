import type { CSSProperties, ReactNode } from 'react'

interface Th {
  bg: string
  fg: string
  dim: string
  rule: string
  accent: string
  accentFg: string
  display: string
  body: string
  mono: string
  ar: string
}

const Bar = ({ w = '100%', h = 5, o = 0.28, col }: { w?: string | number; h?: number; o?: number; col?: string }) => (
  <div style={{ width: w, height: h, background: col ?? 'currentColor', opacity: col ? 1 : o }} />
)

const Panel = ({ th, title, text, children }: { th: Th; title: string; text: string; children: ReactNode }) => (
  <div style={{ borderColor: th.rule }} className="flex flex-col gap-4 border p-5">
    <div style={{ fontFamily: th.mono, color: th.dim }} className="text-[10px] uppercase tracking-[.16em]">
      {title}
    </div>
    <div className="min-h-[190px] flex-1">{children}</div>
    <p style={{ color: th.dim }} className="text-[13px] leading-relaxed">
      {text}
    </p>
  </div>
)

function Identity({ th, swatches, sample, sampleStyle, fonts }: { th: Th; swatches: string[]; sample: string; sampleStyle: CSSProperties; fonts: string }) {
  return (
    <div className="flex h-full flex-col justify-between gap-4">
      <div className="flex">
        {swatches.map((c) => (
          <div key={c} style={{ background: c, border: `1px solid ${th.rule}` }} className="h-10 flex-1" />
        ))}
      </div>
      <div style={{ fontFamily: th.display, ...sampleStyle }}>{sample}</div>
      <div style={{ fontFamily: th.ar }} dir="rtl" className="text-[22px]">
        الساعة التي بعد الغروب
      </div>
      <div style={{ fontFamily: th.mono, color: th.dim }} className="text-[10px] uppercase tracking-[.12em]">
        {fonts}
      </div>
    </div>
  )
}

/* ---------- Direction A: Title Sequence ---------- */
const NavA = ({ th }: { th: Th }) => (
  <div className="flex h-full flex-col justify-center gap-5" style={{ fontFamily: th.mono }}>
    <div className="flex justify-between text-[9px]">
      {['01 Brief', '02 Lens', '03 Insight', '04 Concept', '05 Script', '06 Out'].map((s, i) => (
        <span key={s} style={{ color: i === 2 ? th.fg : th.dim, borderBottom: `2px solid ${i === 2 ? th.accent : 'transparent'}` }} className="pb-1">
          {s}
        </span>
      ))}
    </div>
    <div style={{ background: th.rule }} className="h-px">
      <div style={{ width: '42%', background: th.accent }} className="h-px" />
    </div>
    <div style={{ color: th.dim }} className="text-[10px]">
      Brief: Dar → Lens: Opposite → Insight 01 → Route A
    </div>
    <div className="text-[11px]" style={{ fontFamily: th.display, fontStyle: 'italic' }}>
      One stage on screen. Context ribbon always shows the chain.
    </div>
  </div>
)
const WsA = ({ th }: { th: Th }) => (
  <div className="flex h-full flex-col gap-2">
    <div className="grid flex-1 grid-cols-12 gap-3">
      <div className="col-span-3 flex flex-col gap-2 pt-1">
        <Bar w="60%" h={3} col={th.accent} />
        <Bar h={3} />
        <Bar w="80%" h={3} />
        <Bar w="70%" h={3} />
      </div>
      <div className="col-span-9 flex flex-col gap-3 border-l pl-3" style={{ borderColor: th.rule }}>
        <div style={{ fontFamily: th.display }} className="text-[22px] italic leading-none">
          A mind at work
        </div>
        <Bar h={7} o={0.5} />
        <Bar w="85%" h={7} o={0.5} />
        <Bar w="40%" h={7} o={0.2} />
      </div>
    </div>
    <div className="grid grid-cols-4 gap-2 border-t pt-2" style={{ borderColor: th.rule }}>
      {['here', 'edit', 'regen', 'next'].map((x) => (
        <div key={x} style={{ fontFamily: th.mono, color: th.dim }} className="text-[8px] uppercase">
          {x}
          <Bar h={3} o={0.4} w="80%" />
        </div>
      ))}
    </div>
  </div>
)
const ScA = ({ th }: { th: Th }) => (
  <div className="flex h-full flex-col gap-3">
    <div className="flex flex-1 items-center justify-center" style={{ background: '#050403' }}>
      <div style={{ background: '#EAE2D0', color: '#16120d', fontFamily: "'Courier Prime',monospace" }} className="w-[70%] p-3 text-[8px] leading-tight">
        <b>1. EXT. RIYADH SKYLINE, DUSK</b>
        <br />
        The sun drops behind the towers.
        <div className="mt-1 text-center">NOUR</div>
        <div className="text-center">Not yet.</div>
      </div>
    </div>
    <div className="flex h-5 gap-px">
      {[10, 12, 14, 14, 10].map((d, i) => (
        <div key={i} style={{ flexGrow: d, background: i === 1 ? th.accent : 'rgba(237,229,214,.12)' }} />
      ))}
    </div>
  </div>
)

/* ---------- Direction B: Specimen Sheet ---------- */
const NavB = ({ th }: { th: Th }) => (
  <div className="flex h-full gap-3 text-[9px]" style={{ fontFamily: th.mono }}>
    <div className="flex w-[38%] flex-col gap-1 border-r pr-2" style={{ borderColor: th.fg }}>
      {['§1 BRIEF', '§2 LENS', '§3 INSIGHT', '§4 CONCEPT', '§5 SCRIPT', '§6 OUTPUT'].map((s, i) => (
        <div key={s} className="px-1 py-0.5" style={i === 2 ? { background: th.accent, color: th.fg } : {}}>
          {s}
        </div>
      ))}
    </div>
    <div className="flex flex-1 flex-col gap-2">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex flex-col gap-1 border-t pt-1" style={{ borderColor: th.fg, outline: i === 2 ? `2px solid ${th.accent}` : 'none' }}>
          <Bar h={3} o={0.6} />
          <Bar w="60%" h={3} o={0.25} />
        </div>
      ))}
    </div>
  </div>
)
const WsB = ({ th }: { th: Th }) => (
  <div className="flex h-full flex-col text-[9px]" style={{ fontFamily: th.mono }}>
    <div className="grid grid-cols-2 border-y-2 py-1 font-bold" style={{ borderColor: th.fg }}>
      <span>INPUT</span>
      <span>OUTPUT</span>
    </div>
    {[
      ['coffee = mornings', 'coffee = evenings'],
      ['energy', 'permission'],
      ['bottle first', 'bottle last'],
      ['sells caffeine', 'sells time'],
    ].map(([a, b], i) => (
      <div key={a} className="grid grid-cols-2 border-b py-1.5" style={{ borderColor: th.rule, background: i === 2 ? th.accent : 'transparent' }}>
        <span style={{ opacity: 0.6 }}>{a}</span>
        <span>→ {b}</span>
      </div>
    ))}
    <div className="mt-auto flex gap-2 pt-2">
      <span style={{ background: th.fg, color: th.bg }} className="px-2 py-1">
        REGEN
      </span>
      <span className="border px-2 py-1" style={{ borderColor: th.fg }}>
        EDIT
      </span>
    </div>
  </div>
)
const ScB = ({ th }: { th: Th }) => (
  <div className="h-full p-3 text-[9px] leading-[1.7]" style={{ background: '#0B0B0B', color: '#EDEDE6', fontFamily: th.mono }}>
    <div style={{ color: '#C6FF00' }}>$ fx script --route A --live</div>
    {[
      ['00:00', 'SC.01', 'EXT. RIYADH, DUSK'],
      ['00:10', 'SC.02', "INT. STUDIO, 7:42PM"],
      ['00:22', 'SC.03', 'EXT. ROOFTOP, NIGHT'],
    ].map((r) => (
      <div key={r[0]} className="flex gap-3">
        <span style={{ opacity: 0.5 }}>{r[0]}</span>
        <span style={{ color: '#C6FF00' }}>{r[1]}</span>
        <span>{r[2]}</span>
      </div>
    ))}
    <div className="caret mt-1">&gt; edit sc.02 vo</div>
  </div>
)

/* ---------- Direction C: Atelier ---------- */
const Clip = ({ th, x, y, r, w, children, alt }: { th: Th; x: string; y: string; r: number; w: number; children: ReactNode; alt?: boolean }) => (
  <div
    style={{ left: x, top: y, width: w, transform: `rotate(${r}deg)`, background: alt ? th.accent : '#F7EFDF', color: alt ? '#F7EFDF' : th.fg, boxShadow: '2px 4px 0 rgba(42,31,22,.12)' }}
    className="absolute px-2 py-1.5 text-[11px] leading-tight"
  >
    {children}
  </div>
)
const NavC = ({ th }: { th: Th }) => (
  <div className="relative h-[200px]" style={{ fontFamily: th.body }}>
    {[
      ['4%', '8%', 'Brief'],
      ['38%', '44%', 'Insight'],
      ['64%', '6%', 'Script'],
    ].map(([x, y, l]) => (
      <div key={l} style={{ left: x, top: y, borderColor: th.dim }} className="absolute grid size-[34%] place-items-center rounded-full border border-dashed">
        <span style={{ fontFamily: th.display, color: th.dim }} className="text-[16px] italic">
          {l}
        </span>
      </div>
    ))}
    <Clip th={th} x="8%" y="40%" r={-4} w={72}>
      sold for mornings
    </Clip>
    <Clip th={th} x="44%" y="30%" r={3} w={76} alt>
      second sunrise
    </Clip>
    <Clip th={th} x="70%" y="52%" r={-2} w={66}>
      ice, macro
    </Clip>
  </div>
)
const WsC = ({ th }: { th: Th }) => (
  <div className="relative h-[200px]" style={{ fontFamily: th.body }}>
    <Clip th={th} x="2%" y="6%" r={-3} w={110}>
      <i style={{ fontFamily: th.display }} className="text-[15px]">
        The day changes light
      </i>
    </Clip>
    <Clip th={th} x="48%" y="2%" r={4} w={90} alt>
      Insight 02
    </Clip>
    <Clip th={th} x="14%" y="46%" r={2} w={120}>
      Lighthouse for the night shift
    </Clip>
    <Clip th={th} x="58%" y="52%" r={-5} w={84}>
      what if no bottle?
    </Clip>
    <svg className="absolute inset-0 size-full" fill="none" stroke={th.accent} strokeWidth="1" strokeDasharray="3 3">
      <path d="M80 50C120 40 140 30 150 25M100 90C130 110 150 120 170 130" />
    </svg>
  </div>
)
const ScC = ({ th }: { th: Th }) => (
  <div className="grid h-full grid-cols-3 gap-3 text-[11px]" style={{ fontFamily: th.body }}>
    <div className="col-span-2 flex flex-col gap-1.5" style={{ fontFamily: th.display }}>
      <div className="text-[15px] italic">Scene 3, rooftop, night</div>
      <Bar h={4} o={0.5} />
      <Bar w="90%" h={4} o={0.5} />
      <Bar w="70%" h={4} o={0.3} />
      <div className="mt-auto grid grid-cols-3 gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="aspect-video border" style={{ borderColor: th.dim, background: 'rgba(180,80,47,.15)' }} />
        ))}
      </div>
    </div>
    <div className="flex flex-col gap-3 pt-5" style={{ color: th.accent }}>
      <div className="-rotate-2 border-b border-dashed" style={{ borderColor: th.accent }}>
        hold on the crack
      </div>
      <div className="rotate-1 border-b border-dashed" style={{ borderColor: th.accent }}>
        warmer here?
      </div>
    </div>
  </div>
)

const A: Th = { bg: '#0A0908', fg: '#EDE5D6', dim: '#A39B8C', rule: 'rgba(237,229,214,.18)', accent: '#FF5A2A', accentFg: '#0A0908', display: "'Newsreader',serif", body: "'Hanken Grotesk',sans-serif", mono: "'DM Mono',monospace", ar: "'Amiri',serif" }
const B: Th = { bg: '#F1F0EA', fg: '#0B0B0B', dim: '#55554E', rule: 'rgba(11,11,11,.25)', accent: '#C6FF00', accentFg: '#0B0B0B', display: "'Archivo',sans-serif", body: "'Archivo',sans-serif", mono: "'JetBrains Mono',monospace", ar: "'IBM Plex Sans Arabic',sans-serif" }
const C: Th = { bg: '#EBDFCB', fg: '#2A1F16', dim: '#6E5C49', rule: 'rgba(42,31,22,.25)', accent: '#B4502F', accentFg: '#F7EFDF', display: "'Instrument Serif',serif", body: "'Instrument Sans',sans-serif", mono: "'Instrument Sans',sans-serif", ar: "'Amiri',serif" }

interface Dir {
  key: string
  name: string
  tag: string
  th: Th
  philosophy: string
  layout: string
  identity: ReactNode
  identityText: string
  nav: ReactNode
  navText: string
  ws: ReactNode
  wsText: string
  script: ReactNode
  scriptText: string
  rtl: string
}

const DIRS: Dir[] = [
  {
    key: 'A',
    name: 'Title Sequence',
    tag: 'Cinematic noir',
    th: A,
    philosophy: 'FX is a screening room. One stage fills the frame at a time, like chapters in a film. The AI is a director thinking out loud beside you.',
    layout: 'Asymmetric 3 / 9 grid. A narrow column holds the AI\'s reasoning; the wide column holds the work. Huge serif type, hairline rules, no cards.',
    identity: <Identity th={A} swatches={['#0A0908', '#1B1815', '#EDE5D6', '#A39B8C', '#FF5A2A']} sample="The hour after sunset" sampleStyle={{ fontSize: 34, fontStyle: 'italic', fontWeight: 300, lineHeight: 1 }} fonts="Newsreader · Hanken Grotesk · DM Mono · Amiri" />,
    identityText: 'Warm black, bone paper, one vermilion signal. Transitional serif display against a quiet grotesk. Mono only for labels.',
    nav: <NavA th={A} />,
    navText: 'Linear pipeline rail with a Lens node between Brief and Insight. A context ribbon records the chain of decisions.',
    ws: <WsA th={A} />,
    wsText: 'Three zones: AI reasoning left, editable work center, a four-field status bar (here, editable, regenerate, next) pinned below.',
    script: <ScA th={A} />,
    scriptText: 'A bone-colored screenplay page glowing in a dark room, with a proportional timeline above. Every line is editable in place.',
    rtl: 'RTL: the rail, grid and arrows mirror. Newsreader swaps to Amiri, a calligraphic serif that carries the same editorial gravity.',
  },
  {
    key: 'B',
    name: 'The Specimen Sheet',
    tag: 'Brutalist laboratory',
    th: B,
    philosophy: 'FX is a lab notebook. Everything is visible at once on one ruled document. The AI shows its working: inputs, transformations, outputs.',
    layout: 'Strict ruled table grid. Zero radius, hard black rules, one acid highlight. Dense, scannable, fast for power users.',
    identity: <Identity th={B} swatches={['#F1F0EA', '#0B0B0B', '#55554E', '#C6FF00', '#D8D6CC']} sample="THE HOUR AFTER SUNSET" sampleStyle={{ fontSize: 26, fontWeight: 800, lineHeight: 1, letterSpacing: '-.02em' }} fonts="Archivo · JetBrains Mono · IBM Plex Sans Arabic" />,
    identityText: 'Paper white, pure black, acid lime as a highlighter. Heavy grotesk headlines over monospace data.',
    nav: <NavB th={B} />,
    navText: 'A fixed left index (§1 to §6) over one long scrolling document. Stages are sections, not screens.',
    ws: <WsB th={B} />,
    wsText: 'Input and output side by side as a ruled table. Changed rows are highlighted like a diff.',
    script: <ScB th={B} />,
    scriptText: 'A terminal log with timecode gutter and a live cursor. Powerful for editing, but cold for a creative audience.',
    rtl: 'RTL: the index flips to the right and mono labels become Plex Arabic. Tabular logic survives well.',
  },
  {
    key: 'C',
    name: 'The Atelier',
    tag: 'Warm spatial moodboard',
    th: C,
    philosophy: 'FX is a studio wall. Thoughts are clippings you pin, group and connect. The AI is a collaborator who leaves notes in the margin.',
    layout: 'A freeform canvas. Rotated paper scraps, tape, dashed connectors, handwritten annotations. Tactile and human.',
    identity: <Identity th={C} swatches={['#EBDFCB', '#F7EFDF', '#2A1F16', '#B4502F', '#6B7A45']} sample="The hour after sunset" sampleStyle={{ fontSize: 40, lineHeight: 1 }} fonts="Instrument Serif · Instrument Sans · Amiri" />,
    identityText: 'Cream stock, ink brown, terracotta. A soft condensed serif, warm and approachable.',
    nav: <NavC th={C} />,
    navText: 'Spatial zones for Brief, Insight and Script on a pannable canvas. Progress is a path, not a list.',
    ws: <WsC th={C} />,
    wsText: 'Freeform board where each insight is a movable clipping. Delightful for ideation, hard to keep a clear stage.',
    script: <ScC th={C} />,
    scriptText: 'An annotated manuscript with margin notes and storyboard frames. Rich, but fragile for a timed 60-second script.',
    rtl: 'RTL: the canvas flow reverses and notes move to the opposite margin. Handwriting-style notes would need a bespoke Arabic face.',
  },
]

export default function Directions({ onEnter }: { onEnter: () => void }) {
  return (
    <div style={{ background: '#0A0908', color: '#EDE5D6', fontFamily: "'Hanken Grotesk',sans-serif" }}>
      <header className="flex h-16 items-center justify-between border-b px-6 lg:px-14" style={{ borderColor: A.rule }}>
        <div className="flex items-baseline gap-3">
          <span style={{ fontFamily: A.display }} className="text-[1.9rem] italic leading-none">
            FX
          </span>
          <span style={{ fontFamily: A.mono, color: A.dim }} className="text-[11px] uppercase tracking-[.14em]">
            Design exploration
          </span>
        </div>
        <button onClick={onEnter} style={{ fontFamily: A.mono, color: A.dim }} className="cursor-pointer text-[11px] uppercase tracking-[.14em] transition-colors hover:text-[#FF5A2A]">
          Skip to the product →
        </button>
      </header>

      <section className="px-6 pb-20 pt-20 lg:px-14">
        <div style={{ fontFamily: A.mono, color: A.dim }} className="text-[11px] uppercase tracking-[.14em]">
          Phase 01 · Three product philosophies
        </div>
        <h1 style={{ fontFamily: A.display }} className="mt-6 max-w-5xl text-[clamp(2.8rem,7vw,6.5rem)] font-light leading-[.95] tracking-[-0.03em]">
          Three ways to give a machine <em style={{ color: A.accent }}>a creative mind.</em>
        </h1>
        <p style={{ color: A.dim }} className="mt-8 max-w-2xl text-[17px] leading-relaxed">
          Same pipeline (Brief, Insight, Concept, Script), same five lateral-thinking engines. Three different answers to what the product is: a screening room, a lab notebook, a studio wall. Each is shown with its identity, layout, navigation, workspace and script experience.
        </p>
        <div className="mt-10 flex flex-wrap gap-6" style={{ fontFamily: A.mono, color: A.dim }}>
          {DIRS.map((d) => (
            <a key={d.key} href={`#dir-${d.key}`} className="text-[12px] uppercase tracking-[.12em] transition-colors hover:text-[#FF5A2A]">
              {d.key} · {d.name}
            </a>
          ))}
        </div>
      </section>

      {DIRS.map((d) => (
        <section id={`dir-${d.key}`} key={d.key} style={{ background: d.th.bg, color: d.th.fg, fontFamily: d.th.body }} className="px-6 py-20 lg:px-14">
          <div className="grid grid-cols-12 gap-x-10 gap-y-8">
            <div className="col-span-12 lg:col-span-7">
              <div style={{ fontFamily: d.th.mono, color: d.th.dim }} className="text-[11px] uppercase tracking-[.16em]">
                Direction {d.key} · {d.tag}
              </div>
              <h2
                style={{ fontFamily: d.th.display, fontWeight: d.key === 'B' ? 800 : 400, textTransform: d.key === 'B' ? 'uppercase' : 'none', fontStyle: d.key === 'A' ? 'italic' : 'normal' }}
                className="mt-5 text-[clamp(2.6rem,6vw,5.5rem)] leading-[.95] tracking-[-0.025em]"
              >
                {d.name}
              </h2>
            </div>
            <div className="col-span-12 flex flex-col gap-4 lg:col-span-5">
              <p className="text-[17px] leading-relaxed">{d.philosophy}</p>
              <p style={{ color: d.th.dim }} className="text-[14px] leading-relaxed">
                <b style={{ color: d.th.fg }}>Layout philosophy. </b>
                {d.layout}
              </p>
            </div>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Panel th={d.th} title="Identity & type" text={d.identityText}>
              {d.identity}
            </Panel>
            <Panel th={d.th} title="Navigation model" text={d.navText}>
              {d.nav}
            </Panel>
            <Panel th={d.th} title="Workspace structure" text={d.wsText}>
              {d.ws}
            </Panel>
            <Panel th={d.th} title="Cinematic script" text={d.scriptText}>
              {d.script}
            </Panel>
          </div>
          <p style={{ color: d.th.dim, borderColor: d.th.rule }} className="mt-5 max-w-3xl border-t pt-4 text-[13px]">
            <b style={{ color: d.th.fg }}>Arabic & RTL. </b>
            {d.rtl}
          </p>
        </section>
      ))}

      <section className="px-6 py-24 lg:px-14">
        <div className="grid grid-cols-12 gap-x-10 gap-y-10">
          <div className="col-span-12 lg:col-span-6">
            <div style={{ fontFamily: A.mono, color: A.accent }} className="text-[11px] uppercase tracking-[.16em]">
              Recommendation
            </div>
            <h2 style={{ fontFamily: A.display }} className="mt-5 text-[clamp(2.6rem,6vw,5.5rem)] font-light italic leading-[.95] tracking-[-0.03em]">
              Direction A, <br />
              Title Sequence.
            </h2>
            <button
              onClick={onEnter}
              style={{ background: A.accent, color: A.accentFg }}
              className="mt-10 inline-flex h-12 cursor-pointer items-center gap-3 px-6 text-[14px] font-medium transition-colors hover:!bg-[#EDE5D6]"
            >
              Enter the FX Lab →
            </button>
          </div>
          <ol className="col-span-12 flex flex-col lg:col-span-6">
            {[
              ['The pipeline reads instantly.', 'A linear rail makes Brief to Insight to Concept to Script the visible spine. B hides it in a document; C turns it into a map.'],
              ['It fits the output.', 'The end product is a film. A dark screening room with a paper script page makes the final stage feel like the destination.'],
              ['It travels into Arabic.', 'A serif-led system pairs with Amiri without losing its voice, and the single-axis layout mirrors cleanly.'],
              ['It borrows the best of B and C.', "B's rigor becomes the status bar and visible reasoning trace. C's tactility becomes editable clippings and the paper script."],
            ].map(([h, p], i) => (
              <li key={h} style={{ borderColor: A.rule }} className="grid grid-cols-12 gap-4 border-t py-5 last:border-b">
                <span style={{ fontFamily: A.mono, color: A.accent }} className="col-span-1 text-[11px]">
                  0{i + 1}
                </span>
                <div className="col-span-11">
                  <div style={{ fontFamily: A.display }} className="text-[1.4rem] leading-tight">
                    {h}
                  </div>
                  <p style={{ color: A.dim }} className="mt-1 text-[14px] leading-relaxed">
                    {p}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  )
}
