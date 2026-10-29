import 'server-only'
import { summarizeCrates } from '@/lib/crates'
import { tomorrowInBratislava } from '@/lib/dates'
import { customerConfirmationEmail, internalOrderEmail, type CancelLink } from '@/lib/email/templates'
import { sendEmail } from '@/lib/email/send'
import { createCancelToken } from '@/lib/orders/cancelToken'
import { cancelDeadline } from '@/lib/orders/cancelWindow'
import { buildOrderPayload, type OrderPayload } from '@/lib/orders/orderPayload'
import { getSettings } from '@/lib/settings'
import { siteUrl } from '@/lib/site'
import { createServiceClient } from '@/lib/supabase/server'
import type { Address, OrderCustomer, OrderDeliveryAddress, OrderItemRow, OrderRow, Product, Profile, Recurrence } from '@/lib/types'
import { splitEmails } from '@/lib/emailList'

export type PlaceOrderInput = {
  addressId: string
  requestedDate: string | null
  note: string
  recurrence: Recurrence | null
  replacesOrderId: string | null
  items: { product_id: string; quantity: number }[]
}

export class OrderError extends Error {}

const MAX_ORDERS_PER_10_MIN = 5

export async function placeOrder(profile: Profile, input: PlaceOrderInput) {
  const db = createServiceClient()
  const settings = await getSettings()

  // Zlúčenie duplicitných riadkov toho istého produktu.
  const merged = new Map<string, number>()
  for (const i of input.items) merged.set(i.product_id, (merged.get(i.product_id) ?? 0) + i.quantity)

  const summary = summarizeCrates([...merged.values()].reduce((a, b) => a + b, 0), settings.crate_size)
  if (!summary.isValid) {
    throw new OrderError(`Počet kusov musí byť násobkom ${settings.crate_size} (celé prepravky).`)
  }

  if (input.requestedDate && input.requestedDate < tomorrowInBratislava()) {
    throw new OrderError('Požadovaný termín musí byť najskôr zajtra.')
  }

  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { count } = await db
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', profile.id)
    .gte('created_at', since)
  if ((count ?? 0) >= MAX_ORDERS_PER_10_MIN) {
    throw new OrderError('Príliš veľa objednávok za krátky čas. Skúste to o chvíľu.')
  }

  const { data: products, error: productsError } = await db
    .from('products')
    .select('*')
    .in('id', [...merged.keys()])
  if (productsError) throw productsError
  const byId = new Map((products as Product[]).map((p) => [p.id, p]))
  for (const id of merged.keys()) {
    const p = byId.get(id)
    if (!p) throw new OrderError('Niektorý produkt už nie je v ponuke. Obnovte stránku.')
    if (p.status !== 'active') throw new OrderError(`${p.name} je momentálne nedostupný. Odstráňte ho z objednávky.`)
  }

  const { data: address } = await db
    .from('addresses')
    .select('*')
    .eq('id', input.addressId)
    .eq('profile_id', profile.id)
    .eq('archived', false)
    .maybeSingle<Address>()
  if (!address) throw new OrderError('Vyberte platnú dodaciu adresu.')

  const customer: OrderCustomer = {
    customer_id: profile.id,
    company_name: profile.company_name,
    ico: profile.ico,
    dic: profile.dic,
    ic_dph: profile.ic_dph,
    contact_name: profile.contact_name,
    email: profile.email,
    phone: profile.phone,
    billing_address: {
      street: profile.billing_street,
      city: profile.billing_city,
      zip: profile.billing_zip,
      country: profile.billing_country,
    },
  }
  const delivery: OrderDeliveryAddress = {
    address_id: address.id,
    label: address.label,
    company: address.company,
    street: address.street,
    city: address.city,
    zip: address.zip,
    country: address.country,
    contact_name: address.contact_name,
    contact_phone: address.contact_phone,
    note: address.note,
  }

  // Poradie položiek podľa katalógu, nie podľa poradia klikania.
  const items = [...merged.entries()]
    .map(([id, quantity]) => ({ product: byId.get(id)!, quantity }))
    .sort((a, b) => a.product.sort_order - b.product.sort_order)
    .map(({ product, quantity }) => ({ product_id: product.id, sku: product.sku, name: product.erp_name || product.name, quantity }))

  if (input.replacesOrderId && !input.recurrence) {
    throw new OrderError('Pri zmene pravidelnej dodávky zvoľte interval.')
  }
  let replacesOrderNumber: string | null = null
  if (input.replacesOrderId) {
    const { data: replaced } = await db
      .from('orders')
      .select('order_number')
      .eq('id', input.replacesOrderId)
      .eq('profile_id', profile.id)
      .maybeSingle<{ order_number: string }>()
    if (!replaced) throw new OrderError('Pôvodná pravidelná dodávka sa nenašla.')
    replacesOrderNumber = replaced.order_number
  }

  const { data: created, error } = await db
    .rpc('create_order', {
      p_profile_id: profile.id,
      p_customer: customer,
      p_delivery: delivery,
      p_requested_date: input.requestedDate,
      p_note: input.note,
      p_crate_size: settings.crate_size,
      p_items: items,
      p_recurrence: input.recurrence,
      p_replaces_order_id: input.replacesOrderId,
    })
    .single<{ order_id: string; order_number: string; created_at: string }>()
  if (error?.message?.includes('už neplatí')) {
    throw new OrderError('Pôvodná pravidelná dodávka už bola zmenená alebo ukončená. Obnovte stránku Môj účet.')
  }
  if (error || !created) {
    console.error('[order] create_order failed', error)
    throw new OrderError('Objednávku sa nepodarilo uložiť. Skúste to znova.')
  }

  const payload = buildOrderPayload({
    orderNumber: created.order_number,
    createdAt: new Date(created.created_at).toISOString(),
    customer,
    delivery,
    requestedDate: input.requestedDate,
    note: input.note,
    crateSize: settings.crate_size,
    items,
    crate: { sku: settings.crate_sku, name: settings.crate_erp_name },
    recurrence: input.recurrence,
    replacesOrderNumber,
  })

  // Objednávka je uložená – zlyhanie emailu ju nesmie zrušiť. Stav odoslania
  // sa uloží a admin vidí (a môže zopakovať), ktoré emaily neodišli.
  await sendOrderEmails(created.order_id, payload, 'both')

  return { orderNumber: created.order_number }
}

async function sendOrderEmails(orderId: string, payload: OrderPayload, which: 'internal' | 'customer' | 'both') {
  const settings = await getSettings()
  const [internal, confirmation] = await Promise.all([
    which === 'customer'
      ? null
      : sendEmail({
          to: splitEmails(settings.order_email),
          replyTo: payload.customer.email,
          ...internalOrderEmail(payload),
          attachments: [
            {
              filename: `objednavka-${payload.order_number}.json`,
              content: JSON.stringify(payload, null, 2),
              contentType: 'application/json',
            },
          ],
        }),
    which === 'internal' ? null : sendCustomerConfirmation(orderId, payload, settings.sales_email, settings.cancel_window_minutes),
  ])
  const now = new Date().toISOString()
  const update: Record<string, string> = {}
  if (internal?.ok) update.internal_email_sent_at = now
  if (confirmation?.ok) update.customer_email_sent_at = now
  if (Object.keys(update).length) await createServiceClient().from('orders').update(update).eq('id', orderId)
  return { ok: (internal?.ok ?? true) && (confirmation?.ok ?? true) }
}

// Každé odoslanie potvrdenia vytvorí nový odkaz na zrušenie (v DB je len
// odtlačok, takže starý odkaz sa tým zneplatní).
async function sendCustomerConfirmation(orderId: string, payload: OrderPayload, salesEmail: string, windowMinutes: number) {
  // Po uplynutí lehoty (napr. pri opätovnom odoslaní z adminu) odkaz nepridávame.
  let cancel: CancelLink | undefined
  const deadline = cancelDeadline(payload.created_at, windowMinutes)
  if (deadline && deadline > new Date()) {
    const { token, hash } = createCancelToken()
    const { error } = await createServiceClient().from('orders').update({ cancel_token_hash: hash }).eq('id', orderId)
    if (error) console.error('[order] cancel token not stored', error)
    else cancel = { url: siteUrl(`/objednavka/zrusit?t=${token}`), deadline: deadline.toISOString() }
  }
  return sendEmail({ to: payload.customer.email, replyTo: salesEmail, ...customerConfirmationEmail(payload, cancel) })
}

/** Opätovné odoslanie emailov k uloženej objednávke (z adminu). */
export async function resendOrderEmails(orderId: string, which: 'internal' | 'customer' | 'both') {
  const db = createServiceClient()
  const settings = await getSettings()
  const { data: order } = await db.from('orders').select('*, order_items(*)').eq('id', orderId).single<OrderRow & { order_items: OrderItemRow[] }>()
  if (!order) throw new OrderError('Objednávka neexistuje.')
  const { data: replaced } = order.replaces_order_id
    ? await db.from('orders').select('order_number').eq('id', order.replaces_order_id).maybeSingle<{ order_number: string }>()
    : { data: null }
  const payload = buildOrderPayload({
    orderNumber: order.order_number,
    createdAt: new Date(order.created_at).toISOString(),
    customer: order.customer,
    delivery: order.delivery_address,
    requestedDate: order.requested_delivery_date,
    note: order.note,
    crateSize: order.crate_size,
    items: [...order.order_items].sort((a, b) => a.line_no - b.line_no),
    crate: { sku: settings.crate_sku, name: settings.crate_erp_name },
    recurrence: order.recurrence,
    replacesOrderNumber: replaced?.order_number ?? null,
  })
  return sendOrderEmails(orderId, payload, which)
}
