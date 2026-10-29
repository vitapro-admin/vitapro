import { button, layout } from './templates'

// Šablóny pre systémové emaily Supabase (Authentication → Emails → Templates).
// Generujú sa s Go premennými Supabase ({{ .SiteURL }}, {{ .TokenHash }}),
// výsledné HTML je v supabase/email-templates/ na skopírovanie do Supabase.
// Odkazy vedú na /auth/confirm (token_hash) – fungujú aj na inom zariadení.

export type AuthTemplateKind = 'confirm-signup' | 'reset-password' | 'change-email'

export const SUPABASE_SITE_URL = '{{ .SiteURL }}'

const confirmUrl = (type: string, next: string) =>
  `${SUPABASE_SITE_URL}/auth/confirm?token_hash={{ .TokenHash }}&type=${type}&next=${next}`

export function authEmailTemplate(kind: AuthTemplateKind): { subject: string; html: string } {
  switch (kind) {
    case 'confirm-signup': {
      const subject = 'Potvrďte svoj email – VITAPRO'
      return {
        subject,
        html: layout(
          subject,
          { siteBase: SUPABASE_SITE_URL, preheader: 'Posledný krok k registrácii vašej firmy.', eyebrow: 'Registrácia', heading: 'Potvrďte', headingEm: 'svoj email' },
          `<p style="margin:0 0 4px">Dobrý deň,</p>
<p style="margin:0">ďakujeme za registráciu. Potvrďte prosím, že táto emailová adresa patrí vám. Potom vašu registráciu skontroluje obchodné oddelenie a po schválení môžete objednávať.</p>
<p style="margin:28px 0 0">${button(confirmUrl('email', '/ucet'), 'Potvrdiť email')}</p>
<p style="margin:20px 0 0;font-size:13px">Ak ste sa neregistrovali vy, tento email pokojne ignorujte.</p>`,
        ),
      }
    }
    case 'reset-password': {
      const subject = 'Obnovenie hesla – VITAPRO'
      return {
        subject,
        html: layout(
          subject,
          { siteBase: SUPABASE_SITE_URL, preheader: 'Odkaz na nastavenie nového hesla.', eyebrow: 'Obnovenie hesla', heading: 'Nastavte si', headingEm: 'nové heslo' },
          `<p style="margin:0 0 4px">Dobrý deň,</p>
<p style="margin:0">dostali sme žiadosť o obnovenie hesla k vášmu účtu VITAPRO. Nové heslo si nastavíte cez tlačidlo nižšie.</p>
<p style="margin:28px 0 0">${button(confirmUrl('recovery', '/nove-heslo'), 'Nastaviť nové heslo')}</p>
<p style="margin:20px 0 0;font-size:13px">Ak ste o obnovenie nežiadali, tento email ignorujte – vaše heslo ostáva bez zmeny.</p>`,
        ),
      }
    }
    case 'change-email': {
      const subject = 'Potvrďte zmenu emailu – VITAPRO'
      return {
        subject,
        html: layout(
          subject,
          { siteBase: SUPABASE_SITE_URL, preheader: 'Potvrďte novú emailovú adresu k účtu VITAPRO.', eyebrow: 'Zmena emailu', heading: 'Potvrďte', headingEm: 'novú adresu' },
          `<p style="margin:0 0 4px">Dobrý deň,</p>
<p style="margin:0">k vášmu účtu VITAPRO bola zadaná nová emailová adresa <strong>{{ .NewEmail }}</strong>. Zmenu potvrdíte tlačidlom nižšie.</p>
<p style="margin:28px 0 0">${button(confirmUrl('email_change', '/ucet'), 'Potvrdiť zmenu')}</p>
<p style="margin:20px 0 0;font-size:13px">Ak ste zmenu nežiadali, kontaktujte prosím obchodné oddelenie.</p>`,
        ),
      }
    }
  }
}
