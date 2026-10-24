import SpelKader from './SpelKader.tsx'
import Gesprek from './Gesprek.tsx'

// Berichten van een kind aan mama en papa (docs/chat.md). Staat per kind uit tot een ouder het aanzet.
export default function Chat() {
  return (
    <SpelKader titel="Berichten" terug={(id) => `/kind/${id}`}>
      {(kind) => <Gesprek kind={kind} kant="kind" />}
    </SpelKader>
  )
}
