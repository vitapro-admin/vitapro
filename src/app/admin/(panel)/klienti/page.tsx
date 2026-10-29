import { requireAdminPage } from '@/lib/auth'
import { saveClientNoteAction, setClientStatusAction } from '@/app/admin/actions'
import { AdminTitle, Badge, Empty, FilterTabs } from '@/components/admin/ui'
import { formatDateTimeSk } from '@/lib/email/templates'
import { createServiceClient } from '@/lib/supabase/server'
import { PROFILE_STATUS_LABEL, type Address, type Profile, type ProfileStatus } from '@/lib/types'

export const metadata = { title: 'Klienti' }

const TONE: Record<ProfileStatus, 'warn' | 'ok' | 'danger'> = { pending: 'warn', approved: 'ok', blocked: 'danger' }

export default async function AdminClientsPage({ searchParams }: PageProps<'/admin/klienti'>) {
  await requireAdminPage()
  const { stav, q } = await searchParams
  const status = typeof stav === 'string' && stav in PROFILE_STATUS_LABEL ? (stav as ProfileStatus) : ''
  const query = typeof q === 'string' ? q.trim() : ''

  const db = createServiceClient()
  let req = db.from('profiles').select('*, addresses(*)').order('created_at', { ascending: false }).limit(300)
  if (status) req = req.eq('status', status)
  if (query) {
    const like = `%${query.replace(/[%_,()"\\]/g, '')}%`
    req = req.or(`company_name.ilike.${like},ico.ilike.${like},email.ilike.${like},contact_name.ilike.${like}`)
  }
  const [{ data: clients }, { count: pending }] = await Promise.all([
    req,
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  return (
    <>
      <AdminTitle title="Klienti" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <FilterTabs
          basePath="/admin/klienti"
          param="stav"
          current={status}
          options={[['', 'Všetci'], ['pending', 'Čakajú na schválenie', pending ?? 0], ['approved', 'Schválení'], ['blocked', 'Zablokovaní']]}
        />
        <form>
          {status && <input type="hidden" name="stav" value={status} />}
          <input name="q" defaultValue={query} placeholder="Firma, IČO, email" className="field !w-56 !py-1.5 text-sm" />
        </form>
      </div>

      {(clients ?? []).length === 0 ? (
        <Empty>Žiadni klienti.</Empty>
      ) : (
        <ul className="space-y-4">
          {(clients as (Profile & { addresses: Address[] })[]).map((c) => (
            <li key={c.id} className="rounded-xl border border-line p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="text-sm leading-relaxed">
                  <p className="flex flex-wrap items-center gap-2 text-base font-medium">
                    {c.company_name || '(bez názvu)'}
                    <Badge tone={TONE[c.status]}>{PROFILE_STATUS_LABEL[c.status]}</Badge>
                    {c.ico_known ? <Badge tone="info">IČO v zozname klientov</Badge> : <Badge>IČO nie je v zozname</Badge>}
                    {c.role === 'admin' && <Badge>{c.is_superadmin ? 'superadmin' : 'admin'}</Badge>}
                  </p>
                  <p className="text-ink-soft">
                    IČO {c.ico || '—'}
                    {c.dic && ` · DIČ ${c.dic}`}
                    {c.ic_dph && ` · IČ DPH ${c.ic_dph}`}
                  </p>
                  <p className="text-ink-soft">
                    {c.contact_name} · <a href={`mailto:${c.email}`} className="underline underline-offset-4">{c.email}</a>
                    {c.phone && ` · ${c.phone}`}
                  </p>
                  <p className="text-xs text-ink-mute">Registrácia {formatDateTimeSk(c.created_at)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {c.status !== 'approved' && (
                    <form action={setClientStatusAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="status" value="approved" />
                      <button className="btn btn-primary !py-2 text-sm">Schváliť</button>
                    </form>
                  )}
                  {c.status !== 'blocked' && c.role !== 'admin' && (
                    <form action={setClientStatusAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="status" value="blocked" />
                      <button className="btn btn-ghost !py-2 text-sm text-danger">{c.status === 'pending' ? 'Zamietnuť' : 'Zablokovať'}</button>
                    </form>
                  )}
                </div>
              </div>

              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-ink-mute hover:text-ink">Adresy a poznámka</summary>
                <div className="mt-3 grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-ink-mute">Fakturačná: {c.billing_street}, {c.billing_zip} {c.billing_city}</p>
                    {c.addresses.filter((a) => !a.archived).map((a) => (
                      <p key={a.id}>
                        <span className="font-medium">{a.label || 'Dodacia'}:</span> {[a.company, a.street, `${a.zip} ${a.city}`].filter(Boolean).join(', ')}
                      </p>
                    ))}
                  </div>
                  <form action={saveClientNoteAction} className="space-y-2">
                    <input type="hidden" name="id" value={c.id} />
                    <label htmlFor={`note-${c.id}`} className="block text-ink-mute">
                      Interná poznámka (zákazník ju nevidí)
                    </label>
                    <textarea id={`note-${c.id}`} name="admin_note" defaultValue={c.admin_note} rows={3} className="field text-sm" />
                    <button className="btn btn-ghost !py-1.5 text-sm">Uložiť poznámku</button>
                  </form>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
