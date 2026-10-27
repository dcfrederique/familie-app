import type { CapacitorConfig } from '@capacitor/cli'

// De app is een schil rond de gehoste site (docs/capacitor.md): nieuwe versies komen zonder nieuwe APK binnen.
const adres = 'https://thankful-meadow-0d992b403.5.azurestaticapps.net'

const config: CapacitorConfig = {
  appId: 'be.declercq.familie',
  appName: 'Familie',
  // Enkel nodig om de schil te bouwen; de app zelf laadt `server.url`.
  webDir: 'dist',
  server: {
    url: adres,
    // Alleen ons eigen domein en Supabase mogen in de schil openen.
    allowNavigation: ['thankful-meadow-0d992b403.5.azurestaticapps.net', '*.supabase.co'],
    androidScheme: 'https',
  },
  android: { allowMixedContent: false },
}

export default config
