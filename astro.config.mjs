// @ts-check
import { defineConfig } from 'astro/config';

// Sito statico. Nessun framework frontend per ora (vedi CLAUDE.md).
// ATTENZIONE: `site` DEVE essere l'URL di produzione reale. Le anteprime social
// (Open Graph in Base.astro) costruiscono URL assoluti da qui: se il dominio è
// sbagliato, le immagini di anteprima non caricano su Threads/X/WhatsApp.
export default defineConfig({
  site: 'https://estate-il-tempo-lento.vercel.app',
  // Il listato vive sulla root `/`. La vecchia sezione index reindirizza lì,
  // così i vecchi link a `/estate-il-tempo-lento/` non si rompono. I singoli
  // post restano su `/estate-il-tempo-lento/dd-mm-yyyy`.
  redirects: {
    '/estate-il-tempo-lento': '/',
  },
});
