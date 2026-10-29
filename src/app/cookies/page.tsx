import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage } from '@/components/LegalPage'

export const metadata: Metadata = { title: 'Používanie cookies' }

export default function CookiesPage() {
  return (
    <LegalPage title="Používanie cookies" updated="1. 11. 2026">
      <p>
        Objednávkový portál VITAPRO používa <strong>iba nevyhnutné cookies</strong>, bez ktorých by nefungovalo
        prihlásenie a objednávanie. Nepoužívame analytické, reklamné ani sledovacie cookies a údaje o vašom správaní
        nezdieľame s tretími stranami. Preto od vás nežiadame súhlas (§ 109 ods. 8 zákona č. 452/2021 Z. z.
        o elektronických komunikáciách).
      </p>

      <h2>Čo ukladáme vo vašom prehliadači</h2>
      <ul>
        <li>
          <strong>Prihlasovacie cookies</strong> (názov začína <code>sb-</code>) – udržia vás prihláseného a chránia účet.
          Platia počas prihlásenia, po odhlásení sa vymažú.
        </li>
        <li>
          <strong>Obsah rozpracovanej objednávky</strong> – aby sa vám prepravka nevyprázdnila pri prechode medzi
          stránkami. Ukladá sa do lokálneho úložiska prehliadača (nie je to cookie) a vymaže sa po odoslaní objednávky.
        </li>
      </ul>

      <h2>Ako cookies vymazať</h2>
      <p>
        Cookies a lokálne úložisko môžete kedykoľvek vymazať v nastaveniach prehliadača. Portál potom bude fungovať, len
        sa budete musieť znova prihlásiť.
      </p>

      <p>
        Viac o spracúvaní údajov nájdete v <Link href="/ochrana-osobnych-udajov">Zásadách ochrany osobných údajov</Link>.
      </p>
    </LegalPage>
  )
}
