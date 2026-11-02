import React, { useState } from 'react';
import { Sparkles, Clapperboard, X, ArrowRight, Wand2 } from 'lucide-react';

interface DirectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPrompt: (prompt: string, tokens: string[]) => void;
}

interface DirectorStyle {
  name: string;
  signature: string;
  lighting: string;
  lensChoice: string;
  samplePrompt: string;
  tokens: string[];
}

const DIRECTOR_STYLES: DirectorStyle[] = [
  {
    name: 'Denis Villeneuve',
    signature: 'Monumental brutalism, solitary human scale against vast architecture, volumetric dust haze',
    lighting: 'Overcast atmospheric diffused dawn light',
    lensChoice: 'Leica Summicron-C 50mm Prime · ƒ/2.0',
    samplePrompt: 'Solitary figure in dark architectural coat standing atop a minimalist raw concrete monolith overlooking an immense foggy fjord at daybreak. Silent monumental composition with atmospheric depth.',
    tokens: ['--ar 2.39:1', '--chaos 8', '--film fuji-eterna', '--lens leica-50mm', '--shutter 172', '--seed 623194'],
  },
  {
    name: 'Wong Kar-wai',
    signature: 'Step-printed 6fps exposure, saturated sodium amber and turquoise reflections, wet pavement',
    lighting: 'Backlit tungsten & neon amber spill through humid air',
    lensChoice: 'Cooke Anamorphic /i 35mm T2.3',
    samplePrompt: 'Rain-soaked narrow alleyway in Kowloon at 2 AM. Solitary figure glances sideways under flickering warm amber signage. Smudged kinetic reflections on puddles, emotional step-printed motion blur.',
    tokens: ['--ar 16:9', '--chaos 18', '--film kodak-500t', '--lens cooke-35mm', '--shutter 144', '--seed 884102'],
  },
  {
    name: 'David Fincher',
    signature: 'Surgical tripod pans, low-key chiaroscuro, desaturated deep blacks with sickly green-yellow highlights',
    lighting: 'Precision directional overhead fluorescent with rim falloff',
    lensChoice: 'Panavision C-Series 40mm Anamorphic T2.8',
    samplePrompt: 'Dimly lit underground archive vault. Analytical camera dolly tracking a vintage dossier open on a brushed steel table. Extreme shadow density, micro-contrast clarity, cool fluorescent undertone.',
    tokens: ['--ar 2.39:1', '--chaos 6', '--film kodak-5219', '--lens panavision-40mm', '--shutter 180', '--seed 447812'],
  },
  {
    name: 'Terrence Malick',
    signature: 'Golden hour solar rim light, flowing wind through unbleached textiles, intimate low-angle wide',
    lighting: 'Magic hour low-angle sun bleeding through dusty horizon',
    lensChoice: 'Zeiss Master Prime 27mm · ƒ/1.4',
    samplePrompt: 'Close tracking medium shot of a wanderer traversing wind-swept golden grass at twilight. Warm solar halo catches unbleached linen weave, dust motes drifting in golden backlight.',
    tokens: ['--ar 16:9', '--chaos 14', '--film kodak-250d', '--lens zeiss-27mm', '--shutter 180', '--seed 910452'],
  },
];

export const DirectorModal: React.FC<DirectorModalProps> = ({
  isOpen,
  onClose,
  onApplyPrompt,
}) => {
  const [selectedStyle, setSelectedStyle] = useState<DirectorStyle>(DIRECTOR_STYLES[0]);
  const [customIdea, setCustomIdea] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState(selectedStyle.samplePrompt);
  const [generatedTokens, setGeneratedTokens] = useState<string[]>(selectedStyle.tokens);

  if (!isOpen) return null;

  const handleSelectStyle = (style: DirectorStyle) => {
    setSelectedStyle(style);
    setGeneratedPrompt(style.samplePrompt);
    setGeneratedTokens(style.tokens);
  };

  const handleSynthesize = () => {
    setIsSynthesizing(true);
    setTimeout(() => {
      if (customIdea.trim()) {
        const enriched = `${customIdea.trim()}, framed with ${selectedStyle.signature.toLowerCase()}, captured on 35mm film stock with ${selectedStyle.lighting.toLowerCase()}.`;
        setGeneratedPrompt(enriched);
      } else {
        setGeneratedPrompt(selectedStyle.samplePrompt);
      }
      setGeneratedTokens(selectedStyle.tokens);
      setIsSynthesizing(false);
    }, 600);
  };

  const handleApply = () => {
    onApplyPrompt(generatedPrompt, generatedTokens);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0d0e11] border border-white/[0.15] max-w-2xl w-full p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[#f59e0b]" />
            <h3 className="font-serif text-xl text-[#f3efe0] font-normal">
              Cinematic Director Staging Engine
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#94a3b8] hover:text-[#f3efe0] p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Director Style Archetype Cards */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase text-[#ffc174] tracking-wider block">
            Select Cinematographic Archetype
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DIRECTOR_STYLES.map((style) => (
              <button
                key={style.name}
                onClick={() => handleSelectStyle(style)}
                className={`p-3 text-left border transition-all ${
                  selectedStyle.name === style.name
                    ? 'bg-[#1c1f26] border-[#f59e0b] text-[#f3efe0] shadow-sm'
                    : 'bg-[#14161b] border-white/[0.08] text-[#94a3b8] hover:text-[#f3efe0]'
                }`}
              >
                <div className="font-serif text-sm font-medium text-[#f3efe0]">
                  {style.name}
                </div>
                <div className="font-grotesk text-[11px] text-[#94a3b8] mt-1 line-clamp-2">
                  {style.signature}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Subject / Scene Idea Input */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase text-[#cac7b8] tracking-wider block">
            Optional Scene Intent / Motif
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customIdea}
              onChange={(e) => setCustomIdea(e.target.value)}
              placeholder="e.g. Rain-slicked boulevard, abandoned astronomical dome, titanium reliquary..."
              className="flex-1 bg-[#08090a] border border-white/[0.1] px-3 py-2 text-xs font-serif text-[#f3efe0] placeholder:text-white/20 focus:outline-none focus:border-[#f59e0b]"
            />
            <button
              onClick={handleSynthesize}
              disabled={isSynthesizing}
              className="px-4 py-2 bg-[#14161b] hover:bg-[#1c1f26] border border-[#f59e0b]/50 text-[#ffc174] text-xs font-mono flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{isSynthesizing ? 'Orchestrating...' : 'Synthesize Script'}</span>
            </button>
          </div>
        </div>

        {/* Generated Staging Preview */}
        <div className="bg-[#08090a] border border-white/[0.1] p-4 space-y-3 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#94a3b8]">
            <span className="text-[#ffc174] uppercase">Generated Scene Prose:</span>
            <span>Lens: {selectedStyle.lensChoice}</span>
          </div>
          <p className="font-serif italic text-sm text-[#f3efe0] leading-relaxed">
            "{generatedPrompt}"
          </p>
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/[0.05]">
            {generatedTokens.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 bg-[#14161b] border border-white/[0.1] text-[10px] font-mono text-[#ffc174]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.08]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono text-[#94a3b8] hover:text-[#f3efe0]"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex items-center gap-2 px-5 py-2 bg-[#14161b] hover:bg-[#1c1f26] border border-[#f59e0b] text-xs font-mono text-[#ffc174] hover:shadow-[0_0_20px_-4px_rgba(245,158,11,0.4)] transition-all cursor-pointer"
          >
            <span>Stage to Scene</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
