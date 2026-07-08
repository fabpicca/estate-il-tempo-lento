/**
 * dateToSlug: Date -> "dd-mm-yyyy" (formato italiano).
 *
 * È la fonte di verità dello slug pubblico (`/estate-il-tempo-lento/dd-mm-yyyy`),
 * NON il filename. Usa i getter UTC perché le date del frontmatter YAML sono
 * parse-ate a mezzanotte UTC: usare i getter locali sfaserebbe il giorno per chi
 * builda in fusi orari negativi.
 */
export function dateToSlug(date: Date): string {
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = date.getUTCFullYear();
  return `${dd}-${mm}-${yyyy}`;
}
