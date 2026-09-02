# design-sync notes — @startupup/ds

Repo-specific gotchas for future syncs. Read this before touching anything.

## Where the design system came from

- This repo is a Next.js **app**, not a component library. `ds/` was created
  specifically so claude.ai/design has real components to build with: every
  component is extracted from styles that already existed in
  `styles/globals.css` and markup already in `pages/index.js`.
- `pages/index.js` still has its own inline `<style jsx global>` block that
  duplicates most of `styles/globals.css`. The DS copies the same rules a third
  time into `ds/src/styles.css`. **If a brand style changes, it has to change in
  all three places** until the app is refactored onto `ds/`.
- `.house-card` / `.house-img` are defined in `globals.css` (and duplicated in
  the inline block) but **used nowhere** — dead CSS. They are carried into the
  DS stylesheet for fidelity but no component uses them.

## Build

- `cd ds && npm run build` → `build:js` (tsup, ESM + .d.ts), `build:css`
  (Tailwind v4 CLI), `build:fonts` (copies woff2 into `dist/fonts`).
- **npm 11 blocks install scripts by default.** After `npm install` in `ds/` or
  `.ds-sync/`, check `node_modules/.bin/esbuild --version` works. It has so far,
  but a hard failure means running `npm approve-scripts esbuild`.
- Builds are slow on this machine (OneDrive-synced path): a full
  `package-build.mjs` + `package-validate.mjs` pass runs past 10 minutes, and
  even `preview-rebuild.mjs` for one component takes ~2 minutes. Budget for it;
  nothing is hanging.

## Tailwind source scanning — the one real trap

`ds/src/styles.css` compiles a **static** stylesheet, so Tailwind only emits
classes it can see at build time. Its `@source` list therefore covers:

- `./` — the DS components themselves
- `../../pages` — the live site, so the compiled CSS carries the utility
  vocabulary the brand actually uses (this is what the design agent gets)
- `../../stock-map/components`
- `../../.design-sync/previews` — **required**: preview cards use arbitrary
  utilities (`w-[320px]`, `h-[280px]`) that appear nowhere else. Without this
  line those previews silently render at the wrong size.

Adding a new preview that uses a brand-new arbitrary utility means re-running
`npm run build:css` in `ds/` before the converter, or the card renders wrong.

## Component classes vs utilities

`ds/src/styles.css` puts the ported classes (`.btn-primary`, `.input-modern`,
`.label`, `.sold-out-ribbon`, `.custom-map-marker`, …) inside
`@layer components`, so Tailwind utilities win over them. The live site defines
the same classes **unlayered**, where they beat utilities instead — that is why
`className="btn-primary py-2.5"` silently loses its padding on the site but
works in the DS. Deliberate; don't "fix" it back.

## Fonts

Prompt (300/400/500/600/700, thai + latin subsets) is vendored into
`ds/src/fonts/` from Google Fonts and shipped in the bundle — the DS does not
depend on the host page loading a webfont. Vietnamese and latin-ext subsets were
deliberately dropped to keep the payload small; if the brand ever needs them,
re-run the download with those subsets included.

## Known render warns

- `[GRID_OVERFLOW]` on `PropertyCardSkeleton` — its `LoadingRail` and
  `FillingAGap` stories are intentionally wider than one grid cell. Resolved with
  `cfg.overrides.PropertyCardSkeleton = {"cardMode": "column"}`.
- `Reveal` previews pass `immediate` so the card captures the revealed end state.
  The scroll-triggered entrance cannot be captured statically; that is expected,
  not a broken preview.
- `Marquee` is a running CSS animation — each capture catches it at a different
  offset. Frame-to-frame differences between syncs are not regressions.

## Re-sync risks

- **The DS duplicates the app's styles.** Nothing detects drift. If someone
  edits `globals.css` or the inline block in `pages/index.js` without touching
  `ds/src/styles.css`, the synced design system quietly stops matching the site.
- **Preview images are remote Unsplash URLs.** They render in the cards but are
  not vendored; if Unsplash changes or blocks them the cards lose their photos.
  Swap in repo-owned images if that matters.
- `ds/docs/*.md` are frontmatter-only stubs whose sole job is setting each
  component's `category` (its group in the DS pane). They intentionally have no
  body, so `.prompt.md` keeps the auto-synthesized props documentation. If a
  real doc body is ever added to one, it replaces that synthesis.
- The DS was built against Tailwind v4.3.3 / React 19.2.4 / tsup 8.5.1.
