import { z } from 'zod'
import { splitEmails } from '@/lib/emailList'

const line = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maximálne ${max} znakov.`)
    .transform((v) => v.replace(/[\r\n]+/g, ' '))

const required = (max: number, msg = 'Povinné pole.') => line(max).pipe(z.string().min(1, msg))

export const icoSchema = z
  .string()
  .transform((v) => v.replace(/\s/g, ''))
  .pipe(z.string().regex(/^\d{8}$/, 'IČO má 8 číslic.'))

export const passwordSchema = z
  .string()
  .min(10, 'Heslo musí mať aspoň 10 znakov.')
  .max(72, 'Heslo môže mať najviac 72 znakov.')

export const registrationSchema = z
  .object({
    company_name: required(200),
    ico: icoSchema,
    dic: line(20),
    ic_dph: line(20),
    contact_name: required(120),
    phone: required(40),
    email: z.string().trim().toLowerCase().email('Neplatný email.').max(200),
    password: passwordSchema,
    password_confirm: z.string(),
    billing_street: required(200),
    billing_city: required(120),
    billing_zip: required(12),
    terms: z.literal('on', { error: 'Je potrebný súhlas s obchodnými podmienkami.' }),
    privacy: z.literal('on', { error: 'Je potrebné potvrdiť oboznámenie so spracovaním osobných údajov.' }),
  })
  .refine((d) => d.password === d.password_confirm, {
    path: ['password_confirm'],
    message: 'Heslá sa nezhodujú.',
  })

export const addressSchema = z.object({
  label: line(80),
  company: line(200),
  street: required(200),
  city: required(120),
  zip: required(12),
  country: line(60).transform((v) => v || 'Slovensko'),
  contact_name: line(120),
  contact_phone: line(40),
  note: line(300),
})

export const profileSchema = z.object({
  company_name: required(200),
  dic: line(20),
  ic_dph: line(20),
  contact_name: required(120),
  phone: required(40),
  billing_street: required(200),
  billing_city: required(120),
  billing_zip: required(12),
})

export const orderSchema = z.object({
  address_id: z.string().uuid('Vyberte dodaciu adresu.'),
  note: z.string().trim().max(1000, 'Poznámka môže mať najviac 1000 znakov.'),
  recurrence: z
    .enum(['weekly', 'biweekly', 'monthly'])
    .nullable()
    .or(z.literal('').transform(() => null)),
  replaces_order_id: z
    .string()
    .uuid()
    .nullable()
    .or(z.literal('').transform(() => null)),
  items: z
    .array(z.object({ product_id: z.string().min(1), quantity: z.number().int().min(1).max(9996) }))
    .min(1, 'Objednávka je prázdna.')
    .max(50),
})

export const productSchema = z.object({
  name: required(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Len malé písmená bez diakritiky, čísla a pomlčky.'),
  sku: required(60),
  erp_name: line(200),
  subtitle: line(200),
  description: z.string().trim().max(1000),
  composition: z.string().trim().max(1000),
  nutrition: z.string().trim().max(1000),
  volume: line(40),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Farba v tvare #RRGGBB.'),
  status: z.enum(['active', 'unavailable', 'archived']),
  sort_order: z.coerce.number().int().min(0).max(100000),
})

/** Jedna alebo viac adries (čiarka/bodkočiarka) – uloží sa ako „a@x.sk, b@y.sk“. */
const emailList = z
  .string()
  .transform(splitEmails)
  .pipe(
    z
      .array(z.string().email('Neplatný email.'))
      .min(1, 'Zadajte aspoň jeden email.')
      .max(10, 'Najviac 10 adries.'),
  )
  .transform((list) => [...new Set(list)].join(', '))

export const settingsSchema = z.object({
  order_email: emailList,
  registration_notify_email: emailList,
  sales_name: required(120),
  sales_email: z.string().trim().email('Neplatný email.'),
  sales_phone: line(40),
  auto_approve_known_ico: z.boolean(),
  crate_sku: line(60),
  crate_erp_name: line(200),
  cancel_window_minutes: z.coerce.number().int().min(0, 'Minimálne 0.').max(10080, 'Najviac 7 dní (10080 min).'),
})

/** Prvá chybová hláška pre každé pole – na zobrazenie pri formulári. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    if (!out[key]) out[key] = issue.message
  }
  return out
}
