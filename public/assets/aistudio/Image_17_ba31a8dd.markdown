---
name: Belajar Khot Design System
colors:
  surface: '#eefdef'
  surface-dim: '#cfded1'
  surface-bright: '#eefdef'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#e8f8ea'
  surface-container: '#e3f2e4'
  surface-container-high: '#ddecdf'
  surface-container-highest: '#d7e6d9'
  on-surface: '#121e16'
  on-surface-variant: '#414943'
  inverse-surface: '#26332a'
  inverse-on-surface: '#e5f5e7'
  outline: '#717972'
  outline-variant: '#c1c8c1'
  surface-tint: '#3d674e'
  primary: '#19432d'
  on-primary: '#ffffff'
  primary-container: '#315b43'
  on-primary-container: '#a3d1b3'
  inverse-primary: '#a3d1b3'
  secondary: '#47654b'
  on-secondary: '#ffffff'
  secondary-container: '#c6e9c7'
  on-secondary-container: '#4b6a4f'
  tertiary: '#363d38'
  on-tertiary: '#ffffff'
  tertiary-container: '#4d544e'
  on-tertiary-container: '#c1c8c0'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#bfedce'
  primary-fixed-dim: '#a3d1b3'
  on-primary-fixed: '#002111'
  on-primary-fixed-variant: '#254f38'
  secondary-fixed: '#c9ebca'
  secondary-fixed-dim: '#adcfaf'
  on-secondary-fixed: '#03210c'
  on-secondary-fixed-variant: '#304d35'
  tertiary-fixed: '#dde4dc'
  tertiary-fixed-dim: '#c1c8c1'
  on-tertiary-fixed: '#161d18'
  on-tertiary-fixed-variant: '#414843'
  background: '#eefdef'
  on-background: '#121e16'
  surface-variant: '#d7e6d9'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: 0em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0.005em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system establishes a refined, serene, and disciplined aesthetic tailored for a specialized Islamic calligraphy educational SaaS and member portal. The emotional tone bridges time-honored artistic discipline with modern product utility: tranquil, clear, structured, and trustworthy.

The visual direction adopts a Corporate Modern Minimalist framework enriched with quiet organic warmth. The layout prioritizes ample whitespace, balanced proportions, and subtle material layering over loud visual embellishments. This ensures members can focus on study progression, lesson schedules, certificate downloads, and administrative workflows without cognitive fatigue.

## Colors

The color palette centers on grounding forest and sage tones, evoking clarity, growth, and natural equilibrium:

- **Primary (`#315B43`):** Deep Forest Green. Used for primary calls-to-action, active navigation markers, key icons, and structural focus anchors.
- **Secondary (`#6F8F72`):** Matcha Green. Serves as interactive secondary cues, contextual highlights, progress meters, and selected pill states.
- **Tertiary / Soft Canvas (`#E8EFE7`):** Soft Sage. Applied to subtle container backdrops, segmented control tracks, and highlighted card compartments.
- **Neutral Main (`#26332A`):** Deep Cypress Dark. High-contrast, legible typographic base for headlines and primary body text.
- **Neutral Secondary (`#6B776D`):** Medium Sage Slate. Used for metadata, subtitles, and secondary form labels.
- **Neutral Muted (`#929B93`):** Soft Stone. Reserved for placeholder text, deactivated icons, and disabled states.
- **Backgrounds:**
  - Base App Canvas: `#FAFCF9`
  - Subtle Surface Tier: `#F3F7F2`
  - Elevated Container / Card Fill: `#FFFFFF`
- **Borders:**
  - Standard Dividing Lines: `#E3EAE3`
  - Active / Emphasized Outlines: `#C7D7C8`
- **Functional Semantics:**
  - Success: `#3B7551` text on `#EBF5EE` surface
  - Warning / Pending: `#A06A18` text on `#FCF5E8` surface
  - Error: `#B44238` text on `#FCEEEF` surface
  - Info: `#356B8C` text on `#EBF3F8` surface

## Typography

Typography is powered consistently by **Plus Jakarta Sans**, offering geometric balance, generous counters, and crisp legibility at compact data scales. 

- **Headlines:** Employ weights `600` and `700` with tight negative tracking (`-0.01em` to `-0.02em`) to project intentional authority and structured elegance.
- **Body Text:** Leverages weight `400` with comfortable line-height multipliers (`1.5x` to `1.57x`) to ensure prolonged readability during lesson reviews and policy reading.
- **Interactive Labels & Badges:** Use weights `600` with slightly open letter-spacing to ensure crisp parsing on high-density mobile displays and status indicators.

## Layout & Spacing

The portal layout operates on an adaptive 8-point base rhythm, balancing structured density with intentional breathing room:

- **Desktop (1024px+):** 12-column responsive grid with a standard `margin` of `2rem` (32px), `gutter` of `1.5rem` (24px), and maximum content constraint of 1280px. Persistent collapsible navigation rail anchored to the left.
- **Tablet (768px – 1023px):** 8-column layout with `1.5rem` margins and `1rem` gutters. Top bar replaces sidebar or transitions into an off-canvas drawer.
- **Mobile (< 768px):** 4-column layout utilizing `margin-sm` of `1rem` (16px) and `gutter-sm` of `1rem` (16px). Bottom persistent tab bar handles primary destinations.
- **Interior Component Rhythm:** Small inline elements utilize `space-xs` (4px) and `space-sm` (8px). Container insets and card paddings strictly observe `space-md` (16px) on mobile and `space-lg` (24px) on desktop dashboards.

## Elevation & Depth

Depth is established primarily through **soft tonal separation and ambient diffused shadows**, avoiding stark contrast:

- **Level 0 (Flat / Canvas):** Applied to the main screen wrapper `#FAFCF9`.
- **Level 1 (Card Default):** Base white containers (`#FFFFFF`) with a 1px border (`#E3EAE3`) and an ultra-subtle tinted drop: `0px 2px 8px rgba(38, 51, 42, 0.04)`.
- **Level 2 (Hover & Active Cards):** Lifted state for interactive membership modules: `0px 8px 20px rgba(38, 51, 42, 0.08)`, border subtly darkening to `#C7D7C8`.
- **Level 3 (Floating Overlays & Popovers):** Mobile bottom navigation bars, dropdown menus, and modal dialogs: `0px 12px 32px rgba(38, 51, 42, 0.12)` with light background blur (`backdrop-filter: blur(8px)`) over `#FFFFFFE6`.

## Shapes

The geometric framework balances contemporary clean edges with welcoming curvature. A roundedness factor of `2` provides systematic consistency:

- **Standard Cards & Containers:** Radii set between 14px and 16px (`rounded-lg` to 1rem), delivering a softened architectural profile.
- **Controls & Input Fields:** 8px (`rounded` / 0.5rem) to preserve structured form density.
- **Pills, Badges & Floating Navigation:** Fully rounded circular caps (`9999px`) used for status tags, filter chips, and floating bottom navigation bars.

## Components

### Buttons
- **Primary:** Background `#315B43`, label `#FFFFFF` in `label-lg`. Height 44px (48px on mobile touch targets), border radius 8px (`rounded`). Hover state deepens to `#264734`.
- **Secondary / Subtle:** Background `#E8EFE7`, text `#315B43`. No border. Hover background shifts to `#DCE6DA`.
- **Outline:** Transparent background, 1px border `#C7D7C8`, text `#315B43`. Hover transitions to background `#F3F7F2`.

### Status Badges & Chips
- Fully rounded pills (`border-radius: 9999px`) with padding `4px 10px`.
- Text styled in `label-sm`.
- **Success:** Surface `#EBF5EE`, text `#3B7551`.
- **Pending / Warning:** Surface `#FCF5E8`, text `#A06A18`.
- **Error:** Surface `#FCEEEF`, text `#B44238`.
- **Info:** Surface `#EBF3F8`, text `#356B8C`.

### Cards & Dashboards
- Pure white fill (`#FFFFFF`), border 1px solid `#E3EAE3`, border radius 16px.
- Internal padding of 24px (`space-lg`) on desktop, 16px (`space-md`) on mobile.
- Section headers within cards utilize `headline-sm` with optional right-aligned interactive text actions.

### Input Fields & Controls
- Container height 44px, background `#FFFFFF`, border 1px solid `#E3EAE3`, border radius 8px.
- Focused state features a crisp 1.5px border `#315B43` and a 2px outer glow of `#315B431A`.
- Checkboxes and radios use a 20px size; checked state fills with `#315B43` and a pure white glyph.

### Navigation Bars & Mobile Tabs
- **Mobile Bottom Bar:** Fixed elevation with a frosted white background (`#FFFFFFF2` with `backdrop-filter: blur(12px)`), 1px top border `#E3EAE3`, height 64px.
- Active tab features an indicator dot or pill highlight in `#315B43` with typography transitioning from muted neutral (`#6B776D`) to primary dark (`#26332A`).