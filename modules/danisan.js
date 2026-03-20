import { supabase } from '../db.js';

window.danisanListesi = [];
window.aktifHastaId = null;
window.aktifHastaBoy = null;

// ================= 1. DANIŞANLARI MUHTEŞEM TASARIMLA LİSTELE =================
export async function danisanlariGetir() {
    const tablo = document.getElementById("danisan-tablosu"); 
    const rSec = document.getElementById("r-hasta"); 
    const fSec = document.getElementById("f-hasta");
    
    const { data, error } = await supabase.from('danisanlar').select('*').order('kayittarihi', { ascending: false });
    if (error) { console.error("Veri çekme hatası:", error); return; }

    window.danisanListesi = data || []; 
    if (tablo) tablo.innerHTML = ""; 
    
    const statEl = document.getElementById("stat-hastalar");
    if(statEl) statEl.innerText = data ? data.length : 0;
    
    let opts = '<option value="">Listeden Seçin...</option>';
    
    if(data) {
        data.forEach((d) => {
            const ad = d.ad || "İsimsiz";
            const soyad = d.soyad || "Danışan";
            const isim = ad + " " + soyad; 
            const harf = ad.charAt(0).toUpperCase();
            const telefon = d.telefon || "Belirtilmemiş";
            const protokol = d.protokol_no || "PROT-YOK";
            const cinsiyet = d.cinsiyet || "Belirtilmemiş";
            const kayitTarihi = d.kayittarihi ? new Date(d.kayittarihi).toLocaleDateString('tr-TR') : "-";
            
            opts += `<option value="${isim}" data-dbid="${d.id}">${isim}</option>`;
            
            let tibbiRozetler = "";
            if (d.kronik_hastaliklar && d.kronik_hastaliklar !== "Yok" && d.kronik_hastaliklar !== "-") {
                tibbiRozetler += `<span class="bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded text-[10px] font-bold mr-1 mb-1 inline-flex items-center"><i class="fas fa-heartbeat mr-1"></i> Kronik</span>`;
            }
            if (d.alerjiler && d.alerjiler !== "Yok" && d.alerjiler !== "-") {
                tibbiRozetler += `<span class="bg-orange-50 text-orange-600 border border-orange-200 px-2 py-1 rounded text-[10px] font-bold mr-1 mb-1 inline-flex items-center"><i class="fas fa-exclamation-triangle mr-1"></i> Alerji</span>`;
            }
            if (!tibbiRozetler) {
                tibbiRozetler = `<span class="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-1 rounded text-[10px] font-bold inline-flex items-center"><i class="fas fa-check-circle mr-1"></i> Risksiz</span>`;
            }

            if (tablo) {
                // Satırın her yerine tıklanabilme özelliği eklendi (cursor-pointer)
                tablo.innerHTML += `
                <tr class="hover:bg-slate-50/80 transition group cursor-pointer" onclick="window.profiliAc('${d.id}')">
                    <td class="p-4">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 text-teal-700 font-black flex items-center justify-center border border-teal-200 shadow-sm text-lg">${harf}</div>
                            <div>
                                <div class="font-bold text-slate-800 text-sm group-hover:text-teal-700 transition">${isim}</div>
                                <div class="text-[10px] text-slate-500 font-bold mt-1 bg-slate-100 px-2 py-0.5 rounded inline-block">${protokol} • ${cinsiyet}</div>
                            </div>
                        </div>
                    </td>
                    <td class="p-4">
                        <div class="text-sm font-bold text-slate-700"><i class="fas fa-phone-alt text-slate-400 text-xs mr-1.5"></i>${telefon}</div>
                        <div class="text-[10px] font-bold text-slate-400 mt-1"><i class="fas fa-calendar-plus mr-1"></i>Kayıt: ${kayitTarihi}</div>
                    </td>
                    <td class="p-4">
                        <div class="flex flex-wrap max-w-[180px]">
                            ${tibbiRozetler}
                        </div>
                    </td>
                    <td class="p-4 text-right">
                        <button onclick="event.stopPropagation(); window.profiliAc('${d.id}')" class="bg-white border border-gray-200 px-5 py-2.5 rounded-lg text-xs font-bold text-teal-700 hover:bg-teal-700 hover:text-white hover:border-teal-700 shadow-sm transition">
                            Dosyayı Aç <i class="fas fa-chevron-right ml-1"></i>
                        </button>
                    </td>
                </tr>`;
            }
        });
    }
    
    if(rSec) rSec.innerHTML = opts; 
    if(fSec) fSec.innerHTML = opts;
}

// ================= 2. HATASIZ DANIŞAN KAYDETME MOTORU =================
export function kayitFormunuBaslat() {
    const frmDanisan = document.getElementById('form-danisan-kayit');
    if(frmDanisan) {
        frmDanisan.onsubmit = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-kaydet'); 
            btn.innerText = "Sisteme İşleniyor..."; 
            btn.disabled = true;
            
            try {
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
                
                frmDanisan.reset(); 
                if (typeof window.uretProtokol === "function") window.uretProtokol(); 
                
                // ŞIK BİLDİRİM (Alert yok!)
                window.showToast('Danışan başarıyla eklendi!', 'success'); 
                
                const secList = document.getElementById('page-danisan-listesi');
                const secKayit = document.getElementById('page-yeni-kayit');
                if(secList && secKayit) {
                    secKayit.classList.remove('block'); secKayit.classList.add('hidden');
                    secList.classList.remove('hidden'); secList.classList.add('block');
                }
                
                danisanlariGetir(); 
                
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

// ================= 3. PROFİLİ AÇMA MOTORU (KIRILMAZ VERSİYON) =================
window.profiliAc = function(hastaId) {
    console.log("PROFİL AÇILIYOR ->", hastaId);
    const d = window.danisanListesi.find(x => x.id === hastaId);
    if(!d) {
        window.showToast('Hasta verisi bulunamadı!', 'error');
        return;
    }
    
    window.aktifHastaId = d.id; 
    window.aktifHastaBoy = d.boy || 0;
    
    const ad = d.ad || "İsimsiz"; 
    const soyad = d.soyad || "Danışan";
    
    document.getElementById('prof-header-isim').innerText = ad + " " + soyad;
    document.getElementById('profil-harf').innerText = ad.charAt(0).toUpperCase();
    document.getElementById('p-adsoyad').innerText = ad + " " + soyad;
    document.getElementById('p-tel').innerText = d.telefon || "-";
    document.getElementById('p-tel-ust').innerHTML = `${d.telefon || "-"} <i class="fas fa-check-circle text-teal-500"></i>`;
    document.getElementById('p-protokol').innerText = d.protokol_no || "-";
    document.getElementById('p-alerji').innerText = d.alerjiler || "Yok";
    document.getElementById('p-kronik').innerText = d.kronik_hastaliklar || "Yok";
    document.getElementById('p-su').innerText = d.su_tuketimi ? d.su_tuketimi + " L" : "-";
    document.getElementById('p-spor').innerText = d.fiziksel_aktivite || "-";
    
    if(d.dogum_tarihi) { 
        const yas = new Date().getFullYear() - new Date(d.dogum_tarihi).getFullYear(); 
        document.getElementById('p-yas-etiket').innerText = `${(d.cinsiyet || "BELİRTİLMEMİŞ").toUpperCase()}, ${yas} YAŞ`; 
    } else { 
        document.getElementById('p-yas-etiket').innerText = (d.cinsiyet || "BELİRTİLMEMİŞ").toUpperCase(); 
    }
    
    // UI.js'ye ihtiyaç duymadan KESİN olarak sayfayı değiştirir:
    document.querySelectorAll('.page-section').forEach(el => {
        el.classList.remove('block'); el.classList.add('hidden');
    });
    document.getElementById('page-hasta-profili').classList.remove('hidden');
    document.getElementById('page-hasta-profili').classList.add('block');
    
    if(typeof window.appSwitchProfileTab === 'function') window.appSwitchProfileTab('detay'); 
    
    if(typeof window.olcumleriGetir === 'function') window.olcumleriGetir(d.id); 
    if(typeof window.diyetleriGetir === 'function') window.diyetleriGetir(d.id); 
    if(typeof window.cariHareketleriGetir === 'function') window.cariHareketleriGetir(d.id); 
    if(typeof window.tahlilleriGetir === 'function') window.tahlilleriGetir(d.id);
}

// 4. DANIŞAN SİLME (Şık Bildirimli)
window.hastaSilCurrent = async function() { 
    if(!window.aktifHastaId) return;
    const onay = confirm("Bu danışanı kalıcı olarak silmek istediğinize emin misiniz?");
    if(onay) { 
        const { error } = await supabase.from('danisanlar').delete().eq('id', window.aktifHastaId); 
        if(!error) {
            window.showToast('Danışan başarıyla silindi', 'success');
            document.getElementById('page-hasta-profili').classList.remove('block');
            document.getElementById('page-hasta-profili').classList.add('hidden');
            document.getElementById('page-danisan-listesi').classList.remove('hidden');
            document.getElementById('page-danisan-listesi').classList.add('block');
            danisanlariGetir();
        } 
    } 
}