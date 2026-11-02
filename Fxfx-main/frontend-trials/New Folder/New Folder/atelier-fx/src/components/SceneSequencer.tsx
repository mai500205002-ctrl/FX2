import React, { useState, useEffect, useRef } from 'react';
import { SceneShot, TimelineClip } from '../types/studio';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Scissors,
  Volume2,
  Eye,
  EyeOff,
  Lock,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronRight,
} from 'lucide-react';

interface SceneSequencerProps {
  shots: SceneShot[];
  clips: TimelineClip[];
  onSelectShot: (shotId: string) => void;
  onUpdateClips: (clips: TimelineClip[]) => void;
}

export const SceneSequencer: React.FC<SceneSequencerProps> = ({
  shots,
  clips,
  onSelectShot,
  onUpdateClips,
}) => {
  const [currentTime, setCurrentTime] = useState(6.2);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(28); // pixels per second
  const [isV1Visible, setIsV1Visible] = useState(true);
  const [isV2Visible, setIsV2Visible] = useState(true);
  const [isA1Muted, setIsA1Muted] = useState(false);
  const [activeClipId, setActiveClipId] = useState<string>('clip-01');

  const totalDuration = 30.0; // 30 seconds project timeline
  const timelineRef = useRef<HTMLDivElement>(null);
  const isDraggingPlayhead = useRef(false);

  // Timecode formatting helper: HH:MM:SS:FF at 24fps
  const formatTimecode = (seconds: number) => {
    const s = Math.max(0, seconds);
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    const frames = Math.floor((s % 1) * 24);
    return `00:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  };

  // Find currently active clip and corresponding shot based on currentTime
  const currentV1Clip = clips.find(
    (c) => c.trackId === 'v1' && currentTime >= c.startSecond && currentTime < c.startSecond + c.durationSecond
  ) || clips[0];

  const currentShot = shots.find((s) => s.id === currentV1Clip?.shotId) || shots[0];

  // Playback timer (24fps ticker)
  useEffect(() => {
    let animId: number;
    let lastStamp = performance.now();

    const tick = (now: number) => {
      const delta = (now - lastStamp) / 1000;
      lastStamp = now;

      setCurrentTime((prev) => {
        const next = prev + delta;
        if (next >= totalDuration) {
          setIsPlaying(false);
          return 0;
        }
        return next;
      });

      if (isPlaying) {
        animId = requestAnimationFrame(tick);
      }
    };

    if (isPlaying) {
      lastStamp = performance.now();
      animId = requestAnimationFrame(tick);
    }

    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // Scrub handler
  const handleTimelineScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = timelineRef.current.scrollLeft || 0;
    const clickX = e.clientX - rect.left + scrollLeft;
    const newSec = Math.max(0, Math.min(totalDuration, clickX / zoomLevel));
    setCurrentTime(newSec);

    // Sync active shot
    const matched = clips.find(
      (c) => c.trackId === 'v1' && newSec >= c.startSecond && newSec < c.startSecond + c.durationSecond
    );
    if (matched) {
      setActiveClipId(matched.id);
      onSelectShot(matched.shotId);
    }
  };

  // Frame step helpers (1 frame = 1/24s)
  const stepFrame = (frames: number) => {
    setCurrentTime((prev) => Math.max(0, Math.min(totalDuration, prev + frames * (1 / 24))));
  };

  // Split clip at playhead
  const handleSplitAtPlayhead = () => {
    const targetClip = clips.find(
      (c) => c.trackId === 'v1' && currentTime > c.startSecond + 0.5 && currentTime < c.startSecond + c.durationSecond - 0.5
    );
    if (!targetClip) return;

    const firstHalfDuration = currentTime - targetClip.startSecond;
    const secondHalfDuration = targetClip.durationSecond - firstHalfDuration;

    const firstHalf: TimelineClip = {
      ...targetClip,
      durationSecond: firstHalfDuration,
    };

    const secondHalf: TimelineClip = {
      ...targetClip,
      id: `clip-split-${Date.now()}`,
      startSecond: currentTime,
      durationSecond: secondHalfDuration,
      title: `${targetClip.title} (Cut B)`,
    };

    const updated = clips.map((c) => (c.id === targetClip.id ? firstHalf : c)).concat(secondHalf);
    onUpdateClips(updated);
  };

  // Time graduation marks every 2 or 5 seconds
  const ruleMarks = [];
  for (let sec = 0; sec <= totalDuration; sec += 2) {
    ruleMarks.push(sec);
  }

  return (
    <div className="flex-1 flex flex-col bg-[#08090a] overflow-hidden select-none">
      {/* TOP DOCK: Master Video Monitor & Transport HUD */}
      <div className="p-4 bg-[#0d0e11] border-b border-white/[0.07] flex flex-col lg:flex-row items-center justify-between gap-6 shrink-0">
        {/* Playback Preview Window (Compact Film Deck) */}
        <div className="flex items-center gap-4">
          <div className="w-56 h-32 bg-black border border-white/[0.15] overflow-hidden relative shadow-lg group">
            <img
              src={currentShot.imageUrl}
              alt={currentShot.title}
              className="w-full h-full object-cover"
              style={{
                filter: isV1Visible
                  ? `brightness(${1 + currentShot.colorGrade.exposure * 0.4}) contrast(${currentShot.colorGrade.contrast})`
                  : 'brightness(0)',
              }}
              referrerPolicy="no-referrer"
            />
            {/* Film grain */}
            <div className="absolute inset-0 film-grain pointer-events-none opacity-40" />

            {/* Inverted frame stamp */}
            <div className="absolute top-1 left-2 font-mono text-[9px] text-[#ffc174] bg-black/70 px-1">
              {currentShot.sceneNumber}
            </div>

            <div className="absolute bottom-1 right-2 font-mono text-[9px] text-[#94a3b8] bg-black/70 px-1">
              TAKE {currentShot.takeNumber}
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-serif text-lg text-[#f3efe0] font-normal leading-tight">
              {currentShot.title}
            </h3>
            <p className="font-mono text-xs text-[#94a3b8]">
              {currentV1Clip.title}
            </p>
            <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-[#cac7b8]">
              <span className="text-[#ffc174]">24.000 FPS</span>
              <span className="text-white/20">·</span>
              <span>KODAK 500T</span>
              <span className="text-white/20">·</span>
              <span>PANAVISION C-40</span>
            </div>
          </div>
        </div>

        {/* TIME CODE DIGITAL READOUT */}
        <div className="flex flex-col items-center justify-center bg-[#090a0d] px-6 py-2 border border-white/[0.08] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
          <span className="text-[10px] font-mono text-[#94a3b8] tracking-widest uppercase">
            Master Playhead Timecode
          </span>
          <span className="font-mono text-3xl font-normal text-[#ffc174] tracking-wider tabular-nums">
            {formatTimecode(currentTime)}
          </span>
        </div>

        {/* TRANSPORT CONSOLE */}
        <div className="flex items-center gap-2 bg-[#14161b] p-1.5 border border-white/[0.08]">
          <button
            onClick={() => setCurrentTime(0)}
            className="p-2 hover:bg-[#1c1f26] text-[#94a3b8] hover:text-[#f3efe0] transition-colors"
            title="Rewind to In-Point (00:00:00:00)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => stepFrame(-1)}
            className="px-2 py-1.5 hover:bg-[#1c1f26] text-[11px] font-mono text-[#94a3b8] hover:text-[#f3efe0] transition-colors"
            title="Step -1 Frame (J)"
          >
            -1F
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2.5 transition-all cursor-pointer ${
              isPlaying
                ? 'bg-[#f59e0b] text-[#0d0e11] shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                : 'bg-[#1c1f26] text-[#f3efe0] hover:bg-[#252830] border border-white/[0.1]'
            }`}
            title="Play / Pause (Space)"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </button>

          <button
            onClick={() => stepFrame(1)}
            className="px-2 py-1.5 hover:bg-[#1c1f26] text-[11px] font-mono text-[#94a3b8] hover:text-[#f3efe0] transition-colors"
            title="Step +1 Frame (L)"
          >
            +1F
          </button>

          <button
            onClick={() => setCurrentTime(totalDuration)}
            className="p-2 hover:bg-[#1c1f26] text-[#94a3b8] hover:text-[#f3efe0] transition-colors"
            title="Jump to Out-Point"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-6 bg-white/[0.1] mx-1" />

          <button
            onClick={handleSplitAtPlayhead}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0d0e11] hover:bg-[#1c1f26] border border-white/[0.1] text-xs font-mono text-[#cac7b8] hover:text-[#ffc174] transition-colors"
            title="Razor Cut at Playhead (C)"
          >
            <Scissors className="w-3.5 h-3.5 text-[#ffc174]" />
            <span>Split Cut</span>
          </button>
        </div>
      </div>

      {/* TIMELINE TOOLBAR (Track headers, zoom, snapping) */}
      <div className="px-6 py-2 bg-[#0d0e11] border-b border-white/[0.07] flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-4 text-[#94a3b8]">
          <span className="text-[#f3efe0] uppercase tracking-wider text-[11px]">
            Reel Tracks
          </span>
          <span className="text-white/20">|</span>
          <span>DURATION 00:00:30:00</span>
          <span className="text-white/20">|</span>
          <span className="text-[#ffc174]">MAGNETIC SNAP ON</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomLevel((z) => Math.max(16, z - 4))}
            className="p-1 hover:bg-[#1c1f26] text-[#94a3b8] hover:text-[#f3efe0]"
            title="Zoom Out Timeline"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-[#94a3b8] tabular-nums">{zoomLevel}px/s</span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(48, z + 4))}
            className="p-1 hover:bg-[#1c1f26] text-[#94a3b8] hover:text-[#f3efe0]"
            title="Zoom In Timeline"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* MULTI-TRACK TIMELINE CANVAS */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers Rail */}
        <div className="w-44 bg-[#0d0e11] border-r border-white/[0.07] flex flex-col shrink-0 z-10">
          {/* Header ruler spacer */}
          <div className="h-7 border-b border-white/[0.07] bg-[#090a0d] flex items-center px-3 text-[10px] font-mono text-[#94a3b8]">
            TRACK
          </div>

          {/* V1 Track Header */}
          <div className="h-28 border-b border-white/[0.07] p-2 flex flex-col justify-between bg-[#14161b]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-medium text-[#f3efe0]">
                V1 · Master Reel
              </span>
              <button
                onClick={() => setIsV1Visible(!isV1Visible)}
                className="text-[#94a3b8] hover:text-[#ffc174]"
              >
                {isV1Visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-[#e11d48]" />}
              </button>
            </div>
            <div className="text-[10px] font-mono text-[#94a3b8]">
              35mm Film Gate
            </div>
          </div>

          {/* V2 Track Header */}
          <div className="h-20 border-b border-white/[0.07] p-2 flex flex-col justify-between bg-[#111317]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-medium text-[#cac7b8]">
                V2 · FX & Mattes
              </span>
              <button
                onClick={() => setIsV2Visible(!isV2Visible)}
                className="text-[#94a3b8] hover:text-[#ffc174]"
              >
                {isV2Visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-[#e11d48]" />}
              </button>
            </div>
            <div className="text-[10px] font-mono text-[#94a3b8]">
              Anamorphic Passes
            </div>
          </div>

          {/* A1 Track Header */}
          <div className="h-20 border-b border-white/[0.07] p-2 flex flex-col justify-between bg-[#0f1115]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-medium text-[#cac7b8]">
                A1 · Score & Foley
              </span>
              <button
                onClick={() => setIsA1Muted(!isA1Muted)}
                className="text-[#94a3b8] hover:text-[#ffc174]"
              >
                <Volume2 className={`w-3.5 h-3.5 ${isA1Muted ? 'text-[#e11d48]' : ''}`} />
              </button>
            </div>
            <div className="text-[10px] font-mono text-[#94a3b8]">
              24-bit 96kHz L/R
            </div>
          </div>
        </div>

        {/* Scrollable Tracks Area */}
        <div
          ref={timelineRef}
          onClick={handleTimelineScrub}
          className="flex-1 overflow-x-auto overflow-y-hidden bg-[#08090a] relative select-none cursor-crosshair"
        >
          {/* Timeline Width Container */}
          <div
            className="relative h-full"
            style={{ width: `${totalDuration * zoomLevel + 120}px` }}
          >
            {/* TIME-GRADUATED RULER */}
            <div className="h-7 bg-[#090a0d] border-b border-white/[0.07] relative flex items-center">
              {ruleMarks.map((sec) => (
                <div
                  key={sec}
                  className="absolute top-0 bottom-0 border-l border-[#2a2e39] flex items-center pl-1 text-[9px] font-mono text-[#94a3b8] tabular-nums"
                  style={{ left: `${sec * zoomLevel}px` }}
                >
                  00:{String(sec).padStart(2, '0')}
                </div>
              ))}
            </div>

            {/* TRACK V1: MASTER REEL CLIPS */}
            <div className="h-28 border-b border-white/[0.07] relative bg-[#0d0e11]/50 py-1.5">
              {clips
                .filter((c) => c.trackId === 'v1')
                .map((clip) => {
                  const shot = shots.find((s) => s.id === clip.shotId);
                  const isSelected = activeClipId === clip.id;
                  return (
                    <div
                      key={clip.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveClipId(clip.id);
                        onSelectShot(clip.shotId);
                        setCurrentTime(clip.startSecond);
                      }}
                      className={`absolute top-1.5 bottom-1.5 border transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#1c1f26] border-[#f59e0b] shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)]'
                          : 'bg-[#14161b] border-white/[0.1] hover:border-white/[0.25]'
                      }`}
                      style={{
                        left: `${clip.startSecond * zoomLevel}px`,
                        width: `${clip.durationSecond * zoomLevel}px`,
                      }}
                    >
                      {/* Top Film Sprocket Perforation Pattern */}
                      <div className="h-2 film-perforations-top opacity-60 shrink-0" />

                      {/* Clip Body */}
                      <div className="px-2 py-0.5 flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-2 truncate">
                          {shot && (
                            <img
                              src={shot.imageUrl}
                              alt=""
                              className="w-8 h-5 object-cover shrink-0 border border-white/20"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <span className="font-serif text-xs text-[#f3efe0] truncate">
                            {clip.title}
                          </span>
                        </div>
                        <span className="font-mono text-[9px] text-[#ffc174] shrink-0 tabular-nums">
                          {clip.durationSecond.toFixed(1)}s
                        </span>
                      </div>

                      {/* Bottom Film Sprocket Perforation Pattern */}
                      <div className="h-2 film-perforations-bottom opacity-60 shrink-0" />
                    </div>
                  );
                })}
            </div>

            {/* TRACK V2: FX & MATTES */}
            <div className="h-20 border-b border-white/[0.07] relative bg-[#090a0d]/60 py-1.5">
              {clips
                .filter((c) => c.trackId === 'v2')
                .map((clip) => (
                  <div
                    key={clip.id}
                    className="absolute top-1.5 bottom-1.5 bg-[#181d24] border border-[#ffb95f]/30 px-2 py-1 flex items-center justify-between"
                    style={{
                      left: `${clip.startSecond * zoomLevel}px`,
                      width: `${clip.durationSecond * zoomLevel}px`,
                    }}
                  >
                    <span className="font-mono text-[10px] text-[#ffc174] truncate">
                      {clip.title}
                    </span>
                    <span className="text-[9px] font-mono text-[#94a3b8] tabular-nums">
                      {clip.durationSecond.toFixed(1)}s
                    </span>
                  </div>
                ))}
            </div>

            {/* TRACK A1: SCORE & FOLEY (with simulated audio waves) */}
            <div className="h-20 border-b border-white/[0.07] relative bg-[#0a0c0e] py-1.5">
              {clips
                .filter((c) => c.trackId === 'a1')
                .map((clip) => (
                  <div
                    key={clip.id}
                    className="absolute top-1.5 bottom-1.5 bg-[#121c17] border border-[#10b981]/30 px-2 py-1 flex flex-col justify-between overflow-hidden"
                    style={{
                      left: `${clip.startSecond * zoomLevel}px`,
                      width: `${clip.durationSecond * zoomLevel}px`,
                    }}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#10b981]">
                      <span className="truncate">{clip.title}</span>
                      <span className="tabular-nums">{clip.durationSecond.toFixed(1)}s</span>
                    </div>

                    {/* Waveform graphic bars */}
                    <div className="flex items-center gap-[2px] h-6 opacity-60 overflow-hidden">
                      {Array.from({ length: Math.floor(clip.durationSecond * 8) }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-[#10b981] rounded-[1px]"
                          style={{
                            height: `${Math.max(3, Math.sin(i * 0.4) * 14 + 10)}px`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
            </div>

            {/* THE AMBER PLAYHEAD WIRE */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none z-30 transition-all duration-75"
              style={{ left: `${currentTime * zoomLevel}px` }}
            >
              {/* Playhead marker cap with floating timecode */}
              <div className="relative -left-2.5">
                <div className="w-5 h-4 bg-[#f59e0b] clip-path-polygon flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.8)]">
                  <div className="w-1 h-1 bg-[#0d0e11]" />
                </div>
                {/* Floating precise timecode badge */}
                <div className="absolute top-4 -left-6 bg-[#08090a] border border-[#f59e0b] px-1.5 py-0.5 text-[9px] font-mono text-[#ffc174] whitespace-nowrap shadow-md tabular-nums">
                  {formatTimecode(currentTime)}
                </div>
              </div>

              {/* 1px Solid Amber Wire Line */}
              <div className="w-[1.5px] h-full bg-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
