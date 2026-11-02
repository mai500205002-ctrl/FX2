"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";

interface Engine {
  id: string;
  name: string;
  enName: string;
  description: string;
  status: "ACTIVE" | "STANDBY" | "PROCESSING";
  weight: number;
  icon: string;
}

const LATERAL_ENGINES: Engine[] = [
  {
    id: "provocation",
    name: "الاستفزاز الإبداعي",
    enName: "Provocation (Po)",
    description: "زرع فرضيات غير منطقية عمداً لكسر القوالب التقليدية وتوليد أفكار جذرية خارج السرب.",
    status: "ACTIVE",
    weight: 92,
    icon: "bolt",
  },
  {
    id: "analogy",
    name: "القياس الاستراتيجي",
    enName: "Analogy Mapping",
    description: "نقل الحلول والهياكل من قطاعات صناعية مختلفة تماماً إلى مجال الحملة التسويقية.",
    status: "ACTIVE",
    weight: 85,
    icon: "compare_arrows",
  },
  {
    id: "random",
    name: "المحفز العشوائي",
    enName: "Random Stimulus",
    description: "حقق ارتباطاً غير متوقع بين عناصر الطبيعة أو التكنولوجيا والفكرة لتفجير زوايا رؤية جديدة.",
    status: "STANDBY",
    weight: 64,
    icon: "shuffle",
  },
  {
    id: "reverse",
    name: "التفكير العكسي",
    enName: "Reverse Logic",
    description: "قلب المشكلة رأسًا على عقب (مثلاً: كيف نفشل تماماً؟) لاستنباط أساليب النجاح الخفية.",
    status: "ACTIVE",
    weight: 78,
    icon: "autorenew",
  },
  {
    id: "constraints",
    name: "عكس القيود",
    enName: "Constraint Reversal",
    description: "تحويل الموانع والحدود الصارمة للعميل إلى ميزات تنافسية فريدة وأساس للهوية.",
    status: "PROCESSING",
    weight: 95,
    icon: "lock_open",
  },
];

export default function LateralEnginesPage() {
  const [engines, setEngines] = useState<Engine[]>(LATERAL_ENGINES);
  const [selectedEngine, setSelectedEngine] = useState<Engine>(LATERAL_ENGINES[0]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [promptInput, setPromptInput] = useState("إطلاق حملة تسويقية لسيارة كهربائية في أفق صحراء نيوم الصامتة");

  const handleExecuteEngine = async (engineId: string) => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      alert(`تم تشغيل محرك [${engineId}] بنجاح، وتحديث مسار التفكير الجانبي!`);
    }, 1200);
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-primary/10 border border-primary/20 text-primary font-mono text-[10px] tracking-widest uppercase">
              MODULE // LATERAL_NEURAL_PROCESSING
            </span>
            <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
              5 DIVERGENT COGNITIVE VECTORS
            </span>
          </div>
          <h1 className="font-headline text-3xl font-bold text-on-surface tracking-tight">
            محركات التفكير الجانبي الخمسة
          </h1>
          <p className="font-body text-sm text-on-surface-variant max-w-2xl leading-relaxed">
            القلب النابض للذكاء الاصطناعي الإبداعي. تحكم في أوزان المحركات الخمسة واربطها بمسارات التوليد البصري والنصي للباك إند.
          </p>
        </div>

        <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <label className="font-mono text-xs text-on-surface uppercase font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">terminal</span>
              مُدخل السياق الأساسي للتحليل (Context Prompt Seed)
            </label>
            <span className="font-mono text-[10px] text-primary bg-surface-container px-2 py-0.5 rounded">SYNCED WITH /api/insight</span>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              className="flex-1 bg-surface-container-highest border border-surface-container-high rounded-lg px-4 py-3 font-body text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
              placeholder="اكتب التوجيه الأساسي..."
            />
            <button
              onClick={() => handleExecuteEngine(selectedEngine.id)}
              disabled={isExecuting}
              className="px-6 py-3 rounded-lg bg-primary-container text-on-primary-container font-body text-xs font-semibold hover:bg-primary transition-all flex items-center gap-2 shadow-[0_0_12px_rgba(212,175,55,0.2)] disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-sm ${isExecuting ? "animate-spin" : ""}`}>
                {isExecuting ? "sync" : "bolt"}
              </span>
              <span>{isExecuting ? "جاري المعالجة..." : "حقن وزيادة التفكير"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="font-mono text-xs text-on-surface-variant uppercase tracking-wider mb-1">
              المحركات النشطة في الذاكرة (COGNITIVE NODES)
            </div>

            {engines.map((engine) => {
              const isSelected = selectedEngine.id === engine.id;
              return (
                <div
                  key={engine.id}
                  onClick={() => setSelectedEngine(engine)}
                  className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col gap-4 ${
                    isSelected
                      ? "bg-surface-container-high border-primary shadow-[0_0_20px_rgba(242,202,80,0.08)]"
                      : "bg-surface-container-low border-surface-container-high/60 hover:border-outline-variant"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? "bg-primary text-on-primary font-bold" : "bg-surface-container text-primary"}`}>
                        <span className="material-symbols-outlined text-xl">{engine.icon}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-headline font-semibold text-base text-on-surface">{engine.name}</span>
                        <span className="font-mono text-[10px] text-on-surface-variant uppercase">{engine.enName}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <span className="font-mono text-[10px] text-outline">وزن التأثير</span>
                        <span className="font-mono text-sm text-primary font-bold">{engine.weight}%</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${engine.status === "ACTIVE" ? "bg-primary/10 text-primary border border-primary/20" : engine.status === "PROCESSING" ? "bg-secondary/10 text-secondary border border-secondary/20" : "bg-surface-container text-outline"}`}>
                        {engine.status}
                      </span>
                    </div>
                  </div>

                  <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                    {engine.description}
                  </p>

                  <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${engine.weight}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="font-mono text-xs text-on-surface-variant uppercase tracking-wider mb-1">
              مؤشرات تشخيص المحرك (ENGINE TELEMETRY)
            </div>

            <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-6 shadow-xl flex flex-col gap-6 sticky top-28">
              <div className="flex items-center justify-between border-b border-surface-container-high pb-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-2xl">{selectedEngine.icon}</span>
                  <div>
                    <h3 className="font-headline font-bold text-lg text-on-surface">{selectedEngine.name}</h3>
                    <span className="font-mono text-xs text-primary">{selectedEngine.enName}</span>
                  </div>
                </div>
                <span className="w-3 h-3 rounded-full bg-primary animate-pulse"></span>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-on-surface-variant">معدل العشوائية المحكومة (Temperature)</span>
                    <span className="text-primary">0.85</span>
                  </div>
                  <input type="range" min="0" max="100" defaultValue="85" className="w-full accent-primary cursor-pointer" />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-on-surface-variant">عمق الاستفزاز المنطقي (Depth)</span>
                    <span className="text-secondary">72%</span>
                  </div>
                  <input type="range" min="0" max="100" defaultValue="72" className="w-full accent-secondary cursor-pointer" />
                </div>
              </div>

              <div className="bg-surface-container-lowest p-4 rounded-lg border border-surface-container-high flex flex-col gap-2">
                <span className="font-mono text-[10px] text-outline uppercase">مسار الربط البرمجي (Backend Endpoint)</span>
                <code className="font-mono text-xs text-primary bg-surface-container p-2 rounded block" dir="ltr">
                  POST /api/insight?engine={selectedEngine.id}
                </code>
                <span className="font-body text-[11px] text-on-surface-variant mt-1">
                  يقوم الباك إند بتفعيل هذه الخوارزمية عبر عقلية الـ Lateral Thinking Agent لتوليد مخرجات فريدة.
                </span>
              </div>

              <button
                onClick={() => handleExecuteEngine(selectedEngine.id)}
                className="w-full py-3 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-body text-xs font-semibold border border-surface-container-highest transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm text-primary">play_arrow</span>
                <span>اختبار الاستجابة الفورية للمحرك</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
