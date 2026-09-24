/**
 * Offline checks for the scraper's pure functions. No network.
 *
 * The artist filter is the one part of the scraper whose failure is silent:
 * if a venue spells the name differently, the show just does not appear. So
 * the filter logic is tested with fixed fixtures, and the aliases in
 * `ticketing.config.json` are checked to at least match themselves.
 *
 *   node scripts/ticketing/test.mjs
 */
import * as cheerio from 'cheerio';
import {
  loadConfig,
  normalize,
  isArtists,
  isSuspicious,
  cleanTitle,
  slug,
  merge,
  prices,
  minutes,
} from './scrape.mjs';
import { availability, utcOffset, widgetUrl, landingHref, monthsBetween } from '../../src/lib/ticketing/core.ts';

let failures = 0;

function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}`);
  if (!ok) console.log(`        expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

// ===================== ARTIST FILTER (fixtures) ===================== //

const ALIASES = ['santi fernandez', 'santiago fernandez', 's fernandez'].map(normalize);

console.log('\nMatches the artist:');
for (const block of [
  'Artista: Santi Fernández',
  'Artista: Santi Fernandez',
  'Artista: SANTIAGO FERNANDEZ',
  'Artista:  santi   fernández ',
  'Artista: S. Fernández',
  'Artista: Santi Fernández (Mentalista)',
  'Artistas: Belén Caccia, Victoria Santos, Santi Fernández',
  'Artistas: Santi Fernández y Alex Ruiz',
]) {
  check(`"${block}"`, isArtists(block, ALIASES), true);
}

console.log('\nDoes not let anyone else in:');
for (const block of ['Artista: Alex Ruíz', 'Artista: Santi Rodríguez', 'Artista: Marta Fernández', '']) {
  check(`"${block || '(empty)'}"`, isArtists(block, ALIASES), false);
}

console.log('\nFlags near misses:');
check('same surname', isSuspicious('Artista: Marta Fernández', 'fernandez'), true);
check('unrelated', isSuspicious('Artista: Alex Ruíz', 'fernandez'), false);
check('no surname configured', isSuspicious('Artista: Marta Fernández', ''), false);

// ===================== CONFIG ===================== //

console.log('\nticketing.config.json:');
const config = loadConfig();
check('has at least one active target', config.targets.length > 0, true);
for (const alias of config.aliases) {
  check(`alias "${alias}" matches "Artista: ${alias}"`, isArtists(`Artista: ${alias}`, config.aliases), true);
}

// ===================== TITLE AND SLUG ===================== //

console.log('\nCleans marketplace titles:');
check('artist and city', cleanTitle('Asómbrate y Ríe - Santi Fernández en Madrid', 'Santi Fernández', 'Madrid'), 'Asómbrate y Ríe');
check('artist first', cleanTitle('Chap - La magia del pase de oro', 'Chap', 'Madrid'), 'La magia del pase de oro');
check('alias differs from the signature', cleanTitle('Chap - La magia', 'Chap Magic', 'Madrid', ['chap']), 'La magia');
check('only the city', cleanTitle('Ilusiones Cercanas en Madrid', 'X', 'Madrid'), 'Ilusiones Cercanas');
check('keeps a dash that is not the artist', cleanTitle('Magia a la carta - Cena Show', '', 'Madrid'), 'Magia a la carta - Cena Show');
check('slug', slug('Asómbrate y Ríe!'), 'asombrate-y-rie');

console.log('\nParses durations:');
for (const [text, expected] of [['100 minutos', 100], ['1 hora', 60], ['1 hora y 30 minutos', 90], ['1h30', 90], ['1,5 horas', 90], ['75 min', 75], ['', null]]) {
  check(`"${text}"`, minutes(text), expected);
}

// ===================== PRICES ===================== //

console.log('\nReads prices per row, not page max:');
const tiers = cheerio.load(`
  <div class="js-price-row" data-price-value="14&euro;"><del class="origin-price">18&euro;</del><ins class="final-price">14&euro;</ins></div>
  <div class="js-price-row" data-price-value="22&euro;"><ins class="final-price">22&euro;</ins></div>`);
check('from = cheapest final, full = its struck price', prices(tiers, ''), { priceFrom: 14, priceFull: 18 });

const flat = cheerio.load('<div class="js-price-row" data-price-value="30&euro;"></div><div class="js-price-row" data-price-value="38&euro;"></div>');
check('tiers without discount are not a discount', prices(flat, ''), { priceFrom: 30, priceFull: null });

check('fallback without price rows', prices(cheerio.load(''), 'desde 12&euro; antes 18&euro;'), { priceFrom: 12, priceFull: 18 });

// ===================== CORE ===================== //

console.log('\nCore helpers:');
check('sold out', availability(0, 100), 'soldout');
check('few by count', availability(8, 300), 'few');
check('few by ratio', availability(15, 75), 'few');
check('available', availability(50, 75), 'available');
check('no figures means available', availability(undefined, undefined), 'available');
check('widget url keeps the trailing slash', widgetUrl({ provider: 1, event: 2 }, '2026-10-02'), 'https://www.dinaticket.com/es/provider/1/event/2/fecha-2026-10-02/?widget');
check('summer offset Madrid', utcOffset('2026-07-10', '20:00', 'Europe/Madrid'), '+02:00');
check('winter offset Madrid', utcOffset('2026-12-10', '20:00', 'Europe/Madrid'), '+01:00');
check('landing href', landingHref('/{lang}/shows/{id}', 'x', 'en'), '/en/shows/x');
check('months include empty gaps', monthsBetween(['2026-11-02', '2027-01-05']), ['2026-11', '2026-12', '2027-01']);

// ===================== MERGE ===================== //

console.log('\nMerges a touring show:');
const base = (over) => ({
  id: 'show', name: 'Show', ticketing: { provider: 1, event: 1 }, sourceUrl: 'a', venue: 'A',
  description: ['one'], highlights: [], photos: [], duration: 60, minAge: null, category: 'Magia',
  venueAddress: null, geo: null, priceFrom: 12, priceFull: null, performances: [], ...over,
});
const [toured] = merge([
  base({ performances: [{ date: '2026-10-30', time: '20:00', venue: 'A', buyUrl: 'x/event/1/fecha-2026-10-30/?widget' }] }),
  base({
    ticketing: { provider: 2, event: 2 }, sourceUrl: 'b', venue: 'B', duration: null, description: ['one', 'two'], priceFrom: 10, priceFull: 15,
    performances: [
      { date: '2026-09-17', time: '20:00', venue: 'B', buyUrl: 'x/event/2/fecha-2026-09-17/?widget' },
      { date: '2026-09-17', time: '20:00', venue: 'B', buyUrl: 'x/event/2/fecha-2026-09-17/?widget' },
    ],
  }),
]);
check('dates from both, deduplicated and sorted', toured.performances.map((p) => p.date), ['2026-09-17', '2026-10-30']);
check('main ticketing is the next performance', toured.ticketing, { provider: 2, event: 2 });
check('keeps the more complete fields', toured.duration, 60);
check('lowest price carries its own full price', [toured.priceFrom, toured.priceFull], [10, 15]);

console.log(failures === 0 ? '\nAll good.\n' : `\n${failures} checks failed.\n`);
process.exit(failures === 0 ? 0 : 1);
