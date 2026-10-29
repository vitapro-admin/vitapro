import { PageShell } from '@/components/PageShell'

// Kostra právnej stránky. Znenie je návrh na schválenie AQUA PRO EUROPE, a.s.
export function LegalPage({ title, updated, children }: { title: string; updated?: string; children?: React.ReactNode }) {
  return (
    <PageShell eyebrow="Právne informácie" title={title} width="wide" intro={updated ? `Účinné od ${updated}` : undefined}>
      <div className="max-w-3xl space-y-4 leading-relaxed text-ink-soft [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:text-ink [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_strong]:font-medium [&_strong]:text-ink [&_a]:underline [&_a]:underline-offset-4">
        {children ?? (
          <p className="rounded-lg border border-dashed border-line bg-white p-6">
            Text pripravujeme. Znenie dodá AQUA PRO EUROPE, a.s. pred spustením webu.
          </p>
        )}
      </div>
    </PageShell>
  )
}
