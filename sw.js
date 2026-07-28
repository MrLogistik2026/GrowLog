/* GrowSmart Service Worker
 *
 * Zweck: Die App startet aus dem Cache statt die ~1,9 MB grosse index.html jedes Mal neu
 * zu laden und zu parsen. Das war der groesste Posten der Startzeit.
 *
 * Strategie: stale-while-revalidate.
 *   - Antwort kommt SOFORT aus dem Cache (schneller Start, funktioniert auch offline).
 *   - Parallel laeuft im Hintergrund ein Netz-Abruf, der den Cache aktualisiert.
 *   - Beim naechsten Start ist die neue Version da.
 * Damit muss die Version unten NICHT bei jedem Release angefasst werden — sie dient nur
 * dazu, alte Caches aufzuraeumen, wenn sich die Dateiliste aendert.
 *
 * Wichtig: Nur gleiche Herkunft (same-origin) wird behandelt. Fremde Anfragen laufen
 * unveraendert durch, damit nichts kaputtgeht, was die App sonst noch laedt.
 */
const CACHE = 'growsmart-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon-32.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // einzeln statt addAll: fehlt eine Datei, scheitert nicht die ganze Installation
      .then((c) => Promise.all(ASSETS.map((u) => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(req).then((cached) => {
      const fromNet = fetch(req).then((resp) => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return resp;
      }).catch(() => cached);
      return cached || fromNet;
    })
  );
});
