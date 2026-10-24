// Eigen prenten voor de banner bovenaan het startscherm. Vlakke vormen, geen merken of personages.
import { voetbalBanner } from './themaPrenten.ts'

/** Nachtelijke racebaan met raceauto nr. 8, een vulkaan en een dino. */
export function RaceBanner() {
  return (
    <svg className="banner-prent" viewBox="0 0 1130 210" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
      <circle cx="520" cy="40" r="2" fill="#FFFFFF" opacity="0.7" />
      <circle cx="610" cy="24" r="2" fill="#FFFFFF" opacity="0.7" />
      <circle cx="820" cy="30" r="2.5" fill="#FFFFFF" opacity="0.7" />
      <circle cx="450" cy="70" r="1.8" fill="#FFFFFF" opacity="0.6" />
      <path d="M640 178L720 92h40l80 86z" fill="#2B3F6E" />
      <path d="M720 92q20-34 40 0z" fill="#F2B33D" />
      <path d="M732 70q4-16 10-24M748 66q6-12 4-26" fill="none" stroke="#9AA6B5" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
      <rect x="0" y="178" width="1130" height="32" fill="#0E1A35" />
      <path d="M0 194H1130" stroke="#F2B33D" strokeWidth="4" strokeDasharray="26 20" />
      <path d="M410 152h40M396 164h50M420 140h28" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.45" />
      <path d="M505 150l20-22h45l20 22z" fill="#E53935" />
      <path d="M530 147l11-14h26l11 14z" fill="#BFD7FF" />
      <rect x="465" y="148" width="160" height="32" rx="14" fill="#E53935" />
      <circle cx="560" cy="164" r="11" fill="#FFFFFF" />
      <text x="560" y="169" textAnchor="middle" fontFamily="Nunito, sans-serif" fontSize="14" fontWeight="800" fill="#16264A">8</text>
      <circle cx="500" cy="182" r="15" fill="#0B1226" stroke="#9AA6B5" strokeWidth="5" />
      <circle cx="592" cy="182" r="15" fill="#0B1226" stroke="#9AA6B5" strokeWidth="5" />
      <path d="M900 148q-50 22-110 8" fill="none" stroke="#3FA34D" strokeWidth="16" strokeLinecap="round" />
      <rect x="918" y="150" width="20" height="32" rx="8" fill="#2E8A3C" />
      <rect x="995" y="150" width="20" height="32" rx="8" fill="#2E8A3C" />
      <ellipse cx="960" cy="140" rx="74" ry="36" fill="#3FA34D" />
      <path d="M1010 128q34-40 46-86" fill="none" stroke="#3FA34D" strokeWidth="22" strokeLinecap="round" />
      <ellipse cx="1070" cy="40" rx="24" ry="15" fill="#3FA34D" />
      <circle cx="1078" cy="35" r="3.5" fill="#16264A" />
      <circle cx="940" cy="124" r="7" fill="#7BCB7F" />
      <circle cx="972" cy="116" r="5" fill="#7BCB7F" />
      <circle cx="985" cy="140" r="6" fill="#7BCB7F" />
    </svg>
  )
}

/** Glinster: ster met vier punten. */
const glinster = (x: number, y: number, r: number) =>
  `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}z`

/** Roze prinsessenkasteel op een heuvel, met regenboog, wolkjes en een kroontje. */
export function KasteelBanner() {
  return (
    <svg className="banner-prent" viewBox="0 0 1130 210" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
      <g fill="none" strokeWidth="12" opacity="0.75">
        <path d="M560 210a240 200 0 0 1 480 0" stroke="#F49AC1" />
        <path d="M572 210a228 188 0 0 1 456 0" stroke="#FBC77A" />
        <path d="M584 210a216 176 0 0 1 432 0" stroke="#FFE680" />
        <path d="M596 210a204 164 0 0 1 408 0" stroke="#A8E0B0" />
        <path d="M608 210a192 152 0 0 1 384 0" stroke="#A9CBF5" />
      </g>
      <g fill="#FFFFFF">
        <ellipse cx="470" cy="60" rx="40" ry="16" /><ellipse cx="500" cy="50" rx="28" ry="18" />
        <ellipse cx="1060" cy="70" rx="44" ry="16" /><ellipse cx="1030" cy="60" rx="26" ry="17" />
      </g>
      <g fill="#FFFFFF" opacity="0.9">
        <path d={glinster(560, 40, 10)} /><path d={glinster(640, 80, 7)} /><path d={glinster(980, 30, 9)} /><path d={glinster(430, 120, 6)} />
      </g>
      <ellipse cx="800" cy="232" rx="330" ry="70" fill="#9ED9A8" />
      <ellipse cx="420" cy="240" rx="200" ry="56" fill="#B7E5BE" />
      <rect x="720" y="100" width="160" height="96" fill="#F7B6D3" />
      <path d="M720 100v-14h20v10h20v-10h20v10h20v-10h20v10h20v-10h20v10h20v-10h20v14z" fill="#F7B6D3" />
      <rect x="686" y="78" width="44" height="118" fill="#F49AC1" />
      <rect x="870" y="78" width="44" height="118" fill="#F49AC1" />
      <rect x="778" y="52" width="44" height="60" fill="#F49AC1" />
      <path d="M680 80l28-52 28 52zM864 80l28-52 28 52zM772 54l28-48 28 48z" fill="#C2337A" />
      <path d="M708 28V12l16 6-16 6M892 28V12l16 6-16 6M800 6V-8" stroke="#8E2459" strokeWidth="2.5" fill="#FFE680" />
      <path d="M782 196v-34a18 18 0 0 1 36 0v34z" fill="#8E2459" />
      <g fill="#FFFFFF">
        <path d="M700 120a8 8 0 0 1 16 0v18h-16zM884 120a8 8 0 0 1 16 0v18h-16zM792 78a8 8 0 0 1 16 0v16h-16z" />
        <circle cx="750" cy="130" r="9" /><circle cx="850" cy="130" r="9" />
      </g>
      <g fill="#F2B33D" stroke="#B8800F" strokeWidth="2" strokeLinejoin="round">
        <path d="M455 176l10-28 16 16 14-24 14 24 16-16 10 28z" />
      </g>
      <circle cx="495" cy="166" r="4" fill="#C2337A" />
      <g fill="#FFFFFF"><path d={glinster(445, 150, 6)} /><path d={glinster(548, 140, 8)} /></g>
      <g fill="#F49AC1">
        <path d="M600 170c-6-8-18-2-12 8l12 10 12-10c6-10-6-16-12-8z" />
        <path d="M980 160c-5-6-14-1-9 6l9 8 9-8c5-7-4-12-9-6z" />
      </g>
    </svg>
  )
}

/** Lila feeëntuin: paddenstoelhuisje, bloemen, vlinders en glinsters. */
export function TuinBanner() {
  const bloem = (x: number, y: number, kleur: string) => (
    <g key={`${x}-${y}`}>
      <path d={`M${x} ${y + 6}v34`} stroke="#4E9A5A" strokeWidth="4" strokeLinecap="round" />
      {[0, 72, 144, 216, 288].map((h) => (
        <circle key={h} cx={x + 9 * Math.cos((h * Math.PI) / 180)} cy={y + 9 * Math.sin((h * Math.PI) / 180)} r="8" fill={kleur} />
      ))}
      <circle cx={x} cy={y} r="6" fill="#FFE680" />
    </g>
  )
  const vlinder = (x: number, y: number, kleur: string) => (
    <g key={`v${x}`} transform={`translate(${x} ${y})`}>
      <ellipse cx="-9" cy="-6" rx="10" ry="12" fill={kleur} /><ellipse cx="9" cy="-6" rx="10" ry="12" fill={kleur} />
      <ellipse cx="-7" cy="10" rx="7" ry="8" fill={kleur} opacity="0.8" /><ellipse cx="7" cy="10" rx="7" ry="8" fill={kleur} opacity="0.8" />
      <rect x="-2" y="-12" width="4" height="26" rx="2" fill="#5A3A7A" />
      <path d="M-1-12q-6-10-10-12M1-12q6-10 10-12" stroke="#5A3A7A" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  )
  return (
    <svg className="banner-prent" viewBox="0 0 1130 210" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
      <circle cx="1040" cy="52" r="30" fill="#FFF4C2" />
      <g fill="#FFFFFF" opacity="0.9">
        <path d={glinster(560, 36, 10)} /><path d={glinster(700, 60, 7)} /><path d={glinster(900, 30, 9)} /><path d={glinster(470, 90, 6)} />
      </g>
      <ellipse cx="760" cy="236" rx="420" ry="70" fill="#B7E5BE" />
      <ellipse cx="1060" cy="240" rx="200" ry="70" fill="#9ED9A8" />
      <rect x="806" y="118" width="68" height="78" rx="14" fill="#FFF4E6" />
      <path d="M826 196v-30a14 14 0 0 1 28 0v30z" fill="#A0663C" />
      <circle cx="864" cy="140" r="7" fill="#A9CBF5" stroke="#A0663C" strokeWidth="2" />
      <path d="M770 126c0-46 46-74 70-74s70 28 70 74z" fill="#D9539A" />
      <g fill="#FFFFFF"><circle cx="805" cy="100" r="9" /><circle cx="845" cy="78" r="8" /><circle cx="880" cy="104" r="10" /><circle cx="836" cy="112" r="6" /></g>
      {bloem(560, 150, '#F49AC1')}{bloem(620, 160, '#CDA2F0')}{bloem(700, 150, '#FBC77A')}
      {bloem(960, 150, '#F49AC1')}{bloem(1020, 162, '#A9CBF5')}{bloem(1090, 150, '#CDA2F0')}
      {vlinder(500, 70, '#F49AC1')}{vlinder(980, 92, '#B58BE6')}{vlinder(660, 96, '#FBC77A')}
      <g fill="#FFFFFF"><path d={glinster(930, 130, 7)} /><path d={glinster(760, 40, 8)} /></g>
    </svg>
  )
}

/** Voetbalstadion overdag: tribune met supporters, lichtmasten, doel, bal en hoekvlag. */
export function VoetbalBanner() {
  return (
    <svg className="banner-prent" viewBox="0 0 1000 190" preserveAspectRatio="xMaxYMax slice" aria-hidden="true"
         dangerouslySetInnerHTML={{ __html: voetbalBanner() }} />
  )
}

/** De banner bij een thema. */
export function Banner({ soort }: { soort: 'race' | 'kasteel' | 'tuin' | 'voetbal' }) {
  return soort === 'race' ? <RaceBanner /> : soort === 'kasteel' ? <KasteelBanner /> : soort === 'voetbal' ? <VoetbalBanner /> : <TuinBanner />
}
