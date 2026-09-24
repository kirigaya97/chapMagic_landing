/**
 * Funnel events for the ticketing components.
 *
 * Deliberately thin. Each site handles analytics and consent its own way, so:
 *
 * - If the site defines `window.ticketingTrack(event)`, everything goes there
 *   and nothing else is called. That is the hook for a consent queue.
 * - Otherwise it calls `gtag` and `fbq` if they exist, and does nothing if not.
 * - Either way a `ticketing:track` DOM event is dispatched on `document`.
 *
 * `item_id` / `content_ids` carry the show slug, which is also the landing URL:
 * one identifier across site, GA4 and Meta, so ads can be split per show
 * without an equivalence table.
 *
 * The funnel ends at `begin_checkout`. Payment happens inside Dinaticket's
 * iframe, on their domain, with no `postMessage` back: `purchase` cannot be
 * measured from here.
 */

type Params = Record<string, unknown>;

export interface TrackEvent {
  name: string;
  /** GA4 shaped. */
  params: Params;
  /** Meta shaped, when it differs. */
  metaParams?: Params;
}

type Win = Window & {
  ticketingTrack?: (e: TrackEvent) => void;
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
};

/** GA4 names to Meta standard events. Only standard ones optimise campaigns. */
const META_STANDARD: Record<string, string> = {
  view_item: "ViewContent",
  select_item: "AddToCart",
  begin_checkout: "InitiateCheckout",
};

export function track(name: string, params: Params = {}, metaParams?: Params) {
  const event: TrackEvent = { name, params, metaParams };
  document.dispatchEvent(new CustomEvent("ticketing:track", { detail: event }));

  const w = window as Win;
  if (typeof w.ticketingTrack === "function") {
    w.ticketingTrack(event);
    return;
  }

  w.gtag?.("event", name, params);

  if (typeof w.fbq === "function") {
    const standard = META_STANDARD[name];
    w.fbq(standard ? "track" : "trackCustom", standard ?? name, metaParams ?? params);
  }
}

export interface ShowEvent {
  id: string;
  name: string;
  price: number;
  currency: string;
  date?: string;
  time?: string;
}

export function trackShow(name: "view_item" | "select_item" | "begin_checkout", show: ShowEvent) {
  const when = show.date ? { performance_date: show.date, performance_time: show.time } : {};

  track(
    name,
    {
      currency: show.currency,
      value: show.price,
      items: [{ item_id: show.id, item_name: show.name, item_category: "Show", price: show.price, quantity: 1 }],
      ...when,
    },
    {
      content_type: "product",
      content_ids: [show.id],
      content_name: show.name,
      currency: show.currency,
      value: show.price,
      ...when,
    },
  );
}
