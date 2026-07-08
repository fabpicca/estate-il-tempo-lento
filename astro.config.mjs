// @ts-check
import { defineConfig } from 'astro/config';

// Sito statico. Nessun framework frontend per ora (vedi CLAUDE.md).
// `site` va impostato con l'URL di produzione una volta scelto Netlify/Vercel.
export default defineConfig({
  site: 'https://estate-il-tempo-lento.example',
  // Il listato vive sulla root `/`. La vecchia sezione index reindirizza lì,
  // così i vecchi link a `/estate-il-tempo-lento/` non si rompono. I singoli
  // post restano su `/estate-il-tempo-lento/dd-mm-yyyy`.
  redirects: {
    '/estate-il-tempo-lento': '/',
  },
});
