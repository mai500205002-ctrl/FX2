---
name: TextFX Realm Studio
colors:
  surface: '#121316'
  surface-dim: '#121316'
  surface-bright: '#38393c'
  surface-container-lowest: '#0d0e11'
  surface-container-low: '#1a1c1e'
  surface-container: '#1e2022'
  surface-container-high: '#292a2d'
  surface-container-highest: '#343538'
  on-surface: '#e3e2e5'
  on-surface-variant: '#d8c3ad'
  inverse-surface: '#e3e2e5'
  inverse-on-surface: '#2f3033'
  outline: '#a08e7a'
  outline-variant: '#534434'
  surface-tint: '#ffb95f'
  primary: '#ffc174'
  on-primary: '#472a00'
  primary-container: '#f59e0b'
  on-primary-container: '#613b00'
  inverse-primary: '#855300'
  secondary: '#ffb77d'
  on-secondary: '#4d2600'
  secondary-container: '#d97707'
  on-secondary-container: '#432100'
  tertiary: '#56e5a9'
  on-tertiary: '#003824'
  tertiary-container: '#30c88f'
  on-tertiary-container: '#004e34'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffddb8'
  primary-fixed-dim: '#ffb95f'
  on-primary-fixed: '#2a1700'
  on-primary-fixed-variant: '#653e00'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#121316'
  on-background: '#e3e2e5'
  surface-variant: '#343538'
typography:
  display-hero:
    fontFamily: Outfit
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Outfit
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Outfit
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system delivers an elite, production-grade creative workbench engineered for generative filmmakers, showrunners, screenwriters, and creative technologists. It departs from sterile, standard SaaS conventions by framing AI interaction not as conversational chatbots, but as cinematic post-production and high-end editorial authoring.

The aesthetic foundation operates across three interchangeable aesthetic paradigms called "Realms," allowing creators to match their interface environment to their creative mindset:
- **Director's Noir (Default):** Atmospheric cinematic screening room. Deep carbon obsidian base, golden amber glowing nodes, dark acrylic glass surfaces, and warm golden illumination evoking 35mm projector light in a darkroom.
- **Haute Editorial:** High-fashion, prestige literary publication. Warm textured ivory paper, razor-thin crisp ink borders, and regal deep oxblood/burgundy strikes inspired by heritage print houses and master screenplays.
- **Quantum Deck:** High-throughput cybernetic telemetry deck. Pitch-black abyssal slate, neon emerald generation vectors, phosphor cyan telemetry charts, and monospaced diagnostic matrices.

Across all realms, the experience communicates absolute precision, low cognitive friction during intensive workflow states, and uncompromising typographic sophistication.

## Colors

The core system deploys a semantic token architecture that maps cleanly across the three Studio Realms while establishing Director's Noir as the foundational default.

### Default Realm: Director's Noir
- **Canvas Base:** `#050608` (Abyssal Carbon Obsidian)
- **Surface Elevation 1 (Panels):** `rgba(16, 17, 24, 0.72)` with structural border `rgba(245, 158, 11, 0.12)`
- **Surface Elevation 2 (Cards/Modals):** `rgba(24, 26, 36, 0.85)` with perimeter highlight `rgba(255, 255, 255, 0.06)`
- **Primary Accent:** `#f59e0b` (Cinematic Amber)
- **Secondary Accent:** `#d97706` (Incandescent Gold)
- **Text & Glyph Hierarchy:** Primary `#f8fafc`, Secondary `#94a3b8`, Muted/Disabled `#475569`

### Realm 2: Haute Editorial (Theme Variant)
- **Canvas Base:** `#faf8f5` (Warm Archive Ivory)
- **Surface Elevation 1 (Panels):** `#ffffff` with high-definition rule `rgba(17, 17, 17, 0.12)`
- **Surface Elevation 2 (Cards/Modals):** `#f4efe6` with border `#111111`
- **Primary Accent:** `#8b0000` (Prestige Oxblood)
- **Secondary Accent:** `#991b1b` (Crimson Ink)
- **Text & Glyph Hierarchy:** Primary `#111111`, Secondary `#44403c`, Muted/Disabled `#78716c`

### Realm 3: Quantum Deck (Theme Variant)
- **Canvas Base:** `#04090d` (Sub-Zero Void)
- **Surface Elevation 1 (Panels):** `rgba(6, 17, 24, 0.78)` with telemetry rule `rgba(6, 182, 212, 0.18)`
- **Surface Elevation 2 (Cards/Modals):** `rgba(8, 26, 36, 0.90)` with border `rgba(16, 185, 129, 0.25)`
- **Primary Accent:** `#10b981` (Phosphor Emerald)
- **Secondary Accent:** `#06b6d4` (Telemetry Cyan)
- **Text & Glyph Hierarchy:** Primary `#ecfeff`, Secondary `#64748b`, Muted/Disabled `#1e293b`

### Feedback & Semantic Vectors
- **Success:** `#10b981` (Quantum Emerald)
- **Warning / Render Active:** `#f59e0b` (Film Amber)
- **Error / Interruption:** `#ef4444` (Laser Crimson)
- **Information / Telemetry:** `#06b6d4` (Signal Cyan)

## Typography

The typographic hierarchy balances dramatic editorial stature with computational utility. 

- **Primary Pairing (Director's Noir):** Display & headlines use `Outfit` for architectural balance and geometric punch. Functional narrative, generative parameters, and long-form prompts rely on `Inter` for clarity. Prompt syntax, token counts, neural latency metrics, and seed hashes use `JetBrains Mono`.
- **Haute Editorial Adaptation:** When switched to Haute Editorial, `Playfair Display` replaces `Outfit` for display and headline scales, rendering high-contrast serifs with literary authority, while `EB Garamond` is applied to generation outputs and script text to mirror a physical manuscript.
- **Quantum Deck Adaptation:** In the Quantum Deck realm, headline tokens retain `Outfit` at tighter weights (500/600), while `JetBrains Mono` expands to claim all UI tags, input controls, sub-headers, and runtime stream logs.

## Layout & Spacing

The interface uses a flexible 16-column studio grid system for ultra-wide screen setups (allowing simultaneous display of timeline, node canvas, and rendering viewports) that scales down cleanly:

- **Desktop (>= 1280px):** 16-column fluid canvas with persistent structural rails: 72px left tool-rail, collapsible 320px neural parameter deck on the right, and an expansive center viewport. Canvas margins are locked at `2rem` (`space-xl`), and column gutters at `1.25rem`.
- **Tablet (768px - 1279px):** 8-column layout. The parameter deck collapses into an overlay drawer. Canvas margins compress to `1.5rem`, gutters to `1rem`.
- **Mobile (< 768px):** 4-column layout. Tools and telemetry become accessible via fixed bottom utility bars and sheet drawers. Canvas margins tighten to `1rem`, gutters to `0.75rem`.

Spatial cadence strictly enforces multiples of `0.25rem` (4px baseline). Element internal padding adheres strictly to `space-sm` (8px) for compact tool strips, `space-md` (16px) for production parameter cards, and `space-lg` (24px) for viewport modals and empty-state canvas wrappers.

## Elevation & Depth

Visual depth is achieved through layered glass materials and ambient atmospheric backdrops rather than conventional high-drop shadows.

### Atmospheric Glassmorphism & Tonal Layers
- **Base Canvas:** The deepest layer (`z-index: 0`). A subtle radial light cone (`rgba(245, 158, 11, 0.04)`) centers behind active generation nodes.
- **Level 1 (Dock & Utility Panels):** Translucent backdrop blur (`backdrop-filter: blur(16px)`), background color `rgba(16, 17, 24, 0.72)`. Finished with a 1px top-highlight rim of `rgba(255, 255, 255, 0.08)` and bottom shadow drop `0 8px 32px -4px rgba(0, 0, 0, 0.6)`.
- **Level 2 (Nodes, Floating Palettes, Action Cards):** `rgba(24, 26, 36, 0.88)` with `backdrop-filter: blur(24px)`. Elevated borders employ an inner glow (`box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.1)`).
- **Level 3 (Modal Overlays, Preview Theater):** Fixed overlay background `rgba(5, 6, 8, 0.85)` with `backdrop-filter: blur(32px)`.

### Realm-Specific Depth Variations
- **Director's Noir:** Ambient tinted shadows (`0 20px 40px -15px rgba(245, 158, 11, 0.08)` and `0 0 1px 1px rgba(245, 158, 11, 0.2)` on active elements).
- **Haute Editorial:** Flattens depth. Elevation is communicated through high-contrast borders (`1px solid #111111`) and offset stamp shadows (`4px 4px 0px 0px rgba(17, 17, 17, 0.95)`).
- **Quantum Deck:** Optical laser illumination. Border highlights utilize hard neon strokes (`1px solid rgba(16, 185, 129, 0.4)`) with concentrated localized outer halos (`0 0 16px rgba(6, 182, 212, 0.25)`).

## Shapes

The design system standardizes on structural curvature that flexes dynamically based on the active Realm:

- **Director's Noir (Standard `2`):** Cards, generation frames, and canvas panels feature generous `20px` corner radii (`1.25rem`), projecting an ultra-modern, cinematic device aesthetic. Interactive inputs and nested chips use `8px` (`0.5rem`).
- **Haute Editorial (Adapted `1`):** Sharply tailored silhouette. Cards and workspace partitions lock to `6px` (`0.375rem`), with inputs and pill tags dropping to `2px` or clean `0px` razor corners to mimic precision-cut luxury stationery.
- **Quantum Deck (Adapted `2`):** Technical tactical geometry. Cards snap to `14px` (`0.875rem`) with chamfered or notched corner variants on tactical display headers. Chips and terminal badges feature `4px` corner radii.

## Components

### Buttons & Trigger Controls
- **Primary Studio Action:** High-luminance amber fill (`#f59e0b`), text in `#050608` with `font-weight: 600`. On hover, subtle amber bloom (`box-shadow: 0 0 20px rgba(245, 158, 11, 0.45)`). Height: 44px (touch/desktop standard).
- **Secondary Glass Action:** Translucent fill (`rgba(255, 255, 255, 0.05)`), border `1px solid rgba(255, 255, 255, 0.12)`, text `#f8fafc`. Hover triggers `background: rgba(255, 255, 255, 0.1)`.
- **Ghost/Utility Action:** Zero background, color `#94a3b8`, hover text `#f8fafc` with subtle scale transition (`transform: scale(1.02)`).

### Prompt Engineering Canvas & Input Fields
- **Multi-Modal Prompt Field:** Deep acrylic container with interior padding `space-md`. Uses `Inter` 14px for natural language queries, accompanied by inline parameter token badges (e.g., `--ar 16:9`, `--chaos 20`).
- **Focus States:** Border shifts smoothly to accent amber (`#f59e0b`) with a 2px outer diffuse glow (`rgba(245, 158, 11, 0.2)`). No default browser outlines.
- **Micro Numeric Inputs & Sliders:** Sleek horizontal range bars with glowing thumb nodes and real-time monospaced parameter telemetry displaying numeric values (`JetBrains Mono` 11px).

### Chips, Tags & Status Indicators
- **Generation Model Badges:** Height 24px, padding 0 8px, border radius 4px, `JetBrains Mono` 10px uppercase with `0.06em` letter spacing. 
- **Realm Switcher Component:** Segmented floating pill control with three states (`Noir`, `Editorial`, `Quantum`). Includes smooth physical slide transition indicators and contextual icon markers.

### Cards & Generation Viewports
- **Artifact Preview Card:** Encased in dark glass with 20px radii. Aspect-ratio locked media frame with a hover-activated glass utility overlay containing regeneration, variant branching, seed extraction, and upscaling buttons.
- **Telemetry HUD Drawer:** Docked telemetry panel displaying generation latency, token burn rate, GPU tensor availability, and context memory usage styled in tabular monospaced layouts.

### Checkboxes, Radios & Switches
- **Custom Studio Switch:** 40px width, 22px height pill track with a glowing 18px thumb circle. Active state transitions to `#f59e0b` in Noir, `#8b0000` in Editorial, and `#10b981` in Quantum.
- **Neural Multi-Select Checkboxes:** Square with 4px radius, custom check mark vector, illuminated border on selection.