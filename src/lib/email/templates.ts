import type { OrderPayload } from '@/lib/orders/orderPayload'
import type { OrderDeliveryAddress } from '@/lib/types'
import { cratesLabel } from '@/lib/crates'
import { siteUrl } from '@/lib/site'

export type EmailContent = { subject: string; html: string; text: string }

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Hlavičky emailu nesmú obsahovať zalomenia riadkov. */
export function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim()
}

export function formatDateSk(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${Number(d)}. ${Number(m)}. ${y}`
}

export function formatDateTimeSk(iso: string): string {
  return new Intl.DateTimeFormat('sk-SK', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Bratislava',
  }).format(new Date(iso))
}

function addressLines(a: OrderDeliveryAddress): string[] {
  return [
    a.company,
    a.street,
    `${a.zip} ${a.city}`.trim(),
    a.country,
    a.contact_name ? `Kontakt: ${a.contact_name}${a.contact_phone ? `, ${a.contact_phone}` : ''}` : a.contact_phone,
    a.note ? `Poznámka k adrese: ${a.note}` : '',
  ].filter(Boolean)
}

// Farby a písma podľa webu (globals.css). Emailoví klienti nenačítajú Playfair
// spoľahlivo, preto nadpisy padajú na Georgia.
const C = {
  paper: '#f6f2eb',
  paperDeep: '#ede6da',
  ink: '#1c1a19',
  soft: '#57524c',
  mute: '#8a847b',
  line: '#e2dacd',
  brand: '#0089ce',
  danger: '#b3261e',
}
const SERIF = "'Playfair Display',Georgia,'Times New Roman',serif"
const SANS = "Inter,'Helvetica Neue',Helvetica,Arial,sans-serif"

type LayoutOptions = {
  /** Krátky text, ktorý schránka ukáže vedľa predmetu. */
  preheader?: string
  eyebrow?: string
  heading: string
  /** Doplnok nadpisu kurzívou (ako „zo slovenských sadov“ na webe). */
  headingEm?: string
}

function layout(title: string, o: LayoutOptions, body: string): string {
  return `<!doctype html><html lang="sk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><title>${escapeHtml(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${C.paper};font-family:${SANS};color:${C.ink};-webkit-font-smoothing:antialiased">
${o.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(o.preheader)}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper}">
<tr><td align="center" style="padding:36px 12px 48px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
<tr><td align="center" style="padding:0 0 28px">
<a href="${escapeHtml(siteUrl('/'))}"><img src="${escapeHtml(siteUrl('/email/vitapro-logo.png'))}" width="170" height="31" alt="VITAPRO" style="display:block;border:0"></a>
</td></tr>
<tr><td style="background:#ffffff;border:1px solid ${C.line};border-radius:14px;padding:36px 32px 32px">
${o.eyebrow ? `<p style="margin:0 0 12px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${C.mute}">${escapeHtml(o.eyebrow)}</p>` : ''}
<h1 style="margin:0 0 20px;font-family:${SERIF};font-weight:400;font-size:30px;line-height:1.2;color:${C.ink}">${escapeHtml(o.heading)}${
    o.headingEm ? ` <em style="font-style:italic">${escapeHtml(o.headingEm)}</em>` : ''
  }</h1>
<div style="font-size:15px;line-height:1.6;color:${C.soft}">${body}</div>
</td></tr>
<tr><td align="center" style="padding:28px 24px 0;font-size:12px;line-height:1.7;color:${C.mute}">
<span style="font-family:${SERIF};font-style:italic;font-size:14px;color:${C.soft}">100% prírodné šťavy zo slovenských sadov a polí</span><br>
AQUA PRO EUROPE, a.s. · Pod furčou 7 · 040 01 Košice<br>
<a href="${escapeHtml(siteUrl('/'))}" style="color:${C.mute}">${escapeHtml(siteUrl('/').replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a>
</td></tr>
</table></td></tr></table></body></html>`
}

function sectionTitle(text: string): string {
  return `<p style="margin:28px 0 8px;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:${C.mute}">${escapeHtml(text)}</p>`
}

function button(href: string, label: string, variant: 'dark' | 'danger' = 'dark'): string {
  const style =
    variant === 'dark'
      ? `background:${C.ink};color:#ffffff;border:1px solid ${C.ink}`
      : `background:#ffffff;color:${C.danger};border:1px solid ${C.danger}`
  return `<a href="${escapeHtml(href)}" style="display:inline-block;${style};padding:12px 24px;border-radius:999px;font-size:14px;font-weight:600;text-decoration:none">${escapeHtml(label)}</a>`
}

/** Zvýraznený rámček (pravidelná dodávka, upozornenia). */
function note(html: string, tone: 'paper' | 'brand' | 'danger' = 'paper'): string {
  const bg = tone === 'brand' ? '#e6f3fa' : tone === 'danger' ? '#fbecea' : C.paper
  const bar = tone === 'brand' ? C.brand : tone === 'danger' ? C.danger : C.line
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0"><tr>
<td style="background:${bg};border-left:3px solid ${bar};border-radius:6px;padding:14px 16px;font-size:14px;line-height:1.55;color:${C.ink}">${html}</td></tr></table>`
}

/** Riadky „popis – hodnota“ (údaje o objednávke, odberateľ). */
function facts(rows: [string, string][]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${rows
    .map(
      ([k, v]) => `<tr><td style="padding:5px 16px 5px 0;color:${C.mute};white-space:nowrap;vertical-align:top;width:1%">${escapeHtml(k)}</td>
<td style="padding:5px 0;color:${C.ink}">${escapeHtml(v)}</td></tr>`,
    )
    .join('')}</table>`
}

function itemsTableHtml(p: OrderPayload, withSku = false): string {
  const rows = p.items
    .map(
      (i) => `<tr>
<td style="padding:12px 0;border-bottom:1px solid ${C.line};font-family:${SERIF};font-size:17px;color:${C.ink}">${escapeHtml(i.name)}${
        withSku ? `<br><span style="font-family:${SANS};font-size:12px;color:${C.mute}">${escapeHtml(i.sku)}</span>` : ''
      }</td>
<td style="padding:12px 0;border-bottom:1px solid ${C.line};text-align:right;white-space:nowrap;font-size:15px;color:${C.ink}">${i.quantity}&nbsp;ks</td></tr>`,
    )
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.ink}">
${rows}
<tr><td style="padding:14px 0 0;font-size:14px;font-weight:600;color:${C.ink}">Spolu</td>
<td style="padding:14px 0 0;text-align:right;white-space:nowrap;font-size:14px;font-weight:600;color:${C.ink}">${p.totals.units}&nbsp;ks · ${cratesLabel(p.totals.crates)}</td></tr>
</table>`
}

function itemsText(p: OrderPayload): string {
  return p.items.map((i) => `  ${i.line}. ${i.name} [${i.sku}] – ${i.quantity} ks`).join('\n')
}

// ---------------------------------------------------------------------------
// Potvrdenie pre zákazníka
// ---------------------------------------------------------------------------
export type CancelLink = { url: string; deadline: string }

/** Riadok o pravidelnej dodávke (prázdny pri jednorazovej objednávke). */
function standingLine(p: OrderPayload): string {
  if (!p.standing) return ''
  const from = p.delivery.requested_date ? ` od ${formatDateSk(p.delivery.requested_date)}` : ''
  const replaces = p.standing.replaces_order_number ? ` – nahrádza ${p.standing.replaces_order_number}` : ''
  return `Pravidelná dodávka: ${p.standing.label}${from}${replaces}`
}

function dateLabel(p: OrderPayload): string {
  return p.standing ? 'Prvá dodávka' : 'Požadovaný termín'
}

export function customerConfirmationEmail(p: OrderPayload, cancel?: CancelLink): EmailContent {
  const subject = p.standing
    ? `${p.standing.replaces_order_number ? 'Zmena pravidelnej dodávky' : 'Pravidelná dodávka'} ${p.order_number} – VITAPRO`
    : `Prijali sme vašu objednávku ${p.order_number} – VITAPRO`
  const delivery = addressLines(p.delivery.address)
  const greeting = p.customer.contact_name ? `Dobrý deň, ${escapeHtml(p.customer.contact_name)},` : 'Dobrý deň,'
  const html = layout(
    subject,
    {
      preheader: `Objednávka ${p.order_number} · ${p.totals.units} ks · ${dateLabel(p).toLowerCase()} ${formatDateSk(p.delivery.requested_date)}`,
      eyebrow: `Objednávka ${p.order_number}`,
      heading: p.standing ? 'Pravidelná dodávka' : 'Ďakujeme,',
      headingEm: p.standing ? 'je nastavená' : 'objednávku sme prijali',
    },
    `<p style="margin:0 0 4px">${greeting}</p>
<p style="margin:0">obchodné oddelenie vašu objednávku spracuje a ozve sa vám s termínom dodania.</p>
${p.standing ? note(`<strong>${escapeHtml(standingLine(p))}</strong><br><span style="color:${C.soft}">Dodávky budú chodiť automaticky, nemusíte nič objednávať. Zmeniť alebo ukončiť ich môžete v Môj účet.</span>`, 'brand') : ''}
${sectionTitle('Objednané šťavy')}
${itemsTableHtml(p)}
${sectionTitle('Doručenie')}
${facts([
  [dateLabel(p), formatDateSk(p.delivery.requested_date)],
  ['Adresa', delivery.join(', ')],
  ...(p.note ? ([['Poznámka', p.note]] as [string, string][]) : []),
])}
<p style="margin:32px 0 0">${button(siteUrl('/ucet'), 'Moje objednávky')}</p>
<p style="margin:20px 0 0;font-size:13px;color:${C.mute}">Potrebujete objednávku zmeniť? Stačí odpovedať na tento email.</p>
${cancel ? cancelBlockHtml(cancel) : ''}`,
  )
  const text = `Dobrý deň,

ďakujeme, vašu objednávku ${p.order_number} sme prijali. Obchodné oddelenie ju spracuje a ozve sa vám s termínom dodania.
${p.standing ? `\n${standingLine(p)}\nDodávky budú chodiť automaticky. Zmeniť alebo ukončiť ich môžete v Môj účet.\n` : ''}
Položky:
${itemsText(p)}
Spolu: ${p.totals.units} ks (${cratesLabel(p.totals.crates)})

Dodacia adresa:
${delivery.join('\n')}

${dateLabel(p)}: ${formatDateSk(p.delivery.requested_date)}
${p.note ? `Poznámka: ${p.note}\n` : ''}
Ak potrebujete objednávku zmeniť, odpovedzte na tento email.
${cancel ? `\nTúto objednávku ste nezadali vy? Zrušiť ju môžete do ${formatDateTimeSk(cancel.deadline)}:\n${cancel.url}\n` : ''}
AQUA PRO EUROPE, a.s.`
  return { subject, html, text }
}

// ---------------------------------------------------------------------------
// Interná objednávka (pre obchod + internú AI)
// ---------------------------------------------------------------------------
export function internalOrderSubject(p: OrderPayload): string {
  const tag = p.standing ? (p.standing.replaces_order_number ? '[ZMENA TRVALEJ OBJEDNÁVKY]' : '[TRVALÁ OBJEDNÁVKA]') : '[OBJEDNÁVKA]'
  return `${tag} ${p.order_number} | ${oneLine(p.customer.company_name)} | IČO ${oneLine(p.customer.ico)} | ${p.totals.units} ks`
}

export function internalOrderEmail(p: OrderPayload): EmailContent {
  const subject = internalOrderSubject(p)
  const c = p.customer
  const customerRows: [string, string][] = [
    ['Firma', c.company_name],
    ['IČO', c.ico],
    ['DIČ', c.dic || '—'],
    ['IČ DPH', c.ic_dph || '—'],
    ['Kontakt', c.contact_name],
    ['Email', c.email],
    ['Telefón', c.phone || '—'],
    ['Fakturačná adresa', `${c.billing_address.street}, ${c.billing_address.zip} ${c.billing_address.city}, ${c.billing_address.country}`],
  ]
  const d = p.delivery.address
  const html = layout(
    subject,
    {
      preheader: `${c.company_name} · ${p.totals.units} ks · ${dateLabel(p).toLowerCase()} ${formatDateSk(p.delivery.requested_date)}`,
      eyebrow: `${p.standing ? (p.standing.replaces_order_number ? 'Zmena trvalej objednávky' : 'Trvalá objednávka') : 'Nová objednávka'} ${p.order_number} · ${formatDateTimeSk(p.created_at)}`,
      heading: c.company_name,
    },
    `${p.standing ? note(`<strong>Trvalá objednávka – ${escapeHtml(standingLine(p).replace('Pravidelná dodávka: ', ''))}</strong><br>Naplánujte opakované dodávky v ActiWhere.${p.standing.replaces_order_number ? ` Pôvodnú trvalú objednávku <strong>${escapeHtml(p.standing.replaces_order_number)}</strong> ukončite.` : ''}`, 'brand') : ''}
${sectionTitle('Položky')}
${itemsTableHtml(p, true)}
${p.packaging ? `<p style="margin:10px 0 0;font-size:13px;color:${C.mute}">Prepravky: ${escapeHtml(p.packaging.name)} [${escapeHtml(p.packaging.sku)}] – ${p.packaging.quantity} ks</p>` : ''}
${sectionTitle(`Doručenie${d.label ? ` · ${d.label}` : ''}`)}
${facts([
  [dateLabel(p), formatDateSk(p.delivery.requested_date)],
  ['Adresa', addressLines(d).join(', ')],
  ['Poznámka', p.note ?? '—'],
])}
${sectionTitle('Odberateľ')}
${facts(customerRows)}
<p style="margin:28px 0 0;font-size:12px;color:${C.mute}">Odpoveď na tento email pôjde priamo zákazníkovi. Údaje v strojovom formáte sú v prílohe objednavka-${escapeHtml(p.order_number)}.json.</p>`,
  )
  const text = `NOVÁ OBJEDNÁVKA ${p.order_number}
Vytvorená: ${formatDateTimeSk(p.created_at)}${
    p.standing
      ? `\n\nTRVALÁ OBJEDNÁVKA – ${standingLine(p).replace('Pravidelná dodávka: ', '')}\nNaplánujte opakované dodávky v ActiWhere.${
          p.standing.replaces_order_number ? ` Pôvodnú trvalú objednávku ${p.standing.replaces_order_number} ukončite.` : ''
        }`
      : ''
  }

ODBERATEĽ
${customerRows.map(([k, v]) => `${k}: ${v}`).join('\n')}

POLOŽKY
${itemsText(p)}
SPOLU: ${p.totals.units} ks (${cratesLabel(p.totals.crates)} po ${p.totals.crate_size} ks)${
    p.packaging ? `\nPREPRAVKY: ${p.packaging.name} [${p.packaging.sku}] – ${p.packaging.quantity} ks` : ''
  }

DODACIA ADRESA${p.delivery.address.label ? ` (${p.delivery.address.label})` : ''}
${addressLines(p.delivery.address).join('\n')}

${dateLabel(p)}: ${formatDateSk(p.delivery.requested_date)}
Poznámka: ${p.note ?? '—'}

Údaje v strojovom formáte sú v prílohe objednavka-${p.order_number}.json.
`
  return { subject, html, text }
}

// ---------------------------------------------------------------------------
// Registrácie
// ---------------------------------------------------------------------------
export function registrationNotifyEmail(r: {
  company_name: string
  ico: string
  contact_name: string
  email: string
  phone: string
  ico_known: boolean
  adminUrl: string
}): EmailContent {
  const subject = `[REGISTRÁCIA] ${oneLine(r.company_name)} | IČO ${oneLine(r.ico)}${r.ico_known ? ' | známy klient' : ''}`
  const lines = [
    `Firma: ${r.company_name}`,
    `IČO: ${r.ico} ${r.ico_known ? '(je v zozname klientov)' : '(NIE JE v zozname klientov)'}`,
    `Kontakt: ${r.contact_name}`,
    `Email: ${r.email}`,
    `Telefón: ${r.phone || '—'}`,
  ]
  const html = layout(
    subject,
    { eyebrow: 'Nová registrácia', heading: r.company_name || 'Nová firma', headingEm: 'čaká na schválenie' },
    `${facts([
      ['IČO', `${r.ico} ${r.ico_known ? '· je v zozname klientov' : '· NIE JE v zozname klientov'}`],
      ['Kontakt', r.contact_name],
      ['Email', r.email],
      ['Telefón', r.phone || '—'],
    ])}
${r.ico_known ? '' : note('IČO nie je v zozname existujúcich klientov – pred schválením overte, či ide o vášho odberateľa.', 'danger')}
<p style="margin:28px 0 0">${button(r.adminUrl, 'Otvoriť v administrácii')}</p>`,
  )
  return { subject, html, text: `Nová registrácia čaká na schválenie.\n\n${lines.join('\n')}\n\nAdmin: ${r.adminUrl}` }
}

export function accountApprovedEmail(r: { contact_name: string; siteUrl: string }): EmailContent {
  const subject = 'Váš účet VITAPRO je schválený'
  const html = layout(
    subject,
    { preheader: 'Odteraz môžete objednávať šťavy VITAPRO.', eyebrow: 'Účet schválený', heading: 'Vitajte', headingEm: 'medzi partnermi VITAPRO' },
    `<p style="margin:0 0 4px">Dobrý deň${r.contact_name ? `, ${escapeHtml(r.contact_name)}` : ''},</p>
<p style="margin:0">váš účet bol schválený. Odteraz môžete objednávať – celé prepravky po 12 kusov, chute ľubovoľne kombinovať.</p>
<p style="margin:28px 0 0">${button(r.siteUrl, 'Prejsť na objednávku')}</p>`,
  )
  return { subject, html, text: `Dobrý deň,\n\nváš účet bol schválený. Odteraz môžete objednávať šťavy VITAPRO.\n\n${r.siteUrl}` }
}

function cancelBlockHtml({ url, deadline }: CancelLink): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0 0;border-top:1px solid ${C.line}">
<tr><td style="padding:24px 0 0;font-size:13px;line-height:1.6;color:${C.mute}">
<strong style="color:${C.ink}">Objednali ste omylom alebo ste objednávku nezadali vy?</strong><br>
Zrušiť ju môžete do <strong style="color:${C.ink}">${escapeHtml(formatDateTimeSk(deadline))}</strong>. Ak ste ju nezadali vy, zmeňte si aj heslo.
<p style="margin:14px 0 0">${button(url, 'Zrušiť objednávku', 'danger')}</p>
</td></tr></table>`
}

// ---------------------------------------------------------------------------
// Zrušenie objednávky
// ---------------------------------------------------------------------------
export type CancellationInfo = {
  order_number: string
  /** Ak zrušená objednávka bola zmenou trvalej objednávky, pôvodná opäť platí. */
  restored_order_number?: string | null
  company_name: string
  ico: string
  email: string
  cancelled_at: string
  via: 'email' | 'account' | 'admin'
}

const VIA_LABEL: Record<CancellationInfo['via'], string> = {
  email: 'odkazom z potvrdzovacieho emailu',
  account: 'v zákazníckom účte',
  admin: 'v administrácii',
}

export function internalCancellationEmail(c: CancellationInfo): EmailContent {
  const subject = `[ZRUŠENÁ] ${c.order_number} | ${oneLine(c.company_name)} | IČO ${oneLine(c.ico)}`
  const html = layout(
    subject,
    { eyebrow: 'Zrušená objednávka', heading: c.order_number, headingEm: 'nespracúvajte' },
    `${note(`<strong>Objednávku nespracúvajte.</strong> Ak už bola zadaná do systému, zrušte ju aj tam.`, 'danger')}
${c.restored_order_number ? note(`Pôvodná trvalá objednávka <strong>${escapeHtml(c.restored_order_number)}</strong> ostáva v platnosti.`, 'brand') : ''}
${sectionTitle('Podrobnosti')}
${facts([
  ['Odberateľ', `${c.company_name} (IČO ${c.ico})`],
  ['Zrušená', VIA_LABEL[c.via]],
  ['Kedy', formatDateTimeSk(c.cancelled_at)],
])}`,
  )
  const text = `ZRUŠENÁ OBJEDNÁVKA ${c.order_number}
Zákazník: ${c.company_name} (IČO ${c.ico})
Zrušená ${VIA_LABEL[c.via]}: ${formatDateTimeSk(c.cancelled_at)}

Objednávku nespracúvajte. Ak už bola naimportovaná, zrušte ju aj v internom systéme.${
    c.restored_order_number ? `\nPôvodná trvalá objednávka ${c.restored_order_number} ostáva v platnosti.` : ''
  }

`
  return { subject, html, text }
}

export function customerCancellationEmail(c: CancellationInfo): EmailContent {
  const subject = `Objednávka ${c.order_number} bola zrušená – VITAPRO`
  const html = layout(
    subject,
    { eyebrow: `Objednávka ${c.order_number}`, heading: 'Objednávka', headingEm: 'bola zrušená' },
    `<p style="margin:0 0 4px">Dobrý deň,</p>
<p style="margin:0">objednávka <strong style="color:${C.ink}">${escapeHtml(c.order_number)}</strong> bola zrušená a nebude spracovaná.</p>
<p style="margin:20px 0 0;font-size:13px;color:${C.mute}">Ak ste ju nezadali vy, odporúčame zmeniť si heslo a kontaktovať obchodné oddelenie.</p>`,
  )
  const text = `Dobrý deň,

objednávka ${c.order_number} bola zrušená a nebude spracovaná.

Ak ste ju nezadali vy, odporúčame zmeniť si heslo a kontaktovať obchodné oddelenie.

AQUA PRO EUROPE, a.s.`
  return { subject, html, text }
}

// ---------------------------------------------------------------------------
// Ukončenie trvalej objednávky
// ---------------------------------------------------------------------------
export type StandingEndInfo = {
  order_number: string
  company_name: string
  ico: string
  email: string
  ended_at: string
  via: 'account' | 'admin'
}

export function internalStandingEndEmail(c: StandingEndInfo): EmailContent {
  const subject = `[UKONČENIE TRVALEJ OBJEDNÁVKY] ${c.order_number} | ${oneLine(c.company_name)} | IČO ${oneLine(c.ico)}`
  const who = c.via === 'account' ? 'zákazník v svojom účte' : 'administrácia'
  const html = layout(
    subject,
    { eyebrow: 'Ukončenie trvalej objednávky', heading: c.order_number, headingEm: 'je ukončená' },
    `${note('<strong>Zastavte opakované dodávky v ActiWhere</strong> a pri poslednej návšteve vyzdvihnite prázdne fľaše a prepravky.', 'brand')}
${sectionTitle('Podrobnosti')}
${facts([
  ['Odberateľ', `${c.company_name} (IČO ${c.ico})`],
  ['Ukončil', who],
  ['Kedy', formatDateTimeSk(c.ended_at)],
])}`,
  )
  const text = `UKONČENIE TRVALEJ OBJEDNÁVKY ${c.order_number}
Zákazník: ${c.company_name} (IČO ${c.ico})
Ukončil ${who}: ${formatDateTimeSk(c.ended_at)}

Zastavte opakované dodávky v ActiWhere a pri poslednej návšteve vyzdvihnite prázdne fľaše a prepravky.

`
  return { subject, html, text }
}

export function customerStandingEndEmail(c: StandingEndInfo): EmailContent {
  const subject = `Pravidelná dodávka ${c.order_number} je ukončená – VITAPRO`
  const html = layout(
    subject,
    { eyebrow: `Pravidelná dodávka ${c.order_number}`, heading: 'Pravidelná dodávka', headingEm: 'je ukončená' },
    `<p style="margin:0 0 4px">Dobrý deň,</p>
<p style="margin:0">pravidelnú dodávku <strong style="color:${C.ink}">${escapeHtml(c.order_number)}</strong> sme ukončili. Obchodné oddelenie vás kontaktuje ohľadom poslednej dodávky a vyzdvihnutia prázdnych fliaš.</p>`,
  )
  const text = `Dobrý deň,

pravidelnú dodávku ${c.order_number} sme ukončili. Obchodné oddelenie vás kontaktuje ohľadom poslednej dodávky a vyzdvihnutia prázdnych fliaš.

AQUA PRO EUROPE, a.s.`
  return { subject, html, text }
}
