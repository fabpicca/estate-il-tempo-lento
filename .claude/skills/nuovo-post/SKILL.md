---
name: nuovo-post
description: Aggiunge un nuovo post all'archivio "Estate, il tempo lento". Usa quando l'utente vuole pubblicare/creare/aggiungere un post (una data, un excerpt e un'immagine). Crea il file markdown in src/content/posts/YYYY-MM-DD.md e converte l'immagine in public/images/YYYY-MM-DD.webp rispettando le convenzioni del progetto, poi verifica con un build.
---

# Nuovo post — Estate, il tempo lento

Crea un nuovo post dell'archivio rispettando le convenzioni fissate in `CLAUDE.md`.
L'obiettivo è che l'utente fornisca solo **data, excerpt e immagine**: pensa tu a
nomi file, frontmatter, conversione immagine e validazioni.

## 1. Raccogli le informazioni

Servono tre cose. Se qualcuna manca, **chiedila** prima di procedere:

- **Data** (`YYYY-MM-DD`). Se l'utente non la specifica, proponi **oggi** e
  conferma. È l'unico identificativo del pezzo.
- **Excerpt**: la frase breve del post, mostrata in overlay sulla thumbnail e
  come testo nel dettaglio. È l'unico contenuto testuale del pezzo — i post
  **non hanno un corpo separato** né titolo `#`. Se l'utente non lo dà, chiedilo.
- **Immagine**: il modo più comodo è che l'utente **incolli l'immagine** in
  chat (copia-incolla). Claude Code la salva su disco e ti passa il percorso
  come `[Image: source: /Users/.../.claude/image-cache/<sessione>/N.png]`: usa
  **quel percorso** come sorgente per la conversione al punto 3 — sono i byte
  originali, nessuna perdita. In alternativa l'utente può darti un **percorso
  file** (es. `~/Desktop/foto.png`) o metterlo già in `public/images/`.
  NON provare a ricostruire l'immagine dai pixel che "vedi": usa sempre il file.

## 2. Valida la data (STOP se fallisce)

- Formato esatto `YYYY-MM-DD`.
- **Un solo post al giorno.** Se `src/content/posts/YYYY-MM-DD.md` esiste già,
  **fermati** e avvisa l'utente: il sistema non supporta due post nello stesso
  giorno (il build fallirebbe apposta). Chiedi se vuole un'altra data o
  sovrascrivere quello esistente.

## 3. Prepara l'immagine — converti in WebP

L'archivio usa **WebP** per tutte le immagini (vedi "Pipeline immagini" in
`CLAUDE.md`): un PNG dal generatore AI pesa ~2.5 MB, in WebP ~150 KB. Converti
**sempre** in WebP, qualità 82, con destinazione `public/images/YYYY-MM-DD.webp`
(stesso nome della data). Non copiare il PNG/JPG originale nel repo.

```bash
# sostituisci <SORGENTE> (png/jpg) e <DATA>
cwebp -q 82 "<SORGENTE>" -o "public/images/<DATA>.webp"
```

`cwebp` (libwebp) è già installato. Verifica l'esito con
`ls -la public/images/<DATA>.webp` (deve essere nell'ordine delle centinaia di
KB, non dei MB). Se l'immagine è enorme puoi anche limitarne il lato lungo
aggiungendo `-resize 2400 0` (0 = mantieni proporzioni) prima di `-o`.

## 4. Crea il file markdown

Percorso: `src/content/posts/YYYY-MM-DD.md`. Il **filename deve coincidere** con
il campo `date` del frontmatter, altrimenti slug e ordinamento si disallineano.

Il file ha **solo frontmatter**, nessun corpo dopo il `---` di chiusura.

```markdown
---
date: YYYY-MM-DD
image: "/images/YYYY-MM-DD.webp"
excerpt: "..."
---
```

Regole del frontmatter (schema in `src/content/config.ts`):
- `date`: senza virgolette, formato `YYYY-MM-DD`. Obbligatorio.
- `image`: path pubblico `"/images/YYYY-MM-DD.webp"` (sempre `.webp`, come il
  file convertito al punto 3). Obbligatorio.
- `excerpt`: la frase del post. È l'unico testo del pezzo — non aggiungere un
  corpo sotto il frontmatter.

## 5. Verifica

Esegui il build e controlla che passi e che generi la rotta attesa:

```bash
npm run build
```

La pagina del post sarà su `/estate-il-tempo-lento/dd-mm-yyyy` (formato italiano,
generato da `src/utils/slug.ts` — es. `2026-07-09` → `/estate-il-tempo-lento/09-07-2026`).

Se un dev server è già attivo (`npm run dev`) il post appare in hot-reload:
dà all'utente l'URL locale del nuovo post per il controllo visivo.

## 6. Riepiloga

Comunica: file creato, immagine copiata, URL pubblico del post, esito del build.
Non fare `git commit` a meno che l'utente non lo chieda esplicitamente.
