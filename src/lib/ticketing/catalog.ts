import raw from "../../data/ticketing/dinaticket.json";
import config from "../../../ticketing.config.json";
import { overrides } from "../../data/ticketing/overrides";
import { todayIn, sortPerformances, type Availability, type Performance, type Ticketing } from "./core";
import { strings, fill } from "./i18n";

/**
 * Turns the scraped Dinaticket data into the catalog the site renders.
 *
 * Scraped data rules by default and `src/data/ticketing/overrides.ts` can
 * overwrite single fields. A new show on Dinaticket gets a working landing
 * with nobody writing a line; when there is time, its hook or synopsis gets
 * rewritten and the landing improves without touching structure.
 *
 * Why rewriting pays off is SEO: Dinaticket's text is also on Atrapalo, a huge
 * domain. Publishing it verbatim is duplicate content against it, and the big
 * domain wins. Scraped copy is for EXISTING; rewritten copy is for RANKING.
 *
 * With `PUBLIC_TICKETING_RAW=1` overrides are ignored, to preview what a
 * freshly discovered show looks like before anyone touched it.
 */

/** PUBLIC_ prefix because Vite only exposes prefixed vars on `import.meta.env`. */
export const rawMode = import.meta.env.PUBLIC_TICKETING_RAW === "1";

export const site = {
  timeZone: "Europe/Madrid",
  currency: "EUR",
  country: "ES",
  defaultCity: "Madrid",
  defaultCategory: "Magia",
  landingPath: "/shows/{id}",
  ...(config as { site?: Record<string, string> }).site,
};

export interface Show {
  /** Landing slug. Public once ads point at it: do not change. */
  id: string;
  name: string;
  ticketing: Ticketing;
  category: string;
  /** Short line for cards. */
  tagline: string;
  /** Landing headline. A promise, not a description. */
  hook: string;
  description: readonly string[];
  /** Selling points, three or four, one line each. */
  highlights: readonly { title: string; text: string }[];
  venue: string;
  venueAddress: string;
  location: string;
  /** Every venue it plays, when touring. */
  venues: readonly string[];
  geo: { lat: number; lon: number } | null;
  /** Minutes. `null` if Dinaticket does not say. */
  duration: number | null;
  /** `null` means all ages. */
  minAge: number | null;
  /** Cheapest price on sale. `null` if unknown. */
  priceFrom: number | null;
  /** Struck-through price of that same tier, if discounted. */
  priceFull: number | null;
  /** Portrait poster, path inside `src/assets/ticketing/`. */
  poster: string | null;
  /** Landscape poster art, for cards. */
  banner: string | null;
  /** Landscape performance photo, for full-bleed backgrounds. */
  hero: string | null;
  /** Performance photos for a gallery, without the ones already used as banner or hero. */
  photos: readonly string[];
  seoDescription: string;
}

/** A partial show, plus per-language partials that win over it. */
export type ShowOverride = Partial<Omit<Show, "id" | "ticketing">> & {
  locales?: Record<string, Partial<Omit<Show, "id" | "ticketing">>>;
};

interface RawShow {
  id: string;
  name: string;
  category?: string | null;
  ticketing: Ticketing;
  description: string[];
  highlights: { title: string | null; text: string }[];
  venue: string | null;
  venueAddress: string | null;
  location: string | null;
  venues?: string[];
  geo?: { lat: number; lon: number } | null;
  duration?: number | null;
  minAge?: number | null;
  priceFrom?: number | null;
  priceFull?: number | null;
  poster?: string | null;
  banner?: string | null;
  hero?: string | null;
  images?: { file: string; w: number; h: number; orient: string }[];
  performances: {
    date: string;
    time: string;
    status: Availability;
    venue?: string | null;
    buyUrl: string;
    externalUrl: string;
  }[];
}

const data = raw as unknown as { scrapedAt: string | null; shows: RawShow[] };

/**
 * First sentence of the synopsis. Cut at the closing mark, not the period:
 * marketplace copy opens with exclamations.
 */
function firstSentence(text: string): string {
  const cut = text.search(/[.!?](\s|$)/);
  return cut === -1 ? text : text.slice(0, cut + 1).trim();
}

/** Trims without breaking words, for search descriptions. */
function trim(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const cut = text.lastIndexOf(" ", limit - 1);
  return `${text.slice(0, cut > 40 ? cut : limit - 1)}...`;
}

/**
 * Gallery photos: landscape ones minus banner and hero, so the page does not
 * show the same image twice. Only if enough remain: a show with two photos is
 * better repeating one than having no gallery.
 */
function gallery(s: RawShow): string[] {
  const landscape = (s.images ?? []).filter((i) => i.orient !== "portrait").map((i) => i.file);
  const used = new Set([s.banner, s.hero].filter(Boolean) as string[]);
  const clean = landscape.filter((f) => !used.has(f));
  return clean.length >= 3 ? clean : landscape;
}

/** A complete show from the scraped page, no human input. */
function toShow(s: RawShow, lang: string): Show {
  const t = strings(lang);
  const category = s.category ?? site.defaultCategory;
  const city = s.location ?? site.defaultCity;

  return {
    id: s.id,
    name: s.name,
    ticketing: s.ticketing,
    category,
    tagline: fill(t.taglineFormat, { category, city }),
    hook: s.description[0] ? firstSentence(s.description[0]) : `${s.name}, ${city}.`,
    description: s.description,
    // Dinaticket leaves titles empty when a point has no bold. An untitled
    // point is dropped rather than rendered with a gap.
    highlights: s.highlights
      .filter((h): h is { title: string; text: string } => Boolean(h.title && h.text))
      .map((h) => ({ title: h.title, text: h.text })),
    venue: s.venue ?? city,
    venueAddress: s.venueAddress ?? "",
    location: city,
    venues: s.venues ?? (s.venue ? [s.venue] : []),
    geo: s.geo ?? null,
    duration: s.duration ?? null,
    minAge: s.minAge ?? null,
    priceFrom: s.priceFrom ?? null,
    priceFull: s.priceFull ?? null,
    poster: s.poster ?? s.banner ?? s.hero ?? null,
    banner: s.banner ?? s.hero ?? s.poster ?? null,
    hero: s.hero ?? s.banner ?? s.poster ?? null,
    photos: gallery(s),
    seoDescription: trim(`${s.name}: ${category.toLowerCase()}, ${s.venue ?? city}, ${city}. ${s.description[0] ?? ""}`, 155),
  };
}

/**
 * The catalog as the site sees it, for one language.
 *
 * `shows` is editorial (changes rarely) and `performances` is the schedule
 * (changes by itself). Both come from the same scrape.
 *
 * Past performances are filtered here with "today" in the shows' time zone.
 * The client filters again at view time, since a static page outlives its build.
 */
export function getCatalog(lang = "es"): { shows: Show[]; performances: Performance[]; scrapedAt: string | null } {
  const shows: Show[] = [];
  const performances: Performance[] = [];
  const today = todayIn(site.timeZone);

  for (const s of data.shows) {
    const { locales, ...common } = (rawMode ? undefined : overrides[s.id]) ?? {};
    shows.push({ ...toShow(s, lang), ...common, ...(locales?.[lang] ?? {}) });

    for (const p of s.performances) {
      if (p.date < today) continue;
      performances.push({
        showId: s.id,
        date: p.date,
        time: p.time,
        status: p.status,
        venue: p.venue ?? null,
        buyUrl: p.buyUrl,
        externalUrl: p.externalUrl,
      });
    }
  }

  return {
    shows: shows.sort((a, b) => a.name.localeCompare(b.name, lang)),
    performances: sortPerformances(performances),
    scrapedAt: data.scrapedAt,
  };
}

export const showById = (id: string, all: readonly Show[]) => all.find((s) => s.id === id);
