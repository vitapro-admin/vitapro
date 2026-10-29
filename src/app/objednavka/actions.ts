'use server'

import { redirect } from 'next/navigation'
import { AccessError, requireApprovedCustomer } from '@/lib/auth'
import { OrderError, placeOrder } from '@/lib/orders/placeOrder'
import { orderSchema } from '@/lib/validation'

export type OrderFormState = { error?: string }

export async function submitOrderAction(_prev: OrderFormState, formData: FormData): Promise<OrderFormState> {
  let orderNumber: string
  try {
    const viewer = await requireApprovedCustomer()
    let items: unknown
    try {
      items = JSON.parse(String(formData.get('items') ?? '[]'))
    } catch {
      return { error: 'Neplatné položky objednávky.' }
    }
    const parsed = orderSchema.safeParse({
      address_id: formData.get('address_id'),
      note: formData.get('note') ?? '',
      recurrence: formData.get('recurrence') ?? '',
      replaces_order_id: formData.get('replaces_order_id') ?? '',
      items,
    })
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const result = await placeOrder(viewer.profile, {
      addressId: parsed.data.address_id,
      requestedDate: null, // termín sa nezadáva – doručuje sa s najbližšou dodávkou vody
      note: parsed.data.note,
      recurrence: parsed.data.recurrence,
      replacesOrderId: parsed.data.replaces_order_id,
      items: parsed.data.items,
    })
    orderNumber = result.orderNumber
  } catch (e) {
    if (e instanceof OrderError || e instanceof AccessError) return { error: e.message }
    console.error('[order]', e)
    return { error: 'Niečo sa pokazilo. Skúste to znova alebo nás kontaktujte.' }
  }
  redirect(`/objednavka/odoslana?c=${encodeURIComponent(orderNumber)}`)
}
