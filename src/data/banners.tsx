// Eigen prenten voor de banner bovenaan het startscherm. Vlakke vormen, geen merken of personages.

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
