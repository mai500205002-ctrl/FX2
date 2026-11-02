import React, { useState } from 'react';
import { Download, X, Film, CheckCircle2, HardDrive, Cpu } from 'lucide-react';

interface RenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
}

export const RenderModal: React.FC<RenderModalProps> = ({
  isOpen,
  onClose,
  projectName,
}) => {
  const [codec, setCodec] = useState('prores-4444-xq');
  const [resolution, setResolution] = useState('dci-4k');
  const [bakeLut, setBakeLut] = useState(true);
  const [bakeGrain, setBakeGrain] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  if (!isOpen) return null;

  const totalFrames = 720; // 30 seconds at 24fps

  const handleStartRender = () => {
    setIsRendering(true);
    setRenderProgress(0);
    setCurrentFrame(0);
    setIsComplete(false);

    const interval = setInterval(() => {
      setRenderProgress((prev) => {
        const next = prev + 3;
        if (next >= 100) {
          clearInterval(interval);
          setIsRendering(false);
          setIsComplete(true);
          setCurrentFrame(totalFrames);
          return 100;
        }
        setCurrentFrame(Math.floor((next / 100) * totalFrames));
        return next;
      });
    }, 60);
  };

  const handleDownloadManifest = () => {
    const manifest = {
      project: projectName,
      timestamp: new Date().toISOString(),
      codec,
      resolution,
      frameRate: '24.000 fps',
      totalFrames,
      duration: '00:00:30:00',
      colorSpace: 'ACEScg / Kodak Vision3 500T 3D LUT',
      audio: '24-bit 96kHz PCM Linear L/R',
      status: 'VERIFIED MASTER RENDER',
    };
    const blob = new Blob([JSON.stringify(manifest, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AtelierFX_${projectName.replace(/\s+/g, '_')}_MasterManifest.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0d0e11] border border-white/[0.15] max-w-xl w-full p-6 shadow-2xl space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <Film className="w-4 h-4 text-[#f59e0b]" />
            <h3 className="font-serif text-xl text-[#f3efe0] font-normal">
              Render Master Reel
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#94a3b8] hover:text-[#f3efe0] p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Setting options */}
        {!isRendering && !isComplete && (
          <div className="space-y-4 text-xs font-mono">
            {/* Codec Profile */}
            <div className="space-y-1.5">
              <label className="text-[#cac7b8] uppercase tracking-wider block text-[11px]">
                Master Codec Delivery
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCodec('prores-4444-xq')}
                  className={`p-2.5 text-left border transition-all ${
                    codec === 'prores-4444-xq'
                      ? 'bg-[#1c1f26] border-[#f59e0b] text-[#f3efe0]'
                      : 'bg-[#14161b] border-white/[0.08] text-[#94a3b8]'
                  }`}
                >
                  <div className="font-bold text-[#f3efe0]">ProRes 4444 XQ</div>
                  <div className="text-[10px] text-[#ffc174] mt-0.5">12-bit RGB · Uncompressed</div>
                </button>

                <button
                  onClick={() => setCodec('openexr-sequence')}
                  className={`p-2.5 text-left border transition-all ${
                    codec === 'openexr-sequence'
                      ? 'bg-[#1c1f26] border-[#f59e0b] text-[#f3efe0]'
                      : 'bg-[#14161b] border-white/[0.08] text-[#94a3b8]'
                  }`}
                >
                  <div className="font-bold text-[#f3efe0]">OpenEXR Sequence</div>
                  <div className="text-[10px] text-[#ffc174] mt-0.5">16-bit Float · ACEScg</div>
                </button>

                <button
                  onClick={() => setCodec('avid-dnxhr')}
                  className={`p-2.5 text-left border transition-all ${
                    codec === 'avid-dnxhr'
                      ? 'bg-[#1c1f26] border-[#f59e0b] text-[#f3efe0]'
                      : 'bg-[#14161b] border-white/[0.08] text-[#94a3b8]'
                  }`}
                >
                  <div className="font-bold text-[#f3efe0]">Avid DNxHR HQX</div>
                  <div className="text-[10px] text-[#94a3b8] mt-0.5">Broadcast Archival</div>
                </button>

                <button
                  onClick={() => setCodec('h265-master')}
                  className={`p-2.5 text-left border transition-all ${
                    codec === 'h265-master'
                      ? 'bg-[#1c1f26] border-[#f59e0b] text-[#f3efe0]'
                      : 'bg-[#14161b] border-white/[0.08] text-[#94a3b8]'
                  }`}
                >
                  <div className="font-bold text-[#f3efe0]">HEVC H.265 Master</div>
                  <div className="text-[10px] text-[#94a3b8] mt-0.5">10-bit Rec.709 · High Bitrate</div>
                </button>
              </div>
            </div>

            {/* Resolution */}
            <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
              <label className="text-[#cac7b8] uppercase tracking-wider block text-[11px]">
                Raster Resolution
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'dci-4k', label: 'DCI 4K (4096 × 2160)' },
                  { id: 'uhd-4k', label: 'UHD 4K (3840 × 2160)' },
                  { id: 'scope-2k', label: '2K Scope (2048 × 858)' },
                ].map((res) => (
                  <button
                    key={res.id}
                    onClick={() => setResolution(res.id)}
                    className={`flex-1 py-1.5 px-2 text-[10px] border transition-colors ${
                      resolution === res.id
                        ? 'bg-[#1c1f26] border-[#f59e0b] text-[#ffc174]'
                        : 'bg-[#14161b] border-white/[0.08] text-[#94a3b8]'
                    }`}
                  >
                    {res.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <label className="flex items-center gap-2 cursor-pointer text-[#cac7b8]">
                <input
                  type="checkbox"
                  checked={bakeLut}
                  onChange={(e) => setBakeLut(e.target.checked)}
                  className="rounded-none accent-[#f59e0b]"
                />
                <span>Bake in Kodak Vision3 500T 3D Color LUT</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-[#cac7b8]">
                <input
                  type="checkbox"
                  checked={bakeGrain}
                  onChange={(e) => setBakeGrain(e.target.checked)}
                  className="rounded-none accent-[#f59e0b]"
                />
                <span>Bake in 35mm Silver Halide Grain & Halation passes</span>
              </label>
            </div>
          </div>
        )}

        {/* Rendering state */}
        {isRendering && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 border-2 border-[#2a2e39] border-t-[#f59e0b] rounded-full animate-spin shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
            <div>
              <p className="font-serif text-lg text-[#f3efe0] italic">
                Encoding 12-bit Master Video Pipeline...
              </p>
              <p className="font-mono text-xs text-[#ffc174] mt-1 tabular-nums">
                FRAME {currentFrame} / {totalFrames} (24.000 FPS)
              </p>
            </div>
            <div className="w-full h-1.5 bg-[#14161b] overflow-hidden border border-white/[0.1]">
              <div
                className="h-full bg-[#f59e0b] transition-all duration-75"
                style={{ width: `${renderProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Complete state */}
        {isComplete && (
          <div className="py-6 flex flex-col items-center text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-[#10b981]" />
            <h4 className="font-serif text-xl text-[#f3efe0]">
              Master Render Complete
            </h4>
            <p className="font-mono text-xs text-[#94a3b8] max-w-sm">
              All 4 cinematic reels successfully rasterized to ProRes 4444 XQ at 24.00 fps with calibrated 35mm LUT bake-in.
            </p>
            <button
              onClick={handleDownloadManifest}
              className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-[#14161b] hover:bg-[#1c1f26] border border-[#f59e0b] text-[#ffc174] text-xs font-mono shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Archival Master Package</span>
            </button>
          </div>
        )}

        {/* Footer */}
        {!isRendering && !isComplete && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono text-[#94a3b8] hover:text-[#f3efe0]"
            >
              Cancel
            </button>
            <button
              onClick={handleStartRender}
              className="flex items-center gap-2 px-5 py-2 bg-[#14161b] hover:bg-[#1c1f26] border border-[#f59e0b] text-xs font-mono text-[#ffc174] hover:shadow-[0_0_20px_-4px_rgba(245,158,11,0.4)] transition-all cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5 text-[#ffc174]" />
              <span>Start Master Render</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
