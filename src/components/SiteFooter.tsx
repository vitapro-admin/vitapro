import Image from 'next/image'
import Link from 'next/link'
import { COMPANY } from '@/lib/settings'

export function SiteFooter() {
  return (
    <footer className="bg-night text-white/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr]">
        <div className="space-y-5">
          <Image src="/logo/vitapro-white.svg" alt="VITAPRO" width={250} height={46} className="h-8 w-auto" />
          <p className="max-w-xs text-sm leading-relaxed">
            100% prírodné šťavy lisované z čerstvého ovocia a zeleniny zo slovenských sadov a polí.
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <p className="eyebrow text-white/45">Distribútor</p>
          <Image src="/logo/aquapro-white.svg" alt="AQUA PRO" width={259} height={85} className="h-9 w-auto" />
          <p className="leading-relaxed">
            {COMPANY.name}
            <br />
            {COMPANY.street}, {COMPANY.city}
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <p className="eyebrow text-white/45">Výrobca</p>
          <div className="flex items-start gap-3">
            <Image src="/logo/vuood.svg" alt="VÚOOD" width={83} height={119} className="h-14 w-auto invert" />
            <p className="leading-relaxed">
              Pre AQUA PRO EUROPE, a.s. exkluzívne vyrába Výskumný ústav ovocných a okrasných drevín a.s., Bojnice
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} {COMPANY.name}</p>
          <nav aria-label="Právne informácie" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/obchodne-podmienky" className="hover:text-white">Obchodné podmienky</Link>
            <Link href="/ochrana-osobnych-udajov" className="hover:text-white">Ochrana osobných údajov</Link>
            <Link href="/cookies" className="hover:text-white">Cookies</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
