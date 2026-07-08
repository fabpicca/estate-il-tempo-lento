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
  excerpt: "..."          # opzionale
  ```

## Guardrail già implementato

`src/pages/estate-il-tempo-lento/[slug].astro` fa un check in
`getStaticPaths()`: se due post risolvono nello stesso slug (stessa data),
il **build fallisce con errore esplicito** invece di far sovrascrivere
silenziosamente un post dall'altro. Non rimuovere questo controllo.

## Struttura file (scaffold esistente)

```
src/
  content/
    config.ts              # schema Zod per la collection "posts"
    posts/
      2026-07-08.md         # post di esempio
  layouts/
    Base.astro              # layout minimo, lang="it", nessuno styling
  pages/
    estate-il-tempo-lento/
      index.astro            # listing archivio, ordinato dal più recente
      [slug].astro            # pagina singolo post, routing su data
  utils/
    slug.ts                 # dateToSlug(): Date -> "dd-mm-yyyy"
```

Questo scaffold non è ancora un progetto Astro completo (manca
`astro.config.mjs`, `package.json`, ecc.) — va inizializzato con
`npm create astro@latest` e questi file vanno innestati sopra.

## Cosa manca / non ancora deciso

- **Styling**: nessuno, di proposito. Da progettare.
- **Ottimizzazione immagini**: `astro:assets` non configurato. Le immagini
  sono referenziate come path statici in `public/`, senza resize/lazy-load
  automatico.
- **RSS/feed**: non richiesto finora.
- **Componente per embedding da Threads**: se si vuole linkare o incorporare
  i post originali di Threads, non è stato ancora progettato.

## Setup rapido

```bash
npm create astro@latest    # template minimale, non "blog"
# copiare dentro: src/content/, src/layouts/, src/pages/estate-il-tempo-lento/, src/utils/
npm run dev
```
