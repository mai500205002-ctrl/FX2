"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-surface">
      <Sidebar />
      <div className="pr-64">
        <Header />
        <main className="relative pt-28 pb-12 px-8 w-full min-h-screen overflow-x-hidden">
          <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
          <div className="absolute top-40 left-10 w-[400px] h-[250px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>
          <div className="relative z-10 w-full max-w-[1600px] mx-auto">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}
