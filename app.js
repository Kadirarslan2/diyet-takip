import { supabase } from './db.js';

// ====================== GLOBAL DEĞİŞKENLER ======================
window.aktifHastaId = null; 
window.aktifHastaBoy = null; 
window.sablonListesi = [];
window.danisanListesi = []; // Hataları önleyen yeni güvenli listemiz!

document.addEventListener('DOMContentLoaded', () => {
    
    // ----------------- TAKVİM BAŞLATICI -----------------
    const calendarEl = document.getElementById('calendar');
    if(calendarEl) {
        window.globalCalendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'timeGridWeek', 
            locale: 'tr', 
            height: 600,
            headerToolbar: { 
                left: 'prev,next today', 
                center: 'title', 
                right: 'dayGridMonth,timeGridWeek,timeGridDay' 
            },
            slotMinTime: "08:00:00", 
            slotMaxTime: "20:00:00",
            eventClick: function(info) { 
                if(confirm("Bu randevuyu silmek istediğinize emin misiniz?")) { 
                    window.randevuSil(info.event.extendedProps.dbId); 
                } 
            }
        });
        window.globalCalendar.render();
    }

    // ----------------- 1. DANIŞAN EKLEME FORMU -----------------
    const frmDanisan = document.getElementById('form-danisan-kayit');
    if(frmDanisan) {
        frmDanisan.onsubmit = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-kaydet'); 
            btn.innerText = "Kaydediliyor..."; 
            btn.disabled = true;
            
            try {
                // Danışan Bilgilerini Supabase'e Gönder
                const { data, error } = await supabase.from('danisanlar').insert([{ 
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
                    indirim_orani: 0,
                    boy: document.getElementById('d-boy').value || "0", 
                    hedef_kilo: document.getElementById('d-hedef').value || "0",
                    cinsiyet: document.getElementById('d-cinsiyet').value, 
                    notlar: document.getElementById('d-notlar').value || "-"
                }]).select();
                
                if (error) throw error;
                
                // Eğer Şu Anki Kilo girildiyse, otomatik olarak İlk Ölçüm oluştur
                const ilkKilo = Number(document.getElementById('d-guncel-kilo').value);
                if(data && data[0] && ilkKilo > 0) {
                    const yeniHastaId = data[0].id; 
                    const boy = Number(document.getElementById('d-boy').value);
                    
                    let vkiVal = 0; 
                    let durum = "-";
                    
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

                // Formu temizle ve Listeye dön
                frmDanisan.reset(); 
                window.uretProtokol(); 
                window.switchFormTab('bilgiler'); 
                window.switchPage('page-danisan-listesi'); 
                window.showToast('Danışan başarıyla kaydedildi!', 'success'); 
                window.hastalariGetir(); 
                
            } catch(err) { 
                console.error(err); 
                window.showToast('Kayıt başarısız oldu!', 'error'); 
            } finally { 
                btn.innerText = "Danışanı Sisteme Kaydet"; 
                btn.disabled = false; 
            }
        };
    }

    // ----------------- 2. ÖLÇÜM EKLEME FORMU -----------------
    const frmOlcum = document.getElementById('form-yeni-olcum');
    if(frmOlcum) {
        frmOlcum.onsubmit = async (e) => {
            e.preventDefault(); 
            if(!window.aktifHastaId) return;
            
            try {
                let vkiTutar = 0; 
                let vkiDurumVal = "-"; 
                const kiloVal = Number(document.getElementById('o-kilo').value);
                
                // BMI Hesaplama
                if (window.aktifHastaBoy > 0 && kiloVal) {
                    const boyM = window.aktifHastaBoy / 100; 
                    vkiTutar = (kiloVal / (boyM * boyM)).toFixed(1);
                    if(vkiTutar < 18.5) { vkiDurumVal = "Zayıf"; } 
                    else if(vkiTutar < 24.9) { vkiDurumVal = "Normal"; } 
                    else if(vkiTutar < 29.9) { vkiDurumVal = "Fazla Kilolu"; } 
                    else { vkiDurumVal = "Obez"; }
                }
                
                const { error } = await supabase.from('olcumler').insert([{ 
                    hastaid: window.aktifHastaId, 
                    tarih: document.getElementById('o-tarih').value, 
                    kilo: kiloVal, 
                    yag: Number(document.getElementById('o-yag').value) || null, 
                    kas: Number(document.getElementById('o-kas').value) || null, 
                    vki: Number(vkiTutar), 
                    bmi_durum: vkiDurumVal 
                }]);
                
                if(!error) { 
                    frmOlcum.reset(); 
                    window.closeModal('modal-olcum'); 
                    window.showToast('Ölçüm başarıyla eklendi!', 'success'); 
                    window.olcumleriGetir(window.aktifHastaId); 
                }
            } catch(err) { 
                console.error(err); 
            }
        };
    }

    // ----------------- 3. ŞABLON VE DİYET SİSTEMİ -----------------
    const selSablon = document.getElementById('diy-sablon-secici');
    if(selSablon) {
        selSablon.addEventListener('change', (e) => {
            const id = e.target.value;
            if(!id) { 
                document.getElementById('diy-baslik').value = ""; 
                document.getElementById('diy-icerik').value = ""; 
                return; 
            }
            const s = window.sablonListesi.find(x => x.id === id);
            if(s) { 
                document.getElementById('diy-baslik').value = s.baslik; 
                document.getElementById('diy-icerik').value = s.icerik; 
            }
        });
    }

    const frmSablon = document.getElementById('form-yeni-sablon');
    if(frmSablon) {
        frmSablon.onsubmit = async (e) => {
            e.preventDefault();
            const { error } = await supabase.from('sablonlar').insert([{ 
                baslik: document.getElementById('s-baslik').value, 
                icerik: document.getElementById('s-icerik').value 
            }]);
            
            if(!error) { 
                frmSablon.reset(); 
                window.closeModal('modal-sablon'); 
                window.showToast('Şablon başarıyla kaydedildi!'); 
                window.sablonlariGetir(); 
            }
        };
    }

    const frmDiyet = document.getElementById('form-yeni-diyet');
    if(frmDiyet) {
        frmDiyet.onsubmit = async (e) => {
            e.preventDefault();
            const { error } = await supabase.from('diyetler').insert([{ 
                hastaid: window.aktifHastaId, 
                baslik: document.getElementById('diy-baslik').value, 
                icerik: document.getElementById('diy-icerik').value 
            }]);
            
            if(!error) { 
                frmDiyet.reset(); 
                window.closeModal('modal-diyet'); 
                window.showToast('Diyet başarıyla eklendi!'); 
                window.diyetleriGetir(window.aktifHastaId); 
            }
        };
    }

    // ----------------- 4. RANDEVU EKLEME FORMU -----------------
    const frmRandevu = document.getElementById('form-yeni-randevu');
    if(frmRandevu) {
        frmRandevu.onsubmit = async (e) => {
            e.preventDefault();
            const sZaman = document.getElementById('r-tarih').value + "T" + document.getElementById('r-saat').value; 
            const opt = document.getElementById('r-hasta').options[document.getElementById('r-hasta').selectedIndex];
            
            const { error } = await supabase.from('randevular').insert([{ 
                hastaid: opt.dataset.dbid, 
                hastaad: opt.value, 
                tarih: document.getElementById('r-tarih').value, 
                saat: document.getElementById('r-saat').value, 
                tip: document.getElementById('r-tip').value, 
                timestamp: sZaman 
            }]);
            
            if(!error) { 
                frmRandevu.reset(); 
                window.closeModal('modal-randevu'); 
                window.showToast('Randevu takvime eklendi!'); 
                window.randevulariGetir(); 
            }
        };
    }

    // ----------------- 5. CARİ/FİNANS İŞLEMLERİ FORMLARI -----------------
    const frmFinans = document.getElementById('form-finans');
    if(frmFinans) {
        frmFinans.onsubmit = async (e) => {
            e.preventDefault();
            const opt = document.getElementById('f-hasta').options[document.getElementById('f-hasta').selectedIndex];
            
            const { error } = await supabase.from('cari_hareketler').insert([{ 
                hastaid: opt.dataset.dbid, 
                islem_tarihi: document.getElementById('f-tarih').value, 
                tutar: Number(document.getElementById('f-tutar').value), 
                tur: 'Ödeme', 
                odeme_yontemi: document.getElementById('f-tip').value, 
                uzman_ad: "Dyt. Beyza" 
            }]);
            
            if(!error) { 
                frmFinans.reset(); 
                window.closeModal('modal-finans'); 
                window.showToast('Tahsilat başarıyla alındı!'); 
                window.finanslariGetir(); 
            }
        };
    }

    const frmCariHizmet = document.getElementById('form-cari-hizmet');
    if(frmCariHizmet) {
        frmCariHizmet.onsubmit = async (e) => {
            e.preventDefault();
            const { error } = await supabase.from('cari_hareketler').insert([{ 
                hastaid: window.aktifHastaId, 
                islem_tarihi: new Date().toISOString().split('T')[0], 
                tutar: Number(document.getElementById('ch-tutar').value), 
                tur: 'Hizmet Bedeli', 
                uzman_ad: "Dyt. Beyza" 
            }]);
            
            if(!error) { 
                frmCariHizmet.reset(); 
                window.closeModal('modal-cari-hizmet'); 
                window.showToast('Hizmet bedeli eklendi!'); 
                window.cariHareketleriGetir(window.aktifHastaId); 
            }
        };
    }
    
    const frmCariOdeme = document.getElementById('form-cari-odeme');
    if(frmCariOdeme) {
        frmCariOdeme.onsubmit = async (e) => {
            e.preventDefault();
            const { error } = await supabase.from('cari_hareketler').insert([{ 
                hastaid: window.aktifHastaId, 
                islem_tarihi: new Date().toISOString().split('T')[0], 
                tutar: Number(document.getElementById('co-tutar').value), 
                tur: 'Ödeme', 
                odeme_yontemi: document.getElementById('co-yontem').value, 
                uzman_ad: "Dyt. Beyza" 
            }]);
            
            if(!error) { 
                frmCariOdeme.reset(); 
                window.closeModal('modal-cari-odeme'); 
                window.showToast('Ödeme alındı!'); 
                window.cariHareketleriGetir(window.aktifHastaId); 
            }
        };
    }

    // ----------------- SAYFA AÇILIŞINDA ÇALIŞACAK FONKSİYONLAR -----------------
    window.hastalariGetir(); 
    window.randevulariGetir(); 
    window.finanslariGetir(); 
    window.sablonlariGetir();
});


// ====================== VERİ GETİRME FONKSİYONLARI ======================

window.sablonlariGetir = async function() {
    const list = document.getElementById('sablon-listesi'); 
    const sel = document.getElementById('diy-sablon-secici');
    const { data } = await supabase.from('sablonlar').select('*').order('kayitzamani', { ascending: false });
    
    window.sablonListesi = data || [];
    
    if(list) {
        list.innerHTML = "";
        data.forEach(s => { 
            list.innerHTML += `
            <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-bold text-slate-800">${s.baslik}</h4>
                    <button onclick="window.sablonSil('${s.id}')" class="text-red-400 hover:text-red-600"><i class="fas fa-trash"></i></button>
                </div>
                <p class="text-xs text-slate-500 line-clamp-3">${s.icerik}</p>
            </div>`; 
        });
    }
    
    if(sel) {
        let opts = '<option value="">Şablon Yok / Kendim Yazacağım</option>';
        data.forEach(s => { opts += `<option value="${s.id}">${s.baslik}</option>`; });
        sel.innerHTML = opts;
    }
}

window.randevulariGetir = async function() {
    const { data } = await supabase.from('randevular').select('*').order('timestamp', { ascending: true });
    
    document.getElementById("stat-randevular").innerText = data ? data.length : 0;
    
    if(window.globalCalendar) { 
        window.globalCalendar.removeAllEvents(); 
        data.forEach(r => { 
            window.globalCalendar.addEvent({ 
                title: `${r.saat} | ${r.hastaad}`, 
                start: r.timestamp + ":00", 
                color: (r.tip === "Kontrol Seansı" ? "#f97316" : "#3b82f6"), 
                extendedProps: { dbId: r.id } 
            }); 
        }); 
    }
}

window.finanslariGetir = async function() {
    const tablo = document.getElementById("kasa-tablosu"); 
    const stat = document.getElementById("stat-kasa");
    const { data } = await supabase.from('cari_hareketler').select('*, danisanlar(ad, soyad)').eq('tur', 'Ödeme').order('islem_tarihi', { ascending: false });
    
    tablo.innerHTML = ""; 
    let top = 0;
    
    if(data) {
        data.forEach(i => { 
            top += i.tutar; 
            const hAd = i.danisanlar ? (i.danisanlar.ad + " " + i.danisanlar.soyad) : "Bilinmiyor"; 
            tablo.innerHTML += `
            <tr class="border-b border-gray-100">
                <td class="p-4">${new Date(i.islem_tarihi).toLocaleDateString('tr-TR')}</td>
                <td class="p-4 font-bold">${hAd}</td>
                <td class="p-4 font-black text-teal-700">${i.tutar} ₺</td>
                <td class="p-4 text-right">
                    <button onclick="window.cariSil('${i.id}')" class="text-red-300 hover:text-red-500"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`; 
        });
    }
    stat.innerText = top + " ₺";
}

window.cariHareketleriGetir = async function(hastaId) {
    const tablo = document.getElementById("tablo-cari-hareketler");
    const { data } = await supabase.from('cari_hareketler').select('*').eq('hastaid', hastaId).order('islem_tarihi', { ascending: false });
    
    tablo.innerHTML = ""; 
    let hizmet = 0; 
    let odeme = 0;
    
    if(data) {
        data.forEach(h => {
            if(h.tur === 'Hizmet Bedeli') hizmet += h.tutar; 
            else if(h.tur === 'Ödeme') odeme += h.tutar;
            
            const tRnk = h.tur === 'Hizmet Bedeli' ? "text-orange-600" : "text-emerald-600";
            
            tablo.innerHTML += `
            <tr class="border-b border-gray-50">
                <td class="p-4">${new Date(h.islem_tarihi).toLocaleDateString('tr-TR')}</td>
                <td class="p-4 font-black ${tRnk}">${h.tutar} ₺</td>
                <td class="p-4"><span class="text-xs font-bold uppercase ${tRnk}">${h.tur}</span></td>
                <td class="p-4 text-slate-500">${h.odeme_yontemi||"-"}</td>
                <td class="p-4 text-right">
                    <button onclick="window.cariSil('${h.id}')" class="text-red-300 hover:text-red-500"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
        });
    }
    
    document.getElementById("cari-bakiye").innerText = (hizmet - odeme) + " ₺";
    document.getElementById("cari-toplam-hizmet").innerText = hizmet + " ₺";
    document.getElementById("cari-toplam-odeme").innerText = odeme + " ₺";
}

// ------------------- GÜNCELLENEN GÜVENLİ LİSTELEME -------------------
window.hastalariGetir = async function() {
    const tablo = document.getElementById("danisan-tablosu"); 
    const rSec = document.getElementById("r-hasta"); 
    const fSec = document.getElementById("f-hasta");
    
    const { data } = await supabase.from('danisanlar').select('*').order('kayittarihi', { ascending: false });
    
    window.danisanListesi = data || []; // Verileri güvenli şekilde hafızaya alıyoruz
    
    tablo.innerHTML = ""; 
    document.getElementById("stat-hastalar").innerText = data ? data.length : 0;
    let opts = '<option value="">Listeden Seçin...</option>';
    
    if(data) {
        data.forEach((d, i) => {
            // Eğer eski kayıtlarda ad soyad boşsa sistemi çökertmemek için önlem:
            const ad = d.ad || "İsimsiz";
            const soyad = d.soyad || "Danışan";
            const isim = ad + " " + soyad; 
            
            opts += `<option value="${isim}" data-dbid="${d.id}">${isim}</option>`;
            
            tablo.innerHTML += `
            <tr class="hover:bg-slate-50 border-b border-gray-50">
                <td class="p-4 text-slate-400 font-bold">${i+1}</td>
                <td class="p-4">
                    <div class="font-bold">${isim}</div>
                    <div class="text-[10px] text-slate-400 uppercase tracking-widest">${d.protokol_no || '-'}</div>
                </td>
                <td class="p-4 font-bold text-slate-600">${d.telefon || '-'}</td>
                <td class="p-4 text-right">
                    <button onclick="window.profiliAc('${d.id}')" class="bg-white border border-gray-200 px-4 py-1.5 rounded-lg text-xs font-bold text-teal-600 hover:bg-teal-50 shadow-sm transition">Dosyayı Aç</button>
                </td>
            </tr>`;
        });
    }
    
    if(rSec) rSec.innerHTML = opts; 
    if(fSec) fSec.innerHTML = opts;
}

// ------------------- GÜNCELLENEN GÜVENLİ PROFİL AÇMA -------------------
window.profiliAc = function(hastaId) {
    // Tüm veriyi butona sıkıştırmak yerine güvenli global listeden çekiyoruz
    const d = window.danisanListesi.find(x => x.id === hastaId);
    if(!d) return;
    
    window.aktifHastaId = d.id; 
    window.aktifHastaBoy = d.boy || 0;
    
    const ad = d.ad || "İsimsiz";
    const soyad = d.soyad || "Danışan";
    
    document.getElementById('prof-header-isim').innerText = ad + " " + soyad;
    document.getElementById('profil-harf').innerText = ad.charAt(0).toUpperCase();
    document.getElementById('p-adsoyad').innerText = ad + " " + soyad;
    document.getElementById('p-tel').innerText = d.telefon || "-";
    document.getElementById('p-tel-ust').innerHTML = `${d.telefon || "-"} <i class="fas fa-check-circle text-teal-500"></i>`;
    document.getElementById('p-dogum').innerText = d.dogum_tarihi || "-";
    document.getElementById('p-cinsiyet').innerText = d.cinsiyet || "-";
    document.getElementById('p-protokol').innerText = d.protokol_no || "-";
    document.getElementById('p-uzman').innerText = d.uzman_ad || "-";
    
    if(d.dogum_tarihi) { 
        const yas = new Date().getFullYear() - new Date(d.dogum_tarihi).getFullYear(); 
        document.getElementById('p-yas-etiket').innerText = `${(d.cinsiyet || "BELİRTİLMEMİŞ").toUpperCase()}, ${yas}`; 
    }
    
    window.switchPage('page-hasta-profili'); 
    
    // ui.js'deki fonksiyonun yüklenememe ihtimaline karşı ekstra güvenlik
    if (typeof window.switchProfileTab === "function") {
        window.switchProfileTab('detay'); 
    }
    
    // Alt sekmelerin verilerini yükle
    window.olcumleriGetir(d.id); 
    window.diyetleriGetir(d.id); 
    window.cariHareketleriGetir(d.id);
}

window.olcumleriGetir = async function(hId) {
    const tablo = document.getElementById("tablo-olcum-gecmis");
    const { data } = await supabase.from('olcumler').select('*').eq('hastaid', hId).order('tarih', { ascending: false });
    
    tablo.innerHTML = "";
    
    if(data && data.length > 0) { 
        const o = data[0]; 
        document.getElementById("dash-kilo").innerText = o.kilo.toFixed(1); 
        document.getElementById("dash-bmi").innerText = o.vki ? o.vki.toFixed(1) : "0.0"; 
        document.getElementById("dash-kas").innerText = o.kas ? o.kas.toFixed(1) : "0.0"; 
        document.getElementById("dash-yag").innerText = o.yag ? o.yag.toFixed(1) : "0.0"; 
        
        data.forEach((ol) => { 
            tablo.innerHTML += `
            <tr>
                <td class="p-4">${new Date(ol.tarih).toLocaleDateString('tr-TR')}</td>
                <td class="p-4 text-teal-600 font-black">${ol.kilo} kg</td>
                <td class="p-4 text-slate-500">Y: %${ol.yag||0} / K: %${ol.kas||0}</td>
                <td class="p-4 font-bold">${ol.vki||"-"}</td>
                <td class="p-4 text-right">
                    <button onclick="window.olcumSil('${ol.id}')" class="text-red-300 hover:text-red-500"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`; 
        });
    } else { 
        document.getElementById("dash-kilo").innerText = "0.0"; 
        document.getElementById("dash-bmi").innerText = "0.0"; 
        document.getElementById("dash-kas").innerText = "0.0"; 
        document.getElementById("dash-yag").innerText = "0.0"; 
    }
}

window.diyetleriGetir = async function(hId) {
    const list = document.getElementById("tablo-diyetler");
    const { data } = await supabase.from('diyetler').select('*').eq('hastaid', hId).order('kayitzamani', { ascending: false });
    
    list.innerHTML = "";
    
    if(data) { 
        data.forEach(d => { 
            list.innerHTML += `
            <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div class="flex justify-between items-start mb-3 border-b border-gray-100 pb-2">
                    <h4 class="font-bold text-slate-800">${d.baslik}</h4>
                    <button onclick="window.diyetSil('${d.id}')" class="text-red-400 hover:text-red-600"><i class="fas fa-trash"></i></button>
                </div>
                <p class="text-xs text-slate-600 leading-relaxed">${d.icerik.replace(/\n/g, '<br>')}</p>
            </div>`; 
        }); 
    }
}

// ====================== SİLME İŞLEMLERİ ======================

window.hastaSilCurrent = async function() { 
    if(confirm("Danışanı kalıcı olarak silmek istediğinize emin misiniz?")) { 
        await supabase.from('danisanlar').delete().eq('id', window.aktifHastaId); 
        window.switchPage('page-danisan-listesi'); 
        window.hastalariGetir(); 
    } 
}

window.olcumSil = async function(id) { 
    await supabase.from('olcumler').delete().eq('id', id); 
    window.olcumleriGetir(window.aktifHastaId); 
}

window.diyetSil = async function(id) { 
    await supabase.from('diyetler').delete().eq('id', id); 
    window.diyetleriGetir(window.aktifHastaId); 
}

window.randevuSil = async function(id) { 
    await supabase.from('randevular').delete().eq('id', id); 
    window.randevulariGetir(); 
}

window.cariSil = async function(id) { 
    await supabase.from('cari_hareketler').delete().eq('id', id); 
    window.cariHareketleriGetir(window.aktifHastaId); 
    window.finanslariGetir(); 
}

window.sablonSil = async function(id) { 
    await supabase.from('sablonlar').delete().eq('id', id); 
    window.sablonlariGetir(); 
}