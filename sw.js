/**
 * GrowSmart Service Worker
 *
 * Cache-Strategie: "Cache First, Network Fallback" für die App-Shell (index.html).
 * Erste Ladung: Network → Cache. Folge-Ladungen: aus Cache (instant), parallel
 * Network-Update im Hintergrund.
 *
 * Vorteile:
 *   - App funktioniert komplett offline nach erstem Besuch
 *   - Lade-Zeit reduziert sich von ~2s (LTE) auf <100ms (Cache)
 *   - Auf 3G/Edge spürbar: 28s → instant
 *
 * Update-Mechanismus: bei jedem Reload wird parallel im Hintergrund die neue
 * Version geholt und der Cache aktualisiert. Beim NÄCHSTEN Besuch sieht der
 * User dann die neue Version. Das vermeidet Mid-Session-Updates die laufende
 * Eingaben zerschießen würden.
 *
 * VERSION ändert sich bei jedem Release (steht oben im index.html).
 */

const CACHE_NAME = 'growsmart-v1.1';
const APP_SHELL = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  // Bei der Erst-Installation: App-Shell vorab cachen
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch((err) => {
        // Wenn ein einzelner addAll fehlschlägt (z.B. manifest.json fehlt):
        // wenigstens die index.html cachen
        console.warn('[SW] addAll partial failure:', err);
        return cache.add('/index.html').catch(() => {});
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Alte Caches anderer Versionen löschen (Sauberhalten)
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Nur GET-Requests cachen (POST/PUT etc. lassen wir durch)
  if (request.method !== 'GET') return;
  // Externe Domains (Wetter-API, fonts) nicht cachen
  if (!request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      // Cache-First: bei Treffer sofort aus Cache, parallel Update im Hintergrund
      const networkFetch = fetch(request)
        .then((response) => {
          // Nur erfolgreiche Antworten cachen
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
