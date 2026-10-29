/** Rozdelí zoznam adries oddelených čiarkou, bodkočiarkou alebo medzerou. */
export function splitEmails(value: string): string[] {
  return value
    .split(/[\s,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}
