---
name: FX-2026 Studio Intelligence
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#e9bcb6'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#af8782'
  outline-variant: '#5e3f3b'
  surface-tint: '#ffb4aa'
  primary: '#ffb4aa'
  on-primary: '#690003'
  primary-container: '#e50914'
  on-primary-container: '#fff7f6'
  inverse-primary: '#c0000c'
  secondary: '#ffb5a0'
  on-secondary: '#5f1500'
  secondary-container: '#d73b00'
  on-secondary-container: '#fffbff'
  tertiary: '#ffb3ae'
  on-tertiary: '#68000c'
  tertiary-container: '#e40b2b'
  on-tertiary-container: '#fff7f6'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad5'
  primary-fixed-dim: '#ffb4aa'
  on-primary-fixed: '#410001'
  on-primary-fixed-variant: '#930007'
  secondary-fixed: '#ffdbd1'
  secondary-fixed-dim: '#ffb5a0'
  on-secondary-fixed: '#3b0900'
  on-secondary-fixed-variant: '#862200'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ae'
  on-tertiary-fixed: '#410005'
  on-tertiary-fixed-variant: '#930016'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 3rem
    fontWeight: '600'
    lineHeight: 3.5rem
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Geist
    fontSize: 2rem
    fontWeight: '600'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 2.25rem
    fontWeight: '600'
    lineHeight: 2.75rem
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 1.625rem
    fontWeight: '600'
    lineHeight: 2.125rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 1.5rem
    fontWeight: '500'
    lineHeight: 2rem
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Geist
    fontSize: 1.125rem
    fontWeight: '500'
    lineHeight: 1.625rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.6rem
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.4rem
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.2rem
    letterSpacing: 0.01em
  label-md:
    fontFamily: Geist
    fontSize: 0.8125rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Geist
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: 0.875rem
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
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

This design system embodies the high-performance precision of an advanced AI creative engine. Rooted in cinematic minimalism, dark studio luxury, and precision instrumentation, it commands authority and inspires focus. The platform is crafted for senior creative directors, AI artists, visual effects engineers, and computational designers who demand tactile control and high responsiveness.

The interface evokes an immersive production suite: dark obsidian backgrounds preserve optical stamina during extensive creative sessions, while luminous crimson beacons and smoldering ember gradients highlight critical interactions, live renders, and generative states. 

Key visual principles:
- **Cinematic Depth**: Void-deep dark layers punctuated by warm, calibrated atmospheric backdrops.
- **Instrument Precision**: Hairline borders, precise chamfers, razor-sharp technical typography, and micro-detailed metadata indicators.
- **Restrained Brilliance**: Vibrant accents are never decorative filler; they signify activity, generative synthesis, energy, and focal direction.

## Colors

The palette relies on a deep spectral range built upon high-contrast OLED black and layered obsidian tones, paired with volcanic crimson and warm kinetic orange.

### Color Tiers & Surface Roles
- **Base Canvas (`#080808`)**: Deep obsidian foundation that recedes backward to maximize visual hierarchy.
- **Card Tier 1 (`#111111`)**: Root container surfaces, sidebars, and inactive tool docks.
- **Card Tier 2 (`#161616`)**: Interactive studio cards, canvas panels, and grouped workflow pods.
- **Card Tier 3 / Raised (`#1c1c1c`)**: Dropdowns, active command modules, and hovered card states.
- **Structural Outlines (`rgba(255, 255, 255, 0.08)`)**: Hairline borders defining geometry without visual clutter.
- **Crimson Specular Edge (`rgba(229, 9, 20, 0.35)`)**: Directional edge highlight applied to active cards and generative frames.

### Accent & Feedback
- **Primary Accent (`#e50914` / `#ff2a3a`)**: Primary commands, active render pulses, generative triggers, and critical state indicators.
- **Secondary Flame (`#ff5722` / `#c84110`)**: Ambient light spills, secondary tags, warning alerts, and progress ramps.
- **Text Primary (`#f5f5f7`)**: Maximum contrast display labels, active headers, and numeric values.
- **Text Secondary (`#8e8e93`)**: Subtitles, input placeholders, and inactive navigations.
- **Text Tertiary (`#48484a`)**: Micro timestamps, frame counter indexes, and grid ticks.

## Typography

The typographic hierarchy is designed around technical discipline and rapid visual parsing. Headlines use Geist for crisp, geometric impact with tight horizontal metrics, while body copy relies on Inter’s balanced apertures and neutral legibility at dense information scales.

- **Display & Headlines**: Tightly tracked, solid weight (`500` to `600`), commanding immediate visual authority without excessive bulk.
- **Body Content**: Unobtrusive and calibrated for low-light reading comfort with open line heights (`1.5` to `1.6`).
- **Technical Metadata & Badges**: Small caps, elevated letter-spacing (`0.05em`), and mono-spaced numeric clarity for parameter metrics, seeds, generation tokens, and frame rates.

## Layout & Spacing

The layout operates on a strict 12-column adaptive grid configured for high-density generative workflows and multi-modal creative canvases.

### Layout Mechanics
- **Desktop (1280px+)**: Multi-tier split-pane view with a persistent 280px instrument rail on the left, an infinite canvas or workspace center, and variable parameter side-drawers on the right. Margins stay locked at `2rem`, gutters at `1.5rem`.
- **Tablet (768px - 1279px)**: Tool rails collapse into icon docks with expandable slide-overs. Margins scale to `1.5rem`, gutters compress to `1rem`.
- **Mobile (<768px)**: Canvas transitions to a single-column stacked layout with bottom sheets for parameter adjustments. Margin and gutter reduce to `1rem` and `0.75rem`.

Dynamic vertical spacing conforms strictly to an 8px modular baseline (represented by `space-sm` increments) to maintain rhythm across varied viewport sizes.

## Elevation & Depth

Visual hierarchy uses a dark studio stage model composed of tonal depth, subtle structural borders, and luminous directional glows rather than traditional cast shadows.

### Atmospheric Depth Tiers
- **Tier 0 (Backdrop Stage)**: Plain `#080808` canvas layered with an optional radial gradient mask centered behind active content: `radial-gradient(circle at 60% 10%, rgba(229, 9, 20, 0.14) 0%, rgba(255, 87, 34, 0.05) 35%, transparent 70%)`.
- **Tier 1 (Base Container Panels)**: `#111111` surface with a 1px solid hairline outline (`rgba(255, 255, 255, 0.06)`). No shadow.
- **Tier 2 (Interactive Modules & Cards)**: `#161616` surface. On hover or active focus, a gradient edge border triggers (`linear-gradient(135deg, rgba(229, 9, 20, 0.5) 0%, rgba(255, 87, 34, 0.2) 40%, rgba(255, 255, 255, 0.05) 100%)`) accompanied by an ambient crimson bloom (`box-shadow: 0 12px 32px -8px rgba(229, 9, 20, 0.18)`).
- **Tier 3 (Floating Docks & Command Modals)**: `#1c1c1c` with 12px backdrop blur, `rgba(255, 255, 255, 0.1)` edge border, and a deep ambient drop shadow (`box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.85)`).

## Shapes

The geometric framework balances technical rigor with modern refinement. Corner radii sit at `0.5rem` (8px) for buttons, inputs, and internal widgets, stepping up to `1rem` (16px) for major cards, modals, and generative prompt modules.

- **Primary Radius (8px)**: Segmented controls, input fields, tool buttons, dropdown menus, and pill tags.
- **Panel Radius (16px)**: Canvas frame containers, workflow studio cards, generation output previews.
- **Precision Inner Radius**: Embedded inner containers maintain concentricity by calculating `outer_radius - padding` (commonly 4px to 6px).

## Components

### Buttons
- **Primary Action (Generate / Execute)**: Solid crimson fill (`#e50914`) fading slightly to `#ff2a3a` at top edge, high-contrast white text (`#ffffff`), subtle inset white highlight (`inset 0 1px 0 rgba(255, 255, 255, 0.2)`). Hover triggers a warm orange rim flare.
- **Secondary Action**: `#161616` background with hairline `rgba(255, 255, 255, 0.1)` outline. Hover transitions to `#1c1c1c` with crimson specular border accent.
- **Ghost Action**: Transparent background, muted text (`#8e8e93`). Hover produces `#161616` backing and `#f5f5f7` text.

### Generative Input Bar
- Large unified prompt terminal with a dark `#111111` backdrop, bordered by `rgba(255, 255, 255, 0.08)`.
- Features contextual inline action pills for model parameters, aspect ratios, and seed settings.
- Active typing illuminates the top edge with a dual crimson-orange hairline glow.

### Cards & Workflow Modules
- Base structure utilizes `#161616` with 16px corner radius and 16px to 24px internal padding.
- Upper boundary features an angled specular highlight catching simulated ambient studio light.
- Action tags and status indicators sit docked at the top right with glowing pill micro-dots.

### Parameter Chips & Badges
- Compact 28px height, rounded at 8px, `#121212` background with `#8e8e93` text.
- Selected state turns border into `#ff2a3a` with a low-opacity red tint fill (`rgba(229, 9, 20, 0.12)`) and pure white label.

### Form Inputs & Sliders
- Input fields use inset `#0d0d0d` fill, crisp 1px borders, and monospaced values for precise data entry.
- Custom numerical scrubbers and sliders feature a glowing crimson fill track and an orange thumb beacon with real-time value tooltips.