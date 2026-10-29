# Rozhodnutia a otvorené body

Priebežný záznam dohôd s klientom (AQUA PRO EUROPE, a.s.).

## Emaily
- Odosielanie cez Resend z domény `vita-pro.sk` (región EU, DNS u Websupportu).
- Objednávky pre AQUA PRO → `hotline@aquapro.sk`.
- Pošta na `@vita-pro.sk` sa iba presmeruje na `hotline@aquapro.sk` (Websupport).
- Kontakt pre odpovede zákazníkov: zatiaľ nepotvrdený (návrh: `hotline@aquapro.sk`).

## Účty služieb
- Všetky služby (Resend, Supabase, Vercel, GitHub) na `vitaproadmin@gmail.com`.
- Správca webu zatiaľ `info@peterivan.com`; pred spustením pridať osobu z AQUA PRO.
- Pri odovzdaní: obnovovací telefón/email Gmailu nastaviť na AQUA PRO.
- Stav presunu (29. 10. 2026):
  - Supabase – `vitaproadmin@gmail.com` je Owner organizácie AQUA PRO (databáza ostala na mieste).
  - GitHub – repozitár presunutý na `vitapro-admin/vitapro`, `peterivan78` je spolupracovník.
  - Vercel – nový projekt v tíme VITAPRO (účet vitapro-admin); starý projekt u peterivan78 zrušiť po overení.
  - Resend – účet na `vitaproadmin@gmail.com`, doména `vita-pro.sk` overená (29. 10.).
  - Supabase Auth – SMTP cez Resend (odosielateľ objednavky@vita-pro.sk), slovenské šablóny
    zo `supabase/email-templates/` vložené a otestované (obnova hesla OK).

## Rozsah prvej fázy
- **Bez napojenia na ActiWhere.** Systém funguje len cez emaily:
  potvrdenie s rekapituláciou zákazníkovi + email s objednávkou pre AQUA PRO.
  Všetko ostatné AQUA PRO rieši ručne.
- **Bez požadovaného termínu dodania** (29. 10. 2026): šťavy sa dovážajú s najbližšou dodávkou
  pramenitej vody AQUA PRO; po objednávke sa zobrazí táto informácia.

## Pri spustení (checklist)
- **Zapnúť indexovanie a vypnúť pásik „Testovacia prevádzka“:** vo Verceli nastaviť `ALLOW_INDEXING=true` (Config, Production) a nasadiť znova.
- Prejsť na Vercel Pro (komerčné použitie) a Supabase Pro (zálohy).
- Po prechode na Vercel Pro prepnúť repozitár na súkromný (Hobby nasadzuje zo súkromného repozitára len commity vlastníka).
- Zrušiť starý projekt na Verceli (účet peterivan78).
- Zmazať testovacie účty a objednávky (admin.test@vita-pro.sk, zakaznik.test@vita-pro.sk, testovacie firmy).
- V admine → Nastavenia prepnúť „Kam chodia objednávky / registrácie“ na `hotline@aquapro.sk`.
- Websupport: presmerovanie pošty @vita-pro.sk → `hotline@aquapro.sk`.
- AQUA PRO: pravidlo v pošte, aby emaily z @vita-pro.sk nešli do spamu (iCloud ich pri novej doméne označil).

## Právne texty
- VOP, ochrana osobných údajov a cookies: návrh (29. 10. 2026) – na schválenie AQUA PRO, ideálne s právnikom.
  Overiť IČ DPH, región Supabase a dátum účinnosti.

## Neskôr
