import { buildOrderPayload } from '@/lib/orders/orderPayload'
import {
  customerConfirmationEmail,
  escapeHtml,
  formatDateSk,
  internalCancellationEmail,
  internalOrderEmail,
  internalStandingEndEmail,
} from './templates'

const payload = buildOrderPayload({
  orderNumber: 'OBJ-2026-00042',
  createdAt: '2026-10-22T08:30:00.000Z',
  customer: {
    customer_id: 'u1',
    company_name: 'Bistro <Jablko> s.r.o.',
    ico: '12345678',
    dic: '2020123456',
    ic_dph: '',
    contact_name: 'Jana Nováková',
    email: 'jana@example.sk',
    phone: '+421 900 000 000',
    billing_address: { street: 'Hlavná 1', city: 'Košice', zip: '040 01', country: 'Slovensko' },
  },
  delivery: {
    address_id: 'a1',
    label: 'Prevádzka centrum',
    company: 'Bistro Jablko',
    street: 'Hlavná 1',
    city: 'Košice',
    zip: '040 01',
    country: 'Slovensko',
    contact_name: 'Peter',
    contact_phone: '',
    note: '',
  },
  requestedDate: '2026-11-03',
  note: '  ',
  crateSize: 12,
  crate: { sku: '80000225', name: 'VITAPRO prepravka na 12 ks' },
  items: [
    { sku: 'VP-CVIKLA-033', name: 'Cvikla', quantity: 18 },
    { sku: 'VP-DULA-033', name: 'Dulienka', quantity: 6 },
  ],
})

describe('buildOrderPayload', () => {
  it('numbers lines, totals units and crates, and drops a blank note', () => {
    expect(payload.schema).toBe('vitapro.order.v1')
    expect(payload.items.map((i) => i.line)).toEqual([1, 2])
    expect(payload.totals).toEqual({ units: 24, crates: 2, crate_size: 12 })
    expect(payload.note).toBeNull()
    expect(payload.packaging).toEqual({ sku: '80000225', name: 'VITAPRO prepravka na 12 ks', quantity: 2, unit: 'ks' })
  })
})

describe('internalOrderEmail', () => {
  const email = internalOrderEmail(payload)

  it('puts the key identifiers in the subject', () => {
    expect(email.subject).toBe('[OBJEDNÁVKA] OBJ-2026-00042 | Bistro <Jablko> s.r.o. | IČO 12345678 | 24 ks')
  })

  it('keeps the body readable and points to the JSON attachment', () => {
    expect(email.text).not.toContain('"schema"')
    expect(email.html).not.toContain('"schema"')
    expect(email.text).toContain('objednavka-OBJ-2026-00042.json')
    expect(email.text).toContain('1. Cvikla [VP-CVIKLA-033] – 18 ks')
  })

  it('escapes customer-provided text in HTML', () => {
    expect(email.html).toContain('Bistro &lt;Jablko&gt; s.r.o.')
    expect(email.html).not.toContain('<Jablko>')
  })
})

describe('customerConfirmationEmail', () => {
  it('lists items and the requested date', () => {
    const email = customerConfirmationEmail(payload)
    expect(email.text).toContain('1. Cvikla [VP-CVIKLA-033] – 18 ks')
    expect(email.text).toContain('Spolu: 24 ks (2 prepravky)')
    expect(email.text).toContain('Požadovaný termín: 3. 11. 2026')
  })
})

describe('helpers', () => {
  it('formats dates and escapes HTML', () => {
    expect(formatDateSk(null)).toBe('—')
    expect(escapeHtml(`"a" & 'b'`)).toBe('&quot;a&quot; &amp; &#39;b&#39;')
  })
})

describe('cancellation', () => {
  it('adds a cancel button only when a link is given', () => {
    expect(customerConfirmationEmail(payload).html).not.toContain('Zrušiť objednávku')
    const withLink = customerConfirmationEmail(payload, {
      url: 'https://web.sk/objednavka/zrusit?t=abc',
      deadline: '2026-10-22T10:30:00.000Z',
    })
    expect(withLink.html).toContain('href="https://web.sk/objednavka/zrusit?t=abc"')
    expect(withLink.text).toContain('https://web.sk/objednavka/zrusit?t=abc')
    expect(withLink.text).toContain('12:30') // termín v slovenskom čase
  })

  it('tells sales not to process a cancelled order', () => {
    const email = internalCancellationEmail({
      order_number: 'OBJ-2026-00042',
      company_name: 'Bistro s.r.o.',
      ico: '12345678',
      email: 'jana@example.sk',
      cancelled_at: '2026-10-22T09:00:00.000Z',
      via: 'email',
    })
    expect(email.subject).toBe('[ZRUŠENÁ] OBJ-2026-00042 | Bistro s.r.o. | IČO 12345678')
    expect(email.text).toContain('Objednávku nespracúvajte.')
    expect(email.html).toContain('odkazom z potvrdzovacieho emailu')
  })
})

describe('standing orders', () => {
  const base = {
    orderNumber: 'OBJ-2026-00050',
    createdAt: '2026-10-22T08:30:00.000Z',
    customer: payload.customer,
    delivery: payload.delivery.address,
    requestedDate: '2026-11-02',
    note: '',
    crateSize: 12,
    items: [{ sku: '80000219', name: 'VITAPRO Cvikla 0,33 l', quantity: 24 }],
  }

  it('marks a new standing order for planning in ActiWhere', () => {
    const p = buildOrderPayload({ ...base, recurrence: 'weekly' })
    expect(p.standing).toEqual({ interval: 'weekly', label: 'každý týždeň', replaces_order_number: null })
    const email = internalOrderEmail(p)
    expect(email.subject.startsWith('[TRVALÁ OBJEDNÁVKA] OBJ-2026-00050')).toBe(true)
    expect(email.text).toContain('TRVALÁ OBJEDNÁVKA – každý týždeň od 2. 11. 2026')
    expect(email.text).toContain('Prvá dodávka: 2. 11. 2026')
  })

  it('tells sales which standing order a change replaces', () => {
    const p = buildOrderPayload({ ...base, recurrence: 'monthly', replacesOrderNumber: 'OBJ-2026-00042' })
    const email = internalOrderEmail(p)
    expect(email.subject.startsWith('[ZMENA TRVALEJ OBJEDNÁVKY]')).toBe(true)
    expect(email.text).toContain('Pôvodnú trvalú objednávku OBJ-2026-00042 ukončite.')
    expect(customerConfirmationEmail(p).subject).toBe('Zmena pravidelnej dodávky OBJ-2026-00050 – VITAPRO')
  })

  it('keeps one-time orders unchanged', () => {
    expect(payload.standing).toBeUndefined()
    expect(internalOrderEmail(payload).subject.startsWith('[OBJEDNÁVKA]')).toBe(true)
  })

  it('announces the end of a standing order', () => {
    const email = internalStandingEndEmail({
      order_number: 'OBJ-2026-00050',
      company_name: 'Bistro s.r.o.',
      ico: '12345678',
      email: 'jana@example.sk',
      ended_at: '2026-10-22T09:00:00.000Z',
      via: 'account',
    })
    expect(email.subject).toBe('[UKONČENIE TRVALEJ OBJEDNÁVKY] OBJ-2026-00050 | Bistro s.r.o. | IČO 12345678')
    expect(email.text).toContain('Zastavte opakované dodávky v ActiWhere')
  })
})
