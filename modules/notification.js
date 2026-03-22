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
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> FIRLATILIYOR...';
            btn.disabled = true;

            try {
                // BURASI GEÇİCİ - OneSignal bağlayınca buraya API kodunu koyacağız!
                setTimeout(() => {
                    window.showToast('Bildirim başarıyla fırlatıldı!', 'success');
                    formNotif.reset();
                    btn.innerHTML = eskiIcerik;
                    btn.disabled = false;
                }, 1000);

            } catch (err) {
                window.showToast('Bildirim gönderilemedi!', 'error');
                btn.innerHTML = eskiIcerik;
                btn.disabled = false;
            }
        };
    }
}