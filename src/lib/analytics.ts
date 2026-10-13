/**
 * Site analytics: GA4-shaped events for the lead funnel (events pages,
 * WhatsApp, contact). Ticket sales keep their own module in lib/ticketing.
 *
 * Delivery, in order of preference:
 * - `window.siteTrack(event)` if the site defines it (hook for a consent queue);
 * - `gtag("event", ...)` if gtag.js is loaded;
 * - otherwise `dataLayer.push({ event, ...params })`, which is what GTM reads.
 * `fbq` gets the Meta equivalent when present. A `site:track` DOM event is
 * always dispatched on `document`.
 *
 * Events
 *   select_event_type  click on an event type card          event_type, cta_location
 *   contact_click      WhatsApp / email / phone link         method, event_type, cta_location
 *   quote_click        "request a quote" button              event_type, cta_location
 *   lead_form_start    first interaction with a lead form    form_id, event_type
 *   generate_lead      lead form sent                        form_id, event_type, guests, event_month, lead_source
 *   lead_form_error    lead form failed                      form_id, event_type, error_type
 *
 * Every event also carries `page_type` and `event_type` from the page's
 * <main data-page-type data-event-type> (an attribute on the element wins),
 * and `language`. `event_type` is the language-independent id from
 * data/events.json (`corporate`, `wedding`...), so ES and EN pages add up.
 *
 * Declarative clicks: any element with `data-track="<event>"` sends that
 * event on click, with each `data-track-foo-bar="x"` as param `foo_bar: "x"`.
 * GTM can also trigger on those attributes directly.
 */

type Params = Record<string, unknown>;

export interface SiteEvent {
  name: string;
  params: Params;
}

type Win = Window & {
  siteTrack?: (e: SiteEvent) => void;
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
  dataLayer?: unknown[];
};

/** GA4 names to Meta standard events. */
const META_STANDARD: Record<string, string> = {
  generate_lead: "Lead",
  contact_click: "Contact",
};

function pageContext(): Params {
  const main = document.querySelector<HTMLElement>("main[data-page-type]");
  const ctx: Params = { language: document.documentElement.lang };
  if (main?.dataset.pageType) ctx.page_type = main.dataset.pageType;
  if (main?.dataset.eventType) ctx.event_type = main.dataset.eventType;
  return ctx;
}

export function track(name: string, params: Params = {}) {
  // Unset params are dropped, not sent as "undefined".
  const merged = Object.entries({ ...pageContext(), ...params }).filter(([, v]) => v !== undefined && v !== "");
  const event: SiteEvent = { name, params: Object.fromEntries(merged) };
  document.dispatchEvent(new CustomEvent("site:track", { detail: event }));

  const w = window as Win;
  if (typeof w.siteTrack === "function") {
    w.siteTrack(event);
    return;
  }

  if (typeof w.gtag === "function") {
    w.gtag("event", event.name, event.params);
  } else {
    (w.dataLayer ??= []).push({ event: event.name, ...event.params });
  }

  if (typeof w.fbq === "function") {
    const standard = META_STANDARD[name];
    w.fbq(standard ? "track" : "trackCustom", standard ?? name, event.params);
  }
}

/** data-track-cta-location -> dataset.trackCtaLocation -> cta_location */
function paramsFromDataset(el: HTMLElement): Params {
  const params: Params = {};
  for (const [key, value] of Object.entries(el.dataset)) {
    if (!key.startsWith("track") || key === "track" || value === undefined) continue;
    const name = key
      .slice("track".length)
      .replace(/^[A-Z]/, (c) => c.toLowerCase())
      .replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    params[name] = value;
  }
  return params;
}

const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
];
const ATTRIBUTION_STORAGE = "chapmagic:attribution";

/**
 * Remember the campaign that brought the visitor (last touch, per session),
 * so a lead sent three pages later still says which ad it came from.
 */
function captureAttribution() {
  const url = new URL(window.location.href);
  const found: Record<string, string> = {};
  for (const key of ATTRIBUTION_KEYS) {
    const value = url.searchParams.get(key);
    if (value) found[key] = value.slice(0, 200);
  }
  if (Object.keys(found).length === 0) return;
  found.landing_page = url.pathname;
  try {
    sessionStorage.setItem(ATTRIBUTION_STORAGE, JSON.stringify(found));
  } catch {
    // Storage blocked: the lead simply goes without attribution.
  }
}

export function getAttribution(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(ATTRIBUTION_STORAGE) ?? "{}");
  } catch {
    return {};
  }
}

let listening = false;

/**
 * The ClientRouter swaps pages without reloading, so gtag's `config` only
 * counts the first one. Later navigations send their own page_view.
 */
function trackPageView() {
  (window as Win).gtag?.("event", "page_view", {
    page_location: window.location.href,
    page_path: window.location.pathname,
    page_title: document.title,
  });
}

/** Call on every `astro:page-load`; the click listener is only added once. */
export function initAnalytics() {
  captureAttribution();
  if (listening) {
    trackPageView();
    return;
  }
  listening = true;

  document.addEventListener(
    "click",
    (e) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-track]");
      if (!el?.dataset.track) return;
      const params = paramsFromDataset(el);
      if (el instanceof HTMLAnchorElement) params.link_url = el.href;
      track(el.dataset.track, params);
    },
    { capture: true },
  );
}
