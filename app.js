import { supabase } from './db.js';
import { danisanlariGetir, kayitFormunuBaslat } from './modules/danisan.js?v=diyet1';
import { randevulariGetir, randevuFormunuBaslat } from './modules/randevu.js?v=diyet1';

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

window.whatsappMesajAt = function() {
    if(!window.aktifHastaId) return;
    const d = window.danisanListesi.find(x => x.id === window.aktifHastaId);
    if(!d) return;
    let tel = d.telefon;
    if(!tel || tel === "-" || tel === "Belirtilmemiş") { window.showToast("Hastanın kayıtlı telefonu yok!", "error"); return; }
    tel = tel.replace(/\D/g, ''); if(tel.startsWith("0")) tel = "9" + tel; if(!tel.startsWith("90")) tel = "90" + tel;
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(`Merhaba ${d.ad||''} Hanım/Bey,\nDiyetTakibim Kliniğinden iletişime geçiyoruz. Sağlıklı günler dileriz! 🍏`)}`, '_blank');
}

// KLİNİK RAPORU PDF'İ (Eskisi)
window.pdfIndir = async function() {
    if(!window.aktifHastaId) return;
    const d = window.danisanListesi.find(x => x.id === window.aktifHastaId);
    if(!d) return;
    window.showToast('Profesyonel Rapor Hazırlanıyor...', 'success');
    let guncelKilo = "Bilinmiyor"; let guncelVki = "-";
    const { data: olcumler } = await supabase.from('olcumler').select('*').eq('hastaid', d.id).order('tarih', { ascending: false });
    if(olcumler && olcumler.length > 0) { guncelKilo = olcumler[0].kilo + " kg"; guncelVki = olcumler[0].vki || "-"; }
    const yas = d.dogum_tarihi ? (new Date().getFullYear() - new Date(d.dogum_tarihi).getFullYear()) : "-";
    
    const htmlRapor = `
        <div style="padding: 40px 50px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; background: white; width: 100%; box-sizing: border-box;">
            <div style="border-bottom: 3px solid #0f766e; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div><h1 style="color: #0f766e; margin: 0; font-size: 28px; font-weight: 900;">DİYETTAKİBİM</h1><p style="margin: 5px 0 0 0; color: #64748b; font-size: 13px; font-weight: bold; text-transform: uppercase;">Kapsamlı Hasta Analiz Raporu</p></div>
                <div style="text-align: right; color: #64748b; font-size: 12px;"><strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}<br><strong>Protokol:</strong> ${d.protokol_no || '-'}</div>
            </div>
            <h3 style="background-color: #f8fafc; padding: 10px; font-size: 14px; border-left: 4px solid #0f766e;">Kişisel Bilgiler</h3>
            <table style="width: 100%; margin-bottom: 20px; font-size: 13px;"><tr><td style="padding: 5px 0;"><strong>Ad Soyad:</strong> ${d.ad} ${d.soyad}</td><td><strong>Telefon:</strong> ${d.telefon || '-'}</td></tr></table>
            <h3 style="background-color: #fef2f2; color: #b91c1c; padding: 10px; font-size: 14px; border-left: 4px solid #b91c1c;">Tıbbi Geçmiş</h3>
            <table style="width: 100%; font-size: 13px;"><tr><td style="padding: 5px 0;"><strong>Kronik:</strong> ${d.kronik_hastaliklar||'-'}</td><td><strong>Alerji:</strong> ${d.alerjiler||'-'}</td></tr></table>
        </div>
    `;
    const opt = { margin: 10, filename: `${d.ad}_Klinik_Raporu.pdf`, image: { type: 'jpeg', quality: 1 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
    html2pdf().set(opt).from(htmlRapor).save().then(() => window.showToast('Rapor indirildi!', 'success'));
}

// ================= YENİ: ÖZEL DİYET PDF İNDİRME MOTORU =================
window.diyetPdfIndir = async function(diyetId) {
    window.showToast('Diyet PDF formatına çevriliyor...', 'success');
    const { data: dData } = await supabase.from('diyetler').select('*').eq('id', diyetId).single();
    if(!dData) return;
    
    const d = window.danisanListesi.find(x => x.id === dData.hastaid);
    const adSoyad = d ? `${d.ad} ${d.soyad}` : "Danışan";

    // Öğünleri kontrol edip boşsa HTML'e hiç eklemeyen akıllı şablon
    const ogunHtml = (baslik, renk, icerik) => {
        if(!icerik || icerik.trim() === "") return "";
        return `
        <div style="background: #f8fafc; padding: 15px; margin-bottom: 15px; border-left: 5px solid ${renk}; border-radius: 4px;">
            <h4 style="margin: 0 0 8px 0; color: ${renk}; font-size: 15px;">${baslik}</h4>
            <div style="font-size: 13px; line-height: 1.6; color: #334155;">${icerik.replace(/\n/g, '<br>')}</div>
        </div>`;
    };

    const htmlDiyet = `
        <div style="padding: 40px 50px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: white; width: 100%; box-sizing: border-box;">
            
            <div style="text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="color: #0f766e; margin: 0 0 10px 0; font-size: 26px; font-weight: 900;">DİYETTAKİBİM KLİNİĞİ</h1>
                <h2 style="margin: 0; color: #334155; font-size: 18px;">${dData.baslik}</h2>
                <p style="margin: 10px 0 0 0; color: #64748b; font-size: 12px;"><strong>Danışan:</strong> ${adSoyad} &nbsp;|&nbsp; <strong>Tarih:</strong> ${new Date(dData.kayitzamani).toLocaleDateString('tr-TR')}</p>
            </div>

            ${ogunHtml('SABAH', '#d97706', dData.sabah)}
            ${ogunHtml('1. ARA ÖĞÜN', '#059669', dData.ara1)}
            ${ogunHtml('ÖĞLE YEMEĞİ', '#2563eb', dData.ogle)}
            ${ogunHtml('2. ARA ÖĞÜN', '#059669', dData.ara2)}
            ${ogunHtml('AKŞAM YEMEĞİ', '#4f46e5', dData.aksam)}
            ${ogunHtml('3. ARA ÖĞÜN (GECE)', '#059669', dData.ara3)}
            
            ${dData.icerik ? `
            <div style="margin-top: 30px; padding: 15px; border: 1px dashed #ef4444; background: #fef2f2; border-radius: 8px;">
                <h4 style="margin: 0 0 5px 0; color: #b91c1c; font-size: 13px;">UZMAN NOTU & UYARILAR</h4>
                <div style="font-size: 12px; color: #7f1d1d;">${dData.icerik.replace(/\n/g, '<br>')}</div>
            </div>` : ''}

            <div style="margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8;">
                Bu beslenme programı tamamen size özel olarak hazırlanmıştır.<br>
                Sağlıklı ve mutlu günler dileriz! 🍏
            </div>
        </div>
    `;

    const opt = {
        margin: 10, filename: `Diyet_Listesi_${adSoyad}.pdf`, image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(htmlDiyet).save().then(() => window.showToast('Diyet PDF başarıyla indirildi!', 'success'));
}

// ================= DİYET ÇEKME VE KARTA BASMA MOTORU (GÜNCELLENDİ) =================
window.diyetleriGetir = async function(hId) {
    const list = document.getElementById("tablo-diyetler");
    const { data } = await supabase.from('diyetler').select('*').eq('hastaid', hId).order('kayitzamani', { ascending: false });
    if(list) list.innerHTML = "";
    if(data) { 
        data.forEach(d => { 
            // Sadece dolu olan öğünleri kartta gösterelim ki kart çok uzamasın
            let ozet = "";
            if(d.sabah) ozet += `<span class="text-amber-600 font-bold">Sabah:</span> ${d.sabah.substring(0, 30)}...<br>`;
            if(d.ogle) ozet += `<span class="text-blue-600 font-bold">Öğle:</span> ${d.ogle.substring(0, 30)}...<br>`;
            if(d.aksam) ozet += `<span class="text-indigo-600 font-bold">Akşam:</span> ${d.aksam.substring(0, 30)}...`;

            list.innerHTML += `
            <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                <div>
                    <div class="flex justify-between items-start mb-3 border-b border-gray-100 pb-2">
                        <h4 class="font-black text-slate-800 text-sm">${d.baslik}</h4>
                        <div class="flex gap-2">
                            <button onclick="window.diyetPdfIndir('${d.id}')" class="text-teal-600 hover:text-teal-800 bg-teal-50 px-2 py-1 rounded text-xs font-bold transition" title="PDF İndir"><i class="fas fa-download"></i></button>
                            <button onclick="window.diyetSil('${d.id}')" class="text-red-400 hover:text-red-600 bg-red-50 px-2 py-1 rounded text-xs transition" title="Sil"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="text-[11px] text-slate-600 leading-relaxed mb-3">${ozet || '<i>(Detaylar PDF içindedir)</i>'}</div>
                </div>
                <div class="text-[9px] font-bold text-slate-400 mt-2 border-t border-gray-50 pt-2"><i class="far fa-clock mr-1"></i>${new Date(d.kayitzamani).toLocaleDateString('tr-TR')}</div>
            </div>`; 
        }); 
    }
}

// ================= DİYET VE ŞABLON KAYDETME MOTORLARI (GÜNCELLENDİ) =================
const frmDiyet = document.getElementById('form-yeni-diyet');
if(frmDiyet) {
    frmDiyet.onsubmit = async (e) => {
        e.preventDefault();
        const v = (id) => document.getElementById(id).value;
        const { error } = await supabase.from('diyetler').insert([{ 
            hastaid: window.aktifHastaId, baslik: v('diy-baslik'), 
            sabah: v('diy-sabah'), ara1: v('diy-ara1'), ogle: v('diy-ogle'), 
            ara2: v('diy-ara2'), aksam: v('diy-aksam'), ara3: v('diy-ara3'), 
            icerik: v('diy-notlar') 
        }]);
        if(!error) { frmDiyet.reset(); window.closeModal('modal-diyet'); window.showToast('Profesyonel diyet eklendi!'); window.diyetleriGetir(window.aktifHastaId); }
    };
}

const frmSablon = document.getElementById('form-yeni-sablon');
if(frmSablon) {
    frmSablon.onsubmit = async (e) => {
        e.preventDefault();
        const v = (id) => document.getElementById(id).value;
        const { error } = await supabase.from('sablonlar').insert([{ 
            baslik: v('s-baslik'), sabah: v('s-sabah'), ara1: v('s-ara1'), 
            ogle: v('s-ogle'), ara2: v('s-ara2'), aksam: v('s-aksam'), 
            ara3: v('s-ara3'), icerik: v('s-notlar') 
        }]);
        if(!error) { frmSablon.reset(); window.closeModal('modal-sablon'); window.showToast('Şablon kaydedildi!'); window.sablonlariGetir(); }
    };
}

// Şablon Seçildiğinde Kutuları Dolduran Yapay Zeka (Güncellendi)
window.sablonlariGetir = async function() { 
    const list = document.getElementById('sablon-listesi'); 
    const sel = document.getElementById('diy-sablon-secici'); 
    const { data } = await supabase.from('sablonlar').select('*').order('kayitzamani', { ascending: false }); 
    window.sablonListesi = data || []; 
    
    if(list) { 
        list.innerHTML = ""; 
        data.forEach(s => { 
            list.innerHTML += `<div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200"><div class="flex justify-between items-center mb-2"><h4 class="font-bold text-slate-800">${s.baslik}</h4><button onclick="window.sablonSil('${s.id}')" class="text-red-400 hover:text-red-600"><i class="fas fa-trash"></i></button></div><p class="text-[10px] text-slate-500 font-bold"><i class="fas fa-check text-teal-500 mr-1"></i>Öğünlere ayrılmış profesyonel şablon</p></div>`; 
        }); 
    } 
    
    if(sel) { 
        let opts = '<option value="">Şablon Kullanma, Kendim Yazacağım</option>'; 
        data.forEach(s => { opts += `<option value="${s.id}">${s.baslik}</option>`; }); 
        sel.innerHTML = opts; 
        
        sel.addEventListener('change', (e) => {
            const id = e.target.value;
            const s = window.sablonListesi.find(x => x.id === id);
            const setV = (boxId, val) => { const el = document.getElementById(boxId); if(el) el.value = val || ""; };
            if(s) {
                setV('diy-baslik', s.baslik); setV('diy-sabah', s.sabah); setV('diy-ara1', s.ara1);
                setV('diy-ogle', s.ogle); setV('diy-ara2', s.ara2); setV('diy-aksam', s.aksam);
                setV('diy-ara3', s.ara3); setV('diy-notlar', s.icerik);
            } else {
                setV('diy-baslik',''); setV('diy-sabah',''); setV('diy-ara1',''); setV('diy-ogle','');
                setV('diy-ara2',''); setV('diy-aksam',''); setV('diy-ara3',''); setV('diy-notlar','');
            }
        });
    } 
}

// ================= DİĞER VERİ ÇEKİCİLER =================
window.olcumleriGetir = async function(hId) { const tablo = document.getElementById("tablo-olcum-gecmis"); const { data } = await supabase.from('olcumler').select('*').eq('hastaid', hId).order('tarih', { ascending: false }); if(tablo) tablo.innerHTML = ""; if(data && data.length > 0) { const o = data[0]; document.getElementById("dash-kilo").innerText = o.kilo.toFixed(1); document.getElementById("dash-bmi").innerText = o.vki ? o.vki.toFixed(1) : "0.0"; document.getElementById("dash-kas").innerText = o.kas ? o.kas.toFixed(1) : "0.0"; document.getElementById("dash-yag").innerText = o.yag ? o.yag.toFixed(1) : "0.0"; data.forEach((ol) => { tablo.innerHTML += `<tr><td class="p-4">${new Date(ol.tarih).toLocaleDateString('tr-TR')}</td><td class="p-4 text-teal-600 font-black">${ol.kilo}kg / BMI:${ol.vki||'-'}</td><td class="p-4 text-slate-500">Y:%${ol.yag||0} / K:%${ol.kas||0}</td><td class="p-4">${ol.bel||'-'}cm / ${ol.kalca||'-'}cm</td><td class="p-4">${ol.gogus||'-'}cm / ${ol.boyun||'-'}cm</td><td class="p-4 text-right"><button onclick="window.olcumSil('${ol.id}')" class="text-red-300 hover:text-red-500"><i class="fas fa-trash"></i></button></td></tr>`; }); } }
window.tahlilleriGetir = async function(hId) { const tablo = document.getElementById("tablo-tahliller"); const { data } = await supabase.from('tahliller').select('*').eq('hastaid', hId).order('tarih', { ascending: false }); if(tablo) tablo.innerHTML = ""; if(data) { data.forEach(t => { tablo.innerHTML += `<tr><td class="p-4">${new Date(t.tarih).toLocaleDateString('tr-TR')}</td><td class="p-4 text-red-600 font-bold">${t.b12||'-'} / ${t.d_vitamini||'-'}</td><td class="p-4 font-bold">${t.demir||'-'}</td><td class="p-4">${t.kolesterol||'-'}</td><td class="p-4">${t.aclik_sekeri||'-'}</td><td class="p-4">${t.tsh||'-'}</td><td class="p-4 text-right"><button onclick="window.tahlilSil('${t.id}')" class="text-red-300 hover:text-red-500"><i class="fas fa-trash"></i></button></td></tr>`; }); } }
window.cariHareketleriGetir = async function(hastaId) { const tablo = document.getElementById("tablo-cari-hareketler"); const { data } = await supabase.from('cari_hareketler').select('*').eq('hastaid', hastaId).order('islem_tarihi', { ascending: false }); if(tablo) tablo.innerHTML = ""; let hizmet = 0; let odeme = 0; if(data) { data.forEach(h => { if(h.tur === 'Hizmet Bedeli') hizmet += h.tutar; else if(h.tur === 'Ödeme') odeme += h.tutar; const tRnk = h.tur === 'Hizmet Bedeli' ? "text-orange-600" : "text-emerald-600"; tablo.innerHTML += `<tr class="border-b border-gray-50"><td class="p-4">${new Date(h.islem_tarihi).toLocaleDateString('tr-TR')}</td><td class="p-4 font-black ${tRnk}">${h.tutar} ₺</td><td class="p-4"><span class="text-xs font-bold uppercase ${tRnk}">${h.tur}</span></td><td class="p-4 text-slate-500">${h.odeme_yontemi||"-"}</td><td class="p-4 text-right"><button onclick="window.cariSil('${h.id}')" class="text-red-300 hover:text-red-500"><i class="fas fa-trash"></i></button></td></tr>`; }); } document.getElementById("cari-bakiye").innerText = (hizmet - odeme) + " ₺"; document.getElementById("cari-toplam-hizmet").innerText = hizmet + " ₺"; document.getElementById("cari-toplam-odeme").innerText = odeme + " ₺"; }
window.finanslariGetir = async function() { const tablo = document.getElementById("kasa-tablosu"); const stat = document.getElementById("stat-kasa"); const { data } = await supabase.from('cari_hareketler').select('*, danisanlar(ad, soyad)').eq('tur', 'Ödeme').order('islem_tarihi', { ascending: false }); tablo.innerHTML = ""; let top = 0; if(data) { data.forEach(i => { top += i.tutar; const hAd = i.danisanlar ? (i.danisanlar.ad + " " + i.danisanlar.soyad) : "Bilinmiyor"; tablo.innerHTML += `<tr class="border-b border-gray-100"><td class="p-4">${new Date(i.islem_tarihi).toLocaleDateString('tr-TR')}</td><td class="p-4 font-bold">${hAd}</td><td class="p-4 font-black text-teal-700">${i.tutar} ₺</td><td class="p-4 text-right"><button onclick="window.cariSil('${i.id}')" class="text-red-300 hover:text-red-500"><i class="fas fa-trash"></i></button></td></tr>`; }); } stat.innerText = top + " ₺"; }

window.olcumSil = async function(id) { await supabase.from('olcumler').delete().eq('id', id); window.showToast('Ölçüm silindi', 'success'); window.olcumleriGetir(window.aktifHastaId); }
window.tahlilSil = async function(id) { await supabase.from('tahliller').delete().eq('id', id); window.showToast('Tahlil silindi', 'success'); window.tahlilleriGetir(window.aktifHastaId); }
window.diyetSil = async function(id) { await supabase.from('diyetler').delete().eq('id', id); window.showToast('Diyet silindi', 'success'); window.diyetleriGetir(window.aktifHastaId); }
window.cariSil = async function(id) { await supabase.from('cari_hareketler').delete().eq('id', id); window.showToast('Kayıt silindi', 'success'); window.cariHareketleriGetir(window.aktifHastaId); window.finanslariGetir(); }
window.sablonSil = async function(id) { await supabase.from('sablonlar').delete().eq('id', id); window.showToast('Şablon silindi', 'success'); window.sablonlariGetir(); }

window.randevuIslem = function(id, durum) { let div = document.getElementById('custom-randevu-modal'); if(div) div.remove(); div = document.createElement('div'); div.id = "custom-randevu-modal"; div.className = "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"; div.innerHTML = ` <div class="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl relative transition-all"> <button onclick="document.getElementById('custom-randevu-modal').remove()" class="absolute top-4 right-4 text-slate-400 hover:text-red-500 text-xl"><i class="fas fa-times"></i></button> <h3 class="text-lg font-black mb-2 text-slate-800">Randevu İşlemi</h3> <p class="text-xs font-bold text-slate-500 mb-6 uppercase tracking-wider">Şu anki durum: <span class="text-teal-600">${durum}</span></p> <div class="space-y-3"> <button onclick="window.randevuDurumGuncelle('${id}', 'Geldi')" class="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold py-3 rounded-lg hover:bg-emerald-100 transition"><i class="fas fa-check-circle"></i> Danışan Geldi</button> <button onclick="window.randevuDurumGuncelle('${id}', 'İptal Etti')" class="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 font-bold py-3 rounded-lg hover:bg-red-100 transition"><i class="fas fa-times-circle"></i> İptal Etti / Gelmedi</button> <div class="border-t border-gray-100 my-2 pt-2"></div> <button onclick="window.randevuKalicSil('${id}')" class="w-full flex items-center justify-center gap-2 bg-slate-800 text-white font-bold py-3 rounded-lg shadow-md hover:bg-slate-900 transition"><i class="fas fa-trash"></i> Takvimden Tamamen Sil</button> </div> </div> `; document.body.appendChild(div); }
window.randevuDurumGuncelle = async function(id, yeniDurum) { document.getElementById('custom-randevu-modal').remove(); const { error } = await supabase.from('randevular').update({ durum: yeniDurum }).eq('id', id); if(!error) { window.showToast(`Randevu '${yeniDurum}' olarak işaretlendi!`, 'success'); window.randevulariGetir(); } }
window.randevuKalicSil = async function(id) { document.getElementById('custom-randevu-modal').remove(); if(confirm("Kalıcı olarak silmek istediğinize emin misiniz?")) { await supabase.from('randevular').delete().eq('id', id); window.showToast('Randevu silindi', 'success'); window.randevulariGetir(); } }

document.addEventListener('click', (e) => { const btn = e.target.closest('#nav-randevular'); if(btn) { setTimeout(() => { if(window.globalCalendar) window.globalCalendar.render(); }, 150); } });

// ================= SİSTEMİ BAŞLAT =================
document.addEventListener('DOMContentLoaded', () => {
    console.log("DiyetTakibim Modüler Sistem Devrede!");
    if (typeof window.uretProtokol === "function") window.uretProtokol();
    
    const calendarEl = document.getElementById('calendar');
    if(calendarEl) {
        window.globalCalendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'timeGridWeek', locale: 'tr', height: 600,
            headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
            slotMinTime: "08:00:00", slotMaxTime: "20:00:00", allDaySlot: false, 
            eventClick: function(info) { window.randevuIslem(info.event.extendedProps.dbId, info.event.extendedProps.durum); }
        });
        window.globalCalendar.render(); 
    }
    
    danisanlariGetir(); kayitFormunuBaslat();
    window.randevulariGetir(); sablonlariGetir(); finanslariGetir();
});