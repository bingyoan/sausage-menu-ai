// 這是最簡單的 Service Worker，只為了讓 PWABuilder 開心
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // 這裡什麼都不做，直接回傳網路請求
  // 這樣可以確保你的 App 永遠顯示最新內容，不會被舊的快取卡住
  event.respondWith(fetch(event.request));
});