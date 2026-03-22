// modules/notification.js

export function initNotification() {
    const formNotif = document.getElementById('form-bildirim-gonder');
    
    // ONESIGNAL GİZLİ BİLGİLERİN
    const ONESIGNAL_APP_ID = "ddce2b71-4b68-4437-bc90-7a8f52daca38"; 
    const ONESIGNAL_REST_API_KEY = "os_v2_app_3xhcw4klnbcdppeqpkhvfwwkhcdpgunnkpfeew4vub33oe6cmhutvis5a4ixdxchp4qgrsqn6unrnge3jau3qrkbfe6mon2svfsnotq";

    if (formNotif) {
        formNotif.onsubmit = async (e) => {
            e.preventDefault();
            const baslik = document.getElementById('notif-baslik').value;
            const mesaj = document.getElementById('notif-mesaj').value;
            
            const btn = formNotif.querySelector('button');
            const eskiIcerik = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> BİLDİRİM FIRLATILIYOR...';
            btn.disabled = true;

            try {
                const response = await fetch("/api/onesignal", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                        "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`
                    },
                    body: JSON.stringify({
                        app_id: ONESIGNAL_APP_ID,
                        included_segments: ["Subscribed Users"], 
                        headings: { "en": baslik, "tr": baslik },
                        contents: { "en": mesaj, "tr": mesaj }
                    })
                });

                // ONE SIGNAL'DAN GELEN CEVABI DİNLİYORUZ!
                const gercekCevap = await response.json();

                if (response.ok && !gercekCevap.errors) {
                    window.showToast('Bildirim başarıyla fırlatıldı!', 'success');
                    formNotif.reset();
                } else {
                    // İŞTE BURASI: Hatayı kabak gibi ekrana yazdıracak!
                    let hataMesaji = gercekCevap.errors ? JSON.stringify(gercekCevap.errors) : 'Bilinmeyen Hata';
                    alert("OneSignal'ın Gönderdiği Hata: \n" + hataMesaji);
                    window.showToast('Gönderilemedi, ekrandaki hatayı oku!', 'error');
                }

                btn.innerHTML = eskiIcerik;
                btn.disabled = false;

            } catch (err) {
                console.error("Bildirim Hatası:", err);
                alert("Bağlantı Hatası: Vercel Proxy çalışmadı. Lütfen vercel.json dosyasını kontrol et.");
                btn.innerHTML = eskiIcerik;
                btn.disabled = false;
            }
        };
    }
}