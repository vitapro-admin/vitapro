import type { Metadata } from 'next'
import Link from 'next/link'
import { PageShell } from '@/components/PageShell'
import { canOrder, requireViewer } from '@/lib/auth'
import { getVisibleProducts } from '@/lib/catalog/getProducts'
import { getSettings } from '@/lib/settings'
import { createServiceClient } from '@/lib/supabase/server'
import type { Address, OrderRow } from '@/lib/types'
import { CheckoutForm, type ActiveStanding } from './CheckoutForm'

export const metadata: Metadata = { title: 'Objednávka', robots: { index: false } }

export default async function CheckoutPage() {
  const viewer = await requireViewer('/objednavka')
  if (!canOrder(viewer)) {
    return (
      <PageShell eyebrow="Objednávka" title="Účet ešte nie je schválený">
        <p className="text-ink-soft">Objednávať môžete po schválení účtu obchodným oddelením. Pošleme vám email.</p>
        <Link href="/ucet" className="btn btn-ghost mt-8">
          Môj účet
        </Link>
      </PageShell>
    )
  }

  const [products, settings, { data: addresses }, { data: standing }] = await Promise.all([
    getVisibleProducts(),
    getSettings(),
    createServiceClient()
      .from('addresses')
      .select('*')
      .eq('profile_id', viewer.userId)
      .eq('archived', false)
      .order('is_default', { ascending: false })
      .order('created_at'),
    createServiceClient()
      .from('orders')
      .select('*')
      .eq('profile_id', viewer.userId)
      .not('recurrence', 'is', null)
      .is('standing_ended_at', null)
      .neq('status', 'cancelled'),
  ])
  const activeStanding: ActiveStanding[] = ((standing ?? []) as OrderRow[]).map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    recurrence: o.recurrence!,
    addressId: o.delivery_address.address_id,
  }))

  return (
    <PageShell eyebrow="Objednávka" title="Dokončenie objednávky" width="wide">
      <CheckoutForm products={products} addresses={(addresses ?? []) as Address[]} crateSize={settings.crate_size} activeStanding={activeStanding} />
    </PageShell>
  )
}
