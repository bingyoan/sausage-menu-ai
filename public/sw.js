// public/sw.js - 最簡潔版，只為了滿足 PWA 安裝需求
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // 什麼都不做，直接讓瀏覽器正常連網
  // 這樣就不會擋住 Tailwind 或報錯了
});