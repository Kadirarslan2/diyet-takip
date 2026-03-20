import { supabase } from './db.js';
import { danisanlariGetir, kayitFormunuBaslat } from './modules/danisan.js?v=finalHaftalik';
import { randevuFormunuBaslat } from './modules/randevu.js?v=finalHaftalik';

// ================= ÇELİK TOAST BİLDİRİMLERİ =================
window.showToast = function(mesaj, tip = 'success') {
    let container = document.getElementById('toast-container');
    if(!container) { container = document.createElement('div'); container.id = 'toast-container'; document.body.appendChild(container); }
    const toast = document.createElement('div');
    const bgColor = tip === 'success' ? 'bg-teal-600' : 'bg-red-600';
    const icon = tip === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    toast.className = `flex items-center gap-3 ${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl font-bold text-sm transform transition-all duration-300 translate-y-full opacity-0 fixed bottom-6 right-6 z-[9999]`;
    toast.innerHTML = `<i class="fas ${icon} text-xl"></i> <span>${mesaj}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.remove('translate-y-full', 'opacity-0'); toast.classList.add('translate-y-0', 'opacity-100'); }, 10);
    setTimeout(() => { toast.classList.remove('translate-y-0', 'opacity-100'); toast.classList.add('translate-y-full', 'opacity-0'); setTimeout(() => toast.remove(), 300); }, 3000);
};

window.uretProtokol = function() {
    const rnd = Math.floor(10000 + Math.random() * 90000);
    const el = document.getElementById('d-protokol');
    if(el) el.value = "PRT-" + rnd;
};

// ================= WHATSAPP BAĞLANTISI =================
window.whatsappMesajAt = function() {
    if(!window.aktifHastaId) return;
    const d = window.danisanListesi.find(x => x.id === window.aktifHastaId);
    if(!d) return;
    let tel = d.telefon;
    if(!tel || tel === "-" || tel === "Belirtilmemiş") { window.showToast("Hastanın telefonu yok!", "error"); return; }
    tel = tel.replace(/\D/g, ''); if(tel.startsWith("0")) tel = "9" + tel; if(!tel.startsWith("90")) tel = "90" + tel;
    const ad = d.ad || "Danışan"; const uzman = d.uzman_ad || "Dyt. Beyza";
    const mesaj = encodeURIComponent(`Merhaba ${ad} Hanım/Bey,\nDiyetTakibim Kliniğinden, ${uzman} adına iletişime geçiyoruz. Sağlıklı günler dileriz! 🍏`);
    window.open(`https://wa.me/${tel}?text=${mesaj}`, '_blank');
}

// ================= KUSURSUZ PDF MOTORU (DOKUNULMADI) =================
const pdfOlusturVeIndir = (htmlIcerik, dosyaAdi) => {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed'; wrapper.style.top = '0'; wrapper.style.left = '0'; wrapper.style.width = '100vw'; wrapper.style.height = '100vh'; wrapper.style.backgroundColor = '#f8fafc'; wrapper.style.zIndex = '999999'; wrapper.style.display = 'flex'; wrapper.style.flexDirection = 'column'; wrapper.style.alignItems = 'center'; wrapper.style.overflow = 'auto'; 
    const loader = document.createElement('div');
    loader.innerHTML = '<h2 style="margin-top: 50px; color: #0f766e; font-family: sans-serif;"><i class="fas fa-spinner fa-spin mr-2"></i> PDF Hazırlanıyor...</h2>';
    wrapper.appendChild(loader);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlIcerik; tempDiv.style.width = '800px'; tempDiv.style.backgroundColor = '#ffffff'; tempDiv.style.margin = '20px'; tempDiv.style.boxShadow = '0 0 15px rgba(0,0,0,0.1)';
    wrapper.appendChild(tempDiv);
    document.body.appendChild(wrapper);
    const opt = { margin: 10, filename: dosyaAdi, image: { type: 'jpeg', quality: 1 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
    setTimeout(() => {
        html2pdf().set(opt).from(tempDiv).save().then(() => {
            window.showToast('PDF Başarıyla İndirildi!', 'success'); wrapper.remove(); 
        }).catch(err => {
            console.error("PDF Hatası:", err); window.showToast('PDF Hatası!', 'error'); wrapper.remove();
        });
    }, 800);
}

window.pdfIndir = async function() {
    if(!window.aktifHastaId) return;
    const d = window.danisanListesi.find(x => x.id === window.aktifHastaId);
    if(!d) return;
    window.showToast('Klinik Raporu Başlatıldı...', 'success');
    let guncelKilo = "-", guncelVki = "-"; let olcumHtml = "";
    const { data: olcumler } = await supabase.from('olcumler').select('*').eq('hastaid', d.id).order('tarih', { ascending: false });
    if(olcumler && olcumler.length > 0) { guncelKilo = olcumler[0].kilo + " kg"; guncelVki = olcumler[0].vki || "-"; olcumler.forEach(o => { olcumHtml += `<tr><td style="border: 1px solid #e2e8f0; padding: 6px;">${new Date(o.tarih).toLocaleDateString('tr-TR')}</td><td style="border: 1px solid #e2e8f0; padding: 6px; font-weight:bold; color:#0f766e;">${o.kilo} kg</td><td style="border: 1px solid #e2e8f0; padding: 6px;">%${o.yag||0} / %${o.kas||0}</td><td style="border: 1px solid #e2e8f0; padding: 6px;">${o.bel||'-'} / ${o.kalca||'-'}</td><td style="border: 1px solid #e2e8f0; padding: 6px;">${o.vki||'-'}</td></tr>`; }); }
    let tahlilHtml = "";
    const { data: tahliller } = await supabase.from('tahliller').select('*').eq('hastaid', d.id).order('tarih', { ascending: false });
    if(tahliller && tahliller.length > 0) { tahliller.forEach(t => { tahlilHtml += `<tr><td style="border: 1px solid #e2e8f0; padding: 6px;">${new Date(t.tarih).toLocaleDateString('tr-TR')}</td><td style="border: 1px solid #e2e8f0; padding: 6px; color:#b91c1c; font-weight:bold;">${t.b12||'-'} / ${t.d_vitamini||'-'}</td><td style="border: 1px solid #e2e8f0; padding: 6px;">${t.demir||'-'}</td><td style="border: 1px solid #e2e8f0; padding: 6px;">${t.kolesterol||'-'}</td><td style="border: 1px solid #e2e8f0; padding: 6px;">${t.aclik_sekeri||'-'}</td><td style="border: 1px solid #e2e8f0; padding: 6px;">${t.tsh||'-'}</td></tr>`; }); }
    const htmlRapor = `<div style="padding: 30px 40px; font-family: sans-serif; background: white; width: 800px; box-sizing: border-box;"><div style="border-bottom: 3px solid #0f766e; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;"><div><h1 style="color: #0f766e; margin: 0; font-size: 24px; font-weight: 900;">DİYETTAKİBİM KLİNİĞİ</h1><p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px; font-weight: bold;">Kapsamlı Hasta Analiz Raporu</p></div><div style="text-align: right; color: #64748b; font-size: 11px;"><strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}<br><strong>Protokol:</strong> ${d.protokol_no || '-'}</div></div><h3 style="background-color: #f8fafc; color: #334155; padding: 8px 12px; font-size: 13px; border-left: 4px solid #0f766e; font-weight: bold;">Kişisel Bilgiler</h3><p style="font-size:12px"><strong>Ad Soyad:</strong> ${d.ad} ${d.soyad} | <strong>Cinsiyet:</strong> ${d.cinsiyet || '-'}</p><h3 style="background-color: #f0fdfa; color: #0f766e; padding: 8px 12px; font-size: 13px; border-left: 4px solid #14b8a6; font-weight: bold;">Ölçüm Geçmişi</h3><table style="width:100%; border-collapse:collapse; font-size:11px"><thead><tr style="background:#f8fafc"><th>Tarih</th><th>Kilo</th><th>Yağ/Kas</th><th>Bel/Kalça</th><th>BMI</th></tr></thead><tbody>${olcumHtml}</tbody></table><h3 style="background-color: #fef2f2; color: #b91c1c; padding: 8px 12px; font-size: 13px; border-left: 4px solid #b91c1c; font-weight: bold;">Tahlil Sonuçları</h3><table style="width:100%; border-collapse:collapse; font-size:11px"><thead><tr style="background:#f8fafc"><th>Tarih</th><th>B12/D-Vit</th><th>Demir</th><th>Koles.</th><th>Şeker</th><th>TSH</th></tr></thead><tbody>${tahlilHtml}</tbody></table><div style="margin-top:30px; text-align:center; font-size:10px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:10px;">DiyetTakibim Yönetim Sistemi</div></div>`;
    pdfOlusturVeIndir(htmlRapor, `${d.ad}_Klinik_Raporu.pdf`);
}

window.diyetPdfIndir = async function(diyetId) {
    window.showToast('Diyet PDF Hazırlanıyor...', 'success');
    const { data: dData } = await supabase.from('diyetler').select('*').eq('id', diyetId).single();
    if(!dData) return;
    const d = window.danisanListesi.find(x => x.id === dData.hastaid);
    const ogunHtml = (baslik, renk, icerik, icon) => { if(!icerik) return ""; return `<div style="background: #f8fafc; padding: 15px; margin-bottom: 12px; border-left: 5px solid ${renk}; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"><h4 style="margin: 0 0 8px 0; color: ${renk}; font-size: 15px; text-transform: uppercase;">${icon} ${baslik}</h4><div style="font-size: 13px; line-height: 1.6; color: #334155;">${icerik.replace(/\n/g, '<br>')}</div></div>`; };
    const htmlDiyet = `<div style="padding: 40px 50px; font-family: sans-serif; background: white; width: 800px; box-sizing: border-box;"><div style="text-align: center; border-bottom: 3px solid #0f766e; padding-bottom: 20px; margin-bottom: 20px;"><h1 style="color: #0f766e; margin: 0; font-size: 32px; font-weight: 900;">DİYETTAKİBİM KLİNİĞİ</h1><p style="margin: 0; color: #64748b; font-size: 14px; font-weight: bold; letter-spacing: 2px;">KİŞİYE ÖZEL BESLENME PROGRAMI</p></div><div style="background: #f1f5f9; padding: 15px 20px; border-radius: 8px; margin-bottom: 30px; font-size: 13px;"><strong>Danışan:</strong> ${d ? d.ad + ' ' + d.soyad : 'Danışan'} | <strong>Program:</strong> ${dData.baslik}</div>${ogunHtml('Sabah', '#d97706', dData.sabah, '☀️')} ${ogunHtml('Öğle', '#2563eb', dData.ogle, '🍲')} ${ogunHtml('Akşam', '#4f46e5', dData.aksam, '🌙')}<div style="margin-top: 40px; text-align: center; border-top: 2px solid #e2e8f0; padding-top: 20px;">Sağlıklı Günler Dileriz!</div></div>`;
    pdfOlusturVeIndir(htmlDiyet, `Diyet_Programi.pdf`);
}

// ================= HAFTALIK GÖRÜNÜMÜ ÇÖZEN RANDEVU MOTORU =================
window.randevulariGetir = async function() { 
    try {
        const { data } = await supabase.from('randevular').select('*'); 
        const stat = document.getElementById("stat-randevular");
        if(stat) stat.innerText = data ? data.length : 0; 
        
        if(window.globalCalendar) { 
            window.globalCalendar.removeAllEvents(); 
            if(data) {
                data.forEach(r => { 
                    try {
                        let rRenk = (r.durum === "Geldi") ? "#10b981" : (r.durum === "İptal Etti" ? "#ef4444" : "#3b82f6");
                        
                        // HAFTALIK/GÜNLÜK İÇİN KRİTİK DÜZELTME:
                        // Saat formatını "14:30:00" şeklinde FullCalendar'ın tam anlayacağı şekle getiriyoruz
                        let startStr = `${r.tarih}T${r.saat.length === 5 ? r.saat + ":00" : r.saat}`;
                        
                        // Otomatik 1 Saatlik Bitiş Zamanı Hesapla (Haftalık kutu görünümü için mecburi)
                        let startDate = new Date(startStr);
                        if(isNaN(startDate.getTime())) return; // Bozuksa atla
                        
                        let endDate = new Date(startDate.getTime() + (60 * 60 * 1000));

                        window.globalCalendar.addEvent({ 
                            title: `${r.saat} | ${r.hastaad}`, 
                            start: startStr,
                            end: endDate.toISOString(), // Bitiş saati haftalıkta kutuyu oluşturur!
                            allDay: false, 
                            color: rRenk, 
                            extendedProps: { dbId: r.id, durum: r.durum || 'Bekliyor' } 
                        }); 
                    } catch(e) {}
                }); 
            }
        } 
    } catch(err) {}
}

// ================= DANIŞAN SEÇ DOLDURUCUSU =================
window.randevuSelectDoldur = async function() {
    const sel = document.getElementById('r-hasta');
    if(!sel) return;
    const { data } = await supabase.from('danisanlar').select('id, ad, soyad').order('ad', { ascending: true });
    if(data) {
        sel.innerHTML = '<option value="">Danışan Seçiniz...</option>';
        data.forEach(d => { sel.innerHTML += `<option value="${d.id}">${d.ad} ${d.soyad}</option>`; });
    }
}

// ================= RANDEVU KAYDETME MOTORU =================
let oldFrmRandevu = document.getElementById('form-yeni-randevu');
if(oldFrmRandevu) {
    let frmRandevu = oldFrmRandevu.cloneNode(true);
    oldFrmRandevu.parentNode.replaceChild(frmRandevu, oldFrmRandevu);
    frmRandevu.onsubmit = async (e) => {
        e.preventDefault();
        let hId = document.getElementById('r-hasta').value;
        if(!hId) { window.showToast('Lütfen bir danışan seçin!', 'error'); return; }
        const sel = document.getElementById('r-hasta');
        const hAd = sel.options[sel.selectedIndex].text;
        const tarih = document.getElementById('r-tarih').value;
        const saat = document.getElementById('r-saat').value;
        const tip = document.getElementById('r-tip').value;
        
        const { error } = await supabase.from('randevular').insert([{
            hastaid: hId, hastaad: hAd, tarih: tarih, saat: saat, tip: tip, durum: 'Bekliyor', timestamp: new Date(`${tarih}T${saat}:00`).toISOString()
        }]);

        if(!error) { 
            frmRandevu.reset(); window.closeModal('modal-randevu'); window.showToast('Randevu eklendi!'); 
            if(window.randevulariGetir) window.randevulariGetir(); 
        } else { window.showToast('HATA: ' + error.message, 'error'); }
    };
}

// ================= ŞABLON VE DİYET MOTORLARI =================
window.sablonlariGetir = async function() { 
    try {
        const lists = document.querySelectorAll('#sablon-listesi'); const sels = document.querySelectorAll('#diy-sablon-secici'); 
        const { data, error } = await supabase.from('sablonlar').select('*'); 
        if(error) throw error;
        let sablonlar = data || []; sablonlar.reverse(); window.sablonListesi = sablonlar; 
        lists.forEach(list => { list.innerHTML = ""; if (sablonlar.length === 0) { list.innerHTML = `<div class="col-span-full text-center p-5 text-slate-400 font-bold">Kayıtlı şablon bulunamadı.</div>`; } else { sablonlar.forEach(s => { list.innerHTML += `<div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200"><div class="flex justify-between items-center mb-2"><h4 class="font-bold text-slate-800">${s.baslik}</h4><button onclick="window.sablonSil('${s.id}')" class="text-red-400 hover:text-red-600"><i class="fas fa-trash"></i></button></div><p class="text-[10px] text-slate-500 font-bold"><i class="fas fa-check text-teal-500 mr-1"></i>Profesyonel şablon</p></div>`; }); } });
        sels.forEach(sel => {
            let opts = '<option value="">Şablon Seç...</option>'; sablonlar.forEach(s => { opts += `<option value="${s.id}">${s.baslik}</option>`; }); sel.innerHTML = opts; 
            sel.onchange = (e) => {
                const s = window.sablonListesi.find(x => x.id === e.target.value);
                const setV = (boxId, val) => { const el = document.getElementById(boxId); if(el) el.value = val || ""; };
                if(s) { setV('diy-baslik', s.baslik); setV('diy-sabah', s.sabah); setV('diy-ara1', s.ara1); setV('diy-ogle', s.ogle); setV('diy-ara2', s.ara2); setV('diy-aksam', s.aksam); setV('diy-ara3', s.ara3); setV('diy-notlar', s.icerik); }
            };
        });
    } catch(err) {}
}

const frmSablon = document.getElementById('form-yeni-sablon');
if(frmSablon) { frmSablon.onsubmit = async (e) => { e.preventDefault(); const v = (id) => document.getElementById(id).value; const { error } = await supabase.from('sablonlar').insert([{ baslik: v('s-baslik'), sabah: v('s-sabah'), ara1: v('s-ara1'), ogle: v('s-ogle'), ara2: v('s-ara2'), aksam: v('s-aksam'), ara3: v('s-ara3'), icerik: v('s-notlar') }]); if(!error) { frmSablon.reset(); window.closeModal('modal-sablon'); window.showToast('Şablon kaydedildi!'); window.sablonlariGetir(); } }; }

// ================= DİĞER VERİ ÇEKİCİLER (OLCUM/TAHLIL/FİNANS) =================
window.olcumleriGetir = async function(hId) { const tablo = document.getElementById("tablo-olcum-gecmis"); const { data } = await supabase.from('olcumler').select('*').eq('hastaid', hId).order('tarih', { ascending: false }); if(tablo) tablo.innerHTML = ""; if(data && data.length > 0) { const o = data[0]; document.getElementById("dash-kilo").innerText = o.kilo.toFixed(1); document.getElementById("dash-bmi").innerText = o.vki ? o.vki.toFixed(1) : "0.0"; data.forEach((ol) => { tablo.innerHTML += `<tr><td class="p-4">${new Date(ol.tarih).toLocaleDateString('tr-TR')}</td><td class="p-4 text-teal-600 font-black">${ol.kilo}kg</td><td class="p-4 text-slate-500">Y:%${ol.yag||0} / K:%${ol.kas||0}</td><td class="p-4">${ol.bel||'-'}cm / ${ol.kalca||'-'}cm</td><td class="p-4">${ol.vki||'-'}</td><td class="p-4 text-right"><button onclick="window.olcumSil('${ol.id}')" class="text-red-300 hover:text-red-500"><i class="fas fa-trash"></i></button></td></tr>`; }); } }
window.tahlilleriGetir = async function(hId) { const tablo = document.getElementById("tablo-tahliller"); const { data } = await supabase.from('tahliller').select('*').eq('hastaid', hId).order('tarih', { ascending: false }); if(tablo) tablo.innerHTML = ""; if(data) { data.forEach(t => { tablo.innerHTML += `<tr><td class="p-4">${new Date(t.tarih).toLocaleDateString('tr-TR')}</td><td class="p-4 text-red-600 font-bold">${t.b12||'-'} / ${t.d_vitamini||'-'}</td><td class="p-4 font-bold">${t.demir||'-'}</td><td class="p-4">${t.kolesterol||'-'}</td><td class="p-4">${t.aclik_sekeri||'-'}</td><td class="p-4">${t.tsh||'-'}</td><td class="p-4 text-right"><button onclick="window.tahlilSil('${t.id}')" class="text-red-300 hover:text-red-500"><i class="fas fa-trash"></i></button></td></tr>`; }); } }
window.cariHareketleriGetir = async function(hastaId) { const tablo = document.getElementById("tablo-cari-hareketler"); const { data } = await supabase.from('cari_hareketler').select('*').eq('hastaid', hastaId).order('islem_tarihi', { ascending: false }); if(tablo) tablo.innerHTML = ""; let hiz = 0; let ode = 0; if(data) { data.forEach(h => { if(h.tur === 'Hizmet Bedeli') hiz += h.tutar; else ode += h.tutar; const tR = h.tur === 'Hizmet Bedeli' ? "text-orange-600" : "text-emerald-600"; tablo.innerHTML += `<tr class="border-b border-gray-50"><td class="p-4">${new Date(h.islem_tarihi).toLocaleDateString('tr-TR')}</td><td class="p-4 font-black ${tR}">${h.tutar} ₺</td><td class="p-4"><span class="text-xs font-bold uppercase ${tR}">${h.tur}</span></td><td class="p-4 text-slate-500">${h.odeme_yontemi||"-"}</td><td class="p-4 text-right"><button onclick="window.cariSil('${h.id}')" class="text-red-300 hover:text-red-500"><i class="fas fa-trash"></i></button></td></tr>`; }); } document.getElementById("cari-bakiye").innerText = (hiz - ode) + " ₺"; }
window.finanslariGetir = async function() { const tablo = document.getElementById("kasa-tablosu"); const { data } = await supabase.from('cari_hareketler').select('*, danisanlar(ad, soyad)').eq('tur', 'Ödeme').order('islem_tarihi', { ascending: false }); if(tablo) { tablo.innerHTML = ""; let top = 0; if(data) { data.forEach(i => { top += i.tutar; tablo.innerHTML += `<tr class="border-b border-gray-100"><td class="p-4">${new Date(i.islem_tarihi).toLocaleDateString('tr-TR')}</td><td class="p-4 font-bold">${i.danisanlar ? i.danisanlar.ad + " " + i.danisanlar.soyad : "Bilinmiyor"}</td><td class="p-4 font-black text-teal-700">${i.tutar} ₺</td><td class="p-4 text-right"><button onclick="window.cariSil('${i.id}')" class="text-red-300 hover:text-red-500"><i class="fas fa-trash"></i></button></td></tr>`; }); } document.getElementById("stat-kasa").innerText = top + " ₺"; } }

// SİLMELER
window.olcumSil = async function(id) { await supabase.from('olcumler').delete().eq('id', id); window.olcumleriGetir(window.aktifHastaId); }
window.tahlilSil = async function(id) { await supabase.from('tahliller').delete().eq('id', id); window.tahlilleriGetir(window.aktifHastaId); }
window.diyetSil = async function(id) { await supabase.from('diyetler').delete().eq('id', id); window.diyetleriGetir(window.aktifHastaId); }
window.cariSil = async function(id) { await supabase.from('cari_hareketler').delete().eq('id', id); window.cariHareketleriGetir(window.aktifHastaId); window.finanslariGetir(); }
window.randevuSil = async function(id) { await supabase.from('randevular').delete().eq('id', id); window.randevulariGetir(); }
window.sablonSil = async function(id) { await supabase.from('sablonlar').delete().eq('id', id); window.sablonlariGetir(); }

// RANDEVU İŞLEMLERİ
window.randevuIslem = function(id, durum) { let div = document.getElementById('custom-randevu-modal'); if(div) div.remove(); div = document.createElement('div'); div.id = "custom-randevu-modal"; div.className = "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"; div.innerHTML = ` <div class="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl relative transition-all"> <button onclick="document.getElementById('custom-randevu-modal').remove()" class="absolute top-4 right-4 text-slate-400 hover:text-red-500 text-xl"><i class="fas fa-times"></i></button> <h3 class="text-lg font-black mb-2 text-slate-800">Randevu İşlemi</h3> <p class="text-xs font-bold text-slate-500 mb-6 uppercase tracking-wider">Durum: <span class="text-teal-600">${durum}</span></p> <div class="space-y-3"> <button onclick="window.randevuDurumGuncelle('${id}', 'Geldi')" class="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold py-3 rounded-lg">Geldi</button> <button onclick="window.randevuDurumGuncelle('${id}', 'İptal Etti')" class="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 font-bold py-3 rounded-lg">İptal Etti</button> <div class="border-t border-gray-100 my-2 pt-2"></div> <button onclick="window.randevuKalicSil('${id}')" class="w-full flex items-center justify-center gap-2 bg-slate-800 text-white font-bold py-3 rounded-lg">Takvimden Sil</button> </div> </div> `; document.body.appendChild(div); }
window.randevuDurumGuncelle = async function(id, yeniDurum) { document.getElementById('custom-randevu-modal').remove(); await supabase.from('randevular').update({ durum: yeniDurum }).eq('id', id); window.randevulariGetir(); }
window.randevuKalicSil = async function(id) { document.getElementById('custom-randevu-modal').remove(); if(confirm("Silmek istiyor musunuz?")) { await supabase.from('randevular').delete().eq('id', id); window.randevulariGetir(); } }

document.addEventListener('click', (e) => { 
    const btnR = e.target.closest('#nav-randevular'); if(btnR) { setTimeout(() => { if(window.globalCalendar) window.globalCalendar.render(); }, 150); } 
    const btnS = e.target.closest('#nav-sablonlar'); if(btnS) { window.sablonlariGetir(); }
});

// ================= BAŞLATICI MOTOR =================
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.uretProtokol === "function") window.uretProtokol();
    const calendarEl = document.getElementById('calendar');
    if(calendarEl) {
        window.globalCalendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'timeGridWeek', locale: 'tr', height: 600,
            headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
            slotMinTime: "07:00:00", slotMaxTime: "23:00:00", allDaySlot: false, 
            eventClick: function(info) { window.randevuIslem(info.event.extendedProps.dbId, info.event.extendedProps.durum); }
        });
        window.globalCalendar.render(); 
    }
    danisanlariGetir(); kayitFormunuBaslat(); window.finanslariGetir(); window.randevuSelectDoldur(); 
    setTimeout(() => { window.randevulariGetir(); window.sablonlariGetir(); }, 500);
});