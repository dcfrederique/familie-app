// Meeluisteren bij "Ik lees zelf": Azure-spraakherkenning in het Vlaams via de microfoon van de tablet.
// De Speech SDK is groot, dus die wordt pas geladen als een kind op de knop tikt. Azure bewaart de audio niet
// (logging staat uit), en de app ook niet: alleen wat er gehoord is, en dat enkel zolang de bladzijde openstaat.

export interface Luisteraar {
  /** Nieuwe bladzijde: vergeet wat er gehoord is en geef de woorden van de bladzijde mee als hint. */
  nieuweBladzijde(woorden: string[]): void
  /** Nieuwe token (na 10 minuten vervalt de oude). */
  vernieuw(token: string): void
  stop(): void
}

export const kanMeeluisteren = () =>
  typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof WebSocket !== 'undefined'

/**
 * Start de spraakherkenning. opTekst krijgt telkens alles wat er op deze bladzijde gehoord is, voorlopige
 * woorden inbegrepen. opFout bij een fout (geen microfoon, token verlopen, gratis minuten op).
 */
export async function startMeeluisteren(token: string, regio: string, woorden: string[],
  opTekst: (tekst: string) => void, opFout: (melding: string) => void): Promise<Luisteraar> {
  const sdk = await import('microsoft-cognitiveservices-speech-sdk')
  const config = sdk.SpeechConfig.fromAuthorizationToken(token, regio)
  config.speechRecognitionLanguage = 'nl-BE'
  // Niets wegmoffelen met sterretjes: dat zou als fout gelezen tellen.
  config.setProfanity(sdk.ProfanityOption.Raw)
  // Kinderen lezen traag; een pauze van een paar seconden is nog geen einde van de zin.
  config.setProperty(sdk.PropertyId.Speech_SegmentationSilenceTimeoutMs, '1500')
  const herkenner = new sdk.SpeechRecognizer(config, sdk.AudioConfig.fromDefaultMicrophoneInput())
  const hints = sdk.PhraseListGrammar.fromRecognizer(herkenner)

  let vast = '', gestopt = false
  const zetHints = (w: string[]) => {
    hints.clear()
    for (const woord of new Set(w.map((x) => x.replace(/[^\p{L}\p{N}'-]/gu, '')).filter((x) => x.length > 2))) hints.addPhrase(woord)
  }
  zetHints(woorden)

  herkenner.recognizing = (_, e) => { if (!gestopt) opTekst(`${vast} ${e.result.text}`) }
  herkenner.recognized = (_, e) => {
    if (gestopt || e.result.reason !== sdk.ResultReason.RecognizedSpeech) return
    vast = `${vast} ${e.result.text}`
    opTekst(vast)
  }
  herkenner.canceled = (_, e) => {
    if (!gestopt && e.reason === sdk.CancellationReason.Error) opFout(e.errorDetails || 'spraakherkenning gestopt')
  }

  await new Promise<void>((klaar, mislukt) => herkenner.startContinuousRecognitionAsync(klaar, (fout) => mislukt(new Error(fout))))

  return {
    nieuweBladzijde(w) {
      vast = ''
      zetHints(w)
      opTekst('')
    },
    vernieuw(nieuw) {
      herkenner.authorizationToken = nieuw
    },
    stop() {
      if (gestopt) return
      gestopt = true
      herkenner.stopContinuousRecognitionAsync(() => herkenner.close(), () => herkenner.close())
    },
  }
}
