# 🪄 ChapMagic — Mentalismo & Magia

A premium, high-performance landing page for ChapMagic, featuring state-of-the-art web animations and a bilingual experience. Built with **Astro v5**, **Tailwind CSS 4**, and **GSAP**.

![Astro v5](https://img.shields.io/badge/Astro-v5.0-BC52EE?style=flat-square&logo=astro)
![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38BDF8?style=flat-square&logo=tailwind-css)
![GSAP](https://img.shields.io/badge/GSAP-v3.14-88CE02?style=flat-square&logo=greensock)
![TypeScript](https://img.shields.io/badge/TypeScript-v5.0-3178C6?style=flat-square&logo=typescript)

---

## ✨ Features

- **🎭 Cinematic Animations**: Custom GSAP timelines for the Hero section, scroll-based parallax effects, and staggered reveals.
- **📱 Hybrid Mobile UX**: Smart "auto-reveal" Show cards on mobile (using ScrollTrigger) while maintaining interactive hovers for desktop.
- **📩 Production-Ready Contact Form**:
    - Built with **Resend** for reliable email delivery.
    - **Anti-Spam Protection**: Invisible honeypot + timestamp-based bot detection.
    - **SSR Hybrid mode**: Server-side API endpoint powered by `@astrojs/vercel`.
- **🤏 Custom Golden Cursor**: A bespoke GSAP-powered "magnetic" cursor that expands on interaction (desktop only).
- **🌐 Bilingual (i18n)**: Fully localized in Spanish (ES) and English (EN) using Astro's native i18n routing.
- **🕊️ Smooth Navigation**: Integrated **Lenis** smooth scrolling and a premium "Liquid" mobile menu.

---

## 🏗️ Project Structure

```bash
chapmagic/
├── public/                 # Static assets (favicon, videos, etc.)
│   ├── favicon.svg         # Premium gold star icon
│   └── videos/             # High-quality hero background
├── src/
│   ├── components/
│   │   ├── sections/       # Primary page segments (Hero, Shows, Jury, etc.)
│   │   ├── ui/             # Reusable atomic UI components (Button, GoldenBorder)
│   │   └── Navbar.astro    # Core navigation with language switching
│   ├── data/
│   │   └── site-config.json # The "Brain": Site-wide translations & settings
│   ├── layouts/
│   │   └── BaseLayout.astro # Global wrapper (Fonts, GSAP init, reveals)
│   ├── pages/
│   │   ├── api/            # Server-side endpoints
│   │   │   └── send-email.ts # Resend integration + Anti-spam logic
│   │   ├── [lang]/         # i18n dynamic routes
│   │   └── index.astro      # Main entry point
│   └── styles/
│       └── global.css      # Tailwind 4 foundation & themed tokens
└── package.json            # Dependencies & Scripts
```

---

## 🛠️ Tech Stack

- **Framework**: [Astro v5](https://astro.build/) (Static Site Generation + Server-Side API)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) (New Vite-based engine)
- **Animation**: [GSAP](https://greensock.com/gsap/) (ScrollTrigger, Timeline) & [Motion](https://motion.dev/)
- **Interactivity**: [React 19](https://react.dev/) (specifically for the dynamic Stats counter)
- **Email**: [Resend](https://resend.com/)
- **Deployment**: Configured for [Vercel](https://vercel.com/) (using `@astrojs/vercel`)

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
RESEND_API_KEY=re_your_api_key_here
```

### 3. Development
```bash
npm run dev
```

---

## 🔒 Contact Form Security

The contact form implements a **dual-layer invisible protection** system:

1.  **Honeypot**: An invisible input that only bots fill. If detects input, the API endpoint silently discards the payload without an error.
2.  **Timestamp Guard**: Measures the time between page load and submission. Fast submissions (< 2s) are flagged as automated and ignored.

---

## 🎨 Design System

All core design tokens are defined in `src/styles/global.css` using the new Tailwind 4 `@theme` block:

- **Gold**: `--color-gold: #D4AF37`
- **Obsidian**: `--color-obsidian: #0A0A0A`
- **Ivory**: `--color-ivory: #F5F0E8`

---

Built with ❤️ for **ChapMagic** in Argentina.
