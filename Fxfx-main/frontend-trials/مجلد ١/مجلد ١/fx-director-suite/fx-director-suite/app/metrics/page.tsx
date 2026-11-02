"use client";

import React from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function MetricsPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-primary/10 border border-primary/20 text-primary font-mono text-[10px] tracking-widest uppercase">
              MODULE // TELEMETRY & SaaS METRICS
            </span>
            <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
              REAL-TIME NODE FARM HUD
            </span>
          </div>
          <h1 className="font-headline text-3xl font-bold text-on-surface tracking-tight">
            مراقبة الأداء وطابور الرندرة (Neural Render Queue)
          </h1>
          <p className="font-body text-sm text-on-surface-variant max-w-2xl leading-relaxed">
            متابعة استهلاك الـ Tokens، حالة العقد المتصلة، وتكلفة الجلسة عبر الـ LLM Gateway الحقيقي.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-5 flex flex-col gap-2">
            <span className="font-mono text-[10px] text-on-surface-variant uppercase">استهلاك التوكنز (Total Tokens)</span>
            <span className="font-mono text-2xl text-primary font-bold">48,290</span>
            <span className="font-mono text-[10px] text-secondary">تكلفة تقديرية: $0.145</span>
          </div>

          <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-5 flex flex-col gap-2">
            <span className="font-mono text-[10px] text-on-surface-variant uppercase">سرعة الاستجابة (Latency)</span>
            <span className="font-mono text-2xl text-on-surface font-bold">18ms</span>
            <span className="font-mono text-[10px] text-primary">OpenRouter / Vertex AI</span>
          </div>

          <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-5 flex flex-col gap-2">
            <span className="font-mono text-[10px] text-on-surface-variant uppercase">حالة الحماية (Security)</span>
            <span className="font-mono text-2xl text-primary font-bold">SECURE</span>
            <span className="font-mono text-[10px] text-on-surface-variant">Anti-Prompt Injection Active</span>
          </div>

          <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-5 flex flex-col gap-2">
            <span className="font-mono text-[10px] text-on-surface-variant uppercase">خطة الـ SaaS</span>
            <span className="font-mono text-2xl text-secondary font-bold">STUDIO</span>
            <span className="font-mono text-[10px] text-primary">غير محدود المعالجة</span>
          </div>
        </div>

        <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-surface-container-high pb-4">
            <h3 className="font-headline font-semibold text-base text-on-surface">طابور مهام الرندرة العصبية (Active Render Queue)</h3>
            <span className="font-mono text-xs text-primary">3 مهام قيد المعالجة</span>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { id: "SLATE-01", name: "محاكاة قطرة الماء الفائقة (120fps)", progress: 100, status: "مكتمل" },
              { id: "SLATE-02", name: "انغمار الحواس وزاوية الكاميرا 35mm", progress: 68, status: "قيد الرندرة" },
              { id: "SLATE-03", name: "تثبيت مجسم الزجاج ثلاثي الأبعاد", progress: 15, status: "في الانتظار" },
            ].map((task) => (
              <div key={task.id} className="p-4 rounded-lg bg-surface-container-lowest border border-surface-container-high flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-primary font-bold">{task.id}</span>
                  <span className="font-body text-sm text-on-surface">{task.name}</span>
                </div>
                <div className="flex items-center gap-4 w-1/3">
                  <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${task.progress}%` }}></div>
                  </div>
                  <span className="font-mono text-xs text-on-surface-variant">{task.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
