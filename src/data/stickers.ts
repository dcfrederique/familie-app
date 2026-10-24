// Stickers voor de chat (docs/chat.md): kinderen die nog niet lezen tikken op een prentje in plaats van te typen.
// De zin gaat als tekst mee, zodat de ouders (en de melding) gewoon lezen wat het kind bedoelt.

export interface Sticker {
  sleutel: string
  /** De zin die de ouders lezen en die bij het kind wordt voorgelezen. */
  zin: string
  emoji: string
}

export const stickers: Sticker[] = [
  { sleutel: 'kom', zin: 'Kom je even?', emoji: '🙋' },
  { sleutel: 'honger', zin: 'Ik heb honger', emoji: '🍎' },
  { sleutel: 'dorst', zin: 'Ik heb dorst', emoji: '🥤' },
  { sleutel: 'klaar', zin: 'Ik ben klaar!', emoji: '✅' },
  { sleutel: 'hulp', zin: 'Ik heb hulp nodig', emoji: '🆘' },
  { sleutel: 'toilet', zin: 'Ik moet naar het toilet', emoji: '🚽' },
  { sleutel: 'verdriet', zin: 'Ik ben verdrietig', emoji: '😢' },
  { sleutel: 'liefde', zin: 'Ik hou van jou', emoji: '❤️' },
]

const perSleutel = new Map(stickers.map((s) => [s.sleutel, s]))

export const stickerVan = (sleutel: string | null | undefined): Sticker | undefined => (sleutel ? perSleutel.get(sleutel) : undefined)
