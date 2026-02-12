# ChapMagic — Agent Rules

> **YOU MUST READ THIS FILE AND `.agent/master-prompt.md` BEFORE WRITING ANY CODE.**
> **Failure to do so WILL result in broken, hallucinated, or deprecated code.**

---

## Rule 1: Always Read Before You Write

Before starting ANY coding task in this project, you MUST complete this checklist:

1. ✅ Read this file (`.agent/rules.md`) — you are doing this now.
2. ✅ Read `.agent/master-prompt.md` — the corrected project specification.
3. ✅ Read the relevant skill file(s) from the table below.

| If your task involves... | Read this skill file |
|---|---|
| `.astro` files, layouts, pages, content collections, API routes, `astro:*` imports | `.agent/skills/astro-architecture/SKILL.md` |
| Animations (GSAP, Motion, Lenis, scroll effects, counters) | `.agent/skills/animation-guide/SKILL.md` |
| CSS, Tailwind classes, colors, fonts, responsive design | `.agent/skills/tailwind4-astro/SKILL.md` |
| File creation, naming, JSON data, props, site-config, accessibility | `.agent/skills/project-conventions/SKILL.md` |

**If your task spans multiple areas, read ALL relevant skill files.**

---

## Rule 2: Forbidden Patterns (Hard Errors)

These patterns are **WRONG** and will cause build failures or runtime bugs. NEVER use them.

```
❌ import { z } from 'zod'
✅ import { z } from 'astro/zod'

❌ src/content/config.ts
✅ src/content.config.ts

❌ src/api/send-email.ts
✅ src/pages/api/send-email.ts

❌ <ViewTransitions />
✅ <ClientRouter />  (from 'astro:transitions')

❌ import { animate } from 'motion-one'
❌ import { animate } from '@motionone/dom'
✅ import { animate } from 'motion'

❌ inView(".el", ({ target }) => { ... })
✅ inView(".el", (element, info) => { ... })

❌ @tailwind base; @tailwind components; @tailwind utilities;
✅ @import "tailwindcss";

❌ import tailwind from '@astrojs/tailwind'
✅ import tailwindcss from '@tailwindcss/vite'   (used as Vite plugin, NOT integration)

❌ defineCollection({ schema: z.object({...}) })   (missing loader)
✅ defineCollection({ loader: file("..."), schema: z.object({...}) })
```

---

## Rule 3: No Hardcoded Text

Every user-facing string on the site MUST come from `src/data/site-config.json`.

```
❌ <h1>Magic That Defies The Impossible</h1>
✅ <h1>{t.hero.title}</h1>

❌ <button>Book Now</button>
✅ <button>{t.hero.cta}</button>

❌ <a href="https://wa.me/34123456789">WhatsApp</a>
✅ <a href={`https://wa.me/${config.contact.whatsapp}`}>WhatsApp</a>
```

---

## Rule 4: Astro Islands — Minimize Client JS

- Default to `.astro` components (zero JS shipped).
- Use `client:visible` for interactive components that are below the fold (e.g., `Counter.tsx`).
- Use `client:load` ONLY when the component MUST be interactive immediately on page load.
- NEVER use `client:only` unless the component cannot render ANY markup on the server.
- GSAP script should ONLY be loaded inside `Hero.astro`, not globally.

---

## Rule 5: View Transitions Compatibility

All client-side initialization MUST use the `astro:page-load` event, NOT `DOMContentLoaded`:

```javascript
// ❌ WRONG — only fires once, breaks after View Transition navigation
document.addEventListener('DOMContentLoaded', () => { ... });

// ✅ CORRECT — fires on every navigation
document.addEventListener('astro:page-load', () => { ... });
```

---

## Rule 6: Respect `prefers-reduced-motion`

Before initializing any animation (GSAP, Motion, Lenis), check:

```javascript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReducedMotion) {
  // Initialize animations
}
```

---

## Rule 7: Implementation Order

Execute phases in order. Do NOT skip ahead.

1. **Phase 1**: Scaffold (astro.config, BaseLayout, global.css)
2. **Phase 2**: Data (site-config.json, i18n routing)
3. **Phase 3**: Sections (all 8 components)
4. **Phase 4**: Animations (GSAP, Motion, Lenis, interactive components)
5. **Phase 5**: Contact form API + polish

---

## Rule 8: Image Optimization

- Images in `src/assets/` → use `<Image>` from `astro:assets` (optimized, WebP/AVIF)
- Files in `public/` → use `<img>` or `<video>` directly (no processing)
- Hero video goes in `public/videos/`
- NEVER put optimizable images in `public/` — they won't be processed

---

## Rule 9: File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Components | `PascalCase.astro` | `Hero.astro`, `Button.astro` |
| React islands | `PascalCase.tsx` | `Counter.tsx` |
| Pages | `lowercase.astro` | `index.astro` |
| API routes | `kebab-case.ts` | `send-email.ts` |
| Data files | `kebab-case.json` | `site-config.json` |

---

## Rule 10: When Unsure, Ask

If you encounter ambiguity, conflicting information, or are unsure about the correct approach:

1. **Re-read the relevant skill file.**
2. **Check the master prompt** (`.agent/master-prompt.md`).
3. If still unsure, **ask the user** rather than guessing. A question is always better than hallucinated code.
