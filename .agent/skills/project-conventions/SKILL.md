---
name: project-conventions
description: File structure, naming conventions, data architecture, and bilingual content patterns for the ChapMagic magician landing page.
---

# ChapMagic Project Conventions

> **This document defines the rules for this project.**
> Every file you create or modify MUST follow these conventions.
> When in doubt, consult this document first.

---

## 1. Project Structure (Canonical)

```
chapmagic/
├── astro.config.mjs              # Astro config
├── tsconfig.json                 # TypeScript strict
├── package.json
├── public/
│   ├── fonts/                    # Self-hosted fonts (optional)
│   ├── videos/                   # Hero background video
│   ├── favicon.svg               # Favicon
│   └── robots.txt
├── src/
│   ├── content.config.ts         # ⚠️ AT SRC ROOT, not src/content/
│   ├── assets/                   # Optimized images (use astro:assets)
│   │   ├── shows/                # Show type images
│   │   ├── jury/                 # Jury headshots
│   │   └── hero/                 # Hero imagery
│   ├── components/
│   │   ├── ui/                   # Small, reusable UI atoms
│   │   │   ├── Button.astro
│   │   │   ├── Reveal.astro      # Motion inView wrapper
│   │   │   ├── SectionHeading.astro
│   │   │   ├── GoldStar.astro
│   │   │   └── Counter.tsx       # React island (client:visible)
│   │   ├── sections/             # Full page sections
│   │   │   ├── Hero.astro
│   │   │   ├── Shows.astro
│   │   │   ├── JuryFeedback.astro
│   │   │   ├── Stats.astro
│   │   │   ├── Tickets.astro
│   │   │   ├── Contact.astro
│   │   │   └── Footer.astro
│   │   ├── i18n/
│   │   │   └── LanguageToggle.astro
│   │   ├── WhatsAppButton.astro  # Floating FAB
│   │   └── SmoothScroll.astro    # Lenis initialization
│   ├── data/
│   │   └── site-config.json      # Master config (see §3)
│   ├── layouts/
│   │   └── BaseLayout.astro      # HTML shell, <head>, ClientRouter
│   ├── pages/
│   │   ├── index.astro           # Redirect → /es/
│   │   ├── [lang]/
│   │   │   └── index.astro       # Main landing page
│   │   └── api/
│   │       └── send-email.ts     # POST /api/send-email
│   └── styles/
│       └── global.css            # Tailwind 4 entry + @theme
└── .agent/
    ├── skills/                   # THIS directory
    └── workflows/
```

### Path Rules

| Rule | Correct | Wrong |
|------|---------|-------|
| Content config | `src/content.config.ts` | `src/content/config.ts` |
| API routes | `src/pages/api/send-email.ts` | `src/api/send-email.ts` |
| Optimizable images | `src/assets/` | `public/images/` |
| Static files (no processing) | `public/` | `src/assets/` |
| Global CSS | `src/styles/global.css` | `src/styles/index.css` |

---

## 2. Naming Conventions

### Files

| Type | Convention | Example |
|------|-----------|---------|
| Astro components | `PascalCase.astro` | `HeroSection.astro`, `Button.astro` |
| React islands | `PascalCase.tsx` | `Counter.tsx` |
| Layouts | `PascalCase.astro` | `BaseLayout.astro` |
| Pages | `lowercase.astro` or `[param].astro` | `index.astro`, `[lang]/index.astro` |
| API routes | `kebab-case.ts` | `send-email.ts` |
| Style files | `kebab-case.css` | `global.css` |
| Data files | `kebab-case.json` | `site-config.json` |

### CSS Classes

Use lowercase kebab-case for custom classes:

```html
<div class="hero-title">       ✅
<div class="HeroTitle">         ❌
<div class="hero_title">        ❌
```

### Component Props

Use TypeScript interfaces with PascalCase interface names and camelCase prop names:

```typescript
interface Props {
  showTitle: string;
  isActive?: boolean;
  onBookClick?: () => void;
}
```

---

## 3. Data Architecture: `site-config.json`

This is the **single source of truth** for all text, colors, links, and contact info.
The user should NEVER need to edit component code to change content.

### Required Structure

```json
{
  "branding": {
    "siteName": "ChapMagic",
    "logo": "/images/logo.svg",
    "colors": {
      "primary": "#0A0A0A",
      "secondary": "#1A1A1A",
      "accent": "#D4AF37",
      "text": "#F5F0E8",
      "textMuted": "#D9D0C0"
    },
    "fonts": {
      "heading": "Playfair Display",
      "body": "Inter"
    }
  },
  "contact": {
    "whatsapp": "+34XXXXXXXXX",
    "email": "info@chapmagic.com",
    "formDestinationEmail": "bookings@chapmagic.com"
  },
  "links": {
    "atrapalo": "https://www.atrapalo.com/...",
    "instagram": "https://www.instagram.com/...",
    "youtube": "https://www.youtube.com/...",
    "heroVideoSrc": "/videos/golden-button.mp4"
  },
  "translations": {
    "es": {
      "meta": {
        "title": "ChapMagic — Mago y Mentalista",
        "description": "Espectáculos de magia y mentalismo..."
      },
      "nav": {
        "shows": "Espectáculos",
        "about": "Sobre Mí",
        "contact": "Contacto",
        "bookNow": "Reservar"
      },
      "hero": {
        "title": "La Magia Que Desafía Lo Imposible",
        "subtitle": "Mentalismo · Ilusionismo · Experiencias Únicas",
        "cta": "Reservar Ahora"
      },
      "shows": {
        "sectionTitle": "Espectáculos",
        "items": [
          {
            "id": "corporate",
            "title": "Corporativo",
            "description": "Eventos empresariales inolvidables..."
          },
          {
            "id": "private",
            "title": "Privado",
            "description": "Celebraciones exclusivas..."
          },
          {
            "id": "mentalism",
            "title": "Mentalismo",
            "description": "Lee la mente de tu audiencia..."
          },
          {
            "id": "virtual",
            "title": "Virtual",
            "description": "Magia online interactiva..."
          }
        ]
      },
      "jury": {
        "sectionTitle": "Lo Que Dicen Los Jueces",
        "quotes": [
          {
            "text": "Increíble...",
            "author": "Judge Name",
            "role": "AGT Judge"
          }
        ]
      },
      "stats": {
        "sectionTitle": "Los Números",
        "items": [
          { "value": 14, "label": "Países", "prefix": "+" },
          { "value": 700, "label": "Shows", "prefix": "+" },
          { "value": 40000, "label": "Espectadores", "prefix": "+" },
          { "value": 15, "label": "Años de Experiencia", "prefix": "+" }
        ]
      },
      "tickets": {
        "sectionTitle": "Entradas",
        "cta": "Comprar Entradas",
        "subtitle": "Próximos espectáculos disponibles"
      },
      "contact": {
        "sectionTitle": "Contacto",
        "nameLabel": "Nombre",
        "namePlaceholder": "Tu nombre",
        "emailLabel": "Email",
        "emailPlaceholder": "tu@email.com",
        "messageLabel": "Mensaje",
        "messagePlaceholder": "Cuéntanos sobre tu evento...",
        "submitButton": "Enviar Mensaje",
        "submitting": "Enviando...",
        "successMessage": "¡Mensaje enviado! Te responderemos pronto.",
        "errorMessage": "Error al enviar. Inténtalo de nuevo."
      },
      "whatsapp": {
        "prefillMessage": "Hola, me interesa contratar un espectáculo de magia."
      },
      "footer": {
        "copyright": "© 2026 ChapMagic. Todos los derechos reservados.",
        "privacyPolicy": "Política de Privacidad",
        "termsOfService": "Términos de Servicio"
      }
    },
    "en": {
      "meta": {
        "title": "ChapMagic — Magician & Mentalist",
        "description": "Magic and mentalism shows..."
      },
      "nav": {
        "shows": "Shows",
        "about": "About",
        "contact": "Contact",
        "bookNow": "Book Now"
      },
      "hero": {
        "title": "Magic That Defies The Impossible",
        "subtitle": "Mentalism · Illusion · Unique Experiences",
        "cta": "Book Now"
      },
      "shows": {
        "sectionTitle": "Shows",
        "items": [
          {
            "id": "corporate",
            "title": "Corporate",
            "description": "Unforgettable corporate events..."
          },
          {
            "id": "private",
            "title": "Private",
            "description": "Exclusive celebrations..."
          },
          {
            "id": "mentalism",
            "title": "Mentalism",
            "description": "Read your audience's mind..."
          },
          {
            "id": "virtual",
            "title": "Virtual",
            "description": "Interactive online magic..."
          }
        ]
      },
      "jury": {
        "sectionTitle": "What The Judges Say",
        "quotes": [
          {
            "text": "Incredible...",
            "author": "Judge Name",
            "role": "AGT Judge"
          }
        ]
      },
      "stats": {
        "sectionTitle": "The Numbers",
        "items": [
          { "value": 14, "label": "Countries", "prefix": "+" },
          { "value": 700, "label": "Shows", "prefix": "+" },
          { "value": 40000, "label": "Spectators", "prefix": "+" },
          { "value": 15, "label": "Years of Experience", "prefix": "+" }
        ]
      },
      "tickets": {
        "sectionTitle": "Tickets",
        "cta": "Buy Tickets",
        "subtitle": "Upcoming shows available"
      },
      "contact": {
        "sectionTitle": "Contact",
        "nameLabel": "Name",
        "namePlaceholder": "Your name",
        "emailLabel": "Email",
        "emailPlaceholder": "you@email.com",
        "messageLabel": "Message",
        "messagePlaceholder": "Tell us about your event...",
        "submitButton": "Send Message",
        "submitting": "Sending...",
        "successMessage": "Message sent! We'll get back to you soon.",
        "errorMessage": "Failed to send. Please try again."
      },
      "whatsapp": {
        "prefillMessage": "Hello, I'm interested in booking a magic show."
      },
      "footer": {
        "copyright": "© 2026 ChapMagic. All rights reserved.",
        "privacyPolicy": "Privacy Policy",
        "termsOfService": "Terms of Service"
      }
    }
  }
}
```

### How to Use in Components

```astro
---
// Every section receives the translation object as a prop
interface Props {
  t: typeof import('../data/site-config.json').translations.es;
  config: typeof import('../data/site-config.json');
}
const { t, config } = Astro.props;
---
<section>
  <h2>{t.shows.sectionTitle}</h2>
  {t.shows.items.map((show) => (
    <div>
      <h3>{show.title}</h3>
      <p>{show.description}</p>
    </div>
  ))}
</section>
```

---

## 4. Component Prop Passing Pattern

The main page (`[lang]/index.astro`) loads the config and passes relevant slices to each section:

```astro
---
// src/pages/[lang]/index.astro
import siteConfig from '../../data/site-config.json';
import BaseLayout from '../../layouts/BaseLayout.astro';
import Hero from '../../components/sections/Hero.astro';
import Shows from '../../components/sections/Shows.astro';
// ... other sections

export function getStaticPaths() {
  return [
    { params: { lang: 'es' } },
    { params: { lang: 'en' } },
  ];
}

const { lang } = Astro.params;
const t = siteConfig.translations[lang as 'es' | 'en'];
---
<BaseLayout lang={lang} title={t.meta.title} description={t.meta.description}>
  <Hero t={t.hero} videoSrc={siteConfig.links.heroVideoSrc} />
  <Shows t={t.shows} />
  <!-- ... more sections -->
</BaseLayout>
```

---

## 5. Accessibility Requirements

### Mandatory

1. **All images** MUST have descriptive `alt` text.
2. **All interactive elements** MUST be keyboard-accessible (Tab, Enter, Escape).
3. **Color contrast** MUST meet WCAG AA (4.5:1 for text, 3:1 for large text).
   - Gold (#D4AF37) on Obsidian (#0A0A0A) = 8.2:1 ✅
   - Ivory (#F5F0E8) on Obsidian (#0A0A0A) = 16.4:1 ✅
4. **Form inputs** MUST have associated `<label>` elements.
5. **Language attribute** MUST be set on `<html lang="es">` or `<html lang="en">`.
6. **Skip navigation** link should be provided.
7. **Reduced motion** preference MUST be respected.

### Pattern for Reduced Motion

```astro
<script>
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (!prefersReducedMotion) {
    // Initialize animations only if user allows motion
    initRevealAnimations();
    initSmoothScroll();
  }
</script>
```

---

## 6. Performance Checklist

Before considering any section complete, verify:

- [ ] No unused CSS/JS is shipped
- [ ] Images use `<Image>` from `astro:assets` (not `<img>` with string src)
- [ ] Videos use `preload="metadata"` (not `preload="auto"`)
- [ ] Fonts use `display=swap` and are preconnected
- [ ] No `client:load` is used where `client:visible` would suffice
- [ ] All sections have `loading="lazy"` for below-fold images
- [ ] GSAP is only loaded in the Hero section script, not globally

---

## 7. Git Commit Convention

```
feat(hero): add GSAP timeline with video sync
fix(contact): correct email validation regex
style(global): add gold gradient button styles
chore(config): update site-config.json translations
docs(skills): update animation guide with inView signature
```

Format: `type(scope): description`

Types: `feat`, `fix`, `style`, `chore`, `docs`, `refactor`, `perf`, `test`
