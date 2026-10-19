import { defineMiddleware } from 'astro:middleware';

// Additions to Keystatic's UI, which has no option for them (same as emiliano-calde):
// - floating "back to site" button
// - hide the git branch picker/actions and the dashboard "Current branch" card; editors always work on main
// - dark theme with the site's gold as accent (Keystatic's indigo scale re-tinted; tripled class beats its rules)
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
</style>
<a href="/" style="position:fixed;right:20px;bottom:20px;z-index:2147483647;padding:10px 18px;background:#d4b06a;color:#0b0a08;border-radius:999px;font:700 14px system-ui,sans-serif;text-decoration:none;box-shadow:0 6px 20px rgba(0,0,0,.4)">&larr; Ver sitio</a>
<script>
  new MutationObserver(() => {
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
