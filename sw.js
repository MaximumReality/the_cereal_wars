const CACHE_NAME = 'mochkil-puffs-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './game.js',
  './cereal_wars.mp3',
  './aisle.jpg',
  './azulos_corrupted.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
