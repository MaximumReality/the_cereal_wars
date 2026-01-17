const CACHE_NAME = 'mochkil-puffs-v1';
const ASSETS = [
  './',
  './index.html',
  './game.js',
  './cereal_wars.mp3',
  './aisle.jpg',
  './thief_no_cereal.png',
  './mochkil_puffs.PNG',
  './beanie.png',
  './chef-hat.png',
  './flyazulo.png',
  './holding_azulos.png',
  './azulos_special.png',
  './azulos_corrupted.png',
  './puffs_cereal.png',
  './credibility_badge.png',
  './puffs_commercial.MP4',
  './8bit_azulo.MP4'
];

// Install the service worker and cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Serve assets from cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
