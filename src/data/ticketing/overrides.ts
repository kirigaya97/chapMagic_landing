import type { ShowOverride } from "../../lib/ticketing/catalog";

/**
 * Editorial touches over what the scraper finds, keyed by show id (the slug).
 *
 * Edited in Keystatic ("Dinaticket: textos de cada show"): one JSON per show in
 * `./overrides/<id>.json`. Only overwrite what pays off: SEO (Dinaticket's copy
 * is also on Atrapalo), voice, the hook, and translations under `locales.en`
 * (Dinaticket only has Spanish). The panel never exposes dates, prices, venue,
 * duration or age: Dinaticket knows them better and they change.
 *
 * Empty fields are dropped so they fall back to the scraped text instead of
 * blanking it. `show` only labels the entry in the panel.
 *
 * Preview a show without any of this: PUBLIC_TICKETING_RAW=1 npm run dev
 */
const files = import.meta.glob<{ default: Record<string, unknown> }>("./overrides/*.json", { eager: true });

const clean = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.length ? v : undefined;
    if (typeof v === "string") return v.trim() ? v : undefined;
    if (v && typeof v === "object") {
        const o = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clean(x)]).filter(([, x]) => x !== undefined));
        return Object.keys(o).length ? o : undefined;
    }
    return v ?? undefined;
};

export const overrides: Record<string, ShowOverride> = Object.fromEntries(
    Object.entries(files).map(([path, m]) => {
        const { show, ...texts } = m.default;
        return [path.split("/").pop()!.replace(".json", ""), (clean(texts) ?? {}) as ShowOverride];
    }),
);
