import { config, fields, collection, singleton } from '@keystatic/core';
import siteConfig from './src/data/site-config.json';
import events from './src/data/events.json';

// Keystatic Cloud in production, local files in dev.
// PUBLIC_KEYSTATIC_PROJECT overrides the project, e.g. to move it to the client's own team.
const cloudProject = import.meta.env.PROD
  ? import.meta.env.PUBLIC_KEYSTATIC_PROJECT || 'chapmagic/chapmagic'
  : undefined;

// Dinaticket ids are codes, not quantities: plain text (fields.integer shows "20,845" and a +/- spinner).
// The scraper turns them back into numbers.
const soloNumeros = { regex: /^\d*$/, message: 'Solo números, sin puntos ni espacios' };
const texto = (label: string, description?: string) => fields.text({ label, description });
const parrafo = (label: string, description?: string) => fields.text({ label, description, multiline: true });
const lista = (label: string, description?: string) =>
  fields.array(fields.text({ label }), { label, description, itemLabel: (p) => p.value });

// The site texts are big nested JSON (both languages). Instead of a hand-written schema per key,
// the panel fields are derived from the committed file itself, so every text stays editable.
// Arrays keep at least one item so their shape can never be lost.
const LABELS: Record<string, string> = {
  es: 'Castellano', en: 'Inglés', translations: 'Textos', meta: 'SEO (pestaña y Google)', title: 'Título',
  subtitle: 'Subtítulo', description: 'Descripción', metaTitle: 'Título SEO', metaDescription: 'Descripción SEO',
  kicker: 'Etiqueta superior', eyebrow: 'Etiqueta superior', titleAccent: 'Título (parte destacada)', text: 'Texto',
  body: 'Texto', intro: 'Introducción', summary: 'Resumen', cta: 'Botón', items: 'Elementos', name: 'Nombre',
  label: 'Etiqueta', value: 'Valor', author: 'Autor', role: 'Cargo', quotes: 'Citas', sectionTitle: 'Título de la sección',
  nav: 'Menú', navigation: 'Menú (técnico)', hero: 'Portada', shows: 'Shows', jury: 'Jurado', stats: 'Cifras',
  contact: 'Contacto', footer: 'Pie de página', privacy: 'Privacidad', terms: 'Términos', classes: 'Clases',
  ticketing: 'Entradas', sections: 'Apartados', h3: 'Subtítulo', p: 'Párrafo', image: 'Imagen (ruta)', href: 'Enlace',
  id: 'ID (técnico)', slug: 'ID (técnico)', price: 'Precio', unit: 'Unidad', plans: 'Planes', features: 'Características',
  recommended: 'Recomendado', highlights: 'Destacados', highlight: 'Destacado', idealFor: 'Ideal para', tags: 'Etiquetas',
  facts: 'Datos', paragraphs: 'Párrafos', process: 'Pasos', form: 'Formulario', types: 'Tipos de evento',
  common: 'Común a todos', hub: 'Página de eventos', whatsapp: 'WhatsApp', email: 'Email', instagram: 'Instagram',
  youtube: 'YouTube', links: 'Enlaces y vídeos', branding: 'Marca (técnico)', lastUpdated: 'Última actualización',
  successMessage: 'Mensaje de éxito', errorMessage: 'Mensaje de error', success: 'Mensaje de éxito', error: 'Mensaje de error',
  submit: 'Botón enviar', submitButton: 'Botón enviar', submitting: 'Texto mientras se envía', prefix: 'Prefijo',
  whatsappMessage: 'Mensaje precargado de WhatsApp', whatsappTemplate: 'Mensaje precargado de WhatsApp',
  prefillMessage: 'Mensaje precargado de WhatsApp', copyright: 'Copyright', page: 'Página de entradas',
  landing: 'Página de cada show', events: 'Eventos', finalCta: 'Llamada final', pricing: 'Precios', kids: 'Niños',
  course: 'Curso', video: 'Vídeo', icon: 'Icono (técnico)', analyticsId: 'ID de analítica (técnico)',
  imagePosition: 'Encuadre de la imagen (técnico)', weekdays: 'Días de la semana', guests: 'Opciones de invitados',
  lead: 'Introducción', note: 'Nota', waText: 'Mensaje precargado de WhatsApp', caption: 'Pie del vídeo',
  poster: 'Imagen previa (ruta)', src: 'Archivo (ruta)', file: 'Archivo (nombre)', scale: 'Escala del logo',
  phones: 'Teléfonos', display: 'Como se muestra', tel: 'Número para llamar', primary: 'Principal', city: 'Ciudad',
  ui: 'Textos de la interfaz', site: 'Sitio', tagline: 'Lema', quote: 'Frase', awards: 'Premios', detail: 'Detalle',
  external: 'Abre en otra pestaña', servicios: 'Servicios', galeria: 'Galería', videos: 'Vídeos', agasajo: 'La experiencia',
  sobreMi: 'Sobre mí', confian: 'Quienes confían', reviews: 'Opiniones', fab: 'Botón flotante de WhatsApp',
  consent: 'Aviso de cookies', contacto: 'Contacto', clases: 'Clases', disciplinas: 'Disciplinas', modalidades: 'Modalidades',
  clients: 'Clientes (logos)', legal: 'Datos legales', legalName: 'Titular', taxId: 'NIF', address: 'Dirección',
  postalAddress: 'Dirección en campos (Google)', schema: 'Datos para Google (técnico)', eventTypes: 'Tipos de evento',
  url: 'URL', message: 'Mensaje', type: 'Tipo', sending: 'Texto mientras se envía', sent: 'Mensaje enviado',
  failed: 'Mensaje de error', accept: 'Aceptar', reject: 'Rechazar', more: 'Más información',
};
const label = (key: string) => LABELS[key] ?? key.replace(/[-_]/g, ' ').replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());

// One sample per array: object items merged (all keys), strings the longest.
const merge = (items: unknown[]): unknown =>
  items.reduce((a: any, b: any) =>
    a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a)
      ? Object.fromEntries([...new Set([...Object.keys(a), ...Object.keys(b)])].map((k) => [k, k in a && k in b ? merge([a[k], b[k]]) : a[k] ?? b[k]]))
      : typeof a === 'string' && typeof b === 'string' ? (b.length > a.length ? b : a) : a ?? b,
  );
const preview = (p: any): string =>
  p.fields ? Object.values(p.fields).map((f: any) => f.value).find((v) => typeof v === 'string' && v) ?? '' : String(p.value ?? '');

const fromJson = (v: unknown, key: string): any => {
  const l = label(key);
  if (typeof v === 'boolean') return fields.checkbox({ label: l });
  if (typeof v === 'number') return fields.number({ label: l });
  if (Array.isArray(v))
    return fields.array(fromJson(merge(v), key), { label: l, itemLabel: preview, ...(v.length && { validation: { length: { min: 1 } } }) });
  if (v && typeof v === 'object') return fields.object(fromSchema(v as object), { label: l });
  return fields.text({ label: l, multiline: typeof v === 'string' && (v.length > 80 || v.includes('\n')) });
};
const fromSchema = (o: object) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, fromJson(v, k)]));

const showTexts = {
  tagline: fields.text({ label: 'Línea corta (tarjetas)', description: 'Vacío = la que genera Dinaticket' }),
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

export default config({
  storage: cloudProject ? { kind: 'cloud' } : { kind: 'local' },
  ...(cloudProject && { cloud: { project: cloudProject } }),
  ui: {
    brand: { name: 'ChapMagic' },
    navigation: {
      Web: ['web', 'eventos'],
      Entradas: ['ticketing', 'showsTextos'],
    },
  },

  singletons: {
    web: singleton({
      label: 'Web: textos y ajustes',
      path: 'src/data/site-config',
      format: { data: 'json' },
      schema: fromSchema(siteConfig),
    }),

    eventos: singleton({
      label: 'Eventos privados',
      path: 'src/data/events',
      format: { data: 'json' },
      schema: fromSchema(events),
    }),

    ticketing: singleton({
      label: 'Dinaticket: fuentes',
      path: 'ticketing.config',
      format: { data: 'json' },
      schema: {
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
            landingPath: texto('Ruta de cada show'),
          },
          { label: 'Ajustes técnicos (no tocar)' },
        ),
      },
    }),
  },

  collections: {
    showsTextos: collection({
      label: 'Dinaticket: textos de cada show',
      slugField: 'show',
      path: 'src/data/ticketing/overrides/*',
      format: { data: 'json' },
      schema: {
        show: fields.slug({
          name: { label: 'Show (solo para reconocerlo aquí)', description: 'El título en la web sigue siendo el de Dinaticket' },
          slug: {
            label: 'ID del show',
            description: 'Debe ser igual al de su página: /es/shows/<id>. Si no coincide, estos textos no se aplican',
          },
        }),
        ...showTexts,
        locales: fields.object(
          { en: fields.object({ name: texto('Título en inglés', 'Vacío = el original'), ...showTexts }, { label: 'Inglés (/en/)' }) },
          { label: 'Traducciones' },
        ),
      },
    }),
  },
});
