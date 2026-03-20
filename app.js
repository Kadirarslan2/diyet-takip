import { supabase } from './db.js';

window.aktifHastaId = null; 
window.aktifHastaAdStr = null; 
window.aktifHastaTelStr = null; 
window.aktifHastaBoy = null; 
window.aktifHastaDogumTarihi = null;

document.addEventListener('DOMContentLoaded', () => {
    
    // TAKVİM BAŞLATICI
    const calendarEl = document.getElementById('calendar');
    if(calendarEl) {
        window.globalCalendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'timeGridWeek', locale: 'tr', height: 600,
            headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
            slotMinTime: "08:00:00", slotMaxTime: "20:00:00",
            eventClick: function(info) { if(confirm("Bu randevuyu silmek istediğinize emin misiniz?")) { window.randevuSil(info.event.extendedProps.dbId); } }
        });
        window.globalCalendar.render();
    }

    // DANIŞAN EKLEME (Tam Detaylı)
    const frmDanisan = document.getElementById('form-danisan-kayit');
    if(frmDanisan) {
        frmDanisan.onsubmit = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-kaydet'); btn.innerText = "Kaydediliyor..."; btn.disabled = true;
            try {
                const { error } = await supabase.from('danisanlar').insert([{ 
                    ad: document.getElementById('d-ad').value,
                    soyad: document.getElementById('d-soyad').value,
                    telefon: document.getElementById('d-tel').value || "-",
                    refakatci_tel: document.getElementById('d-refakatci-tel').value || "-",
                    sms_izni: document.getElementById('d-sms-izni').value,
                    email: document.getElementById('d-email').value || "-",
                    dogum_tarihi: document.getElementById('d-dogum-tarihi').value || null,
                    dogum_yeri: document.getElementById('d-dogum-yeri').value || "-",
                    protokol_no: document.getElementById('d-protokol').value,
                    danisan_gruplari: document.getElementById('d-gruplar').value,
                    uyruk: document.getElementById('d-uyruk').value,
                    kimlik_no: document.getElementById('d-kimlik-no').value || "-",
                    uzman_ad: document.getElementById('d-uzman').value,
                    kontrol_tarihi: document.getElementById('d-kontrol-tarihi').value || null,
                    danisan_turu: document.getElementById('d-turu').value,
                    indirim_orani: Number(document.getElementById('d-indirim').value) || 0,
                    boy: document.getElementById('d-boy').value || "0",
                    hedef_kilo: document.getElementById('d-hedef').value || "0",
                    cinsiyet: document.getElementById('d-turu').value, // Danışan Türü cinsiyet olarak kullanılıyor
                    notlar: document.getElementById('d-notlar').value || "-"
                }]);
                if (error) throw error;
                frmDanisan.reset(); 
                if(typeof window.uretProtokol === 'function') window.uretProtokol(); 
                if(typeof window.switchFormTab === 'function') window.switchFormTab('bilgiler'); 
                if(typeof window.switchPage === 'function') window.switchPage('page-danisan-listesi'); 
                if(typeof window.showToast === 'function') window.showToast('Danışan başarıyla eklendi!', 'success'); 
                window.hastalariGetir(); 
            } catch(err) { console.error(err); if(typeof window.showToast === 'function') window.showToast('Kayıt başarısız!', 'error'); } 
            finally { btn.innerText = "Sisteme Kaydet"; btn.disabled = false; }
        };
    }

    // ÖLÇÜM EKLEME (Boy profil bilgisinde kalıyor, BMI hesabı buradan yapılıyor)
    const frmOlcum = document.getElementById('form-yeni-olcum');
    if(frmOlcum) {
        frmOlcum.onsubmit = async (e) => {
            e.preventDefault(); if(!window.aktifHastaId) return;
            const btn = document.getElementById('btn-olcum-kaydet'); btn.innerText = "..."; btn.disabled = true;
            try {
                let vkiTutar = 0; let vkiDurumVal = "-";
                const kiloVal = Number(document.getElementById('o-kilo').value);
                if (window.aktifHastaBoy && window.aktifHastaBoy > 0 && kiloVal) {
                    const boyMetre = window.aktifHastaBoy / 100;
                    vkiTutar = (kiloVal / (boyMetre * boyMetre)).toFixed(1);
                    if(vkiTutar < 18.5) { vkiDurumVal = "Zayıf"; }
                    else if(vkiTutar < 24.9) { vkiDurumVal = "Normal"; }
                    else if(vkiTutar < 29.9) { vkiDurumVal = "Fazla Kilolu"; }
                    else { vkiDurumVal = "Obez"; }
                }

                const { error } = await supabase.from('olcumler').insert([{ 
                    hastaid: window.aktifHastaId, tarih: document.getElementById('o-tarih').value, 
                    kilo: kiloVal, yag: Number(document.getElementById('o-yag').value) || null, kas: Number(document.getElementById('o-kas').value) || null,
                    vki: Number(vkiTutar), bmi_durum: vkiDurumVal
                }]);
                if(error) throw error;
                frmOlcum.reset(); if(typeof window.closeModal === 'function') window.closeModal('modal-olcum'); if(typeof window.showToast === 'function') window.showToast('Ölçüm eklendi!', 'success'); 
                window.olcumleriGetir(window.aktifHastaId);
            } catch(err) { console.error(err); } finally { btn.innerText = "Kaydet"; btn.disabled = false; }
        };
    }

    // DİYET EKLEME
    const frmDiyet = document.getElementById('form-yeni-diyet');
    if(frmDiyet) {
        frmDiyet.onsubmit = async (e) => {
            e.preventDefault(); if(!window.aktifHastaId) return;
            const btn = document.getElementById('btn-diyet-kaydet'); btn.innerText = "..."; btn.disabled = true;
            try {
                const { error } = await supabase.from('diyetler').insert([{ hastaid: window.aktifHastaId, baslik: document.getElementById('diy-baslik').value, icerik: document.getElementById('diy-icerik').value }]);
                if(error) throw error;
                frmDiyet.reset(); if(typeof window.closeModal === 'function') window.closeModal('modal-diyet'); if(typeof window.showToast === 'function') window.showToast('Diyet listesi eklendi!', 'success'); 
                window.diyetleriGetir(window.aktifHastaId);
            } catch(err) { console.error(err); } finally { btn.innerText = "Listeyi Kaydet"; btn.disabled = false; }
        };
    }

    // RANDEVU EKLEME
    const frmRandevu = document.getElementById('form-yeni-randevu');
    if(frmRandevu) {
        frmRandevu.onsubmit = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-randevu-kaydet'); btn.innerText = "Ekleniyor..."; btn.disabled = true;
            const sZaman = document.getElementById('r-tarih').value + "T" + document.getElementById('r-saat').value; 
            try {
                const hastaSecim = document.getElementById('r-hasta');
                const selectedOption = hastaSecim.options[hastaSecim.selectedIndex];
                const hId = selectedOption.dataset.dbid;

                const { error } = await supabase.from('randevular').insert([{ hastaid: hId, hastaad: document.getElementById('r-hasta').value, tarih: document.getElementById('r-tarih').value, saat: document.getElementById('r-saat').value, tip: document.getElementById('r-tip').value, timestamp: sZaman }]);
                if(error) throw error;
                frmRandevu.reset(); if(typeof window.closeModal === 'function') window.closeModal('modal-randevu'); if(typeof window.showToast === 'function') window.showToast('Randevu takvime eklendi!', 'success'); 
                window.randevulariGetir();
            } catch(err) { console.error(err); if(typeof window.showToast === 'function') window.showToast('Hata oluştu!', 'error'); } finally { btn.innerText = "Takvime Ekle"; btn.disabled = false; }
        };
    }

    // FİNANS (KASA) TAHSİLAT GIRME (Dashboard/Finans'tan açılan)
    const frmFinans = document.getElementById('form-finans');
    if(frmFinans) {
        frmFinans.onsubmit = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-finans-kaydet'); btn.innerText = "Onaylanıyor..."; btn.disabled = true;
            try {
                const hastaSecim = document.getElementById('f-hasta');
                const selectedOption = hastaSecim.options[hastaSecim.selectedIndex];
                const hId = selectedOption.dataset.dbid;

                const { error } = await supabase.from('cari_hareketler').insert([{ 
                    hastaid: hId, 
                    islem_tarihi: document.getElementById('f-tarih').value, 
                    tutar: Number(document.getElementById('f-tutar').value), 
                    tur: 'Ödeme', 
                    odeme_yontemi: document.getElementById('f-tip').value, 
                    uzman_ad: "Dyt. Beyza", 
                    islem_notu: null
                }]);
                if(error) throw error;
                frmFinans.reset(); if(typeof window.closeModal === 'function') window.closeModal('modal-finans'); if(typeof window.showToast === 'function') window.showToast('Tahsilat kasaya işlendi!', 'success'); 
                window.finanslariGetir();
            } catch(err) { console.error(err); if(typeof window.showToast === 'function') window.showToast('Hata oluştu!', 'error'); } finally { btn.innerText = "Tahsilatı Onayla"; btn.disabled = false; }
        };
    }

    // CARİ HİZMET/ÖDEME EKLEME MODALLARI (Profil içinden)
    const frmCariHizmet = document.getElementById('form-cari-hizmet');
    if(frmCariHizmet) {
        frmCariHizmet.onsubmit = async (e) => {
            e.preventDefault(); if(!window.aktifHastaId) return;
            const btn = document.getElementById('btn-ch-kaydet'); btn.innerText = "..."; btn.disabled = true;
            try {
                const { error } = await supabase.from('cari_hareketler').insert([{ 
                    hastaid: window.aktifHastaId, islem_tarihi: new Date().toISOString().split('T')[0], tutar: Number(document.getElementById('ch-tutar').value), tur: 'Hizmet Bedeli', odeme_yontemi: null, uzman_ad: "Dyt. Beyza", islem_notu: document.getElementById('ch-not').value || null
                }]);
                if(error) throw error;
                frmCariHizmet.reset(); if(typeof window.closeModal === 'function') window.closeModal('modal-cari-hizmet'); if(typeof window.showToast === 'function') window.showToast('Hizmet kasaya işlendi!', 'success'); 
                window.cariHareketleriGetir(window.aktifHastaId);
            } catch(err) { console.error(err); } finally { btn.innerText = "Kasaya Hizmet Ekle"; btn.disabled = false; }
        };
    }
    const frmCariOdeme = document.getElementById('form-cari-odeme');
    if(frmCariOdeme) {
        frmCariOdeme.onsubmit = async (e) => {
            e.preventDefault(); if(!window.aktifHastaId) return;
            const btn = document.getElementById('btn-co-kaydet'); btn.innerText = "..."; btn.disabled = true;
            try {
                const { error } = await supabase.from('cari_hareketler').insert([{ 
                    hastaid: window.aktifHastaId, islem_tarihi: new Date().toISOString().split('T')[0], tutar: Number(document.getElementById('co-tutar').value), tur: 'Ödeme', odeme_yontemi: document.getElementById('co-yontem').value, uzman_ad: "Dyt. Beyza", islem_notu: null
                }]);
                if(error) throw error;
                frmCariOdeme.reset(); if(typeof window.closeModal === 'function') window.closeModal('modal-cari-odeme'); if(typeof window.showToast === 'function') window.showToast('Ödeme kasaya işlendi!', 'success'); 
                window.cariHareketleriGetir(window.aktifHastaId);
            } catch(err) { console.error(err); } finally { btn.innerText = "Ödemeyi Onayla"; btn.disabled = false; }
        };
    }

    // Açılışta her şeyi yükle
    window.hastalariGetir(); 
    window.randevulariGetir();
    window.finanslariGetir();
});


// ================= VERİ GETİRME FONKSİYONLARI =================

// RANDEVULARI GETİR
window.randevulariGetir = async function() {
    try {
        const { data: randevular, error } = await supabase.from('randevular').select('*').order('timestamp', { ascending: true });
        if(error) throw error;
        const statRand = document.getElementById("stat-randevular"); if(statRand) statRand.innerText = randevular.length;
        if(window.globalCalendar) {
            window.globalCalendar.removeAllEvents();
            randevular.forEach(r => {
                let tipRenk = "#3b82f6"; // Mavi
                if(r.tip === "Kontrol Seansı") tipRenk = "#f97316"; // Turuncu
                window.globalCalendar.addEvent({ 
                    title: `${r.saat} | ${r.hastaad}`, start: r.timestamp + ":00", color: tipRenk, extendedProps: { dbId: r.id } 
                });
            });
        }
    } catch(err) { console.error(err); }
}

// FİNANSLARI GETİR (DASHBOARD/FİNANS İÇİN)
window.finanslariGetir = async function() {
    const tablo = document.getElementById("kasa-tablosu"); const statKasa = document.getElementById("stat-kasa");
    if(!tablo) return; tablo.innerHTML = '<tr><td colspan="4" class="py-4 text-center">Yükleniyor...</td></tr>';
    try {
        const { data: islemler, error } = await supabase.from('cari_hareketler').select('*, danisanlar(ad, soyad)').eq('tur', 'Ödeme').order('islem_tarihi', { ascending: false });
        if(error) throw error;
        tablo.innerHTML = ""; let toplamTutar = 0;
        if(islemler.length === 0) { tablo.innerHTML = '<tr><td colspan="4" class="py-8 text-center text-slate-400">Henüz finansal işlem yok.</td></tr>'; if(statKasa) statKasa.innerText = "0 ₺"; return; }
        islemler.forEach(islem => {
            toplamTutar += islem.tutar;
            const fT = new Date(islem.islem_tarihi).toLocaleDateString('tr-TR');
            let hAd = islem.danisanlar ? (islem.danisanlar.ad + " " + islem.danisanlar.soyad) : "Bilinmiyor";
            tablo.innerHTML += `<tr class="hover:bg-slate-50 transition border-b border-gray-100"><td class="py-4 px-6 font-bold text-slate-600">${fT}</td><td class="py-4 px-6 font-bold text-slate-800">${hAd}</td><td class="py-4 px-6 font-black text-teal-700 text-lg">${islem.tutar} ₺</td><td class="py-4 px-6 text-right"><button onclick="window.cariSil('${islem.id}')" class="text-red-300 hover:text-red-500 transition"><i class="fas fa-trash-alt"></i></button></td></tr>`;
        });
        if(statKasa) statKasa.innerText = toplamTutar + " ₺";
    } catch(err) { console.error(err); }
}

// PROFİL CARİ SEKME İÇİN HAREKETLERİ GETİR
window.cariHareketleriGetir = async function(hastaId) {
    const tablo = document.getElementById("tablo-cari-hareketler"); if(!tablo) return; tablo.innerHTML = '<tr><td colspan="6" class="py-4 text-center">Yükleniyor...</td></tr>';
    const cBakiye = document.getElementById("cari-bakiye"); const cHizmet = document.getElementById("cari-toplam-hizmet"); const cOdeme = document.getElementById("cari-toplam-odeme");
    try {
        const { data: hareketler, error } = await supabase.from('cari_hareketler').select('*').eq('hastaid', hastaId).order('islem_tarihi', { ascending: false });
        if(error) throw error;
        tablo.innerHTML = ""; let toplamHizmet = 0; let toplamOdeme = 0;
        if(hareketler.length === 0) { tablo.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-slate-400">Finansal hareket yok.</td></tr>'; if(cBakiye) cBakiye.innerText = "0 ₺"; if(cHizmet) cHizmet.innerText = "0 ₺"; if(cOdeme) cOdeme.innerText = "0 ₺"; return; }
        hareketler.forEach(h => {
            if(h.tur === 'Hizmet Bedeli') { toplamHizmet += h.tutar; }
            else if(h.tur === 'Ödeme') { toplamOdeme += h.tutar; }
            const fT = new Date(h.islem_tarihi).toLocaleDateString('tr-TR');
            let turRenk = h.tur === 'Hizmet Bedeli' ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700";
            tablo.innerHTML += `<tr class="hover:bg-slate-50 transition border-b border-gray-50"><td class="py-4 px-6 font-bold text-slate-600">${fT}</td><td class="py-4 px-6 font-black text-teal-700 text-lg">${h.tutar} ₺</td><td class="py-4 px-6"><span class="px-2 py-1 rounded text-xs font-black tracking-widest uppercase ${turRenk}">${h.tur}</span></td><td class="py-4 px-6 text-slate-500 font-semibold">${h.odeme_yontemi || "-"}</td><td class="py-4 px-6 text-slate-500">${h.uzman_ad}</td><td class="py-4 px-6 text-right"><button onclick="window.cariSil('${h.id}')" class="text-red-300 hover:text-red-500 transition"><i class="fas fa-trash-alt"></i></button></td></tr>`;
        });
        if(cBakiye) cBakiye.innerText = (toplamHizmet - toplamOdeme) + " ₺";
        if(cHizmet) cHizmet.innerText = toplamHizmet + " ₺";
        if(cOdeme) cOdeme.innerText = toplamOdeme + " ₺";
    } catch(err) { console.error(err); tablo.innerHTML = '<tr><td colspan="6" class="py-4 text-center text-red-500">Hata! Çekilemedi.</td></tr>'; }
}

// HASTALARI GETİR VE LİSTEYİ DOLDUR
window.hastalariGetir = async function() {
    const tablo = document.getElementById("danisan-tablosu"); const stat = document.getElementById("stat-hastalar");
    const rHastaSelect = document.getElementById("r-hasta"); const fHastaSelect = document.getElementById("f-hasta");
    if(!tablo) return; tablo.innerHTML = '<tr><td colspan="4" class="py-4 text-center">Yükleniyor...</td></tr>';
    try {
        const { data: danisanlar, error } = await supabase.from('danisanlar').select('*').order('kayittarihi', { ascending: false });
        if(error) throw error;
        tablo.innerHTML = ""; if(stat) stat.innerText = danisanlar.length;
        let selectOptions = '<option value="">Listeden Seçin...</option>';
        if(danisanlar.length === 0) { tablo.innerHTML = '<tr><td colspan="4" class="py-8 text-center text-slate-400">Danışan yok.</td></tr>'; if(rHastaSelect) rHastaSelect.innerHTML = '<option value="">Önce danışan ekleyin</option>'; if(fHastaSelect) fHastaSelect.innerHTML = '<option value="">Önce danışan ekleyin</option>'; return; }
        
        danisanlar.forEach((d, index) => {
            const isim = d.ad + " " + d.soyad; 
            const dataStr = encodeURIComponent(JSON.stringify(d));
            selectOptions += `<option value="${isim}" data-dbid="${d.id}">${isim}</option>`;
            
            tablo.innerHTML += `
                <tr class="hover:bg-slate-50 transition border-b border-gray-50">
                    <td class="py-4 px-6 text-slate-400 font-bold">${index+1}</td>
                    <td class="py-4 px-6">
                        <div class="font-bold text-slate-800">${isim}</div>
                        <div class="text-[10px] text-slate-400 uppercase font-black tracking-widest">${d.protokol_no}</div>
                    </td>
                    <td class="py-4 px-6 text-slate-600 text-sm font-bold">${d.telefon}</td>
                    <td class="py-4 px-6 text-right">
                        <button onclick="window.profiliAc('${dataStr}')" class="bg-white border border-gray-200 px-4 py-1.5 rounded-lg text-xs font-bold text-teal-600 hover:bg-teal-50 transition shadow-sm">Dosyayı Aç</button>
                    </td>
                </tr>
            `;
        });
        if(rHastaSelect) rHastaSelect.innerHTML = selectOptions; if(fHastaSelect) fHastaSelect.innerHTML = selectOptions;
    } catch(err) { console.error(err); }
}

// BİREBİR DETAYLI PROFİL KARTINI DOLDUR (image_9ab801)
window.profiliAc = function(dataStr) {
    const d = JSON.parse(decodeURIComponent(dataStr)); 
    window.aktifHastaId = d.id; 
    window.aktifHastaAdStr = d.ad + " " + d.soyad; 
    window.aktifHastaTelStr = d.telefon; 
    window.aktifHastaBoy = d.boy || 0; 
    window.aktifHastaDogumTarihi = d.dogum_tarihi;

    document.getElementById('prof-header-isim').innerText = d.ad + " " + d.soyad;
    document.getElementById('profil-harf').innerText = d.ad.charAt(0).toUpperCase();

    // Üst Uyarılar
    document.getElementById('p-tel-ust').innerHTML = `${d.telefon || "-"} <i class="fas fa-exclamation-circle text-orange-500"></i>`;
    
    // Grid Bilgileri
    document.getElementById('p-ad').innerText = d.ad || "-";
    document.getElementById('p-soyad').innerText = d.soyad || "-";
    document.getElementById('p-tel').innerText = d.telefon || "-";
    document.getElementById('p-email').innerText = d.email || "-";
    
    let dogumStr = d.dogum_tarihi || "-";
    let yasStr = "";
    if(d.dogum_tarihi) {
        const yas = new Date().getFullYear() - new Date(d.dogum_tarihi).getFullYear();
        yasStr = ` (${yas} Yaşında)`;
        const pyas = document.getElementById('p-yas-etiket');
        if(pyas) pyas.innerText = `${(d.cinsiyet || "BELİRTİLMEMİŞ").toUpperCase()}, ${yas}`;
    }
    document.getElementById('p-dogum').innerText = dogumStr + yasStr;
    document.getElementById('p-dogumyeri').innerText = d.dogum_yeri || "-";
    document.getElementById('p-protokol').innerText = d.protokol_no || "-";
    document.getElementById('p-cinsiyet').innerText = d.cinsiyet || "-";
    document.getElementById('p-uyruk').innerText = d.uyruk || "-";
    document.getElementById('p-kimlik').innerText = d.kimlik_no || "-";
    document.getElementById('p-uzman').innerText = d.uzman_ad || "-";
    document.getElementById('p-kontrol').innerText = d.kontrol_tarihi || "-";
    document.getElementById('p-grup').innerText = d.danisan_gruplari || "-";

    if(typeof window.switchPage === 'function') window.switchPage('page-hasta-profili'); 
    if(typeof window.switchProfileTab === 'function') window.switchProfileTab('detay'); 
    window.olcumleriGetir(d.id); window.diyetleriGetir(d.id); window.cariHareketleriGetir(d.id);
}

// ÖLÇÜMLERİ GETİR
window.olcumleriGetir = async function(hastaId) {
    const tablo = document.getElementById("tablo-olcum-gecmis"); if(!tablo) return; 
    const dKilo = document.getElementById("dash-kilo"); const dBmi = document.getElementById("dash-bmi"); const dKas = document.getElementById("dash-kas"); const dYag = document.getElementById("dash-yag");
    
    try {
        const { data: olcumler, error } = await supabase.from('olcumler').select('*').eq('hastaid', hastaId).order('tarih', { ascending: false });
        if(error) throw error;
        
        tablo.innerHTML = "";
        if(olcumler.length > 0) { 
            const o = olcumler[0]; 
            if(dKilo) dKilo.innerText = o.kilo.toFixed(1); 
            if(dBmi) dBmi.innerText = o.vki ? o.vki.toFixed(1) : "0.0"; 
            if(dKas) dKas.innerText = o.kas ? o.kas.toFixed(1) : "0.0"; 
            if(dYag) dYag.innerText = o.yag ? o.yag.toFixed(1) : "0.0"; 
            
            olcumler.forEach((ol) => {
                const fT = new Date(ol.tarih).toLocaleDateString('tr-TR'); 
                tablo.innerHTML += `<tr><td class="p-4">${fT}</td><td class="p-4 text-teal-600 font-black">${ol.kilo} kg</td><td class="p-4 text-slate-500">Y: %${ol.yag||0} / K: %${ol.kas||0}</td><td class="p-4 font-bold text-slate-600">${ol.vki||"-"}</td><td class="p-4 text-right"><button onclick="window.olcumSil('${ol.id}')" class="text-red-300 hover:text-red-500 transition"><i class="fas fa-trash-alt"></i></button></td></tr>`;
            });
        } else { 
            if(dKilo) dKilo.innerText = "0.0"; if(dBmi) dBmi.innerText = "0.0"; if(dKas) dKas.innerText = "0.0"; if(dYag) dYag.innerText = "0.0"; 
            tablo.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-slate-400">Ölçüm geçmişi yok.</td></tr>';
        }
    } catch(err) { console.error(err); }
}

// DİYETLERİ GETİR
window.diyetleriGetir = async function(hastaId) {
    const list = document.getElementById("tablo-diyetler"); if(!list) return; list.innerHTML = "Yükleniyor...";
    try {
        const { data: diyetler, error } = await supabase.from('diyetler').select('*').eq('hastaid', hastaId).order('kayitzamani', { ascending: false });
        if(error) throw error;
        if(diyetler.length === 0) { list.innerHTML = '<div class="col-span-2 text-center py-6 text-slate-400 font-semibold text-xs">Henüz diyet programı yazılmamış.</div>'; return; }

        list.innerHTML = "";
        diyetler.forEach((d) => { 
            const formatli = d.icerik.replace(/\n/g, '<br>'); const waIcerik = encodeURIComponent(`Merhaba, Dyt. Beyza Yılmaz kliniğinden yeni diyet listeniz:\n\n*${d.baslik}*\n\n${d.icerik}`); 
            list.innerHTML += `<div class="bg-white border border-gray-200 p-5 rounded-xl shadow-sm relative flex flex-col"><div class="flex justify-between items-start mb-3 border-b border-gray-100 pb-2"><h4 class="font-bold text-slate-800">${d.baslik}</h4><div class="flex gap-3"><button onclick="if(typeof window.whatsappGonder === 'function') window.whatsappGonder('${window.aktifHastaTelStr}', '${waIcerik}')" class="text-slate-400 hover:text-green-500 transition" title="WhatsApp'tan Gönder"><i class="fab fa-whatsapp text-lg"></i></button><button onclick="window.diyetSil('${d.id}')" class="text-slate-400 hover:text-red-500 transition"><i class="fas fa-trash"></i></button></div></div><p class="text-xs text-slate-600 leading-relaxed flex-1">${formatli}</p></div>`; 
        });
    } catch(err) { console.error(err); }
}

// SİLME İŞLEMLERİ
window.hastaSilCurrent = async function() { if(confirm("Bu danışanı kalıcı olarak silmek istiyor musunuz?")) { await supabase.from('danisanlar').delete().eq('id', window.aktifHastaId); if(typeof window.showToast === 'function') window.showToast('Danışan Silindi!', 'error'); window.switchPage('page-danisan-listesi'); window.hastalariGetir(); } }
window.hastaSil = async function(id) { if(confirm("Silmek istediğinize emin misiniz?")) { await supabase.from('danisanlar').delete().eq('id', id); if(typeof window.showToast === 'function') window.showToast('Silindi!', 'error'); window.hastalariGetir(); } }
window.olcumSil = async function(id) { if(confirm("Ölçümü sil?")) { await supabase.from('olcumler').delete().eq('id', id); if(typeof window.showToast === 'function') window.showToast('Silindi!', 'error'); window.olcumleriGetir(window.aktifHastaId); } }
window.diyetSil = async function(id) { if(confirm("Diyeti sil?")) { await supabase.from('diyetler').delete().eq('id', id); if(typeof window.showToast === 'function') window.showToast('Silindi!', 'error'); window.diyetleriGetir(window.aktifHastaId); } }
window.randevuSil = async function(id) { await supabase.from('randevular').delete().eq('id', id); if(typeof window.showToast === 'function') window.showToast('Randevu silindi!', 'error'); window.randevulariGetir(); }
window.cariSil = async function(id) { if(confirm("Finansal hareketi silmek istediğinize emin misiniz?")) { await supabase.from('cari_hareketler').delete().eq('id', id); if(typeof window.showToast === 'function') window.showToast('İşlem silindi!', 'error'); window.cariHareketleriGetir(window.aktifHastaId); } }