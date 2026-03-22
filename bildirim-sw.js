// bildirim-sw.js (Sadece Bildirimlerden Sorumlu Özel İşçimiz)

self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : {};
    const baslik = data.title || 'Yeni Bildirim!';
    
    const secenekler = {
        body: data.body || 'DiyetTakibim sisteminden mesaj var.',
        icon: 'https://cdn-icons-png.flaticon.com/512/2966/2966334.png', // Senin o şık ikonunu buraya da ekledim!
        badge: 'https://cdn-icons-png.flaticon.com/512/2966/2966334.png',
        vibrate: [200, 100, 200, 100, 200, 100, 200], // Telefonu titretecek kod
        requireInteraction: true 
    };

    event.waitUntil(self.registration.showNotification(baslik, secenekler));
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(clients.openWindow('/admin.html'));
});