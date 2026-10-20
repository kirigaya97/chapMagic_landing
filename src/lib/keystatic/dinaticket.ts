import { fields, collection, singleton } from '@keystatic/core';
import { texto, parrafo, lista, soloNumeros } from './fields';

/**
 * Panel for sites running the astro-dinaticket-ticketing kit: its sources (`ticketing.config.json`)
 * and the per-show copy (`src/data/ticketing/overrides/*.json`, read by the kit's overrides.ts).
 * Pass the committed config so the landing path field and the show-id hint match the site.
 *
 * Keystatic rejects keys its schema does not know; `_help` is declared as ignored so the kit's notes stay.
 * Ids are saved as text (see soloNumeros); the kit's scraper turns them back into numbers.
 */
type Config = { site?: { landingPath?: string | Record<string, string> } };

/** Example show URL from the landing pattern, for the slug hint: "/es/shows/<id>". */
const showUrl = (landingPath?: string | Record<string, string>) => {
  const p = typeof landingPath === 'string' ? landingPath : Object.values(landingPath ?? {})[0] ?? '/shows/{id}';
  return String(p).replace('{lang}', 'es').replace('{id}', '<id>');
};

export const ticketingSingleton = (config: Config, label = 'Dinaticket: fuentes') => {
  const lp = config.site?.landingPath;
  return singleton({
    label,
    path: 'ticketing.config',
    format: { data: 'json' },
    schema: {
      _help: fields.ignored(), // the kit's how-to notes: kept as they are, not shown
      targets: fields.array(
        fields.object({
          name: texto('Nombre (solo para reconocerla aquí)'),
          type: fields.select({
            label: 'Tipo',
            description:
              'Cuenta propia: todo lo que publica es tuyo. Teatro: publica a muchos artistas, se filtra por tu nombre. Evento suelto: una sola función elegida a mano.',
            options: [
              { label: 'Cuenta propia', value: 'own' },
              { label: 'Teatro (filtra por nombre)', value: 'venue' },
              { label: 'Evento suelto', value: 'event' },
            ],
            defaultValue: 'own',
          }),
          provider: fields.text({
            label: 'Número de proveedor',
            description: 'En la URL de cualquier evento: dinaticket.com/es/provider/20073/event/4951866 → 20073',
            validation: { isRequired: true, pattern: soloNumeros },
          }),
          event: fields.text({
            label: 'Número de evento (solo "Evento suelto")',
            description: 'En la misma URL: el segundo número (4951866)',
            validation: { pattern: soloNumeros },
          }),
          active: fields.checkbox({ label: 'Activa', description: 'Desactívala para pausarla sin borrarla', defaultValue: true }),
          exclude: fields.array(fields.text({ label: 'Número de evento', validation: { isRequired: true, pattern: soloNumeros } }), {
            label: 'Eventos a ocultar',
            description: 'Funciones de esta fuente que no deben salir en la web',
            itemLabel: (p) => p.value,
          }),
        }),
        { label: 'Fuentes', itemLabel: (p) => `${p.fields.name.value || p.fields.provider.value} (${p.fields.type.value})` },
      ),
      artist: fields.object(
        {
          aliases: lista(
            'Nombres del artista',
            'Cómo aparece tu nombre en el campo "Artista" de los teatros. Sin importar tildes ni mayúsculas',
          ),
          surname: texto('Apellido', 'Si un teatro escribe tu nombre distinto, el robot avisa de las funciones con este apellido'),
        },
        { label: 'Cómo te nombran los teatros' },
      ),
      site: fields.object(
        {
          timeZone: texto('Zona horaria'),
          currency: texto('Moneda'),
          country: texto('País'),
          defaultCity: texto('Ciudad por defecto'),
          defaultCategory: texto('Categoría por defecto'),
          landingPath:
            lp && typeof lp === 'object'
              ? fields.object(Object.fromEntries(Object.keys(lp).map((l) => [l, texto(`Ruta de cada show (${l})`)])), { label: 'Rutas' })
              : texto('Ruta de cada show'),
        },
        { label: 'Ajustes técnicos (no tocar)' },
      ),
    },
  });
};

const showTexts = {
  tagline: texto('Línea corta (tarjetas)', 'Vacío = la que genera Dinaticket'),
  hook: parrafo('Gancho (titular de la página)', 'Una promesa, no una descripción. Vacío = primera frase de Dinaticket'),
  description: fields.array(fields.text({ label: 'Párrafo', multiline: true }), {
    label: 'Sinopsis (vacío = la de Dinaticket)',
    itemLabel: (p) => p.value.slice(0, 60),
  }),
  highlights: fields.array(fields.object({ title: texto('Título'), text: parrafo('Texto') }), {
    label: 'Destacados (3 o 4; vacío = los de Dinaticket)',
    itemLabel: (p) => p.fields.title.value,
  }),
  seoDescription: parrafo('Descripción para Google', 'Unos 155 caracteres. Vacío = se genera sola'),
};

/**
 * One file per show in src/data/ticketing/overrides/. `translations` adds a `locales.<code>` block per
 * extra language, e.g. `{ en: 'Inglés (/en/)' }`. The `show` key only names the entry in the panel;
 * the kit's overrides.ts strips it.
 */
export const showsTextosCollection = (
  config: Config,
  { translations = {} as Record<string, string>, label = 'Dinaticket: textos de cada show' } = {},
) =>
  collection({
    label,
    slugField: 'show',
    path: 'src/data/ticketing/overrides/*',
    format: { data: 'json' },
    schema: {
      show: fields.slug({
        name: { label: 'Show (solo para reconocerlo aquí)', description: 'El título en la web sigue siendo el de Dinaticket' },
        slug: {
          label: 'ID del show',
          description: `Debe ser igual al de su página: ${showUrl(config.site?.landingPath)}. Si no coincide, estos textos no se aplican`,
        },
      }),
      ...showTexts,
      ...(Object.keys(translations).length && {
        locales: fields.object(
          Object.fromEntries(
            Object.entries(translations).map(([code, name]) => [
              code,
              fields.object({ name: texto('Título traducido', 'Vacío = el original'), ...showTexts }, { label: name }),
            ]),
          ),
          { label: 'Traducciones' },
        ),
      }),
    },
  });
