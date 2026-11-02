import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { DICT, type TKey } from "./i18n";
import { buildRationale, exampleBrief, generateConcepts, generateInsights, generateScenes, uid } from "./generators";
import type { AiStatus, Brief, Concept, EngineId, Insight, Lang, Project, Scene, StageId } from "./types";

const KEY = "fx-creative-lab-v1";
const TOKEN_LIMIT = 200000;

function newProject(lang: Lang, example = true): Project {
  const b = example ? exampleBrief(lang) : { ...exampleBrief(lang), projectName: "", brand: "", audience: "", challenge: "", objective: "", tension: "", keyMessage: "", tone: "", constraints: "" };
  return { id: uid(), updatedAt: Date.now(), brief: b, engine: "provocation", insights: [], concepts: [], scenes: [], rationale: "", seed: 0 };
}

interface State { lang: Lang; stage: StageId; projects: Project[]; currentId?: string | undefined; tokens: number }

function useFxState() {
  const [s, setS] = useState<State>(() => {
    const p = newProject("en");
    return { lang: "en", stage: "home", projects: [p], currentId: p.id, tokens: 18420 };
  });
  const [loaded, setLoaded] = useState(false);
  const [ai, setAi] = useState<AiStatus>("idle");
  const [savedAt, setSavedAt] = useState<number>(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setS(JSON.parse(raw)); } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(KEY, JSON.stringify(s));
    setSavedAt(Date.now());
  }, [s, loaded]);
  useEffect(() => {
    document.documentElement.dir = s.lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = s.lang;
  }, [s.lang]);

  const project = s.projects.find((p) => p.id === s.currentId);
  const t = useCallback((k: TKey) => DICT[s.lang][k], [s.lang]);
  const tips = DICT[s.lang].tips;

  const patch = useCallback((fn: (p: Project) => Project) => {
    setS((st) => ({ ...st, projects: st.projects.map((p) => (p.id === st.currentId ? { ...fn(p), updatedAt: Date.now() } : p)) }));
  }, []);

  const run = useCallback((status: AiStatus, cost: number, fn: () => void, ms = 1100) => {
    setAi(status);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fn();
      setS((st) => ({ ...st, tokens: st.tokens + cost }));
      setAi("done");
      timer.current = setTimeout(() => setAi("idle"), 1600);
    }, ms);
  }, []);

  const api = {
    ...s, project, ai, savedAt, t, tips, tokenLimit: TOKEN_LIMIT,
    setLang: (lang: Lang) => setS((st) => ({ ...st, lang })),
    go: (stage: StageId) => { setS((st) => ({ ...st, stage })); if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" }); },
    create: (example = true) => {
      const p = newProject(s.lang, example);
      setS((st) => ({ ...st, projects: [p, ...st.projects], currentId: p.id, stage: "brief" }));
    },
    openProject: (id: string) => setS((st) => ({ ...st, currentId: id, stage: "brief" })),
    removeProject: (id: string) => setS((st) => ({ ...st, projects: st.projects.filter((p) => p.id !== id), currentId: st.currentId === id ? undefined : st.currentId })),
    updateBrief: (b: Partial<Brief>) => patch((p) => ({ ...p, brief: { ...p.brief, ...b } })),
    loadExample: () => patch((p) => ({ ...p, brief: exampleBrief(p.brief.language) })),
    setEngine: (engine: EngineId) => patch((p) => ({ ...p, engine })),
    genInsights: (engine?: EngineId) => {
      if (!project) return;
      setAi("analyzing");
      setTimeout(() => setAi("tensions"), 600);
      run("analyzing", 2400, () => patch((p) => {
        const e = engine ?? p.engine; const seed = p.seed + 1;
        return { ...p, engine: e, seed, insights: generateInsights(p.brief, e, seed), selectedInsight: undefined };
      }), 1400);
    },
    regenInsight: (id: string) => run("tensions", 800, () => patch((p) => {
      const seed = p.seed + 1; const fresh = generateInsights(p.brief, p.engine, seed)[0];
      return { ...p, seed, insights: p.insights.map((i) => (i.id === id && fresh ? { ...fresh, id } : i)) };
    })),
    updateInsight: (id: string, v: Partial<Insight>) => patch((p) => ({ ...p, insights: p.insights.map((i) => (i.id === id ? { ...i, ...v } : i)) })),
    selectInsight: (id: string) => patch((p) => ({ ...p, selectedInsight: id })),
    genConcepts: () => run("concept", 3100, () => patch((p) => {
      const ins = p.insights.find((i) => i.id === p.selectedInsight); if (!ins) return p;
      const seed = p.seed + 1;
      return { ...p, seed, concepts: generateConcepts(p.brief, ins, seed), selectedConcept: undefined };
    })),
    updateConcept: (id: string, v: Partial<Concept>) => patch((p) => ({ ...p, concepts: p.concepts.map((c) => (c.id === id ? { ...c, ...v } : c)) })),
    selectConcept: (id: string) => patch((p) => ({ ...p, selectedConcept: id })),
    genScript: () => run("script", 4200, () => patch((p) => {
      const c = p.concepts.find((x) => x.id === p.selectedConcept); if (!c) return p;
      const ins = p.insights.find((i) => i.id === p.selectedInsight);
      return { ...p, scenes: generateScenes(p.brief, c), rationale: buildRationale(p.brief, ins, c) };
    }), 1600),
    setScenes: (fn: (sc: Scene[]) => Scene[]) => patch((p) => ({ ...p, scenes: fn(p.scenes) })),
    aiScene: (fn: () => void) => run("script", 600, fn, 700),
  };
  return api;
}

export type Fx = ReturnType<typeof useFxState>;
const Ctx = createContext<Fx | null>(null);
export function FxProvider({ children }: { children: ReactNode }) {
  const v = useFxState();
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}
export function useFx() {
  const c = useContext(Ctx);
  if (!c) throw new Error("FxProvider missing");
  return c;
}
