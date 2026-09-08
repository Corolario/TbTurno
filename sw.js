/* Service worker: guarda a pagina e os icones para o app abrir sem sinal.
   AO PUBLICAR UMA MUDANCA, suba o numero da versao abaixo. E ele que faz o
   aparelho trocar o cache antigo pelo novo; sem isso, quem ja instalou pode
   continuar vendo a versao velha. */
const VERSAO = 'turnos-v1';

const ARQUIVOS = [
  './', './index.html', './manifest.webmanifest',
  './favicon-32.png', './icone-192.png', './icone-512.png',
  './icone-maskable-512.png', './apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO).map((n) => caches.delete(n))))
    .then(() => self.clients.claim()));
});

/* A pagina vem da rede primeiro, para a versao nova chegar assim que houver
   sinal, e do cache quando nao ha. Os icones, que nao mudam dentro de uma
   versao, vem direto do cache. */
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((resp) => {
          const copia = resp.clone();
          caches.open(VERSAO).then((c) => c.put(req, copia));
          return resp;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(caches.match(req).then((r) => r || fetch(req)));
});
