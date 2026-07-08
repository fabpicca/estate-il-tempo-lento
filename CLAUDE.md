# Estate, il tempo lento

Sito archivio personale che affianca testi originali a immagini generate con AI,
pubblicati anche su Threads (@fabpicca). Questo file è il contesto di progetto
per Claude Code: decisioni già prese, struttura, e cosa manca ancora.

## Stack

- **Astro** (static site generator, no server/database)
- Contenuto in **Markdown**, tramite Astro content collections
- Deploy su **Netlify o Vercel**, free tier, auto-deploy da git
- Nessun framework frontend (no React/Vue) a meno che non serva in seguito

## Lingua

Solo italiano per ora. `lang="it"` fissato in `src/layouts/Base.astro`.
Nessuna i18n configurata — se in futuro serve l'inglese, va progettata da capo
(routing per lingua, non è un aggiunta banale).

## Convenzioni di contenuto — DECISE, non cambiare senza motivo

- **Un post al giorno, non di più.** Il sistema non supporta più post nello
  stesso giorno.
- **Niente campo `title`.** La data è l'unico identificativo del pezzo.
- **Niente corpo del post.** Il contenuto testuale è solo l'`excerpt`: il file
  markdown ha solo frontmatter, nessun testo dopo il `---` di chiusura.
- **Filename interno:** `src/content/posts/YYYY-MM-DD.md` (es. `2026-07-08.md`).
  Il filename e la data nel frontmatter devono sempre coincidere — se
  divergono, l'ordinamento e lo slug si disallineano silenziosamente.
- **URL pubblico:** `/estate-il-tempo-lento/dd-mm-yyyy` (es.
  `/estate-il-tempo-lento/08-07-2026`). Formato italiano, generato a build
  time da `src/utils/slug.ts` (`dateToSlug`), non dal filename.
- **Immagini:** in `public/images/`, nominate con la stessa data
  (es. `public/images/2026-07-08.jpg`). Path riferito nel frontmatter
  (`image:`).
- **Frontmatter schema** (`src/content/config.ts`):
  ```yaml
  date: 2026-07-08       # obbligatorio
  image: "/images/2026-07-08.jpg"   # obbligatorio
  excerpt: "..."          # il testo del post (unico contenuto testuale)
  ```

## Guardrail già implementato

`src/pages/estate-il-tempo-lento/[slug].astro` fa un check in
`getStaticPaths()`: se due post risolvono nello stesso slug (stessa data),
il **build fallisce con errore esplicito** invece di far sovrascrivere
silenziosamente un post dall'altro. Non rimuovere questo controllo.

## Struttura file

```
src/
  content/
    config.ts              # schema Zod per la collection "posts" (glob loader)
    posts/
      2026-07-08.md         # post di esempio
  layouts/
    Base.astro              # layout, lang="it", baseline di stile globale
  pages/
    index.astro             # ROOT = listato archivio, griglia thumbnail
    estate-il-tempo-lento/
      [slug].astro            # pagina singolo post, routing su data
  utils/
    slug.ts                 # dateToSlug(): Date -> "dd-mm-yyyy" (slug pubblico)
    date.ts                 # formatItalianDate(): Date -> "8 luglio 2026" (UI)
```

Progetto Astro completo e funzionante (`package.json`, `astro.config.mjs`,
`tsconfig.json`). Astro 5, content collections con `glob` loader. Build statico
verificato con `npm run build`.

## Layout e rotte — DECISE

- **Root `/`**: listato dell'archivio, griglia di thumbnail (immagine con data
  ed excerpt in overlay), ordinato dal più recente. È la home.
- **Dettaglio** (`/estate-il-tempo-lento/dd-mm-yyyy`): immagine a tutto schermo
  (`object-fit: cover`) con il testo del post in overlay in basso su gradiente.
- **`/estate-il-tempo-lento`** (senza slug): redirect a `/`, così i vecchi link
  alla sezione non si rompono. Configurato in `astro.config.mjs`.
- **Styling**: baseline nel `<style is:global>` di `Base.astro` (reset, font
  serif, palette calda via CSS custom properties); stili di pagina scoped nei
  singoli `.astro`. Volutamente essenziale, si può evolvere.

## Cosa manca / non ancora deciso

- **Ottimizzazione immagini**: `astro:assets` non configurato. Le immagini
  sono referenziate come path statici in `public/`, senza resize automatico.
  In listato è attivo `loading="lazy"`; nel dettaglio l'immagine è eager.
- **RSS/feed**: non richiesto finora.
- **Componente per embedding da Threads**: se si vuole linkare o incorporare
  i post originali di Threads, non è stato ancora progettato.

## Aggiungere un post

Skill di progetto **`/nuovo-post`** (`.claude/skills/nuovo-post/`): basta fornire
data, testo e immagine e crea il markdown, copia/converte l'immagine con i nomi
giusti, valida (un post al giorno, filename = data) e fa il build di verifica.
Da preferire al lavoro manuale.

## Setup rapido

```bash
npm install
npm run dev      # sviluppo
npm run build    # build statico in dist/
```
