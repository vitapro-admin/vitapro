'use client'

import Image from 'next/image'
import { useCart } from '@/components/cart/CartProvider'
import { productPhoto } from '@/lib/productPhotos'
import type { Product } from '@/lib/types'

export function ProductGrid({ products, crateSize }: { products: Product[]; crateSize: number }) {
  return (
    <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} crateSize={crateSize} priority={i < 3} />
        </li>
      ))}
    </ul>
  )
}

function ProductCard({ product: p, crateSize, priority }: { product: Product; crateSize: number; priority: boolean }) {
  const unavailable = p.status !== 'active'
  const photo = productPhoto(p)
  const dim = unavailable ? 'opacity-40 grayscale' : ''
  return (
    <article className="group flex h-full flex-col" aria-labelledby={`p-${p.slug}`}>
      <div className="relative aspect-[3/2] overflow-hidden rounded-lg bg-paper-deep/60">
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-1" style={{ background: p.accent_color }} />
        {p.illustration_url && (
          // S fotkou fľaše je ilustrácia vľavo a fľaša vpravo – neprekrývajú sa,
          // inak by cez sklo a etiketu presvitala kresba.
          <div className={`absolute inset-y-0 left-0 ${photo ? 'w-[64%]' : 'w-full'}`}>
            <Image
              src={p.illustration_url}
              alt=""
              fill
              sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 92vw"
              priority={priority}
              className={`object-contain p-5 transition duration-500 ${photo ? 'group-hover:-translate-x-1' : 'group-hover:scale-[1.03]'} ${dim}`}
            />
          </div>
        )}
        {photo && (
          // Fotka je na bielom pozadí – „multiply“ ju opticky vsadí do papierového podkladu.
          <Image
            src={photo}
            alt={`Fľaša VITAPRO ${p.name}`}
            width={400}
            height={400}
            sizes="(min-width: 1024px) 220px, (min-width: 640px) 28vw, 55vw"
            priority={priority}
            className={`absolute bottom-[4%] right-[2%] h-[94%] w-auto mix-blend-multiply transition duration-500 group-hover:-translate-y-1 ${dim}`}
          />
        )}
        {unavailable && (
          <span className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 text-xs font-medium text-white">
            Dočasne nedostupné
          </span>
        )}
      </div>

      <div className="mt-5 flex items-baseline justify-between gap-3">
        <h3 id={`p-${p.slug}`} className="font-display text-[1.7rem] font-bold italic leading-tight">
          {p.name}
        </h3>
        <span className="shrink-0 text-sm text-ink-mute">{p.volume}</span>
      </div>
      <p className="mt-1 text-[0.82rem] uppercase tracking-wide" style={{ color: darken(p.accent_color) }}>
        {p.subtitle}
      </p>

      <details className="group/d mt-3 text-sm text-ink-soft">
        <summary className="cursor-pointer list-none text-ink-mute underline decoration-line underline-offset-4 hover:text-ink [&::-webkit-details-marker]:hidden">
          Zloženie a výživové údaje
        </summary>
        <div className="mt-3 space-y-2 leading-relaxed">
          <p>
            <span className="font-medium text-ink">Zloženie:</span> {p.composition}
          </p>
          <p>
            <span className="font-medium text-ink">Na 100 ml:</span> {p.nutrition}
          </p>
        </div>
      </details>

      <div className="mt-auto pt-5">
        <QuantityControl product={p} crateSize={crateSize} disabled={unavailable} />
      </div>
    </article>
  )
}

function QuantityControl({ product, crateSize, disabled }: { product: Product; crateSize: number; disabled: boolean }) {
  const { enabled, quantity, setQuantity, hydrated } = useCart()
  if (!enabled) return null
  const q = hydrated ? quantity(product.id) : 0
  const label = `Počet kusov – ${product.name}`
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-full border border-line bg-white">
        <button
          type="button"
          aria-label={`Odobrať 1 ks – ${product.name}`}
          disabled={disabled || q === 0}
          onClick={() => setQuantity(product.id, q - 1)}
          className="grid h-10 w-10 place-items-center rounded-full text-lg disabled:opacity-30"
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          aria-label={label}
          disabled={disabled}
          value={q === 0 ? '' : q}
          placeholder="0"
          onChange={(e) => setQuantity(product.id, Number(e.target.value))}
          className="h-10 w-14 bg-transparent text-center text-base tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          aria-label={`Pridať 1 ks – ${product.name}`}
          disabled={disabled}
          onClick={() => setQuantity(product.id, q + 1)}
          className="grid h-10 w-10 place-items-center rounded-full text-lg disabled:opacity-30"
        >
          +
        </button>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setQuantity(product.id, q + crateSize)}
        className="rounded-full border border-line px-3 py-2 text-xs font-medium text-ink-soft hover:border-ink hover:text-ink disabled:opacity-30"
      >
        +{crateSize} ks
      </button>
    </div>
  )
}

/** Svetlé farby etikiet (napr. Dulienka) stmaví, aby text bol čitateľný. */
function darken(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  if (luminance < 0.5) return hex
  const f = 0.5 / luminance
  const c = (v: number) => Math.round(v * f).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}
