// Produktové fotky fliaš (public/img) podľa slugu produktu. Fotka nahraná
// v administrácii (photo_url) má prednosť.
const PHOTOS: Record<string, string> = {
  cvikla: '/img/VITAPRO0274-cvikla.webp',
  drienocka: '/img/VITAPRO0275-drienocka.webp',
  broskyna: '/img/VITAPRO0276-broskynka.webp',
  'jablko-ribezla': '/img/VITAPRO0277-jablcko-a-ribezla.webp',
  mrkvicka: '/img/VITAPRO0278-mrkvicka.webp',
  marhulienka: '/img/VITAPRO0279-marhulienka.webp',
  dulienka: '/img/VITAPRO0280-dulienka.webp',
  paradajka: '/img/VITAPRO0281-paradajka.webp',
  aronilka: '/img/VITAPRO0284-aronilka.webp',
}

export function productPhoto(p: { slug: string; photo_url: string | null }): string | null {
  return p.photo_url || PHOTOS[p.slug] || null
}
