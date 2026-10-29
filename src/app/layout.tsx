import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { CartProvider } from '@/components/cart/CartProvider'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { canOrder, getViewer } from '@/lib/auth'
import { siteUrl } from '@/lib/site'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-inter', display: 'swap' })
// Bezplatná náhrada GT Sectra z etikiet (licencia OFL).
const playfair = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-playfair',
  style: ['normal', 'italic'],
  weight: ['400', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: 'VITAPRO – 100% prírodné šťavy', template: '%s | VITAPRO' },
  description:
    'Objednávky 100% prírodných štiav VITAPRO pre obchodných partnerov AQUA PRO EUROPE, a.s. Lisované z čerstvého ovocia a zeleniny zo slovenských sadov a polí.',
  // Pred spustením neindexovať – zapína sa premennou ALLOW_INDEXING=true.
  robots: process.env.ALLOW_INDEXING === 'true' ? { index: true, follow: true } : { index: false, follow: false },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer()
  return (
    <html lang="sk" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-dvh font-sans">
        <CartProvider enabled={canOrder(viewer)}>
          <SiteHeader viewer={viewer} />
          {children}
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  )
}
