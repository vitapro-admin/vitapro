export type ProductStatus = 'active' | 'unavailable' | 'archived'
export type ProfileStatus = 'pending' | 'approved' | 'blocked'
export type UserRole = 'customer' | 'admin'
export type OrderStatus = 'new' | 'processing' | 'completed' | 'cancelled'
export type Recurrence = 'weekly' | 'biweekly' | 'monthly'

export type Product = {
  id: string
  slug: string
  sku: string
  /** Presný názov položky v ActiWhere (ide do objednávky pre interný systém). */
  erp_name: string
  name: string
  subtitle: string
  description: string
  composition: string
  nutrition: string
  volume: string
  accent_color: string
  illustration_url: string | null
  photo_url: string | null
  status: ProductStatus
  sort_order: number
}

export type Profile = {
  id: string
  email: string
  company_name: string
  ico: string
  dic: string
  ic_dph: string
  contact_name: string
  phone: string
  billing_street: string
  billing_city: string
  billing_zip: string
  billing_country: string
  status: ProfileStatus
  role: UserRole
  /** Hlavný admin – cez web sa nedá zablokovať ani zmeniť (migrácia 0005). */
  is_superadmin?: boolean
  ico_known: boolean
  approved_at: string | null
  admin_note: string
  created_at: string
}

export type Address = {
  id: string
  profile_id: string
  label: string
  company: string
  street: string
  city: string
  zip: string
  country: string
  contact_name: string
  contact_phone: string
  note: string
  is_default: boolean
  archived: boolean
}

export type Settings = {
  order_email: string
  registration_notify_email: string
  sales_name: string
  sales_email: string
  sales_phone: string
  auto_approve_known_ico: boolean
  crate_size: number
  cancel_window_minutes: number
  crate_sku: string
  crate_erp_name: string
}

export type OrderRow = {
  id: string
  order_number: string
  profile_id: string | null
  status: OrderStatus
  customer: OrderCustomer
  delivery_address: OrderDeliveryAddress
  requested_delivery_date: string | null
  note: string
  total_units: number
  crates: number
  crate_size: number
  customer_email_sent_at: string | null
  internal_email_sent_at: string | null
  cancelled_at: string | null
  cancelled_via: 'email' | 'account' | 'admin' | null
  /** Trvalá objednávka – dodávky plánuje ActiWhere. null = jednorazová. */
  recurrence: Recurrence | null
  replaces_order_id: string | null
  standing_ended_at: string | null
  created_at: string
}

export type OrderItemRow = {
  id: string
  order_id: string
  product_id: string | null
  line_no: number
  sku: string
  name: string
  quantity: number
}

export type OrderCustomer = {
  customer_id: string
  company_name: string
  ico: string
  dic: string
  ic_dph: string
  contact_name: string
  email: string
  phone: string
  billing_address: { street: string; city: string; zip: string; country: string }
}

export type OrderDeliveryAddress = {
  address_id: string
  label: string
  company: string
  street: string
  city: string
  zip: string
  country: string
  contact_name: string
  contact_phone: string
  note: string
}

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  active: 'Aktívny',
  unavailable: 'Dočasne nedostupný',
  archived: 'Vyradený',
}

export const PROFILE_STATUS_LABEL: Record<ProfileStatus, string> = {
  pending: 'Čaká na schválenie',
  approved: 'Schválený',
  blocked: 'Zablokovaný',
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'Nová',
  processing: 'Spracováva sa',
  completed: 'Vybavená',
  cancelled: 'Zrušená',
}

export const RECURRENCE_LABEL: Record<Recurrence, string> = {
  weekly: 'každý týždeň',
  biweekly: 'každé 2 týždne',
  monthly: 'každý mesiac',
}

/** Aktívna trvalá objednávka = nezrušená a nenahradená/neukončená. */
export function isActiveStanding(o: Pick<OrderRow, 'recurrence' | 'standing_ended_at' | 'status'>): boolean {
  return o.recurrence !== null && o.standing_ended_at === null && o.status !== 'cancelled'
}
