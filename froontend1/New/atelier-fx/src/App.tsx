import React, { useState } from 'react';
import { ViewMode, SceneShot, TimelineClip, ColorGradeSettings } from './types/studio';
import { INITIAL_SHOTS, INITIAL_TIMELINE_CLIPS } from './data/mockProduction';
import { Header } from './components/Header';
import { StagingDirector } from './components/StagingDirector';
import { SceneSequencer } from './components/SceneSequencer';
import { ContactSheet } from './components/ContactSheet';
import { GradingSuite } from './components/GradingSuite';
import { DirectorModal } from './components/DirectorModal';
import { RenderModal } from './components/RenderModal';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('staging');
  const [shots, setShots] = useState<SceneShot[]>(INITIAL_SHOTS);
  const [activeShotId, setActiveShotId] = useState<string>(INITIAL_SHOTS[0].id);
  const [clips, setClips] = useState<TimelineClip[]>(INITIAL_TIMELINE_CLIPS);
  const [projectName] = useState('REEL 04: NOCTURNE IN BRUTALISM');

  const [isDirectorModalOpen, setIsDirectorModalOpen] = useState(false);
  const [isRenderModalOpen, setIsRenderModalOpen] = useState(false);

  const activeShot = shots.find((s) => s.id === activeShotId) || shots[0];

  const handleUpdateShot = (updated: SceneShot) => {
    setShots((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleApplyToAllShots = (grade: ColorGradeSettings) => {
    setShots((prev) =>
      prev.map((s) => ({
        ...s,
        colorGrade: { ...grade },
      }))
    );
  };

  const handleApplyDirectorPrompt = (prompt: string, tokens: string[]) => {
    handleUpdateShot({
      ...activeShot,
      promptSerif: prompt,
      parameterTokens: tokens,
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#08090a] text-[#e3e2e6]">
      {/* Top Bar Contract (Wordmark, Nav links, Render Master primary CTA) */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenRenderModal={() => setIsRenderModalOpen(true)}
        activeProjectName={projectName}
      />

      {/* Main Viewport Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {currentView === 'staging' && (
          <StagingDirector
            shots={shots}
            activeShot={activeShot}
            onSelectShot={setActiveShotId}
            onUpdateShot={handleUpdateShot}
            onOpenDirectorModal={() => setIsDirectorModalOpen(true)}
            onOpenGrading={() => setCurrentView('grading')}
          />
        )}

        {currentView === 'sequencer' && (
          <SceneSequencer
            shots={shots}
            clips={clips}
            onSelectShot={setActiveShotId}
            onUpdateClips={setClips}
          />
        )}

        {currentView === 'contact' && (
          <ContactSheet
            shots={shots}
            onSelectShot={setActiveShotId}
            onNavigateToStaging={(shotId) => {
              setActiveShotId(shotId);
              setCurrentView('staging');
            }}
            onNavigateToGrading={(shotId) => {
              setActiveShotId(shotId);
              setCurrentView('grading');
            }}
          />
        )}

        {currentView === 'grading' && (
          <GradingSuite
            activeShot={activeShot}
            onUpdateShot={handleUpdateShot}
            onApplyToAllShots={handleApplyToAllShots}
          />
        )}
      </div>

      {/* AI Screenplay & Cinematographic Staging Assistant Modal */}
      <DirectorModal
        isOpen={isDirectorModalOpen}
        onClose={() => setIsDirectorModalOpen(false)}
        onApplyPrompt={handleApplyDirectorPrompt}
      />

      {/* Render Master Export Delivery Modal */}
      <RenderModal
        isOpen={isRenderModalOpen}
        onClose={() => setIsRenderModalOpen(false)}
        projectName={projectName}
      />
    </div>
  );
}
