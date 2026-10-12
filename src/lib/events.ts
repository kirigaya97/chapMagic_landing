import events from "../data/events.json";

/**
 * Private events catalog (data/events.json): one landing per event type at
 * /<lang>/eventos/<slug>, built for type-specific ads.
 *
 * `slug` is the URL and is the same in both languages, like /clases, so the
 * hreflang swap in BaseLayout resolves. `analyticsId` is what GA4 receives as
 * `event_type`: stable and language-independent, so renaming a type or its
 * copy never splits its reports.
 */

export type Lang = "es" | "en";
export type EventsStrings = (typeof events.translations)["es"];
type TypeCopy = EventsStrings["types"]["empresas"];

export type EventTypeView = (typeof events.types)[number] & TypeCopy;

export function getEventsStrings(lang: Lang): EventsStrings {
  return events.translations[lang];
}

export function getEventTypes(lang: Lang): EventTypeView[] {
  const copy = events.translations[lang].types as Record<string, TypeCopy>;
  return events.types.map((type) => ({ ...type, ...copy[type.slug] }));
}

export function eventsHref(lang: Lang, slug?: string) {
  return slug ? `/${lang}/eventos/${slug}` : `/${lang}/eventos`;
}
