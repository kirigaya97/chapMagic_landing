---
name: animation-guide
description: GSAP and Motion animation patterns for Astro — correct API usage verified against gsap.com and motion.dev official docs.
---

# Animation Guide for ChapMagic

> **CRITICAL**: This guide defines the EXACT animation APIs to use. Do NOT hallucinate function signatures.
> The library formerly known as "Motion One" is now just **"Motion"** (package name: `motion`).
> GSAP is at version 3.x (package name: `gsap`).

---

## 1. Animation Strategy Overview

| Library | Bundle Size | Where Used | Why |
|---------|-------------|------------|-----|
| **GSAP** | ~25kb | Hero entry sequence ONLY | Complex timeline with video sync, precise sequencing |
| **Motion** | ~2.3kb (mini) or ~18kb (hybrid) | All scroll reveals + counter animations | Lightweight, native-feeling, `inView` built on Intersection Observer |
| **Lenis** | ~4kb | Global smooth scroll | Buttery smooth scroll that works with both libraries |

### Import Rules

```javascript
// GSAP — default import
import gsap from "gsap";

// Motion — named imports from "motion" (NOT "motion-one", NOT "@motionone/dom")
import { animate, inView, stagger } from "motion";
// OR for smaller bundle (limited features):
import { animate } from "motion/mini";

// Lenis
import Lenis from "lenis";
```

---

## 2. Motion: `animate()` Function

**Docs**: [motion.dev/docs/animate](https://motion.dev/docs/animate)

### Signature

```typescript
animate(
  elements: string | Element | Element[],  // CSS selector or DOM element(s)
  keyframes: Record<string, any>,           // Properties to animate
  options?: AnimationOptions                 // Duration, easing, delay, etc.
): AnimationControls
```

### Basic Usage

```javascript
// Animate by CSS selector
animate(".box", { opacity: 1, y: 0 }, { duration: 0.8 });

// Animate specific element
const el = document.querySelector(".hero-title");
animate(el, { opacity: 1, scale: 1 }, { duration: 1.2, ease: "ease-out" });
```

### Key Options

```javascript
animate(element, keyframes, {
  duration: 0.8,                          // seconds (default: 0.3)
  delay: 0.2,                            // seconds
  ease: [0.17, 0.55, 0.55, 1],         // cubic-bezier array
  // OR ease: "ease-in-out"             // named easing
  // OR ease: "spring(1, 80, 10, 0)"    // spring physics
  repeat: Infinity,                       // number of repeats
  repeatType: "reverse",                  // "loop" | "reverse" | "mirror"
});
```

### Stagger Animations

```javascript
import { animate, stagger } from "motion";

animate(".card", 
  { opacity: 1, y: 0 }, 
  { delay: stagger(0.1) }  // Each card delays 0.1s after the previous
);
```

### Animation Controls

```javascript
const controls = animate(".box", { x: 100 }, { duration: 2 });

// Playback control
controls.pause();
controls.play();
controls.cancel();
controls.stop();
controls.complete();

// Timing
controls.time = 0.5;      // Seek to 0.5s
controls.speed = 2;        // 2x speed
controls.duration;          // Read total duration

// Promise-based completion
await controls;
// OR
controls.then(() => console.log("done"));
```

---

## 3. Motion: `inView()` Function

**Docs**: [motion.dev/docs/inview](https://motion.dev/docs/inview)

### ⚠️ CRITICAL: Correct Callback Signature

The base prompt had the WRONG signature. The correct one is:

```typescript
// ❌ WRONG (from the base prompt)
inView(".reveal", ({ target }) => { ... });

// ✅ CORRECT
inView(".reveal", (element, info) => { ... });
//                  ^^^^^^^  ^^^^
//                  DOM el   IntersectionObserverEntry
```

### Signature

```typescript
inView(
  elements: string | Element | Element[],
  callback: (element: Element, info: IntersectionObserverEntry) => void | (() => void),
  options?: InViewOptions
): () => void   // Returns a stop function
```

### Basic Usage — Reveal on Scroll

```javascript
import { inView, animate } from "motion";

// Fire once when element enters viewport
inView(".reveal", (element) => {
  animate(element, { opacity: 1, y: 0 }, { duration: 0.8, ease: [0.17, 0.55, 0.55, 1] });
});
```

### Leaving the Viewport

Return a cleanup function from the callback to handle leave events:

```javascript
inView(".reveal", (element) => {
  const animation = animate(element, { opacity: 1 });
  
  // This runs when element LEAVES the viewport
  return (leaveInfo) => {
    animation.stop();
  };
});
```

### Options

```javascript
inView(".reveal", callback, {
  root: document.querySelector("#scroll-container"),  // Custom scroll root
  margin: "0px 0px -100px 0px",                       // Like rootMargin in Intersection Observer
  amount: 0.3,                                        // 0-1, fraction of element visible to trigger
  // amount: "some" === amount: 0 (any pixel visible)
  // amount: "all" === amount: 1 (fully visible)
});
```

### Stop Detection

```javascript
const stopObserving = inView(".reveal", callback);

// Later, stop watching
stopObserving();
```

---

## 4. Motion: Counter Animation Pattern

For the Stats section, animate numbers counting up:

```typescript
// src/components/ui/Counter.tsx (React island, hydrated with client:visible)
import { useEffect, useRef, useState } from 'react';
import { inView, animate } from 'motion';

interface Props {
  target: number;
  prefix?: string;  // e.g., "+"
  suffix?: string;  // e.g., "K"
  label: string;
  duration?: number;
}

export default function Counter({ target, prefix = '+', suffix = '', label, duration = 2 }: Props) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!ref.current || hasAnimated.current) return;
    
    const stop = inView(ref.current, () => {
      if (hasAnimated.current) return;
      hasAnimated.current = true;
      
      animate(0, target, {
        duration,
        ease: [0.17, 0.55, 0.55, 1],
        onUpdate: (latest) => setCount(Math.round(latest)),
      });
    });

    return () => stop();
  }, [target, duration]);

  return (
    <div ref={ref} className="stat-counter">
      <span className="stat-number">{prefix}{count.toLocaleString()}{suffix}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
```

> **IMPORTANT**: This component MUST be used with `client:visible` in Astro:
> ```astro
> <Counter client:visible target={700} label="Shows" />
> ```

---

## 5. GSAP: Timeline for Hero Section

**Docs**: [gsap.com/docs/v3/GSAP/gsap.timeline()](https://gsap.com/docs/v3/GSAP/gsap.timeline())

### Core Concepts

```javascript
import gsap from "gsap";

// Create a timeline (paused by default so we control when it plays)
const tl = gsap.timeline({ paused: true });

// Chain animations — each plays AFTER the previous by default
tl.from(".hero-title", { opacity: 0, y: 60, duration: 1.2, ease: "power3.out" })
  .from(".hero-subtitle", { opacity: 0, y: 40, duration: 0.8 }, "-=0.6")  // overlap by 0.6s
  .from(".hero-cta", { opacity: 0, scale: 0.8, duration: 0.6 }, "-=0.4"); // overlap by 0.4s

// Play it
tl.play();

// Or control it
tl.pause();
tl.reverse();
tl.seek(1.5);   // jump to 1.5 seconds
tl.restart();
```

### Position Parameter (the `"-=0.6"` part)

This is how you control timing between animations in a timeline:

| Value | Meaning |
|-------|---------|
| `1` | At exactly 1 second from timeline start |
| `"+=1"` | 1 second AFTER end of timeline |
| `"-=0.5"` | 0.5 seconds BEFORE end of timeline (overlap) |
| `"<"` | At the START of the previous animation |
| `">"` | At the END of the previous animation |
| `"<0.5"` | 0.5s after the START of the previous animation |

### Hero Video Sync Pattern

```javascript
// src/components/sections/Hero.astro — inside a <script> tag

import gsap from "gsap";

document.addEventListener('astro:page-load', () => {
  const video = document.querySelector<HTMLVideoElement>('.hero-video');
  const tl = gsap.timeline({ paused: true });

  // Define the hero entrance animation
  tl.from('.hero-title',    { opacity: 0, y: 80, scale: 0.9, duration: 1.4, ease: 'power3.out' })
    .from('.hero-subtitle', { opacity: 0, y: 40, duration: 0.9 }, '-=0.7')
    .from('.hero-cta',      { opacity: 0, y: 30, scale: 0.85, duration: 0.7 }, '-=0.4');

  // Sync with video — trigger animation at the "golden button press" moment
  if (video) {
    let triggered = false;
    video.addEventListener('timeupdate', () => {
      // Adjust this timestamp to match the exact golden button moment
      if (!triggered && video.currentTime >= 3.5) {
        triggered = true;
        tl.play();
      }
    });
    
    // Fallback: if video doesn't load, play animation after 2s
    setTimeout(() => {
      if (!triggered) {
        triggered = true;
        tl.play();
      }
    }, 2000);
  } else {
    // No video — play immediately
    tl.play();
  }
});
```

### GSAP Key Methods Reference

```javascript
// Create tweens
gsap.to(target, { ...vars });        // Animate TO these values
gsap.from(target, { ...vars });      // Animate FROM these values (starts at vars, ends at current)
gsap.fromTo(target, fromVars, toVars); // Animate FROM → TO
gsap.set(target, { ...vars });       // Immediately set values (no animation)

// Common vars
{
  x: 100,          // translateX (px)
  y: -50,          // translateY (px)
  rotation: 360,   // degrees
  scale: 1.2,
  opacity: 0,
  duration: 1,     // seconds
  delay: 0.5,
  ease: "power2.out",  // "power1-4.in/out/inOut", "back.out", "elastic.out", "bounce.out"
  stagger: 0.1,    // For multiple elements
  onComplete: () => {},
  onUpdate: () => {},
}
```

---

## 6. Lenis: Smooth Scroll Setup

```astro
<!-- src/components/SmoothScroll.astro -->
<script>
  import Lenis from 'lenis';
  import 'lenis/dist/lenis.css';

  let lenis: Lenis | null = null;

  function initLenis() {
    // Destroy previous instance if it exists (important for View Transitions)
    lenis?.destroy();
    
    lenis = new Lenis({
      lerp: 0.1,            // Smoothness (0-1, lower = smoother)
      smoothWheel: true,
      orientation: 'vertical',
    });

    function raf(time: number) {
      lenis?.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
  }

  // Initialize on every page load (including View Transitions)
  document.addEventListener('astro:page-load', () => {
    initLenis();
  });
</script>
```

> **IMPORTANT**: The `astro:page-load` event is essential. Without it, Lenis will NOT reinitialize after View Transition navigations.

---

## 7. Astro `<script>` Tag Behavior

### Key Rules

1. `<script>` tags in `.astro` files are **bundled and deduplicated** by Astro.
2. They run in the browser, NOT on the server.
3. They are **module scripts** by default (`type="module"`).
4. With `<ClientRouter />`, scripts are NOT re-run on navigation. Use `astro:page-load`.

```astro
<!-- This script is bundled, tree-shaken, and runs in the browser -->
<script>
  import { animate } from "motion";
  // This code runs once on initial page load
  animate(".box", { opacity: 1 });
</script>

<!-- Inline script that runs as-is (no bundling) -->
<script is:inline>
  console.log("I run exactly as written, no import support");
</script>
```

### Handling View Transitions

```astro
<script>
  // Run on EVERY navigation, not just initial load
  document.addEventListener('astro:page-load', () => {
    // Your initialization code here
  });
  
  // Run ONCE, before swap (good for cleanup)
  document.addEventListener('astro:before-swap', () => {
    // Cleanup code here
  });
</script>
```
