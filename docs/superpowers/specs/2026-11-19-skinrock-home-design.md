# Skinrock Official: Home Page Redesign (Design Spec)

Date: 2026-11-19
Status: agreed in brainstorming; user asked to plan and start building.

## Intent

Rebuild skinrockofficial.com (Skinrock Official AG, Chur, Switzerland; ultra-thin, flexible, translucent natural stone veneers) as an Awwwards-level site. The first deliverable is the project scaffold plus the home page.

**Primary goal:** brand prestige. Make architects, designers and Awwwards juries *feel* the material: thin, flexible, translucent, Swiss. Conversion (sample requests, enquiries) is secondary but present.

**Audience:** architects, interior designers, builders, distributors, trade-show visitors.

## Goals / non-goals / anti-goals

- **Goals:** cinematic, motion-rich home page with parallax and text animation; WebGL used to express the material (light through stone, bending); SEO-correct server-rendered HTML; fast on desktop, graceful on mobile.
- **Non-goals (this phase):** other pages (product, gallery, specs, contact), CMS, e-commerce, i18n (DE/FR/IT), real sample-ordering backend.
- **Anti-goals (would be failure even if it "works"):**
  - Generic AI-looking design: purple gradients, glassmorphism, bento SaaS grids, centered hero with two buttons, sparkle/shimmer text.
  - **Glowing dot "light badges"** next to CTAs or labels.
  - **Em dashes (—) or en dashes (–) anywhere in content.** Ranges are written "1.5 to 3 mm".
  - Orange accents.
  - WebGL that hides content from search engines or breaks without JS.

## Decided by the user

| Decision | Choice |
|---|---|
| Stack | Next.js (App Router, SEO), WebGL, Lenis, Motion; open to other libraries |
| Site goal | Brand prestige first |
| Assets | Current-site photos + stock as placeholders |
| Motion | Parallax and text animations throughout |
| Typography | **A · Swiss grotesk only.** Free: Inter (Display optical size). Production upgrade: Suisse Intl or Neue Haas Grotesk Display |
| Colour | **Graubünden Night** (below) |
| Section structure | 10-section home page (below), accepted without changes |

### Colour tokens: Graubünden Night

| Token | Hex | Use |
|---|---|---|
| `base` | `#0D1520` | page background (ink-blue black) |
| `deep` | `#101B2A` | light chapter background |
| `raised` | `#132033` | raised surfaces |
| `mute` | `#8FA0B3` | secondary text (6.85:1 on base) |
| `stone` | `#EEE9E0` | primary text (15.2:1 on base) |
| `cream` | `#ECE6DA` | inverted "stone-light" chapters |
| `glacier` | `#BFE3F2` | accent, ≈10% of UI, rendered as light, never as flat blocks |
| `backlight` | `#F4E9D2` | the colour of light through stone (WebGL glow) |
| `glacier-ink` | `#2C5A78` | accent on cream chapters |

Principles: cool shadow / warm light; tinted blacks; photos colour-graded into the palette; chapters invert dark ↔ cream (SANTAL); grain overlay at ~7%.

### Typography scale (Inter, opsz auto)

- Display: 500 weight, tracking -0.055em to -0.06em, line-height 0.88 to 0.9, fluid `clamp()` up to ~8.5vw.
- Headline: 500, -0.045em.
- Body: 400, 15 to 17px, -0.01em.
- Labels: 500, 12px, uppercase, +0.1em.

## Approach (chosen: A)

| Option | Trade-off |
|---|---|
| **A · One persistent R3F canvas behind the DOM; WebGL planes synced to real `<img>` elements (chosen)** | Most cohesive and Awwwards-like (SANTAL, Lenval, Belgrade Arbor). More complex and needs perf care; DOM images remain for SEO / no-WebGL fallback. |
| B · Isolated canvases only for hero, bend, light | Faster and lighter, but images elsewhere feel disconnected; weaker transitions. |
| C · Same as A with OGL | Smaller bundle, but loses drei/ecosystem; more hand-written code. |

Chosen by Claude after the user handed over the "how" ("let's plan this and start building").

## Stack

- next 16.x (App Router, Turbopack), react / react-dom 19.3.x (pinned `<19.4` for R3F peer range)
- three, @react-three/fiber 9, @react-three/drei 10
- lenis (via `lenis/react`, `autoRaf: false`, driven by GSAP ticker)
- gsap + @gsap/react (ScrollTrigger, SplitText; GSAP is free incl. plugins)
- motion (`motion/react`) for hover, magnetic, presence
- Tailwind CSS v4 with tokens above
- `next/font/google` Inter (self-hosted at build)
- TypeScript, ESLint

Responsibilities: GSAP owns scroll-pinned timelines and text splitting; Motion owns component-level interaction; never both on the same property. WebGL reads Lenis scroll and velocity in `useFrame`. All motion respects `prefers-reduced-motion`.

## Home page sections

0. **Preloader:** counter 0 to 100, stone-grain wipe out (Vendredi). Short (<2.2s), skipped on repeat visits in-session.
1. **Hero:** Alps slate wall photo as a WebGL plane with subtle depth and parallax; split-text headline "Real stone. Thin enough to let light through." (word rise); spec line; nav (Stones, Projects, Light, Specs, Studio, Request samples as plain text CTA).
2. **Manifesto:** pinned; one huge word at a time: STONE. BENDS. GLOWS. 1.5 MM. (SANTAL).
3. **Flex story:** pinned; a WebGL stone sheet curls and bends with scroll progress; thickness, weight and format count up.
4. **Light (signature):** translucent onyx with a backlight shader; light intensity and position follow cursor and scroll; paragraph fills word by word on scroll.
5. **Collection:** cream chapter; oversized index Slate / Quartzite / Marble / Acoustic with counts; hover shows a stone preview following the cursor.
6. **Projects:** floating parallax collage of project photos (Marvell), leading into a horizontal gallery with captions (use, setting).
7. **Swiss proof:** test results grid (DIN 4102-1 B2; EN 13823 C-s2,d0 orienting; SIA 262/1 frost and de-icing salt; AgBB emissions; SN EN 1931 vapour), plus data-sheet link.
8. **CTA:** "Hold it in your hand." Magnetic "Request samples" button.
9. **Footer:** oversized SKINROCK wordmark, Skinrock Official AG, Hartbertstrasse 9, 7000 Chur, contact, socials, legal (WRK, Storey).

## Content rules

- Reuse real copy and facts from the current site; no invented claims.
- No em or en dashes. No glowing dots.
- Spec values pending client confirmation are centralised in one content file and flagged: thickness (1.5 to 3 mm vs 1 to 3 mm), weight (≈2.8 kg/m²), sheet size (120 × 250 vs 120 × 260 cm), HQ (Chur vs Küblis).

## SEO

- Server-rendered HTML for all text; one H1; semantic sections with H2s.
- Metadata API: title, description, Open Graph, Twitter, canonical.
- JSON-LD: Organization (with address) and WebSite.
- Descriptive alt text on every image; `next/image` for DOM images.
- `sitemap.ts` and `robots.ts`.

## Performance and accessibility

- WebGL canvas lazy-mounted after first paint; DPR clamp ≤ 1.75; pause rendering when tab hidden.
- Fallback when WebGL is unavailable or reduced motion is set: DOM images with CSS parallax off, text visible without animation.
- Targets: Lighthouse SEO 100, Accessibility ≥ 95, LCP < 2.5s on desktop.
- Focus states visible; colour contrast per tokens table (AA or better).

## Assets

- Placeholder imagery: Skinrock's own high-resolution photos (≥1800px) downloaded to `public/images/`, plus stock where gaps exist. ~98 of 151 current-site photos are under 1200px wide, so new photography (especially backlit close-ups) is required before launch.

## Left to the builder

- Exact shader implementations (displacement, backlight, bend) within the described behaviour.
- Component file structure, easing curves, durations (guideline: expo-out style `cubic-bezier(.16,1,.3,1)`, 0.9 to 1.2s for reveals).
- Mobile adaptations of pinned sections.

## References

SANTAL (santalarch.com), Lenval (lenvalproperties.com), Belgrade Arbor (belgradearbor.rs), Palaraiffeisen (palaraiffeisen.ch), Marvell Tile & Stone (marvellco.com.au), WRK Timepieces, Storey Architecture, Longitude Design, Vendredi Society, The Quarry House. Research notes from the brainstorming session; rendered mockups in `.superpowers/brainstorm/`.
