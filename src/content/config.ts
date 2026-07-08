import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Collection "posts": un file per giorno, filename YYYY-MM-DD.md.
// La data è l'unico identificativo del pezzo (niente `title`, vedi CLAUDE.md).
const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    date: z.date(), // obbligatorio — deve coincidere col filename
    image: z.string(), // obbligatorio — path statico in /public/images/
    excerpt: z.string().optional(),
  }),
});

export const collections = { posts };
