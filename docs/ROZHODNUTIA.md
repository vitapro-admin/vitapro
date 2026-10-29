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
  - Resend – účet na `vitaproadmin@gmail.com`, doména `vita-pro.sk` čaká na zverejnenie DNS vo Websupporte.

## Rozsah prvej fázy
- **Bez napojenia na ActiWhere.** Systém funguje len cez emaily:
  potvrdenie s rekapituláciou zákazníkovi + email s objednávkou pre AQUA PRO.
  Všetko ostatné AQUA PRO rieši ručne.

## Pri spustení (checklist)
- **Zapnúť indexovanie:** vo Verceli nastaviť `ALLOW_INDEXING=true` (Config, Production) a nasadiť znova.
- Prejsť na Vercel Pro (komerčné použitie) a Supabase Pro (zálohy).
- Po prechode na Vercel Pro prepnúť repozitár na súkromný (Hobby nasadzuje zo súkromného repozitára len commity vlastníka).
- Zrušiť starý projekt na Verceli (účet peterivan78).
- Zmazať testovacie účty a objednávky.

## Neskôr
- Administrácia: vizuálne zladiť s webom, aby bola pekná a príjemná na používanie.
