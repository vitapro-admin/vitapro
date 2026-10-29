import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage } from '@/components/LegalPage'
import { COMPANY, getSettings } from '@/lib/settings'

export const metadata: Metadata = { title: 'Ochrana osobných údajov' }

export default async function PrivacyPage() {
  const settings = await getSettings()
  return (
    <LegalPage title="Ochrana osobných údajov" updated="1. 11. 2026">
      <p>
        Tieto zásady vysvetľujú, ako spracúvame osobné údaje pri používaní objednávkového portálu VITAPRO, a to v súlade
        s nariadením (EÚ) 2016/679 (GDPR) a zákonom č. 18/2018 Z. z. o ochrane osobných údajov.
      </p>

      <h2>1. Prevádzkovateľ</h2>
      <p>
        <strong>{COMPANY.name}</strong>, {COMPANY.street}, {COMPANY.city}, IČO {COMPANY.ico}, zapísaná v {COMPANY.register}.
        <br />
        Kontakt vo veciach osobných údajov: <a href={`mailto:${settings.sales_email}`}>{settings.sales_email}</a>
        {settings.sales_phone ? `, tel. ${settings.sales_phone}` : ''}.
      </p>

      <h2>2. Aké údaje spracúvame</h2>
      <ul>
        <li>
          <strong>Údaje kontaktnej osoby odberateľa</strong> – meno a priezvisko, email, telefón.
        </li>
        <li>
          <strong>Údaje o firme a doručovaní</strong> – obchodné meno, IČO, DIČ, IČ DPH, fakturačná a dodacie adresy,
          kontaktná osoba na prevádzke.
        </li>
        <li>
          <strong>Údaje o objednávkach</strong> – objednané produkty, množstvá, poznámky, pravidelné dodávky a ich zmeny.
        </li>
        <li>
          <strong>Prihlasovacie a technické údaje</strong> – prihlasovací email, heslo (uložené len v zašifrovanej podobe),
          čas prihlásenia, IP adresa a údaje o prehliadači v bezpečnostných záznamoch.
        </li>
      </ul>

      <h2>3. Účely a právne základy</h2>
      <ul>
        <li>
          <strong>Vedenie účtu, prijímanie a vybavovanie objednávok</strong> – plnenie zmluvy s odberateľom a náš oprávnený
          záujem komunikovať s jeho kontaktnými osobami (čl. 6 ods. 1 písm. b) a f) GDPR).
        </li>
        <li>
          <strong>Fakturácia a účtovníctvo</strong> – plnenie zákonných povinností (čl. 6 ods. 1 písm. c) GDPR).
        </li>
        <li>
          <strong>Bezpečnosť portálu</strong> – ochrana pred zneužitím účtov, oprávnený záujem (čl. 6 ods. 1 písm. f)
          GDPR).
        </li>
      </ul>
      <p>Údaje nepoužívame na marketing tretích strán ani na automatizované rozhodovanie či profilovanie.</p>

      <h2>4. Ako dlho údaje uchovávame</h2>
      <ul>
        <li>Údaje účtu – počas trvania obchodného vzťahu a do 1 roka od zrušenia účtu.</li>
        <li>Objednávky – 10 rokov, ak sú súčasťou účtovných dokladov; inak 3 roky od dodania.</li>
        <li>Bezpečnostné záznamy – spravidla do 90 dní.</li>
      </ul>

      <h2>5. Kto má k údajom prístup</h2>
      <p>Údaje spracúvajú len poverení zamestnanci prevádzkovateľa a títo sprostredkovatelia:</p>
      <ul>
        <li>Supabase Inc. – databáza a prihlasovanie (dáta uložené v EÚ),</li>
        <li>Vercel Inc. – hosting webu (servery vo Frankfurte),</li>
        <li>Resend Inc. – odosielanie emailov (servery v Írsku),</li>
        <li>dodávateľ, ktorý portál technicky spravuje.</li>
      </ul>
      <p>
        Spoločnosti Supabase, Vercel a Resend majú sídlo v USA. Prípadný prenos údajov do USA je zabezpečený
        štandardnými zmluvnými doložkami Európskej komisie, prípadne rámcom EU-US Data Privacy Framework.
      </p>

      <h2>6. Vaše práva</h2>
      <p>
        Máte právo na prístup k údajom, ich opravu, vymazanie, obmedzenie spracúvania, prenosnosť a právo namietať
        spracúvanie na základe oprávneného záujmu. Žiadosť pošlite na{' '}
        <a href={`mailto:${settings.sales_email}`}>{settings.sales_email}</a>. Väčšinu údajov si môžete upraviť aj sami v
        sekcii Môj účet.
      </p>
      <p>
        Ak sa domnievate, že údaje spracúvame v rozpore s predpismi, môžete podať návrh na Úrad na ochranu osobných
        údajov Slovenskej republiky, Hraničná 12, 820 07 Bratislava, www.dataprotection.gov.sk.
      </p>

      <h2>7. Cookies</h2>
      <p>
        Informácie o cookies nájdete na stránke <Link href="/cookies">Používanie cookies</Link>.
      </p>
    </LegalPage>
  )
}
