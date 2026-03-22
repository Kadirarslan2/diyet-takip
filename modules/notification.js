// modules/notification.js

export function initNotification() {
    const formNotif = document.getElementById('form-bildirim-gonder');
    
    // ONESIGNAL GİZLİ BİLGİLERİN
    const ONESIGNAL_APP_ID = "ddce2b71-4b68-4437-bc90-7a8f52daca38"; 
    const ONESIGNAL_REST_API_KEY = "os_v2_app_3xhcw4klnbcdppeqpkhvfwwkhcdpgunnkpfeew4vub33oe6cmhutvis5a4ixdxchp4qgrsqn6unrnge3jau3qrkbfe6mon2svfsnotq"; // DİKKAT: OneSignal'dan REST API Key'i kopyalayıp buraya yapıştır!


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
                // SİHİR BURADA: Artık Vercel'in kendi köprüsünü (/api/onesignal) kullanıyoruz. CORS hatası bitti!
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

                if (response.ok) {
                    window.showToast('Bildirim başarıyla fırlatıldı!', 'success');
                    formNotif.reset();
                } else {
                    window.showToast('Bildirim gönderilemedi. REST API Key hatalı olabilir.', 'error');
                }

                btn.innerHTML = eskiIcerik;
                btn.disabled = false;

            } catch (err) {
                console.error("Bildirim Hatası:", err);
                window.showToast('Bağlantı hatası! Vercel proxy ayarlanamadı.', 'error');
                btn.innerHTML = eskiIcerik;
                btn.disabled = false;
            }
        };
    }
}