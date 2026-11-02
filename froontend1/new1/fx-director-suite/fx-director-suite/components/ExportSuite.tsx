"use client";

import React from "react";

interface ExportProps {
  title: string;
  data: Record<string, any>;
}

export function ExportSuite({ title, data }: ExportProps) {
  const downloadJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, "_")}_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={downloadJSON}
        className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface font-body text-xs hover:bg-surface-bright transition-colors flex items-center gap-2 border border-surface-container-highest"
      >
        <span className="material-symbols-outlined text-sm">download</span>
        <span>تصدير JSON</span>
      </button>
    </div>
  );
}
