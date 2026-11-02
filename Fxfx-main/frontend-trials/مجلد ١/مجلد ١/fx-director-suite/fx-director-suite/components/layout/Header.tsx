"use client";

import React from "react";

export function Header() {
  return (
    <header className="fixed top-0 right-64 left-0 h-28 bg-surface-container-lowest/90 backdrop-blur-xl z-40 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.6)] border-b border-surface-container-high/40">
      
      {/* Top Strip: Tools & Global Actions */}
      <div className="h-16 px-6 flex items-center justify-between">
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-surface-container-high">
            <span className="font-mono text-[10px] text-primary">إصدار 5.0</span>
            <span className="text-on-surface-variant">|</span>
            <span className="font-body text-xs text-on-surface font-medium">خط الإنتاج الإبداعي (Creative Pipeline)</span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-surface-container-high shadow-[0_0_12px_rgba(242,202,80,0.15)] border border-primary/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="font-body text-xs text-primary font-bold">وكيل التفكير الجانبي: نشط وجاهز</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors border border-surface-container-highest">
            <span className="material-symbols-outlined text-sm">search</span>
            <span className="font-body text-xs">لوحة الأوامر</span>
            <kbd className="font-mono text-[10px] bg-surface-container-lowest px-1.5 py-0.5 rounded text-outline border border-surface-variant">⌘K</kbd>
          </button>

          <div className="flex items-center gap-2 border-r border-surface-container-high pr-3">
            <button className="px-4 py-1.5 rounded-lg bg-surface-container text-on-surface font-body text-xs hover:bg-surface-container-high transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">ios_share</span>
              <span>مشاركة</span>
            </button>
            <button className="px-4 py-1.5 rounded-lg bg-primary-container text-on-primary-container font-body text-xs font-semibold hover:bg-primary transition-colors flex items-center gap-2 shadow-[0_0_12px_rgba(212,175,55,0.25)]">
              <span className="material-symbols-outlined text-sm">save</span>
              <span>حفظ نهائي</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Strip: Stage Stepper & Scene Metadata */}
      <div className="h-12 px-6 flex items-center justify-between bg-surface-container-low/50 border-t border-surface-container-high/30">
        
        <div className="flex items-center gap-2 flex-1">
          {["الموجز", "الرؤية", "الفكرة", "السيناريو"].map((stage, idx) => {
            const isCurrent = idx === 3;
            const isDone = idx < 3;
            
            return (
              <React.Fragment key={stage}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isCurrent ? "bg-surface-container-highest shadow-[0_0_8px_rgba(242,202,80,0.1)]" : "bg-transparent"}`}>
                  <span className={`material-symbols-outlined text-sm ${isDone ? "text-primary" : isCurrent ? "text-primary animate-pulse" : "text-outline"}`}>
                    {isDone ? "check_circle" : isCurrent ? "radio_button_checked" : "circle"}
                  </span>
                  <div className="flex flex-col">
                    <span className={`font-mono text-[9px] ${isCurrent || isDone ? "text-primary" : "text-outline"}`}>المرحلة ٠{idx + 1}</span>
                    <span className={`font-body text-[11px] ${isCurrent ? "text-on-surface font-bold" : "text-on-surface-variant"}`}>{stage}</span>
                  </div>
                </div>
                {idx < 3 && <span className="text-outline font-mono text-[10px]">←</span>}
              </React.Fragment>
            );
          })}
        </div>

        <div className="flex items-center gap-4 font-mono text-[10px] text-on-surface-variant bg-surface-container-lowest px-3 py-1.5 rounded-lg shadow-inner">
          <span className="material-symbols-outlined text-[14px] text-outline">timeline</span>
          <span className="text-primary font-medium tracking-widest border-l border-surface-container-high pl-3">00:04:12:00</span>
          <span>ASPECT 2.39:1</span>
        </div>
      </div>
    </header>
  );
}
