/**
 * Every visible string the ticketing components render.
 *
 * Components take `lang` plus an optional `strings` prop. Whatever the site
 * passes wins over these defaults, so a site that keeps all copy in its own
 * config (or needs a third language) never has to edit the kit.
 *
 * Spanish defaults are Spain Spanish, tuteo with the visitor.
 */
export interface TicketingStrings {
  calendarKicker: string;
  calendarTitle: string;
  prevMonth: string;
  nextMonth: string;
  /** One letter per weekday, Monday first. */
  weekdays: string[];
  daysWithShows: string;
  seeDay: string;
  upcoming: string;
  noMore: string;
  buy: string;
  few: string;
  soldout: string;
  hourSuffix: string;
  emptyTitle: string;
  emptyBody: string;
  emptyCta: string;
  cardsKicker: string;
  cardsTitle: string;
  from: string;
  performance: string;
  performances: string;
  seeAndBuy: string;
  widgetKicker: string;
  widgetTitle: string;
  datesLabel: string;
  widgetFrameTitle: string;
  widgetNote: string;
  widgetEscape: string;
  noDates: string;
  modalTitle: string;
  modalFrameTitle: string;
  modalClose: string;
  modalHelp: string;
  modalOpen: string;
  nextPerformance: string;
  duration: string;
  minutes: string;
  venue: string;
  where: string;
  age: string;
  allAges: string;
  /** `{n}` is replaced with the age. */
  fromAge: string;
  /** `{n}` is replaced with the percentage. */
  discount: string;
  /** `{category} en {city}`: the derived tagline when nobody wrote one. */
  taglineFormat: string;
}

const es: TicketingStrings = {
  calendarKicker: "Agenda",
  calendarTitle: "Calendario de funciones",
  prevMonth: "Mes anterior",
  nextMonth: "Mes siguiente",
  weekdays: ["L", "M", "X", "J", "V", "S", "D"],
  daysWithShows: "Días con función",
  seeDay: "Ver funciones del",
  upcoming: "Próximas funciones",
  noMore: "No quedan funciones publicadas.",
  buy: "Comprar",
  few: "Últimas entradas",
  soldout: "Agotado",
  hourSuffix: "h",
  emptyTitle: "Todavía no hay fechas publicadas",
  emptyBody: "Estamos cerrando las próximas funciones. Escríbenos y te avisamos en cuanto se abran las entradas.",
  emptyCta: "Avísame de las fechas",
  cardsKicker: "Cartelera",
  cardsTitle: "Espectáculos en cartel",
  from: "Desde",
  performance: "función",
  performances: "funciones",
  seeAndBuy: "Ver y comprar",
  widgetKicker: "Entradas",
  widgetTitle: "Elige tu función",
  datesLabel: "Fechas disponibles",
  widgetFrameTitle: "Compra de entradas",
  widgetNote: "La compra la gestiona Dinaticket. Recibirás la entrada por email.",
  widgetEscape: "¿No carga? Ábrelo aparte",
  noDates: "No hay fechas a la venta ahora mismo. Escríbenos y te avisamos en cuanto se abra la siguiente tanda.",
  modalTitle: "Entradas",
  modalFrameTitle: "Compra de entradas",
  modalClose: "Cerrar",
  modalHelp: "¿No carga? Ábrela en una pestaña nueva.",
  modalOpen: "Abrir compra",
  nextPerformance: "Próxima función",
  duration: "Duración",
  minutes: "minutos",
  venue: "Sala",
  where: "Dónde",
  age: "Edad",
  allAges: "Todos los públicos",
  fromAge: "A partir de {n} años",
  discount: "{n}% menos que en taquilla",
  taglineFormat: "{category} en {city}",
};

const en: TicketingStrings = {
  calendarKicker: "Schedule",
  calendarTitle: "Show calendar",
  prevMonth: "Previous month",
  nextMonth: "Next month",
  weekdays: ["M", "T", "W", "T", "F", "S", "S"],
  daysWithShows: "Days with a show",
  seeDay: "See shows on the",
  upcoming: "Upcoming shows",
  noMore: "No more shows published.",
  buy: "Buy",
  few: "Last tickets",
  soldout: "Sold out",
  hourSuffix: "",
  emptyTitle: "No dates published yet",
  emptyBody: "We are closing the next dates. Write to us and we will let you know as soon as tickets go on sale.",
  emptyCta: "Notify me",
  cardsKicker: "Now showing",
  cardsTitle: "Shows on stage",
  from: "From",
  performance: "show",
  performances: "shows",
  seeAndBuy: "See and buy",
  widgetKicker: "Tickets",
  widgetTitle: "Pick your show",
  datesLabel: "Available dates",
  widgetFrameTitle: "Ticket purchase",
  widgetNote: "Tickets are sold by Dinaticket. You will receive them by email.",
  widgetEscape: "Not loading? Open it separately",
  noDates: "No dates on sale right now. Write to us and we will let you know when the next ones open.",
  modalTitle: "Tickets",
  modalFrameTitle: "Ticket purchase",
  modalClose: "Close",
  modalHelp: "Not loading? Open it in a new tab.",
  modalOpen: "Open checkout",
  nextPerformance: "Next show",
  duration: "Duration",
  minutes: "minutes",
  venue: "Venue",
  where: "Address",
  age: "Age",
  allAges: "All ages",
  fromAge: "Ages {n}+",
  discount: "{n}% off the box office price",
  taglineFormat: "{category} in {city}",
};

const DICTIONARIES: Record<string, TicketingStrings> = { es, en };

/** Defaults for `lang` (falling back to Spanish), with the site's overrides on top. */
export function strings(lang: string, overrides: Partial<TicketingStrings> = {}): TicketingStrings {
  return { ...(DICTIONARIES[lang] ?? es), ...overrides };
}

/** BCP 47 tag for `Intl`, from a route lang. */
export const localeOf = (lang: string) => (lang === "en" ? "en-GB" : lang === "es" ? "es-ES" : lang);

export const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ""));
