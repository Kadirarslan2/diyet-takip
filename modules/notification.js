// modules/notification.js

export function initNotification() {
    const formNotif = document.getElementById('form-bildirim-gonder');

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
                // Şifresiz, tehlikesiz bir şekilde kendi oluşturduğumuz sunucu motoruna gidiyoruz!
                const response = await fetch("/api/onesignal", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        headings: { "en": baslik, "tr": baslik },
                        contents: { "en": mesaj, "tr": mesaj }
                    })
                });

                const gercekCevap = await response.json();

                if (response.ok && !gercekCevap.errors) {
                    window.showToast('Bildirim başarıyla fırlatıldı!', 'success');
                    formNotif.reset();
                } else {
                    alert("OneSignal Hatası: \n" + JSON.stringify(gercekCevap.errors || gercekCevap));
                    window.showToast('Gönderilemedi, ekrandaki hatayı oku!', 'error');
                }

                btn.innerHTML = eskiIcerik;
                btn.disabled = false;

            } catch (err) {
                console.error("Bildirim Hatası:", err);
                alert("Bağlantı Hatası: api/onesignal dosyasına ulaşılamadı. Klasörü doğru açtığına emin ol.");
                btn.innerHTML = eskiIcerik;
                btn.disabled = false;
            }
        };
    }
}