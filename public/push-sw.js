// Meldingen voor ouders (web-push). Wordt door de service worker van vite-plugin-pwa ingeladen.
self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = { tekst: event.data && event.data.text() } }
  event.waitUntil(self.registration.showNotification(data.titel || 'Familie', {
    body: data.tekst || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'goedkeuren',
    renotify: true,
    data: { url: data.url || '/ouder/goedkeuren' },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data && event.notification.data.url || '/'
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ramen) => {
    const open = ramen.find((r) => 'focus' in r)
    if (open) { open.navigate(url); return open.focus() }
    return self.clients.openWindow(url)
  }))
})
