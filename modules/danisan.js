// db.js dosyasını bir üst klasörden çağırıyoruz
import { supabase } from '../db.js';

// Danışanların hafızada tutulacağı güvenli liste
window.danisanListesi = [];

// 1. DANIŞANLARI VERİTABANINDAN ÇEK VE LİSTELE
export async function danisanlariGetir() {
    const tablo = document.getElementById("danisan-tablosu"); 
    const rSec = document.getElementById("r-hasta"); 
    const fSec = document.getElementById("f-hasta");
    
    // Verileri tarihe göre en yeniler üstte olacak şekilde çek
    const { data, error } = await supabase.from('danisanlar').select('*').order('kayittarihi', { ascending: false });
    
    if (error) {
        console.error("Danışanlar çekilirken hata oluştu:", error);
        return;
    }

    // Listeyi global değişkene kopyala (Profil açarken buradan okuyacağız)
    window.danisanListesi = data || []; 
    
    if (tablo) tablo.innerHTML = ""; 
    
    // Dashboard'daki toplam hasta sayısını güncelle
    const statEl = document.getElementById("stat-hastalar");
    if(statEl) statEl.innerText = data ? data.length : 0;
    
    let opts = '<option value="">Listeden Seçin...</option>';
    
    if(data) {
        data.forEach((d, i) => {
            const ad = d.ad || "İsimsiz";
            const soyad = d.soyad || "Danışan";
            const isim = ad + " " + soyad; 
            const telefon = d.telefon || "Belirtilmemiş";
            const protokol = d.protokol_no || "PROT-YOK";
            
            // Seçim kutuları (Randevu ve Finans için) seçenekleri oluşturuluyor
            opts += `<option value="${isim}" data-dbid="${d.id}">${isim}</option>`;
            
            // HTML Tablosuna satır ekleme
            if (tablo) {
                tablo.innerHTML += `
                <tr class="hover:bg-slate-50 border-b border-gray-50 transition">
                    <td class="p-4 text-slate-400 font-bold">${i+1}</td>
                    <td class="p-4">
                        <div class="font-bold text-slate-800">${isim}</div>
                        <div class="text-[10px] text-slate-400 uppercase tracking-widest">${protokol}</div>
                    </td>
                    <td class="p-4 font-bold text-slate-600">${telefon}</td>
                    <td class="p-4 text-right">
                        <button onclick="window.profiliAc('${d.id}')" class="bg-white border border-gray-200 px-4 py-1.5 rounded-lg text-xs font-bold text-teal-600 hover:bg-teal-50 shadow-sm transition">
                            Dosyayı Aç
                        </button>
                    </td>
                </tr>`;
            }
        });
    }
    
    // Dropdownları güncelle
    if(rSec) rSec.innerHTML = opts; 
    if(fSec) fSec.innerHTML = opts;
}

// 2. DANIŞAN SİLME İŞLEMİ
window.hastaSilCurrent = async function() { 
    if(!window.aktifHastaId) return;
    
    const onay = confirm("Bu danışanı ve ona ait tüm verileri kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!");
    if(onay) { 
        const { error } = await supabase.from('danisanlar').delete().eq('id', window.aktifHastaId); 
        if(!error) {
            window.showToast("Danışan başarıyla silindi.", "success");
            window.switchPage('page-danisan-listesi'); 
            danisanlariGetir(); // Listeyi yenile
        } else {
            window.showToast("Silme işlemi başarısız!", "error");
        }
    } 
}
// DANIŞAN KAYDETME İŞLEMİ (Tüm o detaylı verileri Supabase'e yollar)
export function kayitFormunuBaslat() {
    const frmDanisan = document.getElementById('form-danisan-kayit');
    if(frmDanisan) {
        frmDanisan.onsubmit = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-kaydet'); 
            btn.innerText = "Kaydediliyor..."; 
            btn.disabled = true;
            
            try {
                // Supabase'e tüm verileri gönder
                const { data, error } = await supabase.from('danisanlar').insert([{ 
                    ad: document.getElementById('d-ad').value, 
                    soyad: document.getElementById('d-soyad').value,
                    telefon: document.getElementById('d-tel').value || "-", 
                    dogum_tarihi: document.getElementById('d-dogum-tarihi').value || null, 
                    cinsiyet: document.getElementById('d-cinsiyet').value, 
                    kan_grubu: document.getElementById('d-kan-grubu').value,
                    meslek: document.getElementById('d-meslek').value || "-",
                    medeni_hal: document.getElementById('d-medeni-hal').value,
                    referans_kaynagi: document.getElementById('d-referans').value,
                    adres: document.getElementById('d-adres').value || "-",
                    acil_kisi_ad: document.getElementById('d-acil-kisi').value || "-",
                    protokol_no: document.getElementById('d-protokol').value, 
                    kvkk_onam: document.getElementById('d-kvkk').checked ? "Evet" : "Hayır",
                    
                    boy: document.getElementById('d-boy').value || "0", 
                    hedef_kilo: document.getElementById('d-hedef').value || "0",
                    alerjiler: document.getElementById('d-alerjiler').value || "Yok", 
                    kronik_hastaliklar: document.getElementById('d-kronik').value || "Yok",
                    surekli_ilaclar: document.getElementById('d-ilaclar').value || "Yok",
                    gecirilen_operasyonlar: document.getElementById('d-ameliyatlar').value || "Yok",
                    
                    su_tuketimi: document.getElementById('d-su').value || "0",
                    fiziksel_aktivite: document.getElementById('d-aktivite').value, 
                    sigara_alkol: document.getElementById('d-sigara').value,
                    uyku_duzeni: document.getElementById('d-uyku').value,
                    bagirsak_duzeni: document.getElementById('d-bagirsak').value,
                    
                    notlar: document.getElementById('d-notlar').value || "-"
                }]).select();
                
                if (error) throw error;
                
                // Başlangıç Kilosu Varsa Otomatik İlk Ölçümü Oluştur
                const ilkKilo = Number(document.getElementById('d-guncel-kilo').value);
                if(data && data[0] && ilkKilo > 0) {
                    const yeniHastaId = data[0].id; 
                    const boy = Number(document.getElementById('d-boy').value);
                    let vkiVal = 0; let durum = "-";
                    if(boy > 0) { 
                        const bM = boy / 100; 
                        vkiVal = (ilkKilo / (bM * bM)).toFixed(1);
                        if(vkiVal < 18.5) durum = "Zayıf"; 
                        else if(vkiVal < 25) durum = "Normal"; 
                        else if(vkiVal < 30) durum = "Fazla Kilolu"; 
                        else durum = "Obez";
                    }
                    await supabase.from('olcumler').insert([{ 
                        hastaid: yeniHastaId, 
                        tarih: new Date().toISOString().split('T')[0], 
                        kilo: ilkKilo, 
                        vki: vkiVal, 
                        bmi_durum: durum 
                    }]);
                }

                // Başarılı olduğunda formu temizle ve listeyi yenile
                frmDanisan.reset(); 
                if (typeof window.uretProtokol === "function") window.uretProtokol(); 
                window.switchFormTab('bilgiler'); 
                window.switchPage('page-danisan-listesi'); 
                window.showToast('Danışan tüm detaylarıyla başarıyla kaydedildi!', 'success'); 
                
                danisanlariGetir(); // Modül içindeki listeleme fonksiyonunu çağır
                
            } catch(err) { 
                console.error(err); 
                window.showToast('Kayıt başarısız oldu!', 'error'); 
            } finally { 
                btn.innerText = "Danışanı Sisteme Kaydet"; 
                btn.disabled = false; 
            }
        };
    }
}