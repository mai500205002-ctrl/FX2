"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const ACTIONS = [
    { label: "الموجز الإبداعي", path: "/brief", icon: "description" },
    { label: "محركات التفكير الخمسة", path: "/engines", icon: "psychology" },
    { label: "حلقة الحوكمة والتدقيق", path: "/governance", icon: "gavel" },
    { label: "مراقبة الأداء وطابور الرندرة", path: "/metrics", icon: "analytics" },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const filteredActions = ACTIONS.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-28">
      <div className="bg-surface-container-low border border-surface-container-high rounded-xl w-full max-w-lg p-4 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-surface-container-high pb-2">
          <span className="material-symbols-outlined text-primary">search</span>
          <input
            type="text"
            autoFocus
            placeholder="ابحث عن شاشة أو أمر سريع..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-on-surface focus:outline-none font-body text-sm"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="font-mono text-xs text-outline hover:text-on-surface"
          >
            ESC
          </button>
        </div>

        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
          {filteredActions.map((action) => (
            <button
              key={action.path}
              onClick={() => {
                router.push(action.path);
                setIsOpen(false);
              }}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors text-right"
            >
              <span className="material-symbols-outlined text-sm">{action.icon}</span>
              <span className="font-body text-sm">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
