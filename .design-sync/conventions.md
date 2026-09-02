## How to build with this design system

Startup Up is a Thai real-estate brand. Everything here is extracted from the
live site, so the components already look right — compose them, don't restyle
them.

**No provider, no theme wrapper.** Import the components and render them. The
stylesheet carries the tokens, the component classes and the Prompt webfont
(Thai + Latin, weights 300–700), so nothing has to be set up first. If text
renders in a system font, the stylesheet did not load — that is the only setup
failure mode.

**Write Thai copy by default.** Every label, price and place name on this site is
Thai. Prompt is the brand face and ships with the bundle; do not substitute a
font or fall back to English placeholder copy.

### The styling idiom: Tailwind utilities + brand tokens

Layout and spacing are plain Tailwind utilities. Two brand colours are wired
into the token scale — use these names, never a raw hex:

| Purpose | Classes |
|---|---|
| Brand green `#0b3d1b` | `bg-brand-green` `text-brand-green` `border-brand-green` |
| Tinted brand green | `bg-brand-green/10` (tag/pill backgrounds) |
| Brand light `#eef3f0` | `bg-brand-light` (icon tiles, muted panels) |
| Body text | `text-gray-800` heading, `text-gray-500 font-light` supporting |

House style, applied consistently:

- **Pills for actions.** `rounded-full` on every button and chip.
- **`rounded-2xl` for cards, `rounded-3xl` for large panels.**
- **Soft lift on hover:** `shadow-sm hover:shadow-md transition hover:-translate-y-1`.
- **Thin borders:** `border border-gray-100` (cards) or `border-gray-200` (controls).

A handful of hand-written classes carry effects utilities can't express. Use
them as-is:

`btn-primary` (the green pill that inverts on hover) · `input-modern` (text
input) · `label` (form label) · `sold-out-ribbon` with `sold-out-ribbon-sm` /
`sold-out-ribbon-lg` · `custom-map-marker` · `reveal-on-scroll` + `is-revealed`
(scroll entrance) · `animate-marquee` · `animate-pop` · `scrollbar-hide`

Prefer the component that wraps a class over the class itself: `Button` over
`btn-primary`, `Input` over `input-modern`, `MapMarker` over
`custom-map-marker`. Reach for the raw class only when you need the effect on
markup no component covers.

### Where the truth lives

Read `_ds/<folder>/styles.css` (and the files it `@import`s) before inventing
any style, and `components/<group>/<Name>/<Name>.prompt.md` for a component's
props and intent. Components are grouped as **actions, forms, property,
content, motion, map**.

### An idiomatic screen

```jsx
<section className="max-w-7xl mx-auto px-6 py-16">
  <SectionHeading className="mb-6">บ้านแนะนำในเพชรบูรณ์</SectionHeading>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    <PropertyCard
      layout="fluid"
      title="บ้านเดี่ยว ศุภาลัย ริเวอร์ วิลล์"
      image="/images/river-ville.jpg"
      location="บางนา - ศรีนครินทร์"
      price={4590000}
      category="บ้านเดี่ยว"
      badge="New"
      badgeTone="new"
      areaWah={52}
      bedrooms={3}
      bathrooms={2}
      href="/property/river-ville"
    />
  </div>

  <div className="text-center mt-10">
    <Button>ดูบ้านทั้งหมด</Button>
  </div>
</section>
```

`PropertyCard` defaults to `layout="carousel"` — a fixed 300×400 snap card for
horizontal rails. Pass `layout="fluid"` to let it fill a grid cell, as above.
