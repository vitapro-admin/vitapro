import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage } from '@/components/LegalPage'
import { COMPANY, getSettings } from '@/lib/settings'

export const metadata: Metadata = { title: 'Obchodné podmienky' }

export default async function TermsPage() {
  const settings = await getSettings()
  return (
    <LegalPage title="Obchodné podmienky" updated="1. 11. 2026">
      <h2>1. Úvodné ustanovenia</h2>
      <ol>
        <li>
          Tieto obchodné podmienky upravujú objednávanie štiav VITAPRO cez objednávkový portál na tejto webovej
          stránke. Prevádzkovateľom portálu a predávajúcim je <strong>{COMPANY.name}</strong>, so sídlom {COMPANY.street},{' '}
          {COMPANY.city}, IČO {COMPANY.ico}, DIČ {COMPANY.dic}, zapísaná v {COMPANY.register} (ďalej „predávajúci“).
        </li>
        <li>
          Portál je určený výhradne podnikateľom a právnickým osobám, ktoré sú obchodnými partnermi predávajúceho
          (ďalej „odberateľ“). Vzťahy medzi predávajúcim a odberateľom sa riadia zákonom č. 513/1991 Zb. Obchodný
          zákonník. Portál nie je určený spotrebiteľom.
        </li>
        <li>
          Ak má odberateľ s predávajúcim uzavretú rámcovú alebo inú zmluvu, majú jej ustanovenia prednosť pred týmito
          obchodnými podmienkami.
        </li>
      </ol>

      <h2>2. Registrácia a používateľský účet</h2>
      <ol>
        <li>
          Objednávať môže len registrovaný odberateľ, ktorého účet predávajúci schválil. Predávajúci môže registráciu
          odmietnuť alebo účet zablokovať, najmä ak odberateľ nie je jeho obchodným partnerom alebo porušuje tieto
          podmienky.
        </li>
        <li>
          Odberateľ je povinný uvádzať pravdivé a aktuálne údaje a chrániť prístupové údaje k účtu. Za objednávky
          odoslané z jeho účtu zodpovedá odberateľ.
        </li>
      </ol>

      <h2>3. Objednávka a uzavretie zmluvy</h2>
      <ol>
        <li>
          Šťavy sa objednávajú po kusoch, vždy však v celých prepravkách po {settings.crate_size} ks. Chute v prepravke
          je možné ľubovoľne kombinovať.
        </li>
        <li>
          Odoslaním objednávky odberateľ predkladá predávajúcemu návrh na uzavretie kúpnej zmluvy. Email potvrdzujúci
          prijatie objednávky je len potvrdením jej doručenia. Kúpna zmluva je uzavretá dodaním tovaru, prípadne
          výslovným prijatím objednávky predávajúcim.
        </li>
        <li>
          Predávajúci môže objednávku odmietnuť alebo ju po dohode s odberateľom upraviť, najmä ak tovar nie je dostupný.
        </li>
      </ol>

      <h2>4. Zrušenie objednávky</h2>
      <ol>
        <li>
          Odberateľ môže objednávku zrušiť sám – odkazom v potvrdzovacom emaile alebo v sekcii Môj účet – v lehote
          uvedenej v potvrdzovacom emaile, kým predávajúci nezačal objednávku spracúvať.
        </li>
        <li>Po uplynutí tejto lehoty je zmena alebo zrušenie objednávky možné len po dohode s predávajúcim.</li>
      </ol>

      <h2>5. Pravidelné dodávky</h2>
      <ol>
        <li>
          Odberateľ si môže nastaviť pravidelnú dodávku v zvolenom intervale. Pravidelná dodávka trvá, kým ju odberateľ
          alebo predávajúci neukončí.
        </li>
        <li>
          Zmeniť alebo ukončiť pravidelnú dodávku môže odberateľ v sekcii Môj účet. Zmena sa uplatní od najbližšej
          dodávky, ktorú predávajúci ešte nepripravil.
        </li>
      </ol>

      <h2>6. Cena a platobné podmienky</h2>
      <ol>
        <li>
          Ceny tovaru sa riadia platným cenníkom predávajúceho alebo zmluvou s odberateľom. Portál ceny nezobrazuje.
        </li>
        <li>Tovar predávajúci fakturuje spôsobom a so splatnosťou podľa dohody s odberateľom.</li>
      </ol>

      <h2>7. Dodanie</h2>
      <ol>
        <li>
          Objednaný tovar predávajúci doručí na zvolenú dodaciu adresu pri najbližšej dodávke pramenitej vody AQUA PRO.
        </li>
        <li>Nebezpečenstvo škody na tovare a vlastnícke právo prechádzajú na odberateľa prevzatím tovaru.</li>
        <li>Vratné obaly (najmä prepravky) zostávajú vo vlastníctve predávajúceho, ak nie je dohodnuté inak.</li>
      </ol>

      <h2>8. Kvalita, skladovanie a reklamácie</h2>
      <ol>
        <li>
          Odberateľ je povinný tovar pri prevzatí skontrolovať. Zjavné vady (napr. poškodené alebo chýbajúce fľaše)
          uvedie pri prevzatí, najneskôr však do 2 pracovných dní.
        </li>
        <li>
          Skryté vady odberateľ uplatní bez zbytočného odkladu po ich zistení, najneskôr do dátumu minimálnej
          trvanlivosti uvedeného na výrobku.
        </li>
        <li>
          Tovar je potrebné skladovať podľa údajov na etikete. Predávajúci nezodpovedá za vady spôsobené nesprávnym
          skladovaním alebo zaobchádzaním po prevzatí.
        </li>
        <li>
          Reklamácie prijíma predávajúci na adrese <a href={`mailto:${settings.sales_email}`}>{settings.sales_email}</a>
          {settings.sales_phone ? ` alebo na telefóne ${settings.sales_phone}` : ''}. Ak je reklamácia oprávnená,
          predávajúci dodá náhradný tovar alebo vystaví dobropis.
        </li>
      </ol>

      <h2>9. Ochrana osobných údajov</h2>
      <p>
        Spracúvanie osobných údajov kontaktných osôb odberateľa popisujú{' '}
        <Link href="/ochrana-osobnych-udajov">Zásady ochrany osobných údajov</Link>.
      </p>

      <h2>10. Záverečné ustanovenia</h2>
      <ol>
        <li>
          Predávajúci môže tieto obchodné podmienky meniť. Zmenu zverejní na portáli; pre objednávku platí znenie účinné
          v čase jej odoslania.
        </li>
        <li>Tieto obchodné podmienky nadobúdajú účinnosť dňom uvedeným v ich záhlaví.</li>
      </ol>
    </LegalPage>
  )
}
