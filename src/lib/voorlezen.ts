// Voorlezen met de stem van de tablet (Web Speech API), bij voorkeur Vlaams, anders Nederlands.

export function kanVoorlezen(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function leesVoor(tekst: string) {
  if (!kanVoorlezen()) return
  const synth = window.speechSynthesis
  synth.cancel()
  const zin = new SpeechSynthesisUtterance(tekst)
  const stemmen = synth.getVoices()
  const stem = stemmen.find((s) => s.lang === 'nl-BE') ?? stemmen.find((s) => s.lang.startsWith('nl'))
  if (stem) zin.voice = stem
  zin.lang = stem?.lang ?? 'nl-BE'
  zin.rate = 0.9
  synth.speak(zin)
}
