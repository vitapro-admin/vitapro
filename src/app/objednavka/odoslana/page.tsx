import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ClearCart } from './ClearCart'

export const metadata: Metadata = { title: 'Objednávka odoslaná', robots: { index: false } }

export default async function OrderSentPage({ searchParams }: PageProps<'/objednavka/odoslana'>) {
  const { c } = await searchParams
  const number = typeof c === 'string' && /^OBJ-\d{4}-\d{5,}$/.test(c) ? c : null
  return (
    <main className="paper-grain">
      <ClearCart />
      <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <Image src="/ilustracie/peciatka-zo-slovenskych-sadov.webp" alt="" width={120} height={120} className="mx-auto h-28 w-28" />
        <h1 className="mt-8 font-display text-4xl">Ďakujeme</h1>
        {number && (
          <p className="mt-4 text-lg">
            Číslo objednávky: <strong className="font-medium">{number}</strong>
          </p>
        )}
        <p className="mt-4 leading-relaxed text-ink-soft">
          Objednávka Vám bude doručená pri najbližšej dodávke pramenitej vody AQUA PRO. Potvrdenie sme vám poslali emailom.
        </p>
        <div className="mt-10 flex justify-center gap-3">
          <Link href="/ucet" className="btn btn-primary">
            Moje objednávky
          </Link>
          <Link href="/" className="btn btn-ghost">
            Na úvod
          </Link>
        </div>
      </div>
    </main>
  )
}
