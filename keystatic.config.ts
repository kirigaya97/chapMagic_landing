import { config, singleton } from '@keystatic/core';
import { guia, fromSchema } from './src/lib/keystatic/fields';
import { ticketingSingleton, showsTextosCollection } from './src/lib/keystatic/dinaticket';
import ticketingConfig from './ticketing.config.json';
import siteConfig from './src/data/site-config.json';
import events from './src/data/events.json';

// Keystatic Cloud in production, local files in dev.
// PUBLIC_KEYSTATIC_PROJECT overrides the project, e.g. to move it to the client's own team.
const cloudProject = import.meta.env.PROD
  ? import.meta.env.PUBLIC_KEYSTATIC_PROJECT || 'chapmagic/chapmagic'
  : undefined;

// Field helpers, derived schemas and the panel's look come from the astro-keystatic-panel kit
// (src/lib/keystatic/, upgraded with its install.mjs). The site texts' fields derive from the JSON itself.
export default config({
  storage: cloudProject ? { kind: 'cloud' } : { kind: 'local' },
  ...(cloudProject && { cloud: { project: cloudProject } }),
  ui: {
    brand: { name: 'ChapMagic' },
    navigation: {
      Ayuda: ['guia'],
      Web: ['web', 'eventos'],
      Entradas: ['ticketing', 'showsTextos'],
    },
  },

  singletons: {
    guia: guia('src/data/guia'),

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

    ticketing: ticketingSingleton(ticketingConfig),
  },

  collections: {
    showsTextos: showsTextosCollection(ticketingConfig, { translations: { en: 'Inglés (/en/)' } }),
  },
});
