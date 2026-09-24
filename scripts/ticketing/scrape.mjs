/**
 * Discovers and extracts an artist's shows from Dinaticket.
 *
 * Reads the targets in `ticketing.config.json`, keeps the events that belong
 * to the artist, and writes `src/data/ticketing/dinaticket.json` plus the show
 * photos under `src/assets/ticketing/<show-id>/`.
 *
 * On Dinaticket the "provider" is usually the VENUE, not the artist: one
 * theatre account can publish 22 events of which one is ours. That is why
 * `venue` targets filter by the Artist field and `own` targets do not.
 *
 * From each event page comes everything a landing needs: synopsis, selling
 * points, venue, address, coordinates, duration, minimum age, price with
 * discount, photos and sessions. Reviews do NOT come: the `#opinions` block
 * exists but is empty.
 *
 *   node scripts/ticketing/scrape.mjs              write the JSON
 *   node scripts/ticketing/scrape.mjs --dry        print it, write nothing
 *   node scripts/ticketing/scrape.mjs --forget     re-classify every event
 *   node scripts/ticketing/scrape.mjs --no-photos  skip photo downloads
 *
 * Needs Node >= 22.18 (imports a .ts module with type stripping) and curl.
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

import { availability, sortPerformances, DINATICKET_BASE as BASE } from '../../src/lib/ticketing/core.ts';

// ============================== CONFIG ============================== //

const CONFIG_FILE = resolve('ticketing.config.json');
const OUTPUT = resolve('src/data/ticketing/dinaticket.json');
const PHOTOS_DIR = resolve('src/assets/ticketing');

const TYPES = { own: 'own', venue: 'venue', event: 'event', propio: 'own', sala: 'venue', evento: 'event' };

export function loadConfig(file = CONFIG_FILE) {
  let raw;
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`Could not read ${file}: ${e.message}`);
    console.error('If you edited it by hand, check it is still valid JSON.');
    process.exit(1);
  }

  const targets = (raw.targets ?? [])
    .filter((t) => t.active !== false)
    .map((t) => ({ ...t, type: TYPES[t.type] }));

  for (const t of targets) {
    if (!t.type) {
      console.error(`Target with unknown type: ${JSON.stringify(t)}`);
      process.exit(1);
    }
    if (!Number.isInteger(t.provider)) {
      console.error(`Target without a numeric "provider": ${JSON.stringify(t)}`);
      process.exit(1);
    }
    if (t.type === 'event' && !Number.isInteger(t.event)) {
      console.error(`An "event" target also needs "event": ${JSON.stringify(t)}`);
      process.exit(1);
    }
  }

  const aliases = (raw.artist?.aliases ?? []).map(normalize).filter(Boolean);
  const surname = normalize(raw.artist?.surname ?? '');

  if (targets.some((t) => t.type !== 'own') && !aliases.length) {
    console.error('There are venue/event targets but artist.aliases is empty: nothing would match.');
    process.exit(1);
  }

  return { targets, aliases, surname, site: raw.site ?? {} };
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36';

/** Pause between requests. This runs in the background: no hurry, be polite. */
const PAUSE_MS = 1000;

/** Retries on 429 or 5xx, with growing backoff. */
const RETRIES = 4;

// ============================== TEXT ============================== //

const stripAccents = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/** No accents, lowercase, no punctuation, collapsed spaces. */
export const normalize = (s) =>
  stripAccents(s)
    .replace(/[.,;:()[\]"'`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Splits the "Artista:" block into names. The label comes singular or plural,
 * and a cast is a comma separated list.
 */
export const signers = (block) =>
  String(block ?? '')
    .replace(/^\s*artistas?\s*:\s*/i, '')
    .split(/\s*[,;|/]\s*|\s+y\s+/)
    .map(normalize)
    .filter(Boolean);

/**
 * A name is the artist's if it equals an alias, or contains one as a whole
 * word sequence. The second covers what venues add: "Chap (Mentalista)".
 */
export const isAlias = (name, aliases) => {
  const padded = ` ${name} `;
  return aliases.some((alias) => padded.includes(` ${alias} `));
};

/** Being among the signers is enough: in a gala they share the bill. */
export const isArtists = (block, aliases) => signers(block).some((n) => isAlias(n, aliases));

/** Rejected, but carries the surname: probably a spelling missing from aliases. */
export const isSuspicious = (block, surname) =>
  Boolean(surname) && signers(block).some((n) => n.includes(surname));

/** The three dashes venues use as separator, without writing them here. */
const SEPARATORS = new RegExp(`\\s+[-${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}|]\\s+`);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Drops what Dinaticket adds to titles for its marketplace.
 *
 * There the title is "Show - Artist en Madrid", because it competes with
 * thousands of events. On the artist's own site that is redundant, and the
 * slug would become /shows/show-artist-en-madrid. Only chunks matching the
 * artist (as signed on the page or any configured alias) or the city are removed.
 */
export function cleanTitle(title, artist, city, aliases = []) {
  // The artist as the page signs it, plus every configured alias: an account
  // signed "Chap Magic" still titles its shows "Chap - ...".
  const signatures = [normalize(artist ?? ''), ...aliases.map(normalize)].filter(Boolean);

  let out = title
    .split(SEPARATORS)
    .filter((chunk) => {
      const t = normalize(chunk);
      return !signatures.some((sig) => t === sig || t.startsWith(`${sig} en `));
    })
    .join(' - ')
    .trim();

  if (city) out = out.replace(new RegExp(`\\s+en\\s+${escapeRegex(city)}\\s*$`, 'i'), '').trim();

  return out || title;
}

/** Slug for the landing URL. Public once ads point at it: do not change lightly. */
export const slug = (name) =>
  stripAccents(name)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

const number = (text) => {
  const m = String(text ?? '').match(/-?\d+(?:[.,]\d+)?/);
  return m ? Number(m[0].replace(',', '.')) : null;
};

/**
 * Duration in minutes. Dinaticket writes it free-form: "100 minutos",
 * "1 hora", "1 hora y 30 minutos", "1h30", "1,5 horas". Taking the first
 * number turned "1 hora" into a one-minute show.
 */
export function minutes(text) {
  const s = stripAccents(text);
  const compact = s.match(/(\d+)\s*h\s*(\d{2})\b/);
  if (compact) return Number(compact[1]) * 60 + Number(compact[2]);

  const h = s.match(/(\d+(?:[.,]\d+)?)\s*(?:h(?![a-z])|horas?)/);
  const m = s.match(/(\d+)\s*(?:m(?![a-z])|min|minutos?)/);
  if (!h && !m) return number(text);
  return Math.round((h ? Number(h[1].replace(',', '.')) * 60 : 0) + (m ? Number(m[1]) : 0));
}

const int = (v, fallback = 0) => {
  const n = Number.parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
};

const euros = (text) => {
  const m = String(text ?? '').match(/(\d+(?:[.,]\d{1,2})?)\s*(?:&euro;|€)/);
  return m ? Number(m[1].replace(',', '.')) : null;
};

const localToday = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

// ============================== HTTP ============================== //

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * HTTP through curl, on purpose.
 *
 * Dinaticket's WAF answers 429 to almost anything coming out of Node: `fetch`
 * (undici) fails from the first request and `node:https` lets one through and
 * blocks the rest. curl, same pace and same headers, does 22 out of 22. Fresh
 * connections and browser headers were ruled out, so it is the client's TLS
 * fingerprint, which Node cannot change. Do not "fix" this back to `fetch`.
 *
 * curl ships with GitHub Actions runners and Vercel build images.
 */
const MARK = '<<<HTTP:';

function download(url) {
  return new Promise((ok, fail) => {
    execFile(
      'curl',
      [
        '--silent', '--show-error', '--location', '--max-time', '25',
        '--user-agent', UA,
        '--header', 'Accept: text/html,application/xhtml+xml,*/*;q=0.8',
        '--header', 'Accept-Language: es-ES,es;q=0.9',
        '--write-out', `\n${MARK}%{http_code}>>>`,
        url,
      ],
      // Dinaticket serves ISO-8859-1. Decoding as UTF-8 does not crash, it
      // just fills the site with mojibake, which is worse.
      { encoding: 'latin1', maxBuffer: 20 * 1024 * 1024 },
      (error, stdout) => {
        if (error && !stdout) {
          fail(new Error(/ENOENT/.test(String(error)) ? 'curl is not installed and this scraper needs it' : String(error.message)));
          return;
        }
        const cut = stdout.lastIndexOf(MARK);
        if (cut === -1) {
          fail(new Error('curl did not return a status code'));
          return;
        }
        ok({
          status: Number(stdout.slice(cut + MARK.length).replace('>>>', '').trim()),
          html: stdout.slice(0, cut),
        });
      },
    );
  });
}

async function get(url, attempt = 1) {
  const res = await download(url);

  // 429 and 5xx are temporary. Anything else is final.
  if ((res.status === 429 || res.status >= 500) && attempt <= RETRIES) {
    const wait = 2000 * 2 ** attempt;
    console.error(`    ${res.status}, retry ${attempt}/${RETRIES} in ${wait / 1000}s`);
    await sleep(wait);
    return get(url, attempt + 1);
  }

  if (res.status !== 200) throw new Error(`HTTP ${res.status} on ${url}`);
  return res.html;
}

function downloadBinary(url, dest) {
  return new Promise((ok) => {
    execFile(
      'curl',
      ['--silent', '--location', '--max-time', '30', '--user-agent', UA, '--output', dest, url],
      (error) => ok(!error && existsSync(dest)),
    );
  });
}

// ============================== PHOTOS ============================== //

/**
 * Reads JPEG/PNG dimensions from the header.
 *
 * Atrapalo's file names LIE about orientation: `vertic_880_0.jpg` is 880x462
 * landscape and `si_880_267.jpg` is the 300x400 portrait poster. Classifying
 * by name gave exactly the opposite, so it classifies by real size.
 */
export function measure(buf) {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) break;
      const marker = buf[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return null;
}

/**
 * Brings photos into the repo and gives them roles.
 *
 * Downloaded instead of hotlinked so `astro:assets` can optimise them, and so
 * the site keeps its images the day Atrapalo blocks hotlinking.
 *
 *   poster  Most portrait one. Landing sidebar and share image.
 *   banner  First landscape one in Dinaticket's order, usually the poster art
 *           in horizontal. Used in show cards.
 *   hero    Last landscape one, in practice a performance photo. Full-bleed
 *           background, where a room photo works better than text-heavy art.
 *
 * If there is only one kind, all roles fall back to it.
 */
async function fetchPhotos(id, urls) {
  const dir = `${PHOTOS_DIR}/${id}`;
  mkdirSync(dir, { recursive: true });

  const images = [];

  for (const [index, url] of urls.entries()) {
    const ext = (url.match(/\.(jpg|jpeg|png|webp)/i)?.[1] ?? 'jpg').toLowerCase();
    const name = `${id}-${String(index + 1).padStart(2, '0')}.${ext}`;
    const dest = `${dir}/${name}`;

    if (!existsSync(dest)) {
      await sleep(200);
      if (!(await downloadBinary(url, dest))) {
        console.error(`    photo ${index + 1}: download failed`);
        continue;
      }
    }

    const size = measure(readFileSync(dest));
    if (!size) {
      console.error(`    photo ${index + 1}: unknown format`);
      continue;
    }

    images.push({ file: `${id}/${name}`, ...size, orient: size.h > size.w ? 'portrait' : 'landscape', source: url });
  }

  const portrait = images.filter((i) => i.orient === 'portrait');
  const landscape = images.filter((i) => i.orient !== 'portrait');

  return {
    images,
    poster: (portrait[0] ?? landscape[0])?.file ?? null,
    banner: (landscape[0] ?? portrait[0])?.file ?? null,
    hero: (landscape[landscape.length - 1] ?? portrait[0])?.file ?? null,
  };
}

// ============================== MEMORY ============================== //

/**
 * Which events we already know the owner of.
 *
 * Without this every run opened all 22 events of a venue to keep one. With the
 * scraper running every three hours that is ~200 daily requests to a third
 * party that rate-limits. With memory a normal run is two requests: the venue
 * listing (always read, so new events are found just as fast) and the pages
 * of our own events.
 */
function loadMemory() {
  if (process.argv.includes('--forget') || !existsSync(OUTPUT)) return { ours: [], others: [] };
  try {
    const prev = JSON.parse(readFileSync(OUTPUT, 'utf8'));
    return { ours: prev.known?.ours ?? [], others: prev.known?.others ?? [] };
  } catch {
    return { ours: [], others: [] };
  }
}

// ============================== EXTRACTION ============================== //

async function providerEvents(provider) {
  const html = await get(`${BASE}/${provider}`);
  const ids = new Set();
  for (const m of html.matchAll(new RegExp(`provider/${provider}/event/(\\d+)`, 'g'))) ids.add(Number(m[1]));
  return [...ids];
}

/**
 * The fact sheet is label/value pairs. Read by label, not position: Dinaticket
 * omits rows that do not apply, so the order is not stable.
 */
function factSheet($) {
  const rows = new Map();

  $('[class*="detail-info-box__list-item"]').each((_, el) => {
    const $el = $(el);
    const label = $el.find('.detail-info-box__list-item-title, strong, b').first().text().trim();
    const full = $el.text().replace(/\s+/g, ' ').trim();

    if (label) {
      rows.set(stripAccents(label), full.slice(label.length).trim());
      return;
    }
    for (const key of ['Duración', 'Edad mínima', 'Categoría', 'Fechas del evento']) {
      if (full.startsWith(key)) rows.set(stripAccents(key), full.slice(key.length).trim());
    }
  });

  return rows;
}

/** `<p>` are the synopsis, `<li>` the selling points ("title: text"). */
function description($) {
  const block = $('.detail-info-box__description').first();
  if (!block.length) return { paragraphs: [], points: [] };

  const paragraphs = [];
  block.find('p').each((_, el) => {
    const t = $(el).text().replace(/\s+/g, ' ').trim();
    if (t) paragraphs.push(t);
  });

  const points = [];
  block.find('li').each((_, el) => {
    const $el = $(el);
    const title = $el.find('strong, b').first().text().replace(/\s*:\s*$/, '').trim();
    const full = $el.text().replace(/\s+/g, ' ').trim();
    const text = title ? full.slice(full.indexOf(title) + title.length) : full;
    points.push({ title: title || null, text: text.replace(/^\s*:\s*/, '').trim() });
  });

  return { paragraphs, points };
}

/** Venue, address and coordinates, from the map config JSON in a `<script>`. */
function location(html) {
  const m = html.match(/GMapEventOptions\s*=\s*(\{.*?\});/s);
  if (!m) return null;
  try {
    const cfg = JSON.parse(m[1]);
    return {
      venue: cfg.textoLocalizacion ?? null,
      address: cfg.textoDireccion ?? null,
      geo: Number.isFinite(cfg.latitud) && Number.isFinite(cfg.longitud) ? { lat: cfg.latitud, lon: cfg.longitud } : null,
    };
  } catch {
    return null;
  }
}

/**
 * Prices, read per price row.
 *
 * Each row carries its final price and, when discounted, the struck original
 * (`<del class="origin-price">`). `priceFrom` is the cheapest final price and
 * `priceFull` is the original OF THAT SAME ROW. Taking the page's max instead
 * would call a VIP tier "the full price" and advertise a discount that does
 * not exist.
 *
 * Pages without price rows fall back to scanning the HTML for amounts.
 */
export function prices($, html) {
  const rows = [];

  $('.js-price-row').each((_, el) => {
    const $el = $(el);
    const final = euros($el.attr('data-price-value')) ?? euros($el.find('ins.final-price').first().text());
    if (final == null || final <= 0) return;
    const original = euros($el.find('del').first().text());
    rows.push({ final, original: original && original > final ? original : null });
  });

  if (rows.length) {
    const cheapest = rows.reduce((a, b) => (b.final < a.final ? b : a));
    return { priceFrom: cheapest.final, priceFull: cheapest.original };
  }

  const amounts = [...new Set([...html.matchAll(/(\d+(?:[.,]\d{1,2})?)\s*(?:&euro;|€)/g)].map((m) => Number(m[1].replace(',', '.'))))].filter((n) => n > 0);
  if (!amounts.length) return { priceFrom: null, priceFull: null };
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  return { priceFrom: min, priceFull: max > min ? max : null };
}

/**
 * Sessions on sale. The date comes from `data-date`, already ISO: rebuilding
 * it from the visible day and month means guessing the year, which breaks at
 * every new year and on 29 February.
 */
function performances($, ticketing) {
  const today = localToday();
  const out = [];

  $('.js-session-row').each((_, el) => {
    const $s = $(el);
    const date = $s.attr('data-date');
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today) return;

    const raw = $s.find('.session-card__time-session').first().text().trim();
    const m = raw.replace(/\s/g, '').match(/^(\d{1,2})[:h.]?(\d{2})?/);
    if (!m) return;
    const time = `${m[1].padStart(2, '0')}:${m[2] ?? '00'}`;

    const quotas = $s.find('.js-quota-row');
    let capacity = null;
    let stock = null;

    if (quotas.length) {
      capacity = 0;
      stock = 0;
      quotas.each((_, q) => {
        capacity += int($(q).attr('data-quota-total'));
        stock += int($(q).attr('data-stock'));
      });
    } else {
      const available = $s.attr('data-stock-available');
      if (available != null && available !== '') stock = int(available, null);
    }

    const url = `${BASE}/${ticketing.provider}/event/${ticketing.event}/fecha-${date}/`;

    out.push({
      date,
      time,
      status: availability(stock, capacity),
      venue: $s.attr('data-location-name') ?? null,
      city: $s.attr('data-location-city') ?? null,
      buyUrl: `${url}?widget`,
      externalUrl: url,
    });
  });

  return sortPerformances(out);
}

/** Event photos on the CDN, one per photo id (the last segment is just the crop). */
function photos(html) {
  const seen = new Map();
  for (const m of html.matchAll(/https:\/\/cdn\.atrapalo\.com\/common\/photo\/event\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi)) {
    const parts = m[0].split('/');
    const photoId = parts[parts.length - 2];
    if (!seen.has(photoId)) seen.set(photoId, m[0]);
  }
  return [...seen.values()];
}

async function eventPage(provider, event, { filter, aliases, surname }) {
  const html = await get(`${BASE}/${provider}/event/${event}`);
  const $ = cheerio.load(html);

  const artistBlock = $('.artists').text().replace(/\s+/g, ' ').trim();

  if (filter && !isArtists(artistBlock, aliases)) {
    return {
      rejected: artistBlock.replace(/^artistas?\s*:\s*/i, '') || '(no artist)',
      suspicious: isSuspicious(artistBlock, surname),
    };
  }

  const title = $('h1').first().text().replace(/\s+/g, ' ').trim();
  const facts = factSheet($);
  const { paragraphs, points } = description($);
  const place = location(html) ?? {};
  const ticketing = { provider, event };
  const signature = artistBlock.replace(/^artistas?\s*:\s*/i, '').trim();
  const city = $('.js-session-row').first().attr('data-location-city') ?? null;
  const name = cleanTitle(title, signature, city, aliases);

  return {
    id: slug(name),
    name,
    /** Dinaticket's own title, to trace the source. */
    sourceName: title,
    artist: signature,
    ticketing,
    category: facts.get('categoria') ?? null,
    description: paragraphs,
    highlights: points,
    venue: place.venue ?? null,
    venueAddress: place.address ?? null,
    location: city,
    geo: place.geo ?? null,
    duration: minutes(facts.get('duracion')),
    minAge: number(facts.get('edad minima')),
    ...prices($, html),
    photos: photos(html),
    performances: performances($, ticketing),
    sourceUrl: `${BASE}/${provider}/event/${event}`,
  };
}

// ============================== MERGE ============================== //

/**
 * Merges the same show coming from several targets.
 *
 * A touring show is one event per theatre, each with its own provider and id.
 * For the visitor it is one show: one landing with all dates, not two pages
 * competing in Google for the same title. Each performance keeps its own buy
 * link and venue, so nothing is lost.
 */
export function merge(list) {
  const byId = new Map();

  for (const show of list) {
    const prev = byId.get(show.id);
    const source = { ...show.ticketing, sourceUrl: show.sourceUrl, venue: show.venue };

    if (!prev) {
      byId.set(show.id, { ...show, performances: [...show.performances], sources: [source] });
      continue;
    }

    prev.sources.push(source);
    prev.performances.push(...show.performances);

    // The more complete page wins on fields that may be empty.
    for (const field of ['duration', 'minAge', 'category', 'venueAddress', 'geo']) {
      if (prev[field] == null && show[field] != null) prev[field] = show[field];
    }
    if (show.description.length > prev.description.length) prev.description = show.description;
    if (show.highlights.length > prev.highlights.length) prev.highlights = show.highlights;
    if (show.photos.length > prev.photos.length) prev.photos = show.photos;
    if (show.priceFrom != null && (prev.priceFrom == null || show.priceFrom < prev.priceFrom)) {
      prev.priceFrom = show.priceFrom;
      prev.priceFull = show.priceFull;
    }
  }

  for (const show of byId.values()) {
    const seen = new Set();
    show.performances = sortPerformances(
      show.performances.filter((p) => {
        const key = `${p.date}|${p.time}|${p.venue ?? ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }),
    );

    // Main `ticketing` is the event holding the next performance: the right
    // link when only one can be shown.
    const next = show.performances[0];
    if (next && show.sources.length > 1) {
      const owner = show.sources.find((s) => next.buyUrl.includes(`/event/${s.event}/`));
      if (owner) {
        show.ticketing = { provider: owner.provider, event: owner.event };
        show.venue = owner.venue ?? show.venue;
      }
    }

    show.venues = [...new Set(show.performances.map((p) => p.venue).filter(Boolean))];
    delete show.sourceUrl;
  }

  return [...byId.values()];
}

// ================================ MAIN ================================ //

/**
 * Everything below only runs when executed directly, so the pure functions
 * above can be imported by the tests without scraping anything. The artist
 * filter is what decides whether a show exists on the site, and its dangerous
 * failure (rejecting the artist over a spelling) has no symptom. Testing it
 * without the network is the difference between checking and assuming.
 */
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const dry = process.argv.includes('--dry');
  const { targets, aliases, surname } = loadConfig();

  const found = [];
  const rejected = [];
  const suspicious = [];
  let errors = 0;
  let consecutive429 = 0;

  const memory = loadMemory();
  const ours = new Set(memory.ours);
  const others = new Set(memory.others);

  for (const target of targets) {
    const label = `${target.name ?? target.provider} [${target.type}]`;
    let events;

    try {
      events = target.type === 'event' ? [target.event] : await providerEvents(target.provider);
    } catch (e) {
      console.error(`${label}: could not list (${e.message})`);
      errors += 1;
      continue;
    }

    const filter = target.type !== 'own';
    const pending = events.filter((e) => !others.has(e));
    const skipped = events.length - pending.length;

    console.error(`${label}: ${events.length} events, ${pending.length} to read${skipped ? ` (${skipped} known to be others')` : ''}`);

    for (const event of pending) {
      await sleep(PAUSE_MS);

      try {
        const result = await eventPage(target.provider, event, { filter, aliases, surname });

        if (result.rejected) {
          others.add(event);
          rejected.push(`${event} (${result.rejected})`);
          if (result.suspicious) suspicious.push(`${event}: ${result.rejected}`);
          continue;
        }

        ours.add(event);
        found.push(result);
        consecutive429 = 0;
        console.error(`  ✓ ${event}  ${result.name}  (${result.performances.length} performances)`);
      } catch (e) {
        console.error(`  ! ${event}: ${e.message}`);
        errors += 1;

        // Three 429 in a row is not bad luck, it is a block. Each further page
        // would burn a minute of retries to fail the same way.
        if (/HTTP 429/.test(e.message)) {
          if (++consecutive429 >= 3) {
            console.error('\nStopping: 3 consecutive 429s. Dinaticket is limiting this IP (common on shared CI runners). Longer pauses do not help; the next run usually gets through.\n');
            process.exit(2);
          }
        } else {
          consecutive429 = 0;
        }
      }
    }
  }

  const shows = merge(found);

  // Photos after merging: a touring show shares its images, no point fetching twice.
  if (!process.argv.includes('--no-photos')) {
    for (const show of shows) {
      const { images, poster, banner, hero } = await fetchPhotos(show.id, show.photos);
      Object.assign(show, { images, poster, banner, hero });
      delete show.photos;
      console.error(`  ${show.id}: ${images.length} photos (poster: ${poster ?? 'none'})`);
    }
  }

  console.error(`\nshows: ${found.length} found, ${shows.length} after merge`);
  console.error(`rejected by artist: ${rejected.length}`);
  console.error(`errors: ${errors}`);

  if (suspicious.length) {
    console.error(`\nHEADS UP: rejected events mentioning "${surname}". Missing alias?`);
    for (const line of suspicious) console.error(`  ${line}`);
  }

  /**
   * Nothing found, nothing written. An empty file would publish an empty
   * schedule, which is worse than a stale one: the visitor concludes there are
   * no shows and leaves.
   */
  if (!shows.length) {
    console.error('\nNo show recognised. Nothing written.');
    console.error(`Rejected: ${rejected.join(', ') || '(none)'}`);
    console.error(`Accepted aliases: ${aliases.join(', ') || '(none)'}`);
    process.exit(1);
  }

  const sorted = shows.sort((a, b) => a.id.localeCompare(b.id));
  const known = { ours: [...ours].sort((a, b) => a - b), others: [...others].sort((a, b) => a - b) };

  if (dry) {
    console.log(JSON.stringify({ scrapedAt: new Date().toISOString(), known, shows: sorted }, null, 2));
  } else {
    /**
     * If only the timestamp changed, the file is left alone. Otherwise every
     * run is a commit that says nothing. Memory counts as a change though, or
     * the first classification would never be saved.
     */
    const previous = existsSync(OUTPUT) ? JSON.parse(readFileSync(OUTPUT, 'utf8')) : null;
    const same =
      previous &&
      JSON.stringify(previous.shows) === JSON.stringify(sorted) &&
      JSON.stringify(previous.known ?? null) === JSON.stringify(known);

    if (same) {
      console.error('\nNo changes: file left as it was.');
    } else {
      mkdirSync(resolve('src/data/ticketing'), { recursive: true });
      writeFileSync(OUTPUT, JSON.stringify({ scrapedAt: new Date().toISOString(), known, shows: sorted }, null, 2) + '\n', 'utf8');
      console.error(`\nWrote ${OUTPUT}: ${shows.length} shows.`);
    }
  }
}
