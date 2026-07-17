// Endpoint di pubblicazione da mobile per "Estate, il tempo lento".
//
// È una Vercel Serverless Function (cartella /api rilevata automaticamente da
// Vercel, anche se il sito Astro resta 100% statico: nessun adapter richiesto).
//
// Riceve dal form (`/pubblica`) un JSON con:
//   { secret, date: "YYYY-MM-DD", excerpt, image: <base64>, imageType }
// e, se tutto è valido:
//   1. converte l'immagine in WebP q82 (sharp) — conversione autorevole lato server;
//   2. committa `src/content/posts/<date>.md` + `public/images/<date>.webp` in un
//      UNICO commit su GitHub (un commit = un deploy Vercel), rispettando le
//      convenzioni di CLAUDE.md (un post al giorno, filename = data).
//
// Variabili d'ambiente richieste (impostate su Vercel, NON nel codice):
//   PUBLISH_SECRET  password condivisa del form
//   GITHUB_TOKEN    fine-grained PAT, scope: solo questo repo, Contents R/W
//   GITHUB_REPO     "owner/repo", es. "fabpicca/estate-il-tempo-lento"
//   GITHUB_BRANCH   opzionale, default "main"

import sharp from 'sharp';
import { timingSafeEqual } from 'node:crypto';

const GH_API = 'https://api.github.com';
const WEBP_QUALITY = 82;
const MAX_EDGE = 2400; // lato lungo massimo, per non committare immagini enormi

// --- helper GitHub REST ---
async function gh(repo, token, path, { method = 'GET', body } = {}) {
  const res = await fetch(`${GH_API}/repos/${repo}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'estate-il-tempo-lento-publish',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

// Confronto password a tempo costante (evita timing attack sul segreto).
function secretMatches(provided, expected) {
  if (typeof provided !== 'string' || typeof expected !== 'string') return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito.' });
  }

  const { PUBLISH_SECRET, GITHUB_TOKEN, GITHUB_REPO } = process.env;
  const branch = process.env.GITHUB_BRANCH || 'main';
  if (!PUBLISH_SECRET || !GITHUB_TOKEN || !GITHUB_REPO) {
    return res
      .status(500)
      .json({ error: 'Backend non configurato (variabili d\'ambiente mancanti).' });
  }

  // Vercel fa il parse del JSON body automaticamente (Content-Type: application/json).
  const { secret, date, excerpt, image, imageType } = req.body ?? {};

  if (!secretMatches(secret, PUBLISH_SECRET)) {
    return res.status(401).json({ error: 'Password errata.' });
  }

  // --- validazioni (mirror del guardrail di build in CLAUDE.md) ---
  // Il regex vincola la data a sole cifre/trattini: previene anche path traversal,
  // dato che `date` finisce nei percorsi dei file committati.
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Data non valida: usa il formato YYYY-MM-DD.' });
  }
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    return res.status(400).json({ error: 'Data inesistente.' });
  }
  if (typeof excerpt !== 'string' || !excerpt.trim()) {
    return res.status(400).json({ error: 'Excerpt mancante.' });
  }
  if (typeof image !== 'string' || !image) {
    return res.status(400).json({ error: 'Immagine mancante.' });
  }

  const mdPath = `src/content/posts/${date}.md`;
  const imgPath = `public/images/${date}.webp`;

  try {
    // --- un solo post al giorno: se il markdown esiste già, stop ---
    const existing = await gh(GITHUB_REPO, GITHUB_TOKEN, `/contents/${mdPath}?ref=${branch}`);
    if (existing.status === 200) {
      return res.status(409).json({
        error: `Esiste già un post per il ${date}. Un solo post al giorno.`,
      });
    }
    if (existing.status !== 404) {
      const detail = await existing.text();
      return res.status(502).json({ error: `GitHub (check esistenza): ${existing.status} ${detail}` });
    }

    // --- conversione immagine -> WebP q82 (ridimensiona solo se troppo grande) ---
    const inputBuffer = Buffer.from(image, 'base64');
    const webpBuffer = await sharp(inputBuffer)
      .rotate() // rispetta l'orientamento EXIF (foto da telefono)
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    // --- contenuto markdown (solo frontmatter, nessun corpo) ---
    // date NON quotata (lo schema Zod usa z.date()); image/excerpt quotati in modo
    // sicuro con JSON.stringify (produce scalari YAML double-quoted validi).
    const md =
      `---\n` +
      `date: ${date}\n` +
      `image: ${JSON.stringify(`/images/${date}.webp`)}\n` +
      `excerpt: ${JSON.stringify(excerpt.trim())}\n` +
      `---\n`;

    // --- commit atomico via Git Data API (md + immagine in un solo commit) ---
    const refRes = await gh(GITHUB_REPO, GITHUB_TOKEN, `/git/ref/heads/${branch}`);
    if (!refRes.ok) {
      return res.status(502).json({ error: `GitHub (ref): ${refRes.status} ${await refRes.text()}` });
    }
    const baseCommitSha = (await refRes.json()).object.sha;

    const baseCommitRes = await gh(GITHUB_REPO, GITHUB_TOKEN, `/git/commits/${baseCommitSha}`);
    const baseTreeSha = (await baseCommitRes.json()).tree.sha;

    // Blob del markdown (utf-8) e dell'immagine (base64).
    const mdBlob = await (
      await gh(GITHUB_REPO, GITHUB_TOKEN, `/git/blobs`, {
        method: 'POST',
        body: { content: md, encoding: 'utf-8' },
      })
    ).json();
    const imgBlob = await (
      await gh(GITHUB_REPO, GITHUB_TOKEN, `/git/blobs`, {
        method: 'POST',
        body: { content: webpBuffer.toString('base64'), encoding: 'base64' },
      })
    ).json();

    const treeRes = await gh(GITHUB_REPO, GITHUB_TOKEN, `/git/trees`, {
      method: 'POST',
      body: {
        base_tree: baseTreeSha,
        tree: [
          { path: mdPath, mode: '100644', type: 'blob', sha: mdBlob.sha },
          { path: imgPath, mode: '100644', type: 'blob', sha: imgBlob.sha },
        ],
      },
    });
    const newTreeSha = (await treeRes.json()).sha;

    const commitRes = await gh(GITHUB_REPO, GITHUB_TOKEN, `/git/commits`, {
      method: 'POST',
      body: {
        message: `Nuovo post ${date} (da /pubblica)`,
        tree: newTreeSha,
        parents: [baseCommitSha],
      },
    });
    const newCommitSha = (await commitRes.json()).sha;

    const updateRes = await gh(GITHUB_REPO, GITHUB_TOKEN, `/git/refs/heads/${branch}`, {
      method: 'PATCH',
      body: { sha: newCommitSha },
    });
    if (!updateRes.ok) {
      return res.status(502).json({ error: `GitHub (update ref): ${updateRes.status} ${await updateRes.text()}` });
    }

    // URL pubblico: formato italiano dd-mm-yyyy (come src/utils/slug.ts).
    const [y, m, d] = date.split('-');
    const publicUrl = `/estate-il-tempo-lento/${d}-${m}-${y}`;

    return res.status(200).json({
      ok: true,
      message: 'Post pubblicato. Il deploy Vercel parte ora (~30–60s).',
      url: publicUrl,
      commit: newCommitSha,
    });
  } catch (err) {
    return res.status(500).json({ error: `Errore interno: ${err.message}` });
  }
}
