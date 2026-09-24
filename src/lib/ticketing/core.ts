/**
 * Ticketing core: Dinaticket URLs, availability, dates.
 *
 * This module imports nothing on purpose. Astro uses it, and so does the
 * standalone scraper (`scripts/ticketing/scrape.mjs`), which Node runs directly
 * by stripping the types on the fly. Keep it dependency free and keep to
 * erasable TypeScript (no enums, no namespaces, no parameter properties), or
 * the scraper stops being able to import it.
 *
 * Dinaticket has no public API. What it does have are URLs with a stable
 * shape, and one of them opens the purchase widget already positioned on a
 * given date. That is what lets the button for the 17th land the visitor on
 * that session instead of a list where they have to find it again.
 *
 * The four URLs Atrapalo publishes for the same event:
 *
 *   Atrapalo       atrapalo.com/entradas/<slug>_e<event>/
 *   MiWeb          dinaticket.com/es/provider/<provider>/event/<event>
 *   MiWeb widget   ...the same, with ?widget
 *   Box office     atrapalotickets.com/ticket-office/showsessions/<event>
 *
 * Only the middle two are used. Atrapalo drops the visitor in a marketplace
 * full of other shows, and the box office one redirects to a login.
 */

/** Identifies an event inside Dinaticket. */
export interface Ticketing {
  provider: number;
  event: number;
}

/**
 * What the visitor sees instead of sales figures.
 *
 * Dinaticket exposes sold, capacity and stock per session. None of those
 * leave the scraper: how many tickets an artist has sold is their business,
 * not the visitor's.
 */
export type Availability = "available" | "few" | "soldout";

export interface Performance {
  showId: string;
  /** `YYYY-MM-DD`. */
  date: string;
  /** `HH:MM`, 24h. */
  time: string;
  status: Availability;
  /** Venue for this specific date. Touring shows change venue between dates. */
  venue?: string | null;
  /** Purchase widget, already positioned on this date. */
  buyUrl: string;
  /** The same session outside the widget, for a new tab. */
  externalUrl: string;
}

export const DINATICKET_BASE = "https://www.dinaticket.com/es/provider";

const eventUrl = ({ provider, event }: Ticketing) =>
  `${DINATICKET_BASE}/${provider}/event/${event}`;

/**
 * Purchase widget. With `date` (`YYYY-MM-DD`) it opens that session; without
 * it, the event's full list.
 *
 * The `/fecha-.../` segment goes BEFORE the query and the trailing slash is
 * mandatory: without it Dinaticket ignores the filter and returns the list.
 */
export function widgetUrl(ticketing: Ticketing, date?: string): string {
  const base = eventUrl(ticketing);
  return date ? `${base}/fecha-${date}/?widget` : `${base}?widget`;
}

/** Same page without widget mode, for opening in a new tab. */
export function fullUrl(ticketing: Ticketing, date?: string): string {
  const base = eventUrl(ticketing);
  return date ? `${base}/fecha-${date}/` : base;
}

/**
 * From figures to a traffic light.
 *
 * Two criteria because venues differ in size: eight tickets left is "last
 * tickets" anywhere, and so is 20% left in a 200-seat room. With no numbers
 * it assumes available: better someone finds a sold-out session at checkout
 * than never tries because this said there was nothing left.
 */
export function availability(stock: unknown, capacity: unknown): Availability {
  if (typeof stock !== "number" || !Number.isFinite(stock)) return "available";
  if (stock <= 0) return "soldout";

  const total = typeof capacity === "number" && capacity > 0 ? capacity : 0;
  if (stock <= 8 || (total > 0 && stock / total <= 0.2)) return "few";

  return "available";
}

export const sortPerformances = <T extends { date: string; time: string }>(list: T[]): T[] =>
  list.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

/**
 * Today as `YYYY-MM-DD` in the shows' time zone.
 *
 * Not the server's: Vercel runs in UTC, and between midnight and 2am in Madrid
 * a UTC "today" would still list last night's show as upcoming.
 */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * UTC offset (`+02:00`) of a wall-clock time in a time zone.
 *
 * Needed for the JSON-LD `startDate`. Hardcoding `+02:00` is right in summer
 * and an hour off every winter date in Spain.
 */
export function utcOffset(date: string, time: string, timeZone: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const instant = new Date(Date.UTC(y, m - 1, d, hh, mm));

  const name = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
    .formatToParts(instant)
    .find((p) => p.type === "timeZoneName")?.value;

  return name?.match(/GMT([+-]\d{2}:\d{2})/)?.[1] ?? "+00:00";
}

/**
 * Local date for formatting, built from parts.
 *
 * Never `new Date("2026-10-02")`: that parses as UTC midnight, and anywhere
 * west of Greenwich it formats as the day before.
 */
export function localDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Landing URL for a show. `pattern` comes from `site.landingPath` in
 * `ticketing.config.json`, e.g. `/shows/{id}` or `/{lang}/shows/{id}`.
 */
export function landingHref(pattern: string, id: string, lang: string): string {
  return pattern.replace("{lang}", lang).replace("{id}", id);
}

/**
 * Every month between the first and last date, empty ones included. Without
 * the gaps, "next month" would skip over an empty month and the calendar would
 * look broken.
 */
export function monthsBetween(sortedDates: readonly string[]): string[] {
  if (!sortedDates.length) return [];

  const [fy, fm] = sortedDates[0].split("-").map(Number);
  const [ly, lm] = sortedDates[sortedDates.length - 1].split("-").map(Number);

  const out: string[] = [];
  let y = fy;
  let m = fm;
  while (y < ly || (y === ly && m <= lm)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    if (++m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}
