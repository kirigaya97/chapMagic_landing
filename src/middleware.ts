import { defineMiddleware } from 'astro:middleware';

// Additions to Keystatic's UI, which has no option for them (same as emiliano-calde):
// - floating "back to site" button
// - hide the git branch picker/actions and the dashboard "Current branch" card; editors always work on main
// - dark theme with the site's gold as accent (Keystatic's indigo scale re-tinted; tripled class beats its rules)
// - the 'guia' singleton reads as a page, not an editor: no toolbar, no save/actions, not editable
// Depends on Keystatic internals (aria-labels, .kui-* classes): may break on upgrade, the panel still works.
const EXTRA = `
<style>
  div:has(> button[aria-label="git actions"]), button[aria-label="theme"] { display: none !important; }
  .kui-theme.kui-theme.kui-theme {
    color-scheme: dark;
    --kui-color-scale-indigo1: #15120c; --kui-color-scale-indigo2: #1d1810; --kui-color-scale-indigo3: #2a2214;
    --kui-color-scale-indigo4: #3a2e19; --kui-color-scale-indigo5: #4d3c1f; --kui-color-scale-indigo6: #665028;
    --kui-color-scale-indigo7: #8f6f35; --kui-color-scale-indigo8: #b08c48; --kui-color-scale-indigo9: #d4b06a;
    --kui-color-scale-indigo10: #e2c383; --kui-color-scale-indigo11: #f0d9a0;
  }
  .ks-guia button[form="singleton-form"], .ks-guia header button:not([aria-label="Open app navigation"]),
  .ks-guia [data-keystatic-editor="root"] > div:not(:has(.ProseMirror)), .ks-guia div:has(> [data-keystatic-editor="root"]) > span { display: none !important; }
  .ks-guia [data-keystatic-editor="root"] { border: 0 !important; background: none !important; box-shadow: none !important; }
  .ks-guia .ProseMirror { max-width: 48rem; padding: 0 0 96px !important; font-size: 16px; line-height: 1.7; caret-color: transparent; }
  .ks-guia .ProseMirror h2 { margin-top: 2.2em; padding-bottom: .4em; border-bottom: 1px solid var(--kui-color-scale-indigo5); }
  .ks-guia .ProseMirror h3 { margin-top: 1.6em; color: var(--kui-color-scale-indigo11); }
  .ks-guia .ProseMirror blockquote { border-left: 3px solid var(--kui-color-scale-indigo9); background: var(--kui-color-scale-indigo3); padding: 10px 16px; border-radius: 0 8px 8px 0; }
  .ks-guia .ProseMirror code { background: var(--kui-color-scale-indigo3); padding: 1px 6px; border-radius: 4px; }
</style>
<a href="/" style="position:fixed;right:20px;bottom:20px;z-index:2147483647;padding:10px 18px;background:#d4b06a;color:#0b0a08;border-radius:999px;font:700 14px system-ui,sans-serif;text-decoration:none;box-shadow:0 6px 20px rgba(0,0,0,.4)">&larr; Ver sitio</a>
<script>
  new MutationObserver(() => {
    const guia = location.pathname.endsWith('/singleton/guia');
    document.documentElement.classList.toggle('ks-guia', guia);
    if (guia) document.querySelectorAll('.ProseMirror[contenteditable="true"]').forEach((el) => (el.contentEditable = 'false'));
    document.querySelectorAll('.kui-scheme--auto, .kui-scheme--light').forEach((el) => el.classList.replace(el.classList.contains('kui-scheme--auto') ? 'kui-scheme--auto' : 'kui-scheme--light', 'kui-scheme--dark'));
    document.querySelectorAll('section h2').forEach((h) => {
      if (/^current branch$/i.test(h.textContent.trim())) h.closest('section').style.display = 'none';
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
</script>`;

export const onRequest = defineMiddleware(async (ctx, next) => {
  const res = await next();
  if (!ctx.url.pathname.startsWith('/keystatic') || !res.headers.get('content-type')?.includes('text/html')) return res;
  const html = (await res.text()) + EXTRA; // Keystatic's page has no </body>; appending is valid HTML
  // i18n with prefixDefaultLocale 404s every page without /es or /en. This Astro header makes it skip the panel.
  res.headers.set('X-Astro-Reroute', 'no');
  return new Response(html, { status: res.status, headers: res.headers });
});
