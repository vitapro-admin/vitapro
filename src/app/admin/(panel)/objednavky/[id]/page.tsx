import { requireAdminPage } from '@/lib/auth'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { endStandingAdminAction, setOrderStatusAction } from '@/app/admin/actions'
import { AdminTitle } from '@/components/admin/ui'
import { formatDateSk, formatDateTimeSk } from '@/lib/email/templates'
import { buildOrderPayload } from '@/lib/orders/orderPayload'
import { getSettings } from '@/lib/settings'
import { createServiceClient } from '@/lib/supabase/server'
import { ORDER_STATUS_LABEL, RECURRENCE_LABEL, isActiveStanding, type OrderItemRow, type OrderRow, type OrderStatus } from '@/lib/types'
import { ResendEmails } from './ResendEmails'

export const metadata = { title: 'Detail objednávky' }

export default async function AdminOrderDetailPage({ params }: PageProps<'/admin/objednavky/[id]'>) {
  await requireAdminPage()
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound()
  const { data: order } = await createServiceClient()
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .maybeSingle<OrderRow & { order_items: OrderItemRow[] }>()
  if (!order) notFound()

  const settings = await getSettings()
  const db = createServiceClient()
  const [{ data: replaced }, { data: replacedBy }] = await Promise.all([
    order.replaces_order_id
      ? db.from('orders').select('id, order_number').eq('id', order.replaces_order_id).maybeSingle<{ id: string; order_number: string }>()
      : Promise.resolve({ data: null }),
    db.from('orders').select('id, order_number').eq('replaces_order_id', order.id).neq('status', 'cancelled').maybeSingle<{ id: string; order_number: string }>(),
  ])
  const items = [...order.order_items].sort((a, b) => a.line_no - b.line_no)
  const c = order.customer
  const d = order.delivery_address
  const json = JSON.stringify(
    buildOrderPayload({
      orderNumber: order.order_number,
      createdAt: new Date(order.created_at).toISOString(),
      customer: c,
      delivery: d,
      requestedDate: order.requested_delivery_date,
      note: order.note,
      crateSize: order.crate_size,
      items,
      crate: { sku: settings.crate_sku, name: settings.crate_erp_name },
      recurrence: order.recurrence,
      replacesOrderNumber: replaced?.order_number ?? null,
    }),
    null,
    2,
  )

  return (
    <>
      <Link href="/admin" className="text-sm text-ink-mute hover:text-ink">
        ← Objednávky
      </Link>
      <AdminTitle
        title={order.order_number}
        actions={
          <form action={setOrderStatusAction} className="flex items-center gap-2">
            <input type="hidden" name="id" value={order.id} />
            <select name="status" defaultValue={order.status} className="field !w-auto !py-2 text-sm" aria-label="Stav objednávky">
              {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <button className="btn btn-primary !py-2">Zmeniť stav</button>
          </form>
        }
      />
      <p className="-mt-6 mb-8 text-sm text-ink-mute">Vytvorená {formatDateTimeSk(order.created_at)}</p>
      {order.recurrence && (
        <div className="-mt-4 mb-8 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-brand/10 px-4 py-3 text-sm text-[#00679a]">
          <p>
            <strong>Trvalá objednávka – {RECURRENCE_LABEL[order.recurrence]}.</strong> Dodávky plánuje ActiWhere.
            {replaced && (
              <>
                {' '}Nahrádza{' '}
                <Link href={`/admin/objednavky/${replaced.id}`} className="underline">
                  {replaced.order_number}
                </Link>
                .
              </>
            )}
            {order.standing_ended_at && order.status !== 'cancelled' && (
              <>
                {' '}Ukončená {formatDateTimeSk(order.standing_ended_at)}
                {replacedBy && (
                  <>
                    {' '}– nahradila ju{' '}
                    <Link href={`/admin/objednavky/${replacedBy.id}`} className="underline">
                      {replacedBy.order_number}
                    </Link>
                  </>
                )}
                .
              </>
            )}
          </p>
          {isActiveStanding(order) && (
            <form action={endStandingAdminAction}>
              <input type="hidden" name="id" value={order.id} />
              <button className="btn btn-ghost !py-1.5 text-sm">Ukončiť trvalú objednávku</button>
            </form>
          )}
        </div>
      )}
      {order.cancelled_at && (
        <p className="-mt-4 mb-8 rounded-lg bg-danger/5 px-4 py-3 text-sm text-danger">
          Zrušená {formatDateTimeSk(order.cancelled_at)}
          {order.cancelled_via === 'email' && ' – zákazníkom cez odkaz v emaile'}
          {order.cancelled_via === 'account' && ' – zákazníkom v jeho účte'}
          {order.cancelled_via === 'admin' && ' – v administrácii'}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <section className="rounded-xl border border-line p-6">
          <h2 className="mb-4 font-medium">Položky</h2>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-line">
              {items.map((i) => (
                <tr key={i.id}>
                  <td className="py-2.5">
                    {i.name}
                    <span className="ml-2 font-mono text-xs text-ink-mute">{i.sku}</span>
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{i.quantity} ks</td>
                </tr>
              ))}
              <tr className="font-medium">
                <td className="py-3">Spolu</td>
                <td className="py-3 text-right tabular-nums">
                  {order.total_units} ks · {order.crates} × {order.crate_size}
                </td>
              </tr>
            </tbody>
          </table>
          <dl className="mt-6 grid gap-2 text-sm sm:grid-cols-[10rem_1fr]">
            <dt className="text-ink-mute">Doručenie</dt>
            <dd>{order.requested_delivery_date ? formatDateSk(order.requested_delivery_date) : 'pri najbližšej dodávke vody'}</dd>
            <dt className="text-ink-mute">Poznámka</dt>
            <dd className="whitespace-pre-wrap">{order.note || '—'}</dd>
          </dl>
        </section>

        <div className="space-y-8">
          <section className="rounded-xl border border-line p-6 text-sm leading-relaxed">
            <h2 className="mb-3 font-medium">Odberateľ</h2>
            <p>{c.company_name}</p>
            <p className="text-ink-soft">
              IČO {c.ico}
              {c.dic && ` · DIČ ${c.dic}`}
              {c.ic_dph && ` · IČ DPH ${c.ic_dph}`}
            </p>
            <p className="text-ink-soft">
              {c.billing_address.street}, {c.billing_address.zip} {c.billing_address.city}
            </p>
            <p className="mt-3">{c.contact_name}</p>
            <p>
              <a href={`mailto:${c.email}`} className="underline underline-offset-4">
                {c.email}
              </a>
              {c.phone && ` · ${c.phone}`}
            </p>
            {order.profile_id && (
              <Link href={`/admin/klienti?q=${encodeURIComponent(c.ico)}`} className="mt-3 inline-block text-ink-mute underline underline-offset-4">
                Karta klienta
              </Link>
            )}
          </section>

          <section className="rounded-xl border border-line p-6 text-sm leading-relaxed">
            <h2 className="mb-3 font-medium">Dodacia adresa {d.label && <span className="font-normal text-ink-mute">({d.label})</span>}</h2>
            {d.company && <p>{d.company}</p>}
            <p>{d.street}</p>
            <p>
              {d.zip} {d.city}, {d.country}
            </p>
            {(d.contact_name || d.contact_phone) && <p className="text-ink-soft">{[d.contact_name, d.contact_phone].filter(Boolean).join(', ')}</p>}
            {d.note && <p className="text-ink-soft">Poznámka: {d.note}</p>}
          </section>

          <section className="rounded-xl border border-line p-6 text-sm">
            <h2 className="mb-3 font-medium">Emaily</h2>
            <p>Interný: {order.internal_email_sent_at ? `odoslaný ${formatDateTimeSk(order.internal_email_sent_at)}` : <span className="text-danger">neodoslaný</span>}</p>
            <p>Zákazníkovi: {order.customer_email_sent_at ? `odoslaný ${formatDateTimeSk(order.customer_email_sent_at)}` : <span className="text-danger">neodoslaný</span>}</p>
            <ResendEmails orderId={order.id} />
          </section>
        </div>
      </div>

      <details className="mt-8 rounded-xl border border-line p-6 text-sm">
        <summary className="cursor-pointer font-medium">Strojová verzia (JSON pre internú AI)</summary>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-paper p-4 text-xs">{json}</pre>
      </details>
    </>
  )
}
