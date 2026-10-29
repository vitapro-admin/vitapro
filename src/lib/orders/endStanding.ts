import 'server-only'
import { customerStandingEndEmail, internalStandingEndEmail, type StandingEndInfo } from '@/lib/email/templates'
import { sendEmail } from '@/lib/email/send'
import { getSettings } from '@/lib/settings'
import { createServiceClient } from '@/lib/supabase/server'
import type { OrderRow } from '@/lib/types'
import { splitEmails } from '@/lib/emailList'

/** Ukončí aktívnu trvalú objednávku a oznámi to obchodu aj zákazníkovi. */
export async function endStandingOrder(match: { id: string; profileId?: string }, via: StandingEndInfo['via']): Promise<boolean> {
  const now = new Date().toISOString()
  let q = createServiceClient()
    .from('orders')
    .update({ standing_ended_at: now })
    .eq('id', match.id)
    .not('recurrence', 'is', null)
    .is('standing_ended_at', null)
    .neq('status', 'cancelled')
  if (match.profileId) q = q.eq('profile_id', match.profileId)
  const { data: ended } = await q.select('*').maybeSingle<OrderRow>()
  if (!ended) return false

  const info: StandingEndInfo = {
    order_number: ended.order_number,
    company_name: ended.customer.company_name,
    ico: ended.customer.ico,
    email: ended.customer.email,
    ended_at: now,
    via,
  }
  const settings = await getSettings()
  await Promise.all([
    sendEmail({ to: splitEmails(settings.order_email), replyTo: info.email, ...internalStandingEndEmail(info) }),
    sendEmail({ to: info.email, replyTo: settings.sales_email, ...customerStandingEndEmail(info) }),
  ])
  return true
}
