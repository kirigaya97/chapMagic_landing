import type { MiddlewareHandler } from 'astro';

/**
 * Additions to Keystatic's admin UI, which has no option for any of them:
 * - dark theme tinted with the site's accent (Keystatic's indigo scale, re-derived with color-mix)
 * - floating "back to site" button
 * - git branch picker/actions and the dashboard "Current branch" card hidden: editors always work on main
 * - the guide singleton reads as a page, not an editor: no toolbar, no save/actions, not editable
 * - `X-Astro-Reroute: no`, so i18n with `prefixDefaultLocale` does not 404 /keystatic
 *
 * Depends on Keystatic internals (aria-labels, .kui-* classes, data-keystatic-editor): an upgrade may
 * undo a tweak, but the panel keeps working.
 */
export interface PanelOptions {
  /** Brand colour as #rrggbb. Buttons, highlights and the whole dark scale derive from it. */
  accent: string;
  /** Floating button. Default: '← Ver sitio' to '/'. `false` hides it. */
  back?: { label?: string; href?: string } | false;
  /** Key of the read-only guide singleton (see `guia()` in fields.ts). `false` if there is none. */
  guide?: string | false;
}

// Mix of the accent into the dark base for steps 1-9 of Keystatic's 12-step scale, then into white.
const DARK = [4, 8, 14, 22, 32, 45, 62, 80, 100];
const LIGHT = [25, 55];

/** Black or white, whichever reads better on the accent (WCAG relative luminance). */
function textOn(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.18 ? '#0b0a08' : '#ffffff';
}

export function panelHtml({ accent, back = {}, guide = 'guia' }: PanelOptions): string {
  if (!/^#[0-9a-f]{6}$/i.test(accent)) throw new Error(`keystaticPanel: accent must be #rrggbb, got "${accent}"`);
  const scale = [
    ...DARK.map((p, i) => `--kui-color-scale-indigo${i + 1}: color-mix(in oklab, ${accent} ${p}%, #121212);`),
    ...LIGHT.map((p, i) => `--kui-color-scale-indigo${i + 10}: color-mix(in oklab, ${accent}, #ffffff ${p}%);`),
  ].join('\n    ');

  const g = '.ks-guide';
  const guideCss = guide
    ? `
  ${g} button[form="singleton-form"], ${g} header button:not([aria-label="Open app navigation"]),
  ${g} [data-keystatic-editor="root"] > div:not(:has(.ProseMirror)), ${g} div:has(> [data-keystatic-editor="root"]) > span { display: none !important; }
  ${g} [data-keystatic-editor="root"] { border: 0 !important; background: none !important; box-shadow: none !important; }
  ${g} .ProseMirror { max-width: 48rem; padding: 0 0 96px !important; font-size: 16px; line-height: 1.7; caret-color: transparent; }
  ${g} .ProseMirror h2 { margin-top: 2.2em; padding-bottom: .4em; border-bottom: 1px solid var(--kui-color-scale-indigo5); }
  ${g} .ProseMirror h3 { margin-top: 1.6em; color: var(--kui-color-scale-indigo11); }
  ${g} .ProseMirror blockquote { border-left: 3px solid var(--kui-color-scale-indigo9); background: var(--kui-color-scale-indigo3); padding: 10px 16px; border-radius: 0 8px 8px 0; }
  ${g} .ProseMirror code { background: var(--kui-color-scale-indigo3); padding: 1px 6px; border-radius: 4px; }`
    : '';
  const guideJs = guide
    ? `
    const guide = location.pathname.endsWith('/singleton/${guide}');
    document.documentElement.classList.toggle('ks-guide', guide);
    if (guide) document.querySelectorAll('.ProseMirror[contenteditable="true"]').forEach((el) => (el.contentEditable = 'false'));`
    : '';
  const button = back
    ? `<a href="${back.href ?? '/'}" style="position:fixed;right:20px;bottom:20px;z-index:2147483647;padding:10px 18px;background:${accent};color:${textOn(accent)};border-radius:999px;font:700 14px system-ui,sans-serif;text-decoration:none;box-shadow:0 6px 20px rgba(0,0,0,.4)">${back.label ?? '&larr; Ver sitio'}</a>`
    : '';

  return `
<style>
  div:has(> button[aria-label="git actions"]), button[aria-label="theme"] { display: none !important; }
  .kui-theme.kui-theme.kui-theme {
    color-scheme: dark;
    ${scale}
  }${guideCss}
</style>
${button}
<script>
  new MutationObserver(() => {${guideJs}
    document.querySelectorAll('.kui-scheme--auto, .kui-scheme--light').forEach((el) => el.classList.replace(el.classList.contains('kui-scheme--auto') ? 'kui-scheme--auto' : 'kui-scheme--light', 'kui-scheme--dark'));
    document.querySelectorAll('section h2').forEach((h) => {
      if (/^current branch$/i.test(h.textContent.trim())) h.closest('section').style.display = 'none';
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
</script>`;
}

/** Astro middleware. Alone: `export const onRequest = keystaticPanel({...})`; with others: `sequence(...)`. */
export function keystaticPanel(options: PanelOptions): MiddlewareHandler {
  const extra = panelHtml(options);
  return async (ctx, next) => {
    const res = await next();
    if (!ctx.url.pathname.startsWith('/keystatic') || !res.headers.get('content-type')?.includes('text/html')) return res;
    const html = (await res.text()) + extra; // Keystatic's page has no </body>; appending is valid HTML
    const headers = new Headers(res.headers);
    headers.delete('content-length');
    headers.set('X-Astro-Reroute', 'no');
    return new Response(html, { status: res.status, headers });
  };
}
