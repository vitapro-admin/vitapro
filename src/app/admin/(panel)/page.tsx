import { requireAdminPage } from '@/lib/auth'
import Link from 'next/link'
import { AdminTitle, Badge, Empty, FilterTabs } from '@/components/admin/ui'
import { formatDateTimeSk } from '@/lib/email/templates'
import { cancelDeadline, isWithinCancelWindow } from '@/lib/orders/cancelWindow'
import { getSettings } from '@/lib/settings'
import { createServiceClient } from '@/lib/supabase/server'
import { ORDER_STATUS_LABEL, RECURRENCE_LABEL, type OrderRow, type OrderStatus } from '@/lib/types'

export const metadata = { title: 'Objednávky' }

const TONE: Record<OrderStatus, 'info' | 'warn' | 'ok' | 'neutral'> = {
  new: 'info',
  processing: 'warn',
  completed: 'ok',
  cancelled: 'neutral',
}

export default async function AdminOrdersPage({ searchParams }: PageProps<'/admin'>) {
  await requireAdminPage()
  const { stav, q } = await searchParams
  const status = typeof stav === 'string' && stav in ORDER_STATUS_LABEL ? (stav as OrderStatus) : ''
  const query = typeof q === 'string' ? q.trim() : ''

  const db = createServiceClient()
  let req = db.from('orders').select('*').order('created_at', { ascending: false }).limit(200)
  if (status) req = req.eq('status', status)
  if (query) {
    const like = `%${query.replace(/[%_,()"\\]/g, '')}%`
    req = req.or(`order_number.ilike.${like},customer->>company_name.ilike.${like},customer->>ico.ilike.${like}`)
  }
  const [{ data: orders }, { count: newCount }, settings] = await Promise.all([
    req,
    db.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    getSettings(),
  ])

  return (
    <>
      <AdminTitle title="Objednávky" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <FilterTabs
          basePath="/admin"
          param="stav"
          current={status}
          options={[['', 'Všetky'], ['new', 'Nové', newCount ?? 0], ['processing', 'Spracováva sa'], ['completed', 'Vybavené'], ['cancelled', 'Zrušené']]}
        />
        <form className="flex gap-2">
          {status && <input type="hidden" name="stav" value={status} />}
          <input name="q" defaultValue={query} placeholder="Číslo, firma, IČO" className="field !w-56 !py-1.5 text-sm" />
        </form>
      </div>

      {(orders ?? []).length === 0 ? (
        <Empty>Žiadne objednávky.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-paper text-left text-xs uppercase tracking-wide text-ink-mute">
              <tr>
                <th className="px-4 py-3 font-medium">Číslo</th>
                <th className="px-4 py-3 font-medium">Vytvorená</th>
                <th className="px-4 py-3 font-medium">Odberateľ</th>
                <th className="px-4 py-3 font-medium">Množstvo</th>
                <th className="px-4 py-3 font-medium">Stav</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(orders as OrderRow[]).map((o) => (
                <tr key={o.id} className="hover:bg-paper/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/objednavky/${o.id}`} className="font-medium underline-offset-4 hover:underline">
                      {o.order_number}
                    </Link>
                    {(!o.internal_email_sent_at || !o.customer_email_sent_at) && (
                      <span title="Niektorý email neodišiel" className="ml-2 text-danger">
                        ✉︎!
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{formatDateTimeSk(o.created_at)}</td>
                  <td className="px-4 py-3">
                    {o.customer.company_name}
                    <span className="block text-xs text-ink-mute">IČO {o.customer.ico}</span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {o.total_units} ks <span className="text-ink-mute">/ {o.crates} prep.</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                    {o.recurrence && (
                      <span className="mt-1 block text-xs text-[#00679a]">
                        {o.replaces_order_id ? 'zmena trvalej' : 'trvalá'} · {RECURRENCE_LABEL[o.recurrence]}
                        {o.standing_ended_at && o.status !== 'cancelled' && ' · ukončená'}
                      </span>
                    )}
                    {o.status === 'new' && isWithinCancelWindow(o.created_at, settings.cancel_window_minutes) && (
                      <span className="mt-1 block text-xs text-warn">
                        zákazník môže zrušiť do{' '}
                        {formatDateTimeSk(cancelDeadline(o.created_at, settings.cancel_window_minutes)!.toISOString()).split(' ').pop()}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
