import { supabase } from '../db.js';

export async function randevulariGetir() {
    const { data, error } = await supabase.from('randevular').select('*').order('timestamp', { ascending: true });
    if(error) { console.error("Randevu çekme hatası:", error); return; }

    const statEl = document.getElementById("stat-randevular");
    if(statEl) statEl.innerText = data ? data.length : 0;

    if(window.globalCalendar) {
        window.globalCalendar.removeAllEvents();
        data.forEach(r => {
            // Randevu tiplerine göre renk ataması
            let rRenk = "#3b82f6"; // Mavi (İlk Görüşme)
            if(r.tip === "Kontrol Seansı") rRenk = "#f97316"; // Turuncu
            
            // Eğer Durum güncellendiyse renkleri ez
            if(r.durum === "Geldi") rRenk = "#10b981"; // Yeşil
            if(r.durum === "İptal Etti") rRenk = "#ef4444"; // Kırmızı

            window.globalCalendar.addEvent({
                title: `${r.saat} | ${r.hastaad} (${r.durum || 'Bekliyor'})`,
                start: r.timestamp + ":00",
                color: rRenk,
                extendedProps: { dbId: r.id, durum: r.durum }
            });
        });
    }
}

export function randevuFormunuBaslat() {
    const frm = document.getElementById('form-yeni-randevu');
    if(frm) {
        frm.onsubmit = async (e) => {
            e.preventDefault();
            const opt = document.getElementById('r-hasta').options[document.getElementById('r-hasta').selectedIndex];
            const tarih = document.getElementById('r-tarih').value;
            const saat = document.getElementById('r-saat').value;
            
            const { error } = await supabase.from('randevular').insert([{ 
                hastaid: opt.dataset.dbid, 
                hastaad: opt.value, 
                tarih: tarih, 
                saat: saat, 
                tip: document.getElementById('r-tip').value, 
                durum: 'Bekliyor', // Default durum
                timestamp: tarih + "T" + saat 
            }]);
            
            if(!error) {
                frm.reset(); 
                if(typeof window.closeModal === 'function') window.closeModal('modal-randevu');
                if(typeof window.showToast === 'function') window.showToast('Randevu takvime eklendi!', 'success');
                randevulariGetir();
            } else {
                if(typeof window.showToast === 'function') window.showToast('Randevu eklenemedi!', 'error');
            }
        };
    }
}

// TAKVİMDE RANDEVUYA TIKLAYINCA ÇALIŞAN SİLME VE DURUM GÜNCELLEME İŞLEMİ
window.randevuSil = async function(id) {
    const islem = prompt("Randevu İşlemi:\n1 - Geldi Olarak İşaretle\n2 - İptal Etti Olarak İşaretle\n3 - Takvimden Tamamen Sil\n(1, 2 veya 3 yazın)");
    
    if(islem === "1") {
        await supabase.from('randevular').update({ durum: 'Geldi' }).eq('id', id);
        if(typeof window.showToast === 'function') window.showToast('Randevu Geldi olarak güncellendi', 'success');
        randevulariGetir();
    } else if(islem === "2") {
        await supabase.from('randevular').update({ durum: 'İptal Etti' }).eq('id', id);
        if(typeof window.showToast === 'function') window.showToast('Randevu İptal Etti olarak güncellendi', 'success');
        randevulariGetir();
    } else if(islem === "3") {
        const { error } = await supabase.from('randevular').delete().eq('id', id);
        if(!error) {
            if(typeof window.showToast === 'function') window.showToast('Randevu takvimden silindi', 'success');
            randevulariGetir();
        }
    }
}