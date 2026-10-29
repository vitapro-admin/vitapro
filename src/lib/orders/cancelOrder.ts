import 'server-only'
import { customerCancellationEmail, internalCancellationEmail, type CancellationInfo } from '@/lib/email/templates'
import { sendEmail } from '@/lib/email/send'
import { getSettings } from '@/lib/settings'
import { createServiceClient } from '@/lib/supabase/server'
import type { OrderRow } from '@/lib/types'
import { splitEmails } from '@/lib/emailList'

export type CancelResult =
  | { ok: true; orderNumber: string }
  | { ok: false; reason: 'not_found' | 'already_cancelled' | 'in_progress' | 'expired' }

/**
 * Zruší objednávku, len kým je v stave „nová“ (obchod ju ešte nezačal
 * spracúvať). Podmienka je priamo v UPDATE, takže dve súbežné požiadavky
 * nemôžu zrušiť ani poslať emaily dvakrát.
 */
export async function cancelOrder(
  match: { id: string; profileId?: string } | { cancelTokenHash: string },
  via: CancellationInfo['via'],
): Promise<CancelResult> {
  const db = createServiceClient()
  const now = new Date().toISOString()
  const settings = await getSettings()
  if (settings.cancel_window_minutes <= 0) return { ok: false, reason: 'expired' }
  // Objednávky staršie ako lehota sa už zrušiť nedajú – mohli byť spracované
  // v internom systéme bez toho, aby sa zmenil ich stav na webe.
  const createdAfter = new Date(Date.now() - settings.cancel_window_minutes * 60_000).toISOString()

  let q = db
    .from('orders')
    .update({ status: 'cancelled', cancelled_at: now, cancelled_via: via, cancel_token_hash: null })
    .eq('status', 'new')
    .gt('created_at', createdAfter)
  if ('cancelTokenHash' in match) q = q.eq('cancel_token_hash', match.cancelTokenHash)
  else {
    q = q.eq('id', match.id)
    if (match.profileId) q = q.eq('profile_id', match.profileId)
  }
  const { data: cancelled } = await q.select('*').maybeSingle<OrderRow>()

  if (!cancelled) {
    let check = db.from('orders').select('status, created_at')
    if ('cancelTokenHash' in match) check = check.eq('cancel_token_hash', match.cancelTokenHash)
    else {
      check = check.eq('id', match.id)
      if (match.profileId) check = check.eq('profile_id', match.profileId)
    }
    const { data } = await check.maybeSingle<{ status: OrderRow['status']; created_at: string }>()
    if (!data) return { ok: false, reason: 'not_found' }
    if (data.status === 'cancelled') return { ok: false, reason: 'already_cancelled' }
    if (data.status === 'new') return { ok: false, reason: 'expired' }
    return { ok: false, reason: 'in_progress' }
  }

  // Zrušená bola zmena trvalej objednávky → pôvodná opäť platí.
  let restored: string | null = null
  if (cancelled.replaces_order_id) {
    const { data } = await db
      .from('orders')
      .update({ standing_ended_at: null })
      .eq('id', cancelled.replaces_order_id)
      .neq('status', 'cancelled')
      .select('order_number')
      .maybeSingle<{ order_number: string }>()
    restored = data?.order_number ?? null
  }

  const info: CancellationInfo = {
    order_number: cancelled.order_number,
    restored_order_number: restored,
    company_name: cancelled.customer.company_name,
    ico: cancelled.customer.ico,
    email: cancelled.customer.email,
    cancelled_at: now,
    via,
  }
  await Promise.all([
    sendEmail({ to: splitEmails(settings.order_email), replyTo: info.email, ...internalCancellationEmail(info) }),
    sendEmail({ to: info.email, replyTo: settings.sales_email, ...customerCancellationEmail(info) }),
  ])
  return { ok: true, orderNumber: cancelled.order_number }
}
