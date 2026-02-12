---
name: tailwind4-astro
description: Tailwind CSS 4.0 setup and usage within Astro v5 — verified against official Astro and Tailwind docs.
---

# Tailwind CSS 4 in Astro — Setup & Usage Guide

> **CRITICAL**: Tailwind 4 is fundamentally different from Tailwind 3.
> Do NOT use `tailwind.config.mjs`, `@apply` extensively, or `@astrojs/tailwind` integration.
> TW4 uses a Vite plugin and CSS-first configuration.

---

## 1. Installation

### Option A: CLI (Astro ≥ 5.2.0)

```bash
npx astro add tailwind
```

This automatically:
- Installs `@tailwindcss/vite` and `tailwindcss`
- Adds the Vite plugin to `astro.config.mjs`
- Creates `src/styles/global.css` with `@import "tailwindcss"`

### Option B: Manual

```bash
npm install tailwindcss @tailwindcss/vite
```

Then add to `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
});
```

---

## 2. CSS Entry File

Create `src/styles/global.css`:

```css
/* src/styles/global.css */

/* REQUIRED: This single import loads all of Tailwind */
@import "tailwindcss";

/* CUSTOM THEME: Use @theme to define design tokens */
@theme {
  /* Colors — ChapMagic Premium/Mystery palette */
  --color-obsidian: #0A0A0A;
  --color-obsidian-light: #1A1A1A;
  --color-gold: #D4AF37;
  --color-gold-light: #E8C860;
  --color-gold-dark: #B8941F;
  --color-ivory: #F5F0E8;
  --color-ivory-muted: #D9D0C0;
  --color-smoke: #2A2A2A;

  /* Fonts */
  --font-heading: 'Playfair Display', Georgia, serif;
  --font-body: 'Inter', system-ui, sans-serif;

  /* Spacing scale (custom additions) */
  --spacing-section: 120px;
  --spacing-section-mobile: 80px;

  /* Border radius */
  --radius-card: 12px;

  /* Transitions */
  --ease-smooth: cubic-bezier(0.17, 0.55, 0.55, 1);

  /* Animations */
  --animate-fade-up: fade-up 0.8s var(--ease-smooth) forwards;
}

/* Custom keyframes */
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Import in Layout

```astro
---
// src/layouts/BaseLayout.astro
import '../styles/global.css';
---
```

---

## 3. Key Differences: Tailwind 4 vs Tailwind 3

| Feature | Tailwind 3 | Tailwind 4 |
|---------|-----------|-----------|
| Config file | `tailwind.config.mjs` (JS) | `@theme { }` in CSS |
| Plugin | `@astrojs/tailwind` integration | `@tailwindcss/vite` Vite plugin |
| CSS entry | `@tailwind base; @tailwind components; @tailwind utilities;` | `@import "tailwindcss";` |
| Custom colors | `theme.extend.colors` in JS config | `--color-*` in `@theme { }` |
| Custom fonts | `theme.extend.fontFamily` in JS config | `--font-*` in `@theme { }` |
| `@apply` | Supported | Still works but discouraged; prefer utility classes |
| Dark mode | `darkMode: 'class'` in config | `@variant dark { }` or `dark:` prefix (auto-detected) |

---

## 4. Using Theme Tokens in Components

### In Tailwind Classes

Custom `@theme` tokens are automatically available as utilities:

```html
<!-- Uses --color-gold from @theme -->
<h1 class="text-gold font-heading text-6xl">Magician Name</h1>

<!-- Uses --color-obsidian from @theme -->
<section class="bg-obsidian text-ivory py-section">

<!-- Responsive -->
<section class="py-section-mobile md:py-section">
```

### In Arbitrary Values (when theme token doesn't map to a utility)

```html
<div class="bg-[var(--color-obsidian-light)]">
  <!-- For tokens not auto-mapped to a utility -->
</div>
```

### In Custom CSS

```css
/* Custom CSS using theme tokens */
.hero-gradient {
  background: linear-gradient(
    135deg,
    var(--color-obsidian) 0%,
    var(--color-smoke) 50%,
    var(--color-obsidian) 100%
  );
}
```

---

## 5. Typography Scale for the Project

Use Tailwind's built-in responsive typography utilities:

```html
<!-- Hero title: massive, responsive -->
<h1 class="text-4xl md:text-6xl lg:text-8xl font-heading font-bold text-ivory leading-tight">
  
<!-- Section heading -->
<h2 class="text-3xl md:text-5xl font-heading text-ivory">

<!-- Body text -->
<p class="text-base md:text-lg text-ivory-muted font-body leading-relaxed">

<!-- Gold accent text -->
<span class="text-gold font-heading italic">
```

---

## 6. Component Design Patterns

### Card with Hover Effect

```html
<div class="bg-obsidian-light rounded-card p-8 
            border border-smoke
            transition-all duration-300 ease-smooth
            hover:border-gold/30 hover:shadow-lg hover:shadow-gold/10
            hover:-translate-y-1">
  <h3 class="text-xl font-heading text-ivory mb-2">Show Title</h3>
  <p class="text-ivory-muted">Description here</p>
</div>
```

### Gold Gradient Button

```html
<a class="inline-block px-8 py-4 
          bg-gradient-to-r from-gold-dark via-gold to-gold-light
          text-obsidian font-body font-semibold text-lg
          rounded-full
          transition-all duration-300
          hover:shadow-lg hover:shadow-gold/30 hover:scale-105
          active:scale-95">
  Book Now
</a>
```

### Section Container

```html
<section class="bg-obsidian py-section-mobile md:py-section px-6 md:px-12 lg:px-24">
  <div class="max-w-7xl mx-auto">
    <!-- Content -->
  </div>
</section>
```

---

## 7. Responsive Breakpoints (TW4 defaults)

| Prefix | Min-width | Intended for |
|--------|----------|-------------|
| `sm:` | 640px | Small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Large screens |

### Mobile-First Pattern

```html
<!-- Mobile first: stack → row on medium screens -->
<div class="flex flex-col md:flex-row gap-6">

<!-- Font size scales up -->
<h1 class="text-3xl md:text-5xl lg:text-7xl">

<!-- Padding scales up -->
<section class="px-4 md:px-8 lg:px-16">
```

---

## 8. Dark Mode Notes

For this project, the entire site IS dark-themed (obsidian background). There is no light/dark toggle. However, if you need to respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. Google Fonts Loading

Load fonts in `BaseLayout.astro` `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&display=swap" rel="stylesheet">
```

> **TIP**: For maximum performance, self-host fonts instead. Download from Google Fonts, place in `public/fonts/`, and use `@font-face` in your CSS.
