import type { ShowOverride } from "../../lib/ticketing/catalog";

/**
 * Editorial touches over what the scraper finds, keyed by show id (the slug).
 *
 * Scraped data rules by default: a new show on Dinaticket is published on its
 * own. Only overwrite what pays off:
 *
 * 1. SEO. Dinaticket's copy is also on Atrapalo. Rewritten synopsis and
 *    highlights are what let this page rank on its own.
 * 2. Voice. Marketplace copy talks about the artist in the third person.
 * 3. Hook. The derived `hook` is just the synopsis' first sentence.
 * 4. Other languages. Dinaticket only has Spanish: translations go under
 *    `locales.en`. A show without them renders its Spanish copy on /en/.
 *
 * Do NOT overwrite dates, prices, venue, address, duration or age. Dinaticket
 * knows them better and they change.
 *
 * Preview a show without any of this: PUBLIC_TICKETING_RAW=1 npm run dev
 */
export const overrides: Record<string, ShowOverride> = {
    "la-magia-del-pase-de-oro-de-got-talent": {
        locales: {
            en: {
                name: "The Magic of Got Talent's Golden Buzzer",
                hook: "After Risto Mejide's Golden Buzzer on Got Talent and tours across Latin America, the United States, Europe and the Middle East, Chap arrives in Madrid with two exclusive, completely different shows.",
                description: [
                    "After receiving Risto Mejide's Golden Buzzer on Got Talent and performing across Latin America, the United States, Europe and the Middle East, Chap arrives in Madrid with two exclusive and completely different shows.",
                    "On one side, MIRAGE: a theatrical magic experience that blends mentalism, magic, technology and emotion in an immersive show designed to surprise, move you and make the impossible real.",
                    "On the other, MISTERIOS DESCLASIFICADOS (Declassified Mysteries): a stand-up magic show with plenty of audience interaction and impossible effects that make every performance unique.",
                    "Two different ways to experience Chap's universe.",
                    "Pick the one that calls to you... or discover both in the heart of Madrid.",
                ],
                seoDescription:
                    "Chap, Golden Buzzer on Got Talent, live in Madrid at Teatro Escondido Gran Vía: MIRAGE and Misterios Desclasificados. Check dates and buy tickets.",
            },
        },
    },
    "magia-a-la-carta-cena-show": {
        locales: {
            en: {
                name: "Magic à la Carte: Dinner Show",
                hook: "Magic, dinner and a night to enjoy and be amazed.",
                description: [
                    "Magic, dinner and a night to enjoy and be amazed.",
                    "An experience that pairs the show of Chap Magic, Golden Buzzer from Risto Mejide on Got Talent, with the food of Casa Úrsula at the ABC Serrano shopping centre.",
                    "Your ticket includes food, drinks and the show.",
                ],
                seoDescription:
                    "Magic à la Carte: dinner show with Chap Magic, Golden Buzzer on Got Talent, at Casa Úrsula, ABC Serrano, Madrid. Food, drinks and show included.",
            },
        },
    },
};
