'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { registrationNotifyEmail } from '@/lib/email/templates'
import { sendEmail } from '@/lib/email/send'
import { getSettings } from '@/lib/settings'
import { safeNext, siteUrl } from '@/lib/site'
import { createServiceClient, createSessionClient } from '@/lib/supabase/server'
import { verifyTurnstile } from '@/lib/turnstile'
import { fieldErrors, passwordSchema, registrationSchema } from '@/lib/validation'
import { splitEmails } from '@/lib/emailList'

export type FormState = { error?: string; fields?: Record<string, string>; ok?: boolean; values?: Record<string, string> }

async function clientIp() {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
}

function formValues(formData: FormData, omit: string[] = []): Record<string, string> {
  const out: Record<string, string> = {}
  formData.forEach((v, k) => {
    if (typeof v === 'string' && !omit.includes(k) && !k.startsWith('$') && k !== 'cf-turnstile-response') out[k] = v
  })
  return out
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, ['password', 'password_confirm'])
  const parsed = registrationSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values }
  if (!(await verifyTurnstile(formData.get('cf-turnstile-response'), await clientIp()))) {
    return { error: 'Overenie proti robotom zlyhalo. Skúste to znova.', values }
  }

  const d = parsed.data
  const supabase = await createSessionClient()
  const { data, error } = await supabase.auth.signUp({
    email: d.email,
    password: d.password,
    options: {
      emailRedirectTo: siteUrl('/auth/confirm?next=/ucet'),
      data: {
        company_name: d.company_name,
        ico: d.ico,
        dic: d.dic,
        ic_dph: d.ic_dph,
        contact_name: d.contact_name,
        phone: d.phone,
        billing_street: d.billing_street,
        billing_city: d.billing_city,
        billing_zip: d.billing_zip,
        billing_country: 'Slovensko',
        terms_accepted: 'true',
        privacy_accepted: 'true',
      },
    },
  })

  if (error) {
    console.error('[register]', error.message)
    if (error.code === 'weak_password') return { fields: { password: 'Heslo je príliš slabé alebo uniknuté. Zvoľte iné.' }, values }
    if (error.code === 'over_email_send_rate_limit' || error.status === 429) {
      return { error: 'Príliš veľa pokusov. Skúste to o chvíľu.', values }
    }
    return { error: 'Registrácia sa nepodarila. Skúste to znova alebo nás kontaktujte.', values }
  }

  // Supabase z bezpečnostných dôvodov neprezradí, že email už existuje:
  // vráti používateľa bez identít. Vtedy nič nevytvárame ani neposielame.
  const user = data.user
  if (user && (user.identities?.length ?? 0) > 0) {
    const service = createServiceClient()
    await service.from('addresses').insert({
      profile_id: user.id,
      label: 'Sídlo',
      company: d.company_name,
      street: d.billing_street,
      city: d.billing_city,
      zip: d.billing_zip,
      country: 'Slovensko',
      contact_name: d.contact_name,
      contact_phone: d.phone,
      is_default: true,
    })
    const { data: profile } = await service.from('profiles').select('ico_known, status').eq('id', user.id).single()
    if (profile?.status === 'pending') {
      const settings = await getSettings()
      await sendEmail({
        to: splitEmails(settings.registration_notify_email),
        ...registrationNotifyEmail({
          company_name: d.company_name,
          ico: d.ico,
          contact_name: d.contact_name,
          email: d.email,
          phone: d.phone,
          ico_known: Boolean(profile.ico_known),
          adminUrl: siteUrl('/admin/klienti?stav=pending'),
        }),
      })
    }
  }

  redirect('/registracia/hotovo')
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const next = safeNext(formData.get('next'))
  if (!email || !password) return { error: 'Zadajte email a heslo.', values: { email } }
  if (!(await verifyTurnstile(formData.get('cf-turnstile-response'), await clientIp()))) {
    return { error: 'Overenie proti robotom zlyhalo. Skúste to znova.', values: { email } }
  }

  const supabase = await createSessionClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    if (error.code === 'email_not_confirmed') {
      return { error: 'Najprv potvrďte svoj email kliknutím na odkaz, ktorý sme vám poslali.', values: { email } }
    }
    return { error: 'Nesprávny email alebo heslo.', values: { email } }
  }
  redirect(next)
}

export async function logoutAction() {
  const supabase = await createSessionClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!email) return { error: 'Zadajte email.' }
  if (!(await verifyTurnstile(formData.get('cf-turnstile-response'), await clientIp()))) {
    return { error: 'Overenie proti robotom zlyhalo. Skúste to znova.' }
  }
  const supabase = await createSessionClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: siteUrl('/auth/confirm?next=/nove-heslo'),
  })
  if (error) console.error('[forgot]', error.message)
  // Vždy rovnaká odpoveď – neprezrádzame, či účet existuje.
  return { ok: true }
}

export async function newPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = passwordSchema.safeParse(formData.get('password'))
  if (!parsed.success) return { fields: { password: parsed.error.issues[0].message } }
  if (formData.get('password') !== formData.get('password_confirm')) {
    return { fields: { password_confirm: 'Heslá sa nezhodujú.' } }
  }
  const supabase = await createSessionClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data })
  if (error) {
    if (error.code === 'same_password') return { fields: { password: 'Nové heslo musí byť iné ako staré.' } }
    if (error.code === 'weak_password') return { fields: { password: 'Heslo je príliš slabé. Zvoľte iné.' } }
    return { error: 'Odkaz na zmenu hesla vypršal. Požiadajte o nový.' }
  }
  redirect('/ucet?heslo=zmenene')
}
