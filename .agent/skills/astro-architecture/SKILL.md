---
name: astro-architecture
description: Astro v5 Islands Architecture, Content Collections, View Transitions, i18n routing, and API routes — verified against official docs.
---

# Astro v5 Architecture Guide for ChapMagic

> **CRITICAL**: This guide is the single source of truth for Astro patterns in this project.
> Do NOT use patterns from older Astro tutorials (pre-v5). If you are unsure, follow this document exactly.

---

## 1. Astro Islands Architecture

Astro renders HTML on the server by default. JavaScript is ONLY sent to the browser when you explicitly opt-in using `client:*` directives.

### Rules

1. **ALL layout and section components** MUST be `.astro` files (zero JS shipped).
2. **ONLY interactive components** (React/Preact/Svelte) get `client:*` directives.
3. Use `client:visible` for components that should hydrate when scrolled into view (e.g., `Counter.tsx`).
4. Use `client:load` ONLY for components that MUST be interactive immediately on page load (e.g., a form component).
5. **NEVER** use `client:only` unless the component has no server-renderable markup.

### Example — Static Section (zero JS)

```astro
---
// src/components/sections/Shows.astro
// This is server-rendered. No JS shipped.
const { shows } = Astro.props;
---
<section class="shows-grid">
  {shows.map((show) => (
    <div class="show-card">
      <h3>{show.title}</h3>
      <p>{show.description}</p>
    </div>
  ))}
</section>
```

### Example — Interactive Island (JS shipped only for this component)

```astro
---
// Inside the parent page or section
import Counter from '../ui/Counter.tsx';
---
<!-- Counter.tsx will ONLY hydrate when scrolled into view -->
<Counter client:visible target={700} label="Shows" />
```

---

## 2. Content Collections (Content Layer API — Astro v5)

### CRITICAL DIFFERENCES FROM OLDER TUTORIALS

| Old (Astro v2-v4) | New (Astro v5+) |
|---|---|
| Config at `src/content/config.ts` | Config at `src/content.config.ts` (project root of `src/`) |
| No `loader` required | `loader` is **REQUIRED** (e.g., `glob()`, `file()`) |
| `import { z } from 'zod'` | `import { z } from 'astro/zod'` |
| `import { defineCollection } from 'astro:content'` | Same — `import { defineCollection } from 'astro:content'` |
| Loaders not available | `import { glob, file } from 'astro/loaders'` |

### Correct Content Config for This Project

The project uses a single JSON data file for translations. Use the `file()` loader:

```typescript
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

const siteConfig = defineCollection({
  loader: file("src/data/site-config.json"),
  schema: z.object({
    // Define your schema here matching site-config.json structure
    id: z.string(),
    // ... other fields
  }),
});

export const collections = { siteConfig };
```

### Querying Collections

```typescript
import { getCollection, getEntry } from 'astro:content';

// Get all entries
const allEntries = await getCollection('siteConfig');

// Get single entry by id
const entry = await getEntry('siteConfig', 'main');
```

> **NOTE**: For this project, since we're using a single `site-config.json` as a simple import (not really a collection of many entries), you may alternatively just `import siteConfig from '../data/site-config.json'` directly. Content Collections are better suited for multiple entries (blog posts, products, etc.). Evaluate which approach makes more sense for your data shape.

---

## 3. View Transitions (Astro v5)

### CRITICAL: The component is called `<ClientRouter />`, NOT `<ViewTransitions />`

```astro
---
// src/layouts/BaseLayout.astro
import { ClientRouter } from 'astro:transitions';
---
<html lang={lang}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <ClientRouter />
    <!-- other head content -->
  </head>
  <body>
    <slot />
  </body>
</html>
```

### Script Re-initialization After Navigation

When using `<ClientRouter />`, scripts do NOT automatically re-run on navigation. You MUST handle this:

```astro
<script>
  // This event fires on EVERY page navigation (including initial load)
  document.addEventListener('astro:page-load', () => {
    // Re-initialize Lenis, animation observers, etc.
    initLenis();
    initRevealAnimations();
  });
</script>
```

### Transition Directives

```astro
<!-- Name a transition for cross-page element matching -->
<div transition:name="hero">...</div>

<!-- Use built-in animation -->
<div transition:animate="fade">...</div>
<div transition:animate="slide">...</div>

<!-- Persist an element across navigations (e.g., audio player, nav) -->
<nav transition:persist>...</nav>
```

---

## 4. Internationalization (i18n) Routing

### URL Structure

```
/          → redirects to /es/ (default)
/es/       → Spanish landing page
/en/       → English landing page
```

### File Structure

```
src/pages/
├── index.astro           # Meta-redirect to /es/
└── [lang]/
    └── index.astro       # Dynamic route — lang = "es" | "en"
```

### Redirect Page (`src/pages/index.astro`)

```astro
---
// src/pages/index.astro
return Astro.redirect('/es/');
---
```

### Dynamic Language Page (`src/pages/[lang]/index.astro`)

```astro
---
// src/pages/[lang]/index.astro
import BaseLayout from '../../layouts/BaseLayout.astro';
import siteConfig from '../../data/site-config.json';

export function getStaticPaths() {
  return [
    { params: { lang: 'es' } },
    { params: { lang: 'en' } },
  ];
}

const { lang } = Astro.params;
const t = siteConfig.translations[lang];
---
<BaseLayout lang={lang} title={t.meta.title} description={t.meta.description}>
  <!-- Sections here, all receiving `t` (translations) as props -->
</BaseLayout>
```

### Translation Helper Pattern

```typescript
// Access translations anywhere in a component:
// The `t` object is passed down as a prop from [lang]/index.astro

interface Props {
  t: typeof siteConfig.translations.es; // Type-safe translations
}

const { t } = Astro.props;
```

---

## 5. API Routes (Server Endpoints)

### CRITICAL: API routes MUST be under `src/pages/api/`

They will NOT work under `src/api/` — that path is not recognized by Astro.

```
src/pages/api/
└── send-email.ts     ← This creates the endpoint POST /api/send-email
```

### Correct API Route Pattern

```typescript
// src/pages/api/send-email.ts
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.json();

  // Validate input
  const { name, email, message } = formData;
  if (!name || !email || !message) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Send email via Resend or other service
    // await resend.emails.send({ ... });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to send' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Disable prerendering — this endpoint runs on the server
export const prerender = false;
```

### SSR Adapter Requirement

API routes that handle POST requests REQUIRE an SSR adapter. Add one in `astro.config.mjs`:

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
// OR: import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'static', // Default static, but API routes can opt-out
  adapter: node({ mode: 'standalone' }),
  // OR: adapter: vercel(),
});
```

> **NOTE**: With `output: 'static'`, individual pages/endpoints can opt-out of prerendering with `export const prerender = false;`. This is called "hybrid" rendering.

---

## 6. Image Optimization (`astro:assets`)

### Usage in `.astro` Components

```astro
---
import { Image } from 'astro:assets';
import heroImage from '../assets/hero.jpg';
---
<Image src={heroImage} alt="Magician performing" width={1200} height={800} />
```

### Rules

1. ALWAYS import images as modules (not string paths) for optimization.
2. Use the `<Image>` component — it automatically generates `srcset`, WebP/AVIF, and handles lazy loading.
3. For images in `public/`, use `<img>` tags directly (no optimization).
4. For background images (CSS), they are NOT optimized by Astro — consider using `<Image>` with absolute positioning instead.

---

## 7. Astro Config (`astro.config.mjs`) Template

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react'; // Needed for Counter.tsx island
// import node from '@astrojs/node'; // Uncomment for API route SSR

export default defineConfig({
  site: 'https://chapmagic.com', // Replace with actual domain
  integrations: [
    react(), // For .tsx islands
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: true, // /es/ instead of /
    },
  },
  // adapter: node({ mode: 'standalone' }), // Uncomment for API routes
});
```
