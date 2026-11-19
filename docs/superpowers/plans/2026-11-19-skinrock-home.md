# Skinrock Home Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Skinrock Next.js site and build the Awwwards-level home page (10 sections) in the Graubünden Night palette with Swiss-grotesk type, WebGL, Lenis, GSAP and Motion.

**Architecture:** Server-rendered Next.js App Router page; all copy lives in one typed content module. One fixed, persistent R3F `<Canvas>` renders drei `<View>`s that track real DOM elements, so WebGL planes sit exactly over SSR'd `<img>`s (SEO + fallback). Lenis is driven by GSAP's ticker; GSAP owns pinned scroll timelines and text splitting; Motion owns hover/magnetic UI.

**Tech Stack:** next 16, react ~19.3 (<19.4), three, @react-three/fiber 9, @react-three/drei 10, lenis, gsap + @gsap/react, motion, Tailwind v4, TypeScript, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-19-skinrock-home-design.md`

## Global Constraints

- No em dash (U+2014) or en dash (U+2013) in any user-visible copy, alt text or metadata. Ranges: "1.5 to 3 mm".
- No glowing dot badges; CTAs are plain type with hover/magnetic motion.
- No orange; accent `glacier #BFE3F2` on ≈10% of UI, rendered as light (text, hairlines, shader glow), never flat fills on dark.
- Tokens: base `#0D1520`, deep `#101B2A`, raised `#132033`, mute `#8FA0B3`, stone `#EEE9E0`, cream `#ECE6DA`, glacier `#BFE3F2`, backlight `#F4E9D2`, glacier-ink `#2C5A78`.
- Font: Inter via `next/font/google`, variable, `opsz` axis; display 500, tracking -0.055em, line-height 0.9.
- Easing default `cubic-bezier(.16,1,.3,1)`; reveal 0.9 to 1.2s.
- All text present in SSR HTML; animations only transform/opacity what is already rendered.
- `prefers-reduced-motion: reduce` disables Lenis smoothing, pinning scrub effects, preloader and WebGL motion; content stays fully visible.
- Canvas DPR clamp `[1, 1.75]`; render loop paused when `document.hidden`.
- React pinned `~19.3.x` for the R3F peer range.
- Pending client confirmation values live only in `content/site.ts` under `specs` with `pending: true`.

## Review Focus

1. **No JavaScript / crawlers:** every heading and paragraph is visible and readable. Test: Task 3 e2e `renders all copy without JS`.
2. **Reduced motion:** preloader skipped, nothing pinned/hidden, headline visible immediately. Test: Task 5 e2e `reduced motion shows content immediately`.
3. **WebGL unavailable:** DOM images remain visible, no console errors. Test: Task 4 e2e `falls back to DOM images without WebGL`.
4. **Phone width (390px):** no horizontal overflow; pinned sections fall back to stacked layout. Test: Task 10 e2e `no horizontal overflow at 390px`.
5. **Fast scroll to bottom and back:** no console errors, footer wordmark visible, ScrollTriggers refreshed. Test: Task 10 e2e `fast scroll round trip is clean`.

---

## File Structure

```
app/
  layout.tsx            html shell, Inter font, metadata, JSON-LD, Providers, GLStage
  page.tsx              composes sections in order
  globals.css           Tailwind v4 @theme tokens, base styles, grain, utilities
  sitemap.ts, robots.ts
content/site.ts         all copy, stones, projects, specs, tests, contact (typed)
lib/math.ts             clamp, lerp, mapRange, damp
lib/seo.ts              buildMetadata(), organizationJsonLd(), websiteJsonLd()
lib/text.ts             collectStrings(obj): string[]  (used by tests)
components/providers/
  Providers.tsx         MotionPrefsProvider + SmoothScroll
  MotionPrefs.tsx       useMotionPrefs(): { reduced: boolean; webgl: boolean }
  SmoothScroll.tsx      ReactLenis root, GSAP ticker bridge, ScrollTrigger.refresh on load
components/ui/
  SplitReveal.tsx       word-rise reveal (GSAP SplitText), SSR-visible
  ScrollFill.tsx        paragraph words fill on scroll
  MagneticButton.tsx    Motion springs
  Grain.tsx             noise overlay
  Nav.tsx
components/gl/
  GLStage.tsx           fixed Canvas + View.Port, dpr clamp, hidden-tab pause
  GLImage.tsx           <img> + tracked <View> with StoneMaterial
  materials/stone.ts    cover-fit, grade, velocity ripple, reveal
  BendSheet.tsx         curling stone plane (uBend)
  materials/backlight.ts translucency from luminance, pointer light
  useScrollVelocity.ts  Lenis velocity → damped value
components/sections/
  Preloader, Hero, Manifesto, FlexStory, Light, Collection,
  Projects, SwissProof, Cta, Footer  (.tsx)
public/images/          downloaded placeholder photos (≥1800px)
tests/unit/*.test.ts    Vitest
tests/e2e/*.spec.ts     Playwright
```

---

### Task 1: Scaffold, tokens, test harness

**Files:** Create: project via create-next-app, `app/globals.css`, `app/layout.tsx`, `vitest.config.ts`, `playwright.config.ts`, `tests/unit/smoke.test.ts`, `tests/e2e/home.spec.ts`, `.gitignore` entries `.superpowers/ .playwright-mcp/ test-results/`

**Interfaces:** Produces: Tailwind color utilities `bg-base text-stone text-mute text-glacier bg-cream text-glacier-ink bg-deep bg-raised`, CSS var `--font-inter`, `npm run test` (vitest), `npm run e2e` (playwright, dev server on :3100).

- [ ] **Step 1:** `git init`; `npx create-next-app@latest . --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --turbopack --yes` (move `.superpowers`/`.playwright-mcp`/`docs` aside if it refuses, then restore).
- [ ] **Step 2:** Install: `three @react-three/fiber @react-three/drei lenis gsap @gsap/react motion`; dev: `vitest @playwright/test @types/three`; pin `"react": "~19.3.1", "react-dom": "~19.3.1"`.
- [ ] **Step 3:** Write e2e `home responds with Skinrock title`: `expect(page).toHaveTitle(/Skinrock/)`; run, expect FAIL.
- [ ] **Step 4:** `globals.css` `@theme` with the 9 tokens as `--color-*`, `--font-sans: var(--font-inter)`; body `bg-base text-stone antialiased`. Layout loads Inter (`axes:['opsz']`), sets `<title>` placeholder "Skinrock".
- [ ] **Step 5:** Run `npm run test` and `npm run e2e`; expect PASS. `npm run build` succeeds.
- [ ] **Step 6:** Commit `chore: scaffold next app with tokens and test harness`.

### Task 2: Content, images, SEO

**Files:** Create `content/site.ts`, `lib/text.ts`, `lib/seo.ts`, `app/sitemap.ts`, `app/robots.ts`, `scripts/fetch-images.sh`, `public/images/*`; Modify `app/layout.tsx`. Test: `tests/unit/content.test.ts`, `tests/unit/seo.test.ts`.

**Interfaces:** Produces `site` object:
`site.hero {eyebrow, headline, lede, specLine: string[]}`, `site.manifesto: string[]` (= `["Stone.","Bends.","Glows.","1.5 mm."]`), `site.flex {title, stats: {value:number, decimals:number, unit:string, label:string}[]}`, `site.light {kicker, paragraph}`, `site.collection: {slug, name, count:string}[]` (Slate 10 stones, Quartzite 8 stones, Marble 24 stones, Acoustic "Stone faced panel"), `site.projects: {src, alt, use, setting}[]` (≥8), `site.proof: {standard, result}[]`, `site.cta {title:"Hold it in your hand.", button:"Request samples"}`, `site.contact {company:"Skinrock Official AG", street:"Hartbertstrasse 9", postal:"7000", city:"Chur", country:"CH"}`, `site.specs {thickness:{value:"1.5 to 3 mm", pending:true}, weight:{value:"≈2.8 kg/m²", pending:true}, format:{value:"120 × 250 cm", pending:true}}`, `site.images` map name → `{src, width, height, alt}`.
`collectStrings(o: unknown): string[]`; `buildMetadata(): Metadata`; `organizationJsonLd(): Record<string, unknown>`; `websiteJsonLd()`.

- [ ] **Step 1:** Test `content has no em or en dashes`: `collectStrings(site).filter(s => /[–—]/.test(s))` equals `[]`. Test `every image has alt text ≥ 12 chars`. Test `organizationJsonLd has PostalAddress Chur 7000` and `@type: "Organization"`, `buildMetadata().title` contains "Skinrock". Run, FAIL.
- [ ] **Step 2:** `scripts/fetch-images.sh` downloads the high-res set (alps-slate, onyx-column, lit-table, dark-bath, stair, kitchen-translucent, facade-8, walls-20, furniture-23, sauna walls-14, outdoor-walls-13, walls-translucent-3) from `skinrockofficial.com/wp-content/uploads/2026/07/skinrock-stone-veneer-*` into `public/images/`, resized to ≤2000px webp/jpg.
- [ ] **Step 3:** Implement content (copy from spec and current site; no invented claims), seo helpers, layout metadata + JSON-LD `<script type="application/ld+json">`, sitemap/robots (base URL `https://skinrockofficial.com`).
- [ ] **Step 4:** Tests PASS; commit `feat: content model, imagery and seo`.

### Task 3: Motion foundation

**Files:** Create `lib/math.ts`, `components/providers/{Providers,MotionPrefs,SmoothScroll}.tsx`, `components/ui/{SplitReveal,ScrollFill,MagneticButton,Grain}.tsx`. Test: `tests/unit/math.test.ts`, e2e in `tests/e2e/home.spec.ts`.

**Interfaces:** `clamp(v,min,max)`, `lerp(a,b,t)`, `mapRange(v,inMin,inMax,outMin,outMax, clamp=true)`, `damp(a,b,lambda,dt)`. `useMotionPrefs(): {reduced:boolean; webgl:boolean}`. `<SplitReveal as="h1"|"h2"|"p" className? delay?>{string or nodes}</SplitReveal>`. `<ScrollFill text: string className? />`. `<MagneticButton href strength=0.35>`. `useLenis()` from `lenis/react` available app-wide.

- [ ] **Step 1:** Unit tests: `mapRange(5,0,10,0,100)===50`, clamps at bounds, `damp` converges toward target. e2e `renders all copy without JS` (context `javaScriptEnabled:false`): H1 text equals `site.hero.headline`, `site.light.paragraph` visible. Run, FAIL.
- [ ] **Step 2:** Implement. SmoothScroll: `<ReactLenis root options={{autoRaf:false, lerp:0.09}}>`, `gsap.ticker.add(t=>lenis.raf(t*1000))`, `lenis.on('scroll', ScrollTrigger.update)`, `gsap.ticker.lagSmoothing(0)`, refresh after `document.fonts.ready` and `load`; disabled when reduced. SplitReveal splits only after mount (`useGSAP`), so SSR text is plain and visible; mask lines with `overflow:hidden`, `yPercent:108 → 0`, stagger 0.05. ScrollFill: words `opacity .18 → 1` scrubbed.
- [ ] **Step 3:** Tests PASS; commit `feat: smooth scroll, motion prefs and text reveal primitives`.

### Task 4: GL stage and StoneImage

**Files:** Create `components/gl/{GLStage,GLImage,useScrollVelocity}.tsx`, `components/gl/materials/stone.ts`; Modify `app/layout.tsx`.

**Interfaces:** `<GLStage />` (mounted once in layout, fixed inset 0, `pointer-events:none`, z below content, `eventSource={document.body}`). `<GLImage image={site.images.x} className? grade=0.38 ripple=1 parallax=0.12 priority? />` renders `next/image` (always in DOM; hidden with `opacity:0` only once its WebGL twin has rendered a frame) plus a drei `<View track>` mesh using `StoneMaterial` uniforms `{uTex, uRes, uImageRes, uGrade(vec3 #1E3A5C), uGradeAmt, uVelocity, uReveal, uTime}`. `useScrollVelocity(): MutableRefObject<number>`.

- [ ] **Step 1:** e2e `falls back to DOM images without WebGL` (launch chromium with `--disable-gpu --disable-webgl`): hero `<img>` visible, no console errors. Run, FAIL (component missing).
- [ ] **Step 2:** Implement. Shader: cover-fit UVs; color blend toward grade in shadows (`mix(col, col*uGrade*2.2, uGradeAmt*(1.-luma))`); vertical ripple `sin(uv.y*8.+uTime)*uVelocity*0.004`; reveal mask from bottom with noise edge. WebGL detection in MotionPrefs; GLStage not rendered when `!webgl`; frameloop `"never"` when hidden.
- [ ] **Step 3:** Visual check via Playwright screenshot of hero; tests PASS; commit `feat: persistent gl stage with dom-tracked stone images`.

### Task 5: Preloader, Nav, Hero

**Files:** Create `components/sections/{Preloader,Hero}.tsx`, `components/ui/Nav.tsx`; Modify `app/page.tsx`.

**Interfaces:** Preloader sets `document.documentElement.dataset.loaded="true"` on finish; sections may wait for it. sessionStorage key `sr-loaded`.

- [ ] **Step 1:** e2e `reduced motion shows content immediately` (`reducedMotion:'reduce'`): no `[data-preloader]` visible after 300ms; H1 visible. e2e `nav links`: Stones, Projects, Light, Specs, Studio, Request samples. Run, FAIL.
- [ ] **Step 2:** Preloader: counter 0→100 (≤2.2s) bottom-left, then a clip-path wipe upward; skipped when reduced or `sr-loaded`. Hero: full-viewport, `GLImage` alps-slate occupying right 62% (bleeding), left gradient into base; `SplitReveal as="h1"` headline at `clamp(3.5rem, 8.4vw, 9.5rem)`, word "light" in glacier with soft text-shadow; index row "01 / Natural stone veneer" with drawn hairline; spec line from `site.hero.specLine`; scroll cue. Nav: logo SKINROCK (tracking .16em), links mute, CTA plain stone text with underline-draw hover.
- [ ] **Step 3:** Tests PASS, screenshot check; commit `feat: preloader, nav and hero`.

### Task 6: Manifesto and Flex story

**Files:** Create `components/sections/{Manifesto,FlexStory}.tsx`, `components/gl/BendSheet.tsx`.

**Interfaces:** `<BendSheet progress: MutableRefObject<number> image={site.images.x} />` inside a tracked View; uniform `uBend` 0→1 curls plane along x (radius from 6 → 0.9), plus slight z-rotation.

- [ ] **Step 1:** e2e `manifesto words in order`: section `#manifesto` contains the four words in order. Run, FAIL.
- [ ] **Step 2:** Manifesto: pinned for `+=300%`, each word full-bleed `clamp(5rem,18vw,22rem)`, previous word slides up/blur out, next rises in; reduced: static stacked list. FlexStory: pinned `+=200%`; BendSheet progress scrubbed; stats count up (`gsap` snap to decimals) "1.5 mm", "2.8 kg/m²", "120 × 250 cm"; caption "Cut with standard diamond tools. Bends around curves."
- [ ] **Step 3:** Tests PASS; commit `feat: manifesto and flex story`.

### Task 7: Light chapter (signature)

**Files:** Create `components/sections/Light.tsx`, `components/gl/materials/backlight.ts`, `components/gl/BacklightStone.tsx`.

**Interfaces:** `<BacklightStone image={site.images.onyxColumn} intensity: MutableRefObject<number> />`; uniforms `{uTex, uLight(vec2 pointer uv), uIntensity, uWarm(vec3 #F4E9D2), uCool(vec3 #BFE3F2)}`.

- [ ] **Step 1:** e2e `light chapter copy`: `#light` contains `site.light.paragraph`. Run, FAIL.
- [ ] **Step 2:** Shader: translucency `t = pow(luma, 1.6)`; emitted light = `uWarm * t * uIntensity * falloff(distance(uv,uLight))`, slight glacier rim on dark veins; additive over the darkened stone. Intensity scrubbed 0.15→1 across the section; pointer eased with `damp`. Layout: `bg-deep`, two columns, kicker "02 / Translucent", `ScrollFill` paragraph, stats row. Reduced/no-WebGL: static image with CSS radial glow.
- [ ] **Step 3:** Tests PASS, screenshot; commit `feat: backlit stone light chapter`.

### Task 8: Collection and Projects

**Files:** Create `components/sections/{Collection,Projects}.tsx`, `components/ui/CursorPreview.tsx`.

**Interfaces:** `<CursorPreview items={{key, image}[]} active: string|null />` follows pointer with Motion springs (stiffness 180, damping 22), clip-path reveal.

- [ ] **Step 1:** e2e `collection index`: `#collection` has 4 rows with names Slate, Quartzite, Marble, Acoustic. e2e `projects have captions`: ≥8 figures with `figcaption`. Run, FAIL.
- [ ] **Step 2:** Collection: `bg-cream text-base`, numbers in glacier-ink, rows `clamp(2.5rem,6vw,6rem)`, hover indent + preview. Projects: Marvell-style floating collage (8 images, depth-based parallax speeds 0.05 to 0.35) behind a large statement, then a pinned horizontal track of captioned project cards (use · setting). Mobile: vertical stack.
- [ ] **Step 3:** Tests PASS; commit `feat: collection index and projects`.

### Task 9: Swiss proof, CTA, Footer

**Files:** Create `components/sections/{SwissProof,Cta,Footer}.tsx`.

- [ ] **Step 1:** e2e `footer address`: footer contains "Hartbertstrasse 9" and "7000 Chur". e2e `cta button text` "Request samples". Run, FAIL.
- [ ] **Step 2:** SwissProof: grid of `site.proof` (standard, result) with hairlines, heading "Tested in Switzerland, Germany and Austria." only if supported by content, otherwise "Independently tested."; data-sheet link. Cta: big headline, MagneticButton. Footer: wordmark SKINROCK at `~22vw` rising from below with scroll, address, email placeholder flagged, socials, legal, year.
- [ ] **Step 3:** Tests PASS; commit `feat: proof, cta and footer`.

### Task 10: Hardening

**Files:** Modify as needed; Test: `tests/e2e/hardening.spec.ts`.

- [ ] **Step 1:** e2e `no horizontal overflow at 390px` (`scrollWidth <= innerWidth`), `fast scroll round trip is clean` (wheel to bottom in 20 steps and back; zero console errors; footer wordmark visible), `rendered text has no dashes` (`document.body.innerText` has no U+2013/U+2014), `single h1`.
- [ ] **Step 2:** Fix failures; `npm run build`; run Lighthouse (`npx lighthouse http://localhost:3000 --only-categories=seo,accessibility,performance --preset=desktop`), targets SEO 100, A11y ≥ 95.
- [ ] **Step 3:** Commit `chore: harden home page`.
