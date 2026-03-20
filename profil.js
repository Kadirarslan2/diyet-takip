import { supabase } from './db.js';

// PROFİLİ AÇMA FONKSİYONU
window.profiliAc = function(dataStr) {
    const d = JSON.parse(decodeURIComponent(dataStr)); 
    
    // Küresel değişkenlere atıyoruz ki ölçüm kaydederken kim olduğunu bilelim
    window.aktifHastaId = d.id; 
    window.aktifHastaAdStr = d.adsoyad; 
    window.aktifHastaTelStr = d.telefon;
    window.aktifHastaBoy = d.boy; // VKİ hesabı için boyu hafızaya alıyoruz

    // Ekrandaki yazıları doldur
    const hHarf = document.getElementById('profil-harf'); if(hHarf) hHarf.innerText = d.adsoyad.charAt(0).toUpperCase();
    const hIsim = document.getElementById('profil-isim'); if(hIsim) hIsim.innerText = d.adsoyad; 
    const hProt = document.getElementById('profil-protokol'); if(hProt) hProt.innerText = d.protokolno || 'PRT-ESKİ'; 
    const hTel = document.getElementById('profil-tel'); if(hTel) hTel.innerText = d.telefon; 
    
    window.switchPage('page-hasta-profili'); 
    window.switchProfileTab('olcumler'); 
    
    // Profili açar açmaz eski ölçümleri getir
    window.olcumleriGetir(d.id); 
}

// ÖLÇÜM KAYDETME
const formOlcum = document.getElementById('form-yeni-olcum');
if(formOlcum) {
    formOlcum.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        if(!window.aktifHastaId) return;
        
        const btn = document.getElementById('btn-olcum-kaydet'); 
        btn.innerText = "Kaydediliyor..."; btn.disabled = true;

        try {
            const { error } = await supabase.from('olcumler').insert([{ 
                hastaid: window.aktifHastaId, 
                tarih: document.getElementById('o-tarih').value, 
                kilo: document.getElementById('o-kilo').value, 
                yag: document.getElementById('o-yag').value || "-", 
                kas: document.getElementById('o-kas').value || "-" 
            }]);
            
            if(error) throw error;

            formOlcum.reset(); 
            window.closeModal('modal-olcum'); 
            window.showToast('Yeni ölçüm eklendi!', 'success');
            window.olcumleriGetir(window.aktifHastaId); // Tabloyu anında güncelle
        } catch(err) { 
            console.error(err);
            window.showToast('Ölçüm eklenirken hata oluştu!', 'error'); 
        } finally {
            btn.innerText = "Kaydet"; btn.disabled = false;
        }
    });
}

// ÖLÇÜMLERİ GETİRME VE OTOMATİK VKİ HESAPLAMA
window.olcumleriGetir = async function(hastaId) {
    const tablo = document.getElementById("tablo-olcumler"); 
    if(!tablo) return; 
    
    tablo.innerHTML = '<tr><td colspan="5" class="py-4 text-center text-slate-400">Ölçümler Yükleniyor...</td></tr>';

    try {
        const { data: olcumler, error } = await supabase.from('olcumler').select('*').eq('hastaid', hastaId).order('tarih', { ascending: false });
        if(error) throw error;

        if(olcumler.length === 0) { 
            tablo.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-slate-400 font-semibold text-xs">Henüz ölçüm girilmemiş.</td></tr>'; 
            return; 
        }

        tablo.innerHTML = "";
        olcumler.forEach((o) => { 
            const fT = new Date(o.tarih).toLocaleDateString('tr-TR'); 
            
            // VKİ (Boy Kilo Endeksi) Hesaplama Motoru
            let bmi = "-";
            let bmiDurum = "";
            let bmiRenk = "text-slate-400";

            if (window.aktifHastaBoy && window.aktifHastaBoy > 0 && o.kilo) {
                const boyMetre = window.aktifHastaBoy / 100;
                const vki = (o.kilo / (boyMetre * boyMetre)).toFixed(1);
                bmi = vki;

                if(vki < 18.5) { bmiDurum = "Zayıf"; bmiRenk = "text-blue-600 bg-blue-50"; }
                else if(vki < 24.9) { bmiDurum = "Normal"; bmiRenk = "text-emerald-600 bg-emerald-50"; }
                else if(vki < 29.9) { bmiDurum = "Fazla Kilolu"; bmiRenk = "text-orange-500 bg-orange-50"; }
                else { bmiDurum = "Obez"; bmiRenk = "text-red-600 bg-red-50"; }
            }

            tablo.innerHTML += `
                <tr class="hover:bg-slate-50 transition border-b border-gray-50">
                    <td class="py-4 px-6 font-bold text-slate-600">${fT}</td>
                    <td class="py-4 px-6 font-black text-teal-600 text-lg">${o.kilo} kg</td>
                    <td class="py-4 px-6 text-slate-500 font-semibold">% ${o.yag} / % ${o.kas}</td>
                    <td class="py-4 px-6"><span class="px-2 py-1 rounded text-xs font-black tracking-widest uppercase ${bmiRenk}">VKİ: ${bmi} (${bmiDurum})</span></td>
                    <td class="py-4 px-6 text-right">
                        <button onclick="window.olcumSil('${o.id}')" class="text-slate-300 hover:text-red-500 transition"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>
            `; 
        });
    } catch(err) {
        console.error(err);
        tablo.innerHTML = '<tr><td colspan="5" class="text-center text-red-500 py-4">Ölçümler çekilemedi.</td></tr>';
    }
}

// ÖLÇÜM SİLME
window.olcumSil = async function(id) { 
    if(confirm("Bu ölçümü silmek istediğinize emin misiniz?")) { 
        try {
            await supabase.from('olcumler').delete().eq('id', id); 
            window.showToast('Ölçüm silindi!', 'error'); 
            window.olcumleriGetir(window.aktifHastaId); // Sildikten sonra tabloyu yenile
        } catch(err) {
            window.showToast('Hata!', 'error'); 
        }
    } 
}