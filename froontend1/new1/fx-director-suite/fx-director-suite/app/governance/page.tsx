"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";

interface AgentMessage {
  id: string;
  agent: string;
  role: string;
  avatarColor: string;
  text: string;
  status: "APPROVED" | "REJECTED" | "DEBATING";
}

const INITIAL_DEBATE: AgentMessage[] = [
  {
    id: "1",
    agent: "المتمرد الإبداعي",
    role: "Creative Rebel",
    avatarColor: "bg-primary text-on-primary",
    text: "الفكرة الحالية تقليدية جداً تشبه أي إعلان سيارة مكرر. يجب كسر النمط وجعل السحب البصري يبدأ من شاشة مظلمة تماماً بانعكاس صوتي مفاجئ.",
    status: "DEBATING",
  },
  {
    id: "2",
    agent: "سيد الاستراتيجية",
    role: "Strategic Master",
    avatarColor: "bg-secondary text-on-secondary",
    text: "الاعتراض مقبول درامياً، لكنه يخالف عتبة الهوية البصرية للعلامة التجارية (NEOM Guidelines). يجب خفض حدة الظلام بنسبة 15% لضمان توافق الـ ACEScg.",
    status: "REJECTED",
  },
  {
    id: "3",
    agent: "العميل الصعب",
    role: "The Difficult Client",
    avatarColor: "bg-surface-container-highest text-primary",
    text: "الميزانية الزمنية للمشهد 90 ثانية بالضبط. إذا تم قبول تعديل المتمرد، فلن تتسع المدة لعرض الشعار في الأفق. أعيدوا التوجيه!",
    status: "REJECTED",
  },
];

export default function GovernancePage() {
  const [threshold, setThreshold] = useState(92);
  const [messages, setMessages] = useState<AgentMessage[]>(INITIAL_DEBATE);
  const [isAuditing, setIsAuditing] = useState(false);
  const [coherenceScore, setCoherenceScore] = useState(88);

  const handleRunAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      setCoherenceScore(96);
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          agent: "المتدخل الاستراتيجي (AI)",
          role: "Orchestrator Loop",
          avatarColor: "bg-primary-container text-on-primary-container",
          text: "تم تطبيق توجيهات إعادة الصياغة (Rework Directive). استقرار التماسك وصل إلى 96%. تم اعتماد السيناريو للانتقال لطابور الرندرة.",
          status: "APPROVED",
        },
      ]);
    }, 1500);
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-secondary/10 border border-secondary/20 text-secondary font-mono text-[10px] tracking-widest uppercase">
              MODULE // STRATEGIC_AUDIT_GOVERNANCE
            </span>
            <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
              AUTONOMOUS ORCHESTRATOR LOOP
            </span>
          </div>
          <h1 className="font-headline text-3xl font-bold text-on-surface tracking-tight">
            حلقة الحوكمة ونقاش الوكلاء الإبداعي
          </h1>
          <p className="font-body text-sm text-on-surface-variant max-w-2xl leading-relaxed">
            محرك التدقيق الذاتي. تتناقض الشخصيات الثلاث (المتمرد، الاستراتيجي، العميل) لتصفية الأفكار الضعيفة ورفع نسبة التماسك قبل الرندرة.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-6 shadow-xl flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-surface-container-high pb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">forum</span>
                  <h3 className="font-headline font-semibold text-lg text-on-surface">سجل نقاش الوكلاء الحي (Agent Debate Stream)</h3>
                </div>
                <span className="px-2.5 py-1 rounded bg-primary/10 text-primary font-mono text-xs border border-primary/20">
                  COHERENCE: {coherenceScore}%
                </span>
              </div>

              <div className="flex flex-col gap-4 max-h-[450px] overflow-y-auto pl-2">
                {messages.map((msg) => (
                  <div key={msg.id} className="p-4 rounded-lg bg-surface-container-lowest border border-surface-container-high flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${msg.avatarColor}`}>
                          {msg.agent[0]}
                        </span>
                        <span className="font-headline font-semibold text-sm text-on-surface">{msg.agent}</span>
                        <span className="font-mono text-[10px] text-on-surface-variant">({msg.role})</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${msg.status === "APPROVED" ? "bg-primary/10 text-primary" : msg.status === "REJECTED" ? "bg-error-container/20 text-error" : "bg-surface-container text-secondary"}`}>
                        {msg.status}
                      </span>
                    </div>
                    <p className="font-body text-xs text-on-surface-variant leading-relaxed pr-9">
                      {msg.text}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={handleRunAudit}
                disabled={isAuditing}
                className="w-full py-3 rounded-lg bg-primary-container text-on-primary-container font-body text-xs font-semibold hover:bg-primary transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.2)] disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-sm ${isAuditing ? "animate-spin" : ""}`}>
                  {isAuditing ? "sync" : "gavel"}
                </span>
                <span>{isAuditing ? "جاري التدقيق العصبى..." : "تشغيل حلقة الحوكمة وإعادة التوليد (Rework Directive)"}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-6 shadow-xl flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-surface-container-high pb-4">
                <h3 className="font-headline font-semibold text-base text-on-surface">معايير عتبة القبول</h3>
                <span className="font-mono text-xs text-primary">{threshold}%</span>
              </div>

              <div className="flex flex-col gap-3">
                <label className="font-mono text-xs text-on-surface-variant">عتبة التماسك المطلوبة (Threshold Slider)</label>
                <input
                  type="range"
                  min="50"
                  max="99"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
                <span className="font-body text-[11px] text-outline">
                  إذا انخفضت نسبة الفكرة عن هذه العتبة، يقوم النظام تلقائياً برفضها وإجبار الوكلاء على إعادة النقاش.
                </span>
              </div>

              <div className="bg-surface-container-lowest p-4 rounded-lg border border-surface-container-high flex flex-col gap-2">
                <span className="font-mono text-[10px] text-outline uppercase">مسار الباك إند المرتبط</span>
                <code className="font-mono text-xs text-primary bg-surface-container p-2 rounded block" dir="ltr">
                  /api/full-pipeline (Governance)
                </code>
              </div>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
