'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { AccessError, requireAdmin } from '@/lib/auth'
import { accountApprovedEmail } from '@/lib/email/templates'
import { sendEmail } from '@/lib/email/send'
import { endStandingOrder } from '@/lib/orders/endStanding'
import { resendOrderEmails } from '@/lib/orders/placeOrder'
import { siteUrl } from '@/lib/site'
import { createServiceClient } from '@/lib/supabase/server'
import type { OrderStatus, ProductStatus, ProfileStatus } from '@/lib/types'
import { fieldErrors, productSchema, settingsSchema } from '@/lib/validation'

export type AdminFormState = { error?: string; fields?: Record<string, string>; ok?: boolean; message?: string }

function fail(e: unknown): AdminFormState {
  if (e instanceof AccessError) return { error: e.message }
  console.error('[admin]', e)
  return { error: e instanceof Error ? e.message : 'Akcia zlyhala.' }
}

// ---------------------------------------------------------------------------
// Objednávky
// ---------------------------------------------------------------------------
const ORDER_STATUSES: OrderStatus[] = ['new', 'processing', 'completed', 'cancelled']

export async function setOrderStatusAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id'))
  const status = String(formData.get('status')) as OrderStatus
  if (!ORDER_STATUSES.includes(status)) return
  await createServiceClient()
    .from('orders')
    .update(
      status === 'cancelled'
        ? { status, cancelled_at: new Date().toISOString(), cancelled_via: 'admin', cancel_token_hash: null }
        : { status },
    )
    .eq('id', id)
  revalidatePath('/admin')
  revalidatePath(`/admin/objednavky/${id}`)
}

export async function endStandingAdminAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id'))
  await endStandingOrder({ id }, 'admin')
  revalidatePath('/admin')
  revalidatePath(`/admin/objednavky/${id}`)
}

export async function resendOrderEmailsAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  try {
    await requireAdmin()
    const id = String(formData.get('id'))
    const which = String(formData.get('which')) as 'internal' | 'customer' | 'both'
    const result = await resendOrderEmails(id, which)
    revalidatePath(`/admin/objednavky/${id}`)
    return result.ok ? { ok: true, message: 'Email odoslaný.' } : { error: 'Odoslanie zlyhalo – skontrolujte nastavenie Resend.' }
  } catch (e) {
    return fail(e)
  }
}

// ---------------------------------------------------------------------------
// Produkty
// ---------------------------------------------------------------------------
const IMAGE_TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

async function uploadProductImage(productId: string, kind: 'illustration' | 'photo', file: File): Promise<string> {
  const ext = IMAGE_TYPES[file.type]
  if (!ext) throw new Error('Obrázok musí byť PNG, JPG alebo WEBP.')
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Obrázok môže mať najviac 5 MB.')
  const db = createServiceClient()
  const path = `${productId}/${kind}-${Date.now()}.${ext}`
  const { error } = await db.storage.from('product-images').upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw new Error(`Nahratie obrázka zlyhalo: ${error.message}`)
  return db.storage.from('product-images').getPublicUrl(path).data.publicUrl
}

export async function saveProductAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  let savedId: string
  try {
    await requireAdmin()
    const parsed = productSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return { fields: fieldErrors(parsed.error) }
    const db = createServiceClient()
    const id = String(formData.get('id') ?? '')

    if (id) {
      const { error } = await db.from('products').update(parsed.data).eq('id', id)
      if (error) return dbError(error)
      savedId = id
    } else {
      const { data, error } = await db.from('products').insert(parsed.data).select('id').single()
      if (error) return dbError(error)
      savedId = data.id
    }

    const images: Record<string, string | null> = {}
    for (const kind of ['illustration', 'photo'] as const) {
      const file = formData.get(`${kind}_file`)
      if (file instanceof File && file.size > 0) images[`${kind}_url`] = await uploadProductImage(savedId, kind, file)
      else if (formData.get(`${kind}_remove`) === 'on') images[`${kind}_url`] = null
    }
    if (Object.keys(images).length) {
      const { error } = await db.from('products').update(images).eq('id', savedId)
      if (error) throw error
    }
  } catch (e) {
    return fail(e)
  }
  revalidatePath('/')
  revalidatePath('/admin/produkty')
  redirect(`/admin/produkty?ulozene=${savedId}`)
}

function dbError(error: { code?: string; message: string }): AdminFormState {
  if (error.code === '23505') {
    return { error: 'Produkt s rovnakým SKU alebo adresou (slug) už existuje.' }
  }
  return { error: error.message }
}

export async function setProductStatusAction(formData: FormData) {
  await requireAdmin()
  const status = String(formData.get('status')) as ProductStatus
  if (!['active', 'unavailable', 'archived'].includes(status)) return
  await createServiceClient().from('products').update({ status }).eq('id', String(formData.get('id')))
  revalidatePath('/')
  revalidatePath('/admin/produkty')
}

// ---------------------------------------------------------------------------
// Klienti
// ---------------------------------------------------------------------------
export async function setClientStatusAction(formData: FormData) {
  const admin = await requireAdmin()
  const id = String(formData.get('id'))
  const status = String(formData.get('status')) as ProfileStatus
  if (!['pending', 'approved', 'blocked'].includes(status)) return
  if (id === admin.userId) return // admin si nezablokuje sám seba

  const db = createServiceClient()
  const { data: before } = await db.from('profiles').select('status, role, is_superadmin, contact_name, email, approved_at').eq('id', id).single()
  // Adminov (a superadmina) cez web neblokujeme – rieši sa to v Supabase.
  if (before && (before.role === 'admin' || before.is_superadmin) && status !== 'approved') return
  await db
    .from('profiles')
    .update({
      status,
      ...(status === 'approved' && !before?.approved_at ? { approved_at: new Date().toISOString(), approved_by: admin.userId } : {}),
    })
    .eq('id', id)

  if (status === 'approved' && before && before.status !== 'approved') {
    await sendEmail({ to: before.email, ...accountApprovedEmail({ contact_name: before.contact_name, siteUrl: siteUrl('/#stavy') }) })
  }
  revalidatePath('/admin/klienti')
}

/** Zmaže prihlasovací účet zákazníka aj s profilom a adresami. Objednávky
 * ostávajú (s uloženými údajmi odberateľa) kvôli evidencii. Adminov nie. */
export async function deleteClientAction(formData: FormData) {
  const admin = await requireAdmin()
  const id = String(formData.get('id'))
  if (id === admin.userId) return
  const db = createServiceClient()
  const { data: target } = await db.from('profiles').select('role, is_superadmin').eq('id', id).single()
  if (!target || target.role === 'admin' || target.is_superadmin) return
  const { error } = await db.auth.admin.deleteUser(id)
  if (error) console.error('[admin] zmazanie klienta zlyhalo:', error.message)
  revalidatePath('/admin/klienti')
}

export async function saveClientNoteAction(formData: FormData) {
  await requireAdmin()
  const note = String(formData.get('admin_note') ?? '').slice(0, 2000)
  await createServiceClient().from('profiles').update({ admin_note: note }).eq('id', String(formData.get('id')))
  revalidatePath('/admin/klienti')
}

// ---------------------------------------------------------------------------
// Zoznam IČO
// ---------------------------------------------------------------------------
export async function addWhitelistAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  try {
    await requireAdmin()
    const raw = String(formData.get('entries') ?? '')
    const rows: { ico: string; company_name: string }[] = []
    const invalid: string[] = []
    for (const line of raw.split(/\r?\n/)) {
      if (!line.trim()) continue
      const [icoPart, ...rest] = line.split(/[;,\t]/)
      const ico = icoPart.replace(/\s/g, '')
      if (!/^\d{6,10}$/.test(ico)) {
        invalid.push(line.trim())
        continue
      }
      rows.push({ ico, company_name: rest.join(' ').trim().slice(0, 200) })
    }
    if (rows.length === 0) return { error: invalid.length ? `Neplatné riadky: ${invalid.slice(0, 5).join(', ')}` : 'Zadajte aspoň jedno IČO.' }

    const db = createServiceClient()
    const { error } = await db.from('client_whitelist').upsert(rows, { onConflict: 'ico' })
    if (error) throw error
    // Označí už registrovaných klientov s týmto IČO.
    await db.from('profiles').update({ ico_known: true }).in('ico', rows.map((r) => r.ico))
    revalidatePath('/admin/ico')
    revalidatePath('/admin/klienti')
    return {
      ok: true,
      message: `Pridaných/aktualizovaných: ${rows.length}.${invalid.length ? ` Preskočené neplatné riadky: ${invalid.length}.` : ''}`,
    }
  } catch (e) {
    return fail(e)
  }
}

export async function removeWhitelistAction(formData: FormData) {
  await requireAdmin()
  const ico = String(formData.get('ico'))
  const db = createServiceClient()
  await db.from('client_whitelist').delete().eq('ico', ico)
  await db.from('profiles').update({ ico_known: false }).eq('ico', ico)
  revalidatePath('/admin/ico')
}

// ---------------------------------------------------------------------------
// Nastavenia
// ---------------------------------------------------------------------------
export async function saveSettingsAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  try {
    await requireAdmin()
    const parsed = settingsSchema.safeParse({
      ...Object.fromEntries(formData),
      auto_approve_known_ico: formData.get('auto_approve_known_ico') === 'on',
    })
    if (!parsed.success) return { fields: fieldErrors(parsed.error) }
    const { error } = await createServiceClient().from('settings').update(parsed.data).eq('id', 1)
    if (error) throw error
    revalidatePath('/', 'layout')
    return { ok: true, message: 'Nastavenia uložené.' }
  } catch (e) {
    return fail(e)
  }
}
