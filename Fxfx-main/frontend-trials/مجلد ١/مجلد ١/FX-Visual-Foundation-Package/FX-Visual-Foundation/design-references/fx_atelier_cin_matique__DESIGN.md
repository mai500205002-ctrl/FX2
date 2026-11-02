---
name: FX — Atelier Cinématique
colors:
  surface: '#121315'
  surface-dim: '#121315'
  surface-bright: '#38393b'
  surface-container-lowest: '#0d0e10'
  surface-container-low: '#1b1c1e'
  surface-container: '#1f2022'
  surface-container-high: '#292a2c'
  surface-container-highest: '#343537'
  on-surface: '#e3e2e5'
  on-surface-variant: '#d0c5af'
  inverse-surface: '#e3e2e5'
  inverse-on-surface: '#303033'
  outline: '#99907c'
  outline-variant: '#4d4635'
  surface-tint: '#e9c349'
  primary: '#f2ca50'
  on-primary: '#3c2f00'
  primary-container: '#d4af37'
  on-primary-container: '#554300'
  inverse-primary: '#735c00'
  secondary: '#e9bf90'
  on-secondary: '#452b08'
  secondary-container: '#61431f'
  on-secondary-container: '#dab183'
  tertiary: '#d2cec6'
  on-tertiary: '#32302a'
  tertiary-container: '#b6b3ab'
  on-tertiary-container: '#47453f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe088'
  primary-fixed-dim: '#e9c349'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#574500'
  secondary-fixed: '#ffddb9'
  secondary-fixed-dim: '#e9bf90'
  on-secondary-fixed: '#2b1700'
  on-secondary-fixed-variant: '#5e411d'
  tertiary-fixed: '#e6e2d9'
  tertiary-fixed-dim: '#cac6be'
  on-tertiary-fixed: '#1c1c16'
  on-tertiary-fixed-variant: '#484740'
  background: '#121315'
  on-background: '#e3e2e5'
  surface-variant: '#343537'
typography:
  display-hero:
    fontFamily: Playfair Display
    fontSize: 64px
    fontWeight: '600'
    lineHeight: 76px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Playfair Display
    fontSize: 38px
    fontWeight: '600'
    lineHeight: 46px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '500'
    lineHeight: 52px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
    letterSpacing: 0em
  headline-md:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '400'
    lineHeight: 38px
    letterSpacing: 0em
  headline-sm:
    fontFamily: Noto Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: 0.01em
  title-editorial:
    fontFamily: Playfair Display
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
    letterSpacing: 0.02em
  body-lg:
    fontFamily: Noto Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0.01em
  body-md:
    fontFamily: Noto Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0.01em
  body-sm:
    fontFamily: Noto Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.02em
  meta-mono:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.08em
  meta-mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 3rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.75rem
  space-xl: 3rem
---

## Brand & Style

This design system establishes an ultra-luxurious, cinematic atelier environment engineered for elite creative directors, cinematographers, and brand visionaries orchestrating high-end generative AI campaigns. It rejects generic SaaS utilities, sterile whiteboards, and pedestrian chatbot bubbles. Instead, it evokes the sensory tension of a high-end film production darkroom, a bespoke architectural gallery, and an executive creative war room.

The aesthetic fuses **Editorial Minimalism**, **Cinematic Brutalism**, and **Tactile Luxury**:
- **Bilingual Typographic Tension:** High-contrast editorial display typography meets precise, architectural Arabic forms and clinical monospaced production metadata.
- **RTL-Native Spatial Choreography:** Engineered natively for Right-to-Left (RTL) reading flows without compromising bidirectional parity. Structural sightlines prioritize visual weight from right to left, honoring classical Arabic calligraphic dynamics and editorial cadence.
- **Atmospheric Depth:** Layered carbon noir tones, subtle analog film grain textures, razor-sharp hairline borders, and warm atmospheric illumination that emulates tungsten and anamorphic lens flares against velvet shadow.

## Colors

The palette is rooted in the interplay of deep carbon obsidian, anamorphic luminescence, and refined metallics. 

### Palette Architecture
- **Primary (`#D4AF37` — Champagne Aurum):** Used with surgical precision for primary focal points, active state keyframes, executive approvals, and decisive calls-to-action. Never applied in massive flood fills; treated as an illuminated metallic foil or projection beam.
- **Secondary (`#8A6840` — Deep Titanium Bronze):** Bridges atmospheric darks with primary accents. Powers secondary controls, timeline playheads, parameter calipers, and structural metadata.
- **Tertiary (`#E5E1D8` — Raw Ecru / Unbleached Linen):** Provides high-contrast editorial legibility across display titles, active Arabic headlines, and script manuscripts.
- **Neutral Core (`#0B0C0E` — Obsidian Noir):** An immaculate, non-pure-black floor that preserves dynamic range and eliminates digital sterility. Extended via micro-graded carbon tiers:
  - Canvas Floor: `#070709`
  - Studio Surface (Deck / Reels): `#0E1013`
  - Floating Panels & Docks: `#14171C`
  - Subtle Hairline Chrome: `rgba(212, 175, 55, 0.12)` to `rgba(255, 255, 255, 0.08)`

Functional semantic states leverage tempered cinematic cues rather than neon defaults: muted vermillion for script/render errors (`#BF3B3B`), olive gold for processing queue warnings (`#9E8437`), and deep celadon emerald for completed high-res generation pipelines (`#2E6F56`).

## Typography

The typography strategy creates a dialogue between dramatic editorial luxury, flawless Arabic body fluidity, and clinical production telemetry:

1. **Editorial Display Layer (`Playfair Display` paired with classical Naskh/Thuluth-inspired Arabic display proportions):** High stroke contrast and sculptural elegance. Reserved for project codenames, scene titles, creative manifesto treatments, and directorial prompts.
2. **Reading & Prompting Layer (`Noto Sans` / Arabic Modern Sans):** Clean, proportioned, and optimized for extensive prompt crafting, storyboard notes, and complex bilingual text layouts. In RTL mode, text tracking is kept neutral (`0em` to `0.01em`) to preserve letter connection continuity.
3. **Telemetry & Metadata (`JetBrains Mono`):** Used universally for timecodes (`00:04:12:18`), seed numbers, aspect ratios, model checkpoints, render passes, and clip coordinates. Rendered with uppercase letter-spacing to establish authoritative studio utility.

## Layout & Spacing

The workspace operates on an asymmetric fluid grid system anchored by horizontal cinematic aspect ratios and vertical editorial gutters.

### The Spatial Logic
- **Primary Grid:** 16-column desktop canvas allowing multi-reel comparison (e.g., 4-column script/director prompt panel, 8-column high-definition viewport or 3D canvas, 4-column AI parameter & model orchestration dock).
- **RTL Fluid Hierarchy:** The primary anchor panel docks flush right (prompt engineering, narrative lineage, cue stacks), leading smoothly into central projection reels, with technical parameters stacked on the left flank.
- **Rhythmic Densities:**
  - *Macro Padding (`space-xl` / 3rem):* Generous margins surrounding focal viewports, elevating the content to gallery-exhibit prestige.
  - *Micro Precision (`space-xs` to `space-sm`):* Monospaced camera parameters, lens focal lengths, and timeline keyframes snap tightly within high-density tool ribbons.
- **Responsive Reflow:**
  - **Desktop (>1440px):** Full-bleed triple-pane atelier war room with floating inspector docks.
  - **Tablet (768px – 1439px):** Collapsible right-hand prompt drawer, fixed center cinematic viewport, bottom floating timeline strip.
  - **Mobile (<768px):** Stacks vertically into an editorial lookbook feed; production controls tuck into an ambient bottom modal drawer.

## Elevation & Depth

Visual hierarchy rejects exaggerated, blurry SaaS drop-shadows. Depth is built through **optical darkroom physical principles**: hairline backlighting, tiered carbon absorption, and targeted lens-glass refraction.

1. **Base Surface (Floor):** Pure matte obsidian `#070709` layered with a microscopic SVG film grain overlay (`opacity: 0.035`, blend mode: `overlay`) to eliminate sterile flat monitors.
2. **Level 1 (Studio Consoles & Reels):** Background `#0E1013` defined by a crisp 1px hairline border: `rgba(255, 255, 255, 0.06)`.
3. **Level 2 (Active Tool Docks & Floating Modals):** Background `#14171C` with `backdrop-filter: blur(24px)`. Rim-lit using a top/start gradient border `linear-gradient(135deg, rgba(212, 175, 55, 0.35) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(0,0,0,0) 100%)`.
4. **Cinematic Shadows:** When panels lift during canvas reordering or nodal graph dragging, they project a directional, extra-diffused warm obsidian shadow: `0 24px 48px -12px rgba(0, 0, 0, 0.85), 0 0 1px 1px rgba(212, 175, 55, 0.12)`.

## Shapes

The geometric vernacular is strictly architectural and disciplined. Standard elements adopt `roundedness: 1` (0.25rem / 4px base radius), producing crisp, chiseled edges that mimic precision cine lenses, anodized matte-black matte boxes, and physical studio rack equipment. 

- **Cards, Preview Viewports, & Prompt Blocks:** 4px radius, preserving razor-sharp editorial corners.
- **Timeline Bars & Keyframe Nodes:** 0px radius (pure architectural rectangles and diamonds).
- **Pills / Status Chips:** Strictly capped at 2px or 4px subtle radiuses—circular rounded pills are strictly forbidden as they degrade the serious film-studio tone.

## Components

### Buttons & Trigger Elements
- **Primary Action (Directorial Execution / "Render Reel"):** Solid warm champagne gold `#D4AF37` with pitch noir text `#0B0C0E`. Micro-radius (4px), medium uppercase typography with slight tracking, accented with a 1px inner hairline stroke. Hover state introduces a luminous champagne halo (`box-shadow: 0 0 20px rgba(212, 175, 55, 0.25)`).
- **Secondary Action (Variant Branching, Camera Switch):** Matte carbon `#14171C` surface, 1px champagne bronze border (`#8A6840`), text rendered in Raw Ecru (`#E5E1D8`).
- **Ghost Action (Inspect Metadata, Discard Take):** Borderless, subtle monospaced typography, shifting from muted stone `#7A7873` to titanium bronze on hover.

### Prompt Manuscript & Input Fields
- Structured like a screenplay treatment or high-end publishing interface rather than a plain search box.
- Background: Carbon Noir `#0E1013`. Borders: 1px hairline `rgba(212, 175, 55, 0.18)` that sharpens into full champagne luminescence upon focus.
- RTL-native right alignment for Arabic prose prompts, with integrated left-aligned monospaced token badges for camera weights, seeds, and lighting ratios (e.g., `[35mm Anamorphic]`, `[Chiaroscuro]`, `[Aspect 2.39:1]`).

### Cards & Storyboard Frames
- Generous internal padding (`space-lg`), ultra-thin editorial bounding borders.
- Top header features monospaced scene numbering (`SC_04 // TAKE_02`) anchored to the end edge, while editorial titles rest on the start edge.
- Hover reveals contextual directorial overlays: anamorphic crop guides, depth-map inspection toggles, and diffusion heatmaps.

### Sliders, Calipers & Checkboxes
- **Sliders (CFG Scale, Style Weight, Seed Drift):** 1px horizontal titanium rail. The thumb is an angular, diamond-cut gold pip displaying precise monospaced numeric readouts floating directly above.
- **Selection Controls:** Crisp 14px square checkboxes with 1px border. Checked state displays a solid champagne inner square fill rather than a playful tick mark, retaining technical instrument gravitas.

### Bespoke Creative Lab Components
- **The Telemetry Slate:** Fixed status banner displaying GPU cluster temperature, latency, latent space diffusion steps, and Arabic project classification markers.
- **Keyframe Reel Strip:** Horizontal scrubber pinned to the canvas base with frame-accurate timecodes, negative space gutters, and magnetic playhead tracking.