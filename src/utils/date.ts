// Formattazione della data per la UI (es. "8 luglio 2026").
// `timeZone: 'UTC'` perché le date del frontmatter sono a mezzanotte UTC:
// senza, in fusi negativi il giorno mostrato slitterebbe indietro.
const italianDate = new Intl.DateTimeFormat('it-IT', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatItalianDate(date: Date): string {
  return italianDate.format(date);
}
