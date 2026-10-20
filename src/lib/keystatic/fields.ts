import { fields, singleton } from '@keystatic/core';

// Small field shorthands, in the vocabulary the panels use.
export const texto = (label: string, description?: string) => fields.text({ label, description });
export const parrafo = (label: string, description?: string) => fields.text({ label, description, multiline: true });
export const lista = (label: string, description?: string) =>
  fields.array(fields.text({ label }), { label, description, itemLabel: (p) => p.value });

/** For codes such as ids or phone digits: fields.integer would show "20,845" and a +/- spinner. */
export const soloNumeros = { regex: /^\d*$/, message: 'Solo números, sin puntos ni espacios' };

/**
 * Read-only how-to page, first in the sidebar (put its key in `ui.navigation`). Plain Markdown, so it
 * also reads fine on GitHub. keystaticPanel() hides the editor chrome for it.
 */
export const guia = (path = 'src/content/guia', label = 'Cómo usar este panel') =>
  singleton({ label, path, format: { contentField: 'contenido' }, schema: { contenido: fields.markdoc({ label: 'Guía', extension: 'md' }) } });

// ---- Schema derived from a JSON file ----
// Big nested site texts (often both languages) get their panel fields from the committed file itself
// instead of a hand-written schema per key, so every text stays editable and a new key shows up alone.
// Arrays keep at least one item so their shape can never be lost.

// Spanish labels for keys that recur across sites. Unknown keys fall back to the key, humanized.
export const LABELS: Record<string, string> = {
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

const humanize = (key: string) => key.replace(/[-_]/g, ' ').replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());

// One sample per array: object items merged (all keys), strings the longest.
const merge = (items: unknown[]): unknown =>
  items.reduce((a: any, b: any) =>
    a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a)
      ? Object.fromEntries([...new Set([...Object.keys(a), ...Object.keys(b)])].map((k) => [k, k in a && k in b ? merge([a[k], b[k]]) : a[k] ?? b[k]]))
      : typeof a === 'string' && typeof b === 'string' ? (b.length > a.length ? b : a) : a ?? b,
  );
const preview = (p: any): string =>
  p.fields ? Object.values(p.fields).map((f: any) => f.value).find((v) => typeof v === 'string' && v) ?? '' : String(p.value ?? '');

const fromJson = (v: unknown, key: string, labels: Record<string, string>): any => {
  const l = labels[key] ?? humanize(key);
  if (typeof v === 'boolean') return fields.checkbox({ label: l });
  if (typeof v === 'number') return fields.number({ label: l });
  if (Array.isArray(v))
    return fields.array(fromJson(merge(v), key, labels), { label: l, itemLabel: preview, ...(v.length && { validation: { length: { min: 1 } } }) });
  if (v && typeof v === 'object') return fields.object(fromSchema(v as object, labels), { label: l });
  return fields.text({ label: l, multiline: typeof v === 'string' && (v.length > 80 || v.includes('\n')) });
};

/**
 * Panel fields for every key of `json`. Labels come from LABELS, then `extraLabels` (wins), then the key
 * itself humanized. Mark keys an editor must not touch with "(técnico)" in their label.
 */
export const fromSchema = (json: object, extraLabels: Record<string, string> = {}) => {
  const labels = { ...LABELS, ...extraLabels };
  return Object.fromEntries(Object.entries(json).map(([k, v]) => [k, fromJson(v, k, labels)])) as Record<string, any>;
};
