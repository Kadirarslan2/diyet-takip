HEAD
const CACHE_NAME = 'diyet-takibim-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
// sw.js (Arka Plan Nöbetçisi)

self.addEventListener('push', function(event) {
    // Vercel'den gelen füzeyi (mesajı) yakalıyoruz
    const data = event.data ? event.data.json() : {};
    const baslik = data.title || 'Yeni Bildirim!';
    
    const secenekler = {
        body: data.body || 'DiyetTakibim sisteminden mesaj var.',
        icon: '/logo.png', // Eğer sitende logo.png diye bir dosya varsa bildirimde o çıkar
        badge: '/logo.png',
        vibrate: [200, 100, 200, 100, 200, 100, 200], // İŞTE TELEFONU TİTRETECEK O KOD!
        requireInteraction: true // Kullanıcı tıklayana kadar ekranda kalır
    };

    event.waitUntil(self.registration.showNotification(baslik, secenekler));
});

// Bildirime tıklandığında ne olacak? (Siteyi açacak)
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(clients.openWindow('/'));
});