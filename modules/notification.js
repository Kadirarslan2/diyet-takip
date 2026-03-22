// modules/notification.js

// SUPABASE BİLGİLERİNİ BURAYA DA YAPIŞTIR USTA!
const SUPABASE_URL = "https://iavmpgvevuqgirmxwxtr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlhdm1wZ3ZldnVxZ2lybXh3eHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTQyNTksImV4cCI6MjA4OTU3MDI1OX0.Nv4EyW1e87DkVtXqq67Xmf36_NMYjPc0T0CwUfVOJ3A";

// VAPID Açık Anahtarın (Bunu sadece şifrelemek için kullanıyoruz)
const PUBLIC_VAPID_KEY = "BMZPdMy08ZwicPimS3ylir2d9UeqvUAm2wJqxO5n9MOzBtJYQ-pkulj8CmxUNAkkBdPlCGVBKhfSGO453xzzfek";

// Şifre Çevirici Motor (Buna dokunma, standart kod)
function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
    return outputArray;
}

// CİHAZI VERİTABANINA KAYDETME (God Mode'daki butona basınca çalışır)
window.cihaziKaydet = async function() {
    try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            alert('Tarayıcınız bildirimleri desteklemiyor!'); return;
        }

        const kayit = await navigator.serviceWorker.register('/sw.js');
        const abonelik = await kayit.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlB64ToUint8Array(PUBLIC_VAPID_KEY)
        });

        const subJson = abonelik.toJSON();

        // Cihaz kimliğini kendi Supabase tablomuza gizlice kaydediyoruz
        await fetch(`${SUPABASE_URL}/rest/v1/bildirim_aboneleri`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
                endpoint: subJson.endpoint,
                p256dh: subJson.keys.p256dh,
                auth: subJson.keys.auth
            })
        });

        alert("Tebrikler! Bu cihaz veritabanına kaydedildi. Artık bildirim alacak.");
    } catch (err) {
        console.error(err);
        alert("Bildirim izni verilmedi veya hata oluştu. Tarayıcı ayarlarından izin verdiğine emin ol!");
    }
};

// FÜZEYİ ATEŞLEME (Formu doldurup fırlatınca çalışır)
export function initNotification() {
    const formNotif = document.getElementById('form-bildirim-gonder');

    if (formNotif) {
        formNotif.onsubmit = async (e) => {
            e.preventDefault();
            const baslik = document.getElementById('notif-baslik').value;
            const mesaj = document.getElementById('notif-mesaj').value;
            
            const btn = formNotif.querySelector('button');
            const eskiIcerik = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> FIRLATILIYOR...';
            btn.disabled = true;

            try {
                // Kendi Vercel motorumuza gidiyoruz!
                const response = await fetch("/api/notify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ baslik, mesaj })
                });

                const sonuc = await response.json();

                if (response.ok && sonuc.success) {
                    window.showToast('Bildirim başarıyla fırlatıldı!', 'success');
                    formNotif.reset();
                } else {
                    alert("Gönderim Hatası: \n" + (sonuc.error || "Sistemde kayıtlı cihaz yok. Önce yukarıdaki butondan cihazı kaydet!"));
                }
            } catch (err) {
                alert("Bağlantı Hatası: Vercel api/notify dosyasına ulaşılamadı.");
            }
            btn.innerHTML = eskiIcerik;
            btn.disabled = false;
        };
    }
}