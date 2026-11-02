import { AppShell } from "@/components/layout/AppShell";

export default function Home() {
  return (
    <AppShell>
      <div className="flex flex-col gap-6 py-8">
        <h1 className="font-headline text-3xl font-semibold text-on-surface">
          غرفة العمليات المركزية
        </h1>
        <p className="font-body text-on-surface-variant max-w-2xl leading-relaxed">
          أهلاً بك في منصة الإخراج الذكي. تم تجهيز الهيكل المعماري (App Shell) بنجاح. 
          نحن الآن مستعدون لربط شاشات مسار العمل (Pipeline) مع الـ Backend API الخاصة بـ TextFX.
        </p>
        
        <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-6 shadow-lg max-w-xl">
           <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
              <span className="font-mono text-xs text-primary uppercase tracking-widest">System Ready</span>
           </div>
           <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-primary w-full animate-pulse"></div>
           </div>
        </div>
      </div>
    </AppShell>
  );
}
