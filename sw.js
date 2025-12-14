// public/sw.js - 安全版
const CACHE_NAME = 'sausage-ai-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  // 立即控制頁面，不等待
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // 嘗試快取核心檔案，如果失敗就忽略 (避免 CORS 錯誤卡死)
        return cache.addAll(urlsToCache).catch(err => console.log('Cache ignored:', err));
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // 這裡留空，讓它預設直接連網，不要攔截請求
  // 這樣就能解決 Tailwind CDN 被擋住的問題
});