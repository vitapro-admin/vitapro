import Image from 'next/image'
import Link from 'next/link'
import { OrderBar } from '@/components/cart/OrderBar'
import { ProductGrid } from '@/components/catalog/ProductGrid'
import { canOrder, getViewer } from '@/lib/auth'
import { getVisibleProducts } from '@/lib/catalog/getProducts'
import { getSettings } from '@/lib/settings'

export default async function HomePage() {
  const [viewer, products, settings] = await Promise.all([getViewer(), getVisibleProducts(), getSettings()])
  const ordering = canOrder(viewer)

  return (
    <main>
      <Hero ordering={ordering} loggedIn={Boolean(viewer)} />
      {viewer && !ordering && <PendingNotice status={viewer.profile?.status ?? 'pending'} />}
      <Values />

      <section id="stavy" className="paper-grain">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <p className="eyebrow text-ink-mute">Naša ponuka</p>
              <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">Deväť chutí, jedna fľaša 0,33&nbsp;l</h2>
            </div>
            <p className="max-w-sm text-ink-soft">
              {ordering
                ? `Zadajte počty kusov. Objednáva sa po celých prepravkách – ${settings.crate_size} ks, chute môžete ľubovoľne kombinovať.`
                : `Objednávať môžu registrovaní obchodní partneri AQUA PRO EUROPE. Balenie: prepravka ${settings.crate_size} ks, chute sa dajú kombinovať.`}
            </p>
          </div>
          <ProductGrid products={products} crateSize={settings.crate_size} />
        </div>
      </section>

      <HowToOrder crateSize={settings.crate_size} />
      <Contact name={settings.sales_name} email={settings.sales_email} phone={settings.sales_phone} />
      {ordering && <div className="h-28" aria-hidden />}
      <OrderBar crateSize={settings.crate_size} products={products.map((p) => ({ id: p.id, color: p.accent_color }))} />
    </main>
  )
}

function Hero({ ordering, loggedIn }: { ordering: boolean; loggedIn: boolean }) {
  return (
    <section className="overflow-hidden bg-night text-white md:grid md:grid-cols-[40%_60%] md:items-center">
      {/* Ľavý okraj textu zarovnaný s obsahom stránky (max-w-6xl). */}
      <div className="px-4 pb-10 pt-14 sm:px-6 md:py-16 md:pl-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] md:pr-8">
        <p className="eyebrow text-white/60">Pre obchodných partnerov AQUA PRO EUROPE</p>
        <h1 className="mt-5 font-display text-[2.5rem] leading-[1.05] sm:text-5xl lg:text-[3.4rem]">
          100% prírodné šťavy <em>zo slovenských sadov a polí</em>
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-white/75">
          Lisované z čerstvého ovocia a zeleniny. Bez pridaného cukru, bez konzervantov, nie z koncentrátu.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          {ordering ? (
            <Link href="#stavy" className="btn btn-light">
              Objednať
            </Link>
          ) : loggedIn ? (
            <Link href="/ucet" className="btn btn-light">
              Môj účet
            </Link>
          ) : (
            <>
              <Link href="/registracia" className="btn btn-light">
                Registrovať firmu
              </Link>
              <Link href="/prihlasenie" className="btn btn-ghost text-white">
                Prihlásiť sa
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Celá fotka bez orezania – musí byť vidieť všetkých 9 štiav. */}
      <div className="relative">
        <Image
          src="/img/hero.webp"
          alt="Deväť štiav VITAPRO s ovocím a zeleninou"
          width={2400}
          height={1747}
          priority
          sizes="(min-width: 768px) 60vw, 100vw"
          className="block h-auto w-full"
        />
        <div aria-hidden className="absolute inset-y-0 left-0 hidden w-[5%] bg-gradient-to-r from-night to-transparent md:block" />
      </div>
    </section>
  )
}

function PendingNotice({ status }: { status: string }) {
  return (
    <div className="border-b border-line bg-amber-50">
      <p className="mx-auto max-w-6xl px-4 py-4 text-sm text-amber-900 sm:px-6">
        {status === 'blocked'
          ? 'Váš účet je pozastavený. Kontaktujte prosím obchodné oddelenie.'
          : 'Váš účet čaká na schválenie obchodným oddelením. Hneď ako ho schválime, pošleme vám email a môžete objednávať.'}
      </p>
    </div>
  )
}

const VALUES = [
  ['100 % prírodná šťava', 'Nie je vyrobená z koncentrátu (NFC).'],
  ['Bez pridaného cukru', 'Bez konzervantov, arôm a sladidiel.'],
  ['Šetrne pasterizované', 'Bez chemického ošetrenia a pridanej vody.'],
  ['Slovenská úroda', 'Z kontrolovaných sadov a polí na Slovensku.'],
] as const

function Values() {
  return (
    <section aria-label="Prečo VITAPRO" className="border-b border-line bg-paper">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[auto_1fr]">
        <div className="flex justify-center gap-4 lg:justify-start">
          <Image src="/ilustracie/peciatka-zo-slovenskych-sadov.webp" alt="Zo slovenských sadov a polí" width={120} height={120} className="h-24 w-24 sm:h-28 sm:w-28" />
          <Image src="/ilustracie/peciatka-za-studena-lisovane.webp" alt="Za studena lisované" width={120} height={120} className="h-24 w-24 sm:h-28 sm:w-28" />
        </div>
        <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(([title, text]) => (
            <div key={title}>
              <dt className="font-display text-lg">{title}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-ink-soft">{text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function HowToOrder({ crateSize }: { crateSize: number }) {
  const steps = [
    ['Registrácia', 'Zaregistrujte firmu – stačí IČO, kontakt a dodacia adresa.'],
    ['Schválenie', 'Obchodné oddelenie overí, že ste naším klientom, a účet aktivuje.'],
    ['Objednávka', `Vyberte chute po celých prepravkách (${crateSize} ks, ľubovoľný mix) a dodaciu adresu.`],
    ['Doručenie', 'Dostanete email so súhrnom. Šťavy vám prinesieme pri najbližšej dodávke pramenitej vody AQUA PRO.'],
  ]
  return (
    <section id="ako-objednat" className="border-t border-line bg-paper-deep/50">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <p className="eyebrow text-ink-mute">Ako objednať</p>
        <h2 className="mt-3 max-w-xl font-display text-4xl leading-tight">Štyri kroky k plnej prepravke</h2>
        <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([title, text], i) => (
            <li key={title} className="border-t border-ink/80 pt-5">
              <span className="font-display text-sm italic text-ink-mute">0{i + 1}</span>
              <h3 className="mt-2 text-lg font-medium">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Contact({ name, email, phone }: { name: string; email: string; phone: string }) {
  return (
    <section id="kontakt" className="bg-paper">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 md:grid-cols-2 md:items-center">
        <div>
          <p className="eyebrow text-ink-mute">Ešte nie ste naším klientom?</p>
          <h2 className="mt-3 font-display text-4xl leading-tight">Ozvite sa obchodnému oddeleniu</h2>
          <p className="mt-5 max-w-md leading-relaxed text-ink-soft">
            Objednávky cez tento web sú určené pre klientov spoločnosti AQUA PRO EUROPE, a.s. Ak chcete šťavy
            VITAPRO odoberať, kontaktujte nás – radi vám pripravíme ponuku.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-8">
          <p className="font-display text-2xl">{name}</p>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex gap-4">
              <dt className="w-16 text-ink-mute">Email</dt>
              <dd>
                <a href={`mailto:${email}`} className="underline decoration-line underline-offset-4 hover:decoration-ink">
                  {email}
                </a>
              </dd>
            </div>
            {phone && (
              <div className="flex gap-4">
                <dt className="w-16 text-ink-mute">Telefón</dt>
                <dd>
                  <a href={`tel:${phone.replace(/\s/g, '')}`} className="underline decoration-line underline-offset-4 hover:decoration-ink">
                    {phone}
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </section>
  )
}
