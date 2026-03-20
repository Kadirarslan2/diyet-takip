import { supabase } from './db.js';
// CACHE KIRICI - Tarayıcıyı yeni kodları okumaya zorlar
import { danisanlariGetir, kayitFormunuBaslat } from './modules/danisan.js?v=kirilmaz3';
import { randevulariGetir, randevuFormunuBaslat } from './modules/randevu.js?v=kirilmaz3';

// ================= ÇELİK TOAST (BİLDİRİM) MOTORU =================
window.showToast = function(mesaj, tip = 'success') {
    let container = document.getElementById('toast-container');
    if(!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    
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

// ================= YENİ WHATSAPP VE MUHTEŞEM PDF MOTORLARI =================

window.whatsappMesajAt = function() {
    if(!window.aktifHastaId) return;
    const d = window.danisanListesi.find(x => x.id === window.aktifHastaId);
    if(!d) return;

    let tel = d.telefon;
    if(!tel || tel === "-" || tel === "Belirtilmemiş") {
        window.showToast("Hastanın kayıtlı bir telefonu yok!", "error"); return;
    }

    tel = tel.replace(/\D/g, ''); 
    if(tel.startsWith("0")) tel = "9" + tel;
    if(!tel.startsWith("90")) tel = "90" + tel;

    const ad = d.ad || "Danışan";
    const mesaj = encodeURIComponent(`Merhaba ${ad} Hanım/Bey,\nDiyetTakibim Kliniğinden iletişime geçiyoruz. Sağlıklı günler dileriz! 🍏`);
    
    window.open(`https://wa.me/${tel}?text=${mesaj}`, '_blank');
}

// BEYAZ SAYFA HATASI ÇÖZÜLDÜ (Doğrudan Enjeksiyon Yöntemi)
window.pdfIndir = async function() {
    if(!window.aktifHastaId) return;
    const d = window.danisanListesi.find(x => x.id === window.aktifHastaId);
    if(!d) return;

    window.showToast('Profesyonel Rapor Hazırlanıyor...', 'success');

    // Hastanın en güncel kilosunu çekiyoruz
    let guncelKilo = "Bilinmiyor";
    let guncelVki = "-";
    const { data: olcumler } = await supabase.from('olcumler').select('*').eq('hastaid', d.id).order('tarih', { ascending: false });
    if(olcumler && olcumler.length > 0) {
        guncelKilo = olcumler[0].kilo + " kg";
        guncelVki = olcumler[0].vki || "-";
    }

    const yas = d.dogum_tarihi ? (new Date().getFullYear() - new Date(d.dogum_tarihi).getFullYear()) : "-";
    const islemTarihi = new Date().toLocaleDateString('tr-TR') + " " + new Date().toLocaleTimeString('tr-TR');

    // MUAZZAM A4 KLİNİK RAPORU (HTML string olarak PDF motoruna beslenecek)
    const htmlRapor = `
        <div style="padding: 40px 50px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; background: white; width: 100%; box-sizing: border-box;">
            
            <div style="border-bottom: 3px solid #0f766e; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <h1 style="color: #0f766e; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">DİYETTAKİBİM</h1>
                    <p style="margin: 5px 0 0 0; color: #64748b; font-size: 13px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">Kapsamlı Hasta Analiz Raporu</p>
                </div>
                <div style="text-align: right; color: #64748b; font-size: 12px;">
                    <strong>Tarih:</strong> ${islemTarihi}<br>
                    <strong>Protokol:</strong> ${d.protokol_no || '-'}
                </div>
            </div>
            
            <h3 style="background-color: #f8fafc; color: #334155; padding: 10px 15px; font-size: 14px; margin-bottom: 15px; border-left: 4px solid #0f766e; font-weight: bold;">Kişisel Bilgiler</h3>
            <table style="width: 100%; margin-bottom: 30px; font-size: 13px; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; width: 50%;"><strong>Ad Soyad:</strong> ${d.ad} ${d.soyad}</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; width: 50%;"><strong>TC / Uyruk:</strong> ${d.kimlik_no || '-'} / ${d.uyruk || '-'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Telefon:</strong> ${d.telefon || '-'}</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Cinsiyet / Yaş:</strong> ${d.cinsiyet || '-'} / ${yas}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Kan Grubu:</strong> ${d.kan_grubu || '-'}</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Meslek:</strong> ${d.meslek || '-'}</td>
                </tr>
            </table>

            <h3 style="background-color: #fef2f2; color: #b91c1c; padding: 10px 15px; font-size: 14px; margin-bottom: 15px; border-left: 4px solid #b91c1c; font-weight: bold;">Tıbbi Geçmiş ve Risk Analizi</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px;">
                <tr><td style="border: 1px solid #e2e8f0; padding: 10px; font-weight: bold; width: 35%; background: #f8fafc;">Kronik Hastalıklar</td><td style="border: 1px solid #e2e8f0; padding: 10px;">${d.kronik_hastaliklar || '-'}</td></tr>
                <tr><td style="border: 1px solid #e2e8f0; padding: 10px; font-weight: bold; background: #f8fafc;">Alerjiler</td><td style="border: 1px solid #e2e8f0; padding: 10px;">${d.alerjiler || '-'}</td></tr>
                <tr><td style="border: 1px solid #e2e8f0; padding: 10px; font-weight: bold; background: #f8fafc;">Sürekli İlaçlar</td><td style="border: 1px solid #e2e8f0; padding: 10px;">${d.surekli_ilaclar || '-'}</td></tr>
                <tr><td style="border: 1px solid #e2e8f0; padding: 10px; font-weight: bold; background: #f8fafc;">Geçirilen Operasyonlar</td><td style="border: 1px solid #e2e8f0; padding: 10px;">${d.gecirilen_operasyonlar || '-'}</td></tr>
            </table>

            <h3 style="background-color: #f0fdfa; color: #0f766e; padding: 10px 15px; font-size: 14px; margin-bottom: 15px; border-left: 4px solid #14b8a6; font-weight: bold;">Fiziksel Durum ve Yaşam Tarzı</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px;">
                <tr>
                    <td style="border: 1px solid #e2e8f0; padding: 10px; font-weight: bold; width: 25%; background: #f8fafc;">Boy</td><td style="border: 1px solid #e2e8f0; padding: 10px; width: 25%;">${d.boy || '-'} cm</td>
                    <td style="border: 1px solid #e2e8f0; padding: 10px; font-weight: bold; width: 25%; background: #f8fafc;">Güncel Kilo</td><td style="border: 1px solid #e2e8f0; padding: 10px; width: 25%; color: #0f766e; font-weight: bold;">${guncelKilo}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #e2e8f0; padding: 10px; font-weight: bold; background: #f8fafc;">Hedef Kilo</td><td style="border: 1px solid #e2e8f0; padding: 10px;">${d.hedef_kilo || '-'} kg</td>
                    <td style="border: 1px solid #e2e8f0; padding: 10px; font-weight: bold; background: #f8fafc;">Güncel BMI</td><td style="border: 1px solid #e2e8f0; padding: 10px;">${guncelVki}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #e2e8f0; padding: 10px; font-weight: bold; background: #f8fafc;">Su Tüketimi</td><td style="border: 1px solid #e2e8f0; padding: 10px;">${d.su_tuketimi || '-'} Litre</td>
                    <td style="border: 1px solid #e2e8f0; padding: 10px; font-weight: bold; background: #f8fafc;">Fiziksel Aktivite</td><td style="border: 1px solid #e2e8f0; padding: 10px;">${d.fiziksel_aktivite || '-'}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #e2e8f0; padding: 10px; font-weight: bold; background: #f8fafc;">Uyku Düzeni</td><td style="border: 1px solid #e2e8f0; padding: 10px;">${d.uyku_duzeni || '-'}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 10px; font-weight: bold; background: #f8fafc;">Bağırsak Düzeni</td><td style="border: 1px solid #e2e8f0; padding: 10px;">${d.bagirsak_duzeni || '-'}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #e2e8f0; padding: 10px; font-weight: bold; background: #f8fafc;">Sigara/Alkol</td><td style="border: 1px solid #e2e8f0; padding: 10px;" colspan="3">${d.sigara_alkol || '-'}</td>
                </tr>
            </table>

            <h3 style="background-color: #fffbeb; color: #b45309; padding: 10px 15px; font-size: 14px; margin-bottom: 15px; border-left: 4px solid #f59e0b; font-weight: bold;">Uzman Notları</h3>
            <div style="border: 1px solid #e2e8f0; background: #f8fafc; padding: 15px; font-size: 13px; line-height: 1.6; min-height: 80px; border-radius: 4px;">
                ${d.notlar || 'Herhangi bir özel not eklenmemiştir.'}
            </div>
            
            <div style="margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                Bu rapor profesyonel takip ve bilgilendirme amaçlıdır.<br>
                <strong>DiyetTakibim Yönetim Sistemi</strong> tarafından oluşturulmuştur.
            </div>
        </div>
    `;

    const opt = {
        margin:       10,
        filename:     `${d.ad}_${d.soyad}_Klinik_Raporu.pdf`,
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Ekranda olmayan metni doğrudan motora enjekte ediyoruz
    html2pdf().set(opt).from(htmlRapor).save().then(() => {
        window.showToast('Profesyonel Hasta Raporu başarıyla indirildi!', 'success');
    });
}

// ================= PROFİL ALT SEKMELERİ =================
window.olcumleriGetir = async function(hId) {
    const tablo = document.getElementById("tablo-olcum-gecmis");
    const { data } = await supabase.from('olcumler').select('*').eq('hastaid', hId).order('tarih', { ascending: false });
    if(tablo) tablo.innerHTML = "";
    if(data && data.length > 0) { 
        const o = data[0]; 
        document.getElementById("dash-kilo").innerText = o.kilo.toFixed(1); 
        document.getElementById("dash-bmi").innerText = o.vki ? o.vki.toFixed(1) : "0.0"; 
        document.getElementById("dash-kas").innerText = o.kas ? o.kas.toFixed(1) : "0.0"; 
        document.getElementById("dash-yag").innerText = o.yag ? o.yag.toFixed(1) : "0.0"; 
        data.forEach((ol) => { tablo.innerHTML += `<tr><td class="p-4">${new Date(ol.tarih).toLocaleDateString('tr-TR')}</td><td class="p-4 text-teal-600 font-black">${ol.kilo}kg / BMI:${ol.vki||'-'}</td><td class="p-4 text-slate-500">Y:%${ol.yag||0} / K:%${ol.kas||0}</td><td class="p-4">${ol.bel||'-'}cm / ${ol.kalca||'-'}cm</td><td class="p-4">${ol.gogus||'-'}cm / ${ol.boyun||'-'}cm</td><td class="p-4 text-right"><button onclick="window.olcumSil('${ol.id}')" class="text-red-300 hover:text-red-500"><i class="fas fa-trash"></i></button></td></tr>`; });
    } else { 
        document.getElementById("dash-kilo").innerText = "0.0"; document.getElementById("dash-bmi").innerText = "0.0"; document.getElementById("dash-kas").innerText = "0.0"; document.getElementById("dash-yag").innerText = "0.0"; 
    }
}
window.tahlilleriGetir = async function(hId) {
    const tablo = document.getElementById("tablo-tahliller");
    const { data } = await supabase.from('tahliller').select('*').eq('hastaid', hId).order('tarih', { ascending: false });
    if(tablo) tablo.innerHTML = "";
    if(data) { data.forEach(t => { tablo.innerHTML += `<tr><td class="p-4">${new Date(t.tarih).toLocaleDateString('tr-TR')}</td><td class="p-4 text-red-600 font-bold">${t.b12||'-'} / ${t.d_vitamini||'-'}</td><td class="p-4 font-bold">${t.demir||'-'}</td><td class="p-4">${t.kolesterol||'-'}</td><td class="p-4">${t.aclik_sekeri||'-'}</td><td class="p-4">${t.tsh||'-'}</td><td class="p-4 text-right"><button onclick="window.tahlilSil('${t.id}')" class="text-red-300 hover:text-red-500"><i class="fas fa-trash"></i></button></td></tr>`; }); }
}
window.diyetleriGetir = async function(hId) {
    const list = document.getElementById("tablo-diyetler");
    const { data } = await supabase.from('diyetler').select('*').eq('hastaid', hId).order('kayitzamani', { ascending: false });
    if(list) list.innerHTML = "";
    if(data) { data.forEach(d => { list.innerHTML += `<div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200"><div class="flex justify-between items-start mb-3 border-b border-gray-100 pb-2"><h4 class="font-bold text-slate-800">${d.baslik}</h4><button onclick="window.diyetSil('${d.id}')" class="text-red-400 hover:text-red-600"><i class="fas fa-trash"></i></button></div><p class="text-xs text-slate-600 leading-relaxed">${d.icerik.replace(/\n/g, '<br>')}</p></div>`; }); }
}
window.cariHareketleriGetir = async function(hastaId) {
    const tablo = document.getElementById("tablo-cari-hareketler");
    const { data } = await supabase.from('cari_hareketler').select('*').eq('hastaid', hastaId).order('islem_tarihi', { ascending: false });
    if(tablo) tablo.innerHTML = ""; let hizmet = 0; let odeme = 0;
    if(data) {
        data.forEach(h => {
            if(h.tur === 'Hizmet Bedeli') hizmet += h.tutar; else if(h.tur === 'Ödeme') odeme += h.tutar;
            const tRnk = h.tur === 'Hizmet Bedeli' ? "text-orange-600" : "text-emerald-600";
            tablo.innerHTML += `<tr class="border-b border-gray-50"><td class="p-4">${new Date(h.islem_tarihi).toLocaleDateString('tr-TR')}</td><td class="p-4 font-black ${tRnk}">${h.tutar} ₺</td><td class="p-4"><span class="text-xs font-bold uppercase ${tRnk}">${h.tur}</span></td><td class="p-4 text-slate-500">${h.odeme_yontemi||"-"}</td><td class="p-4 text-right"><button onclick="window.cariSil('${h.id}')" class="text-red-300 hover:text-red-500"><i class="fas fa-trash"></i></button></td></tr>`;
        });
    }
    const bBakiye = document.getElementById("cari-bakiye"); if(bBakiye) bBakiye.innerText = (hizmet - odeme) + " ₺";
    const bHizmet = document.getElementById("cari-toplam-hizmet"); if(bHizmet) bHizmet.innerText = hizmet + " ₺";
    const bOdeme = document.getElementById("cari-toplam-odeme"); if(bOdeme) bOdeme.innerText = odeme + " ₺";
}

window.sablonlariGetir = async function() { const list = document.getElementById('sablon-listesi'); const sel = document.getElementById('diy-sablon-secici'); const { data } = await supabase.from('sablonlar').select('*').order('kayitzamani', { ascending: false }); window.sablonListesi = data || []; if(list) { list.innerHTML = ""; data.forEach(s => { list.innerHTML += `<div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200"><div class="flex justify-between items-center mb-2"><h4 class="font-bold text-slate-800">${s.baslik}</h4><button onclick="window.sablonSil('${s.id}')" class="text-red-400 hover:text-red-600"><i class="fas fa-trash"></i></button></div><p class="text-xs text-slate-500 line-clamp-3">${s.icerik}</p></div>`; }); } if(sel) { let opts = '<option value="">Şablon Yok</option>'; data.forEach(s => { opts += `<option value="${s.id}">${s.baslik}</option>`; }); sel.innerHTML = opts; } }
window.finanslariGetir = async function() { const tablo = document.getElementById("kasa-tablosu"); const stat = document.getElementById("stat-kasa"); const { data } = await supabase.from('cari_hareketler').select('*, danisanlar(ad, soyad)').eq('tur', 'Ödeme').order('islem_tarihi', { ascending: false }); tablo.innerHTML = ""; let top = 0; if(data) { data.forEach(i => { top += i.tutar; const hAd = i.danisanlar ? (i.danisanlar.ad + " " + i.danisanlar.soyad) : "Bilinmiyor"; tablo.innerHTML += `<tr class="border-b border-gray-100"><td class="p-4">${new Date(i.islem_tarihi).toLocaleDateString('tr-TR')}</td><td class="p-4 font-bold">${hAd}</td><td class="p-4 font-black text-teal-700">${i.tutar} ₺</td><td class="p-4 text-right"><button onclick="window.cariSil('${i.id}')" class="text-red-300 hover:text-red-500"><i class="fas fa-trash"></i></button></td></tr>`; }); } stat.innerText = top + " ₺"; }

window.olcumSil = async function(id) { await supabase.from('olcumler').delete().eq('id', id); window.showToast('Ölçüm silindi', 'success'); window.olcumleriGetir(window.aktifHastaId); }
window.tahlilSil = async function(id) { await supabase.from('tahliller').delete().eq('id', id); window.showToast('Tahlil silindi', 'success'); window.tahlilleriGetir(window.aktifHastaId); }
window.diyetSil = async function(id) { await supabase.from('diyetler').delete().eq('id', id); window.showToast('Diyet silindi', 'success'); window.diyetleriGetir(window.aktifHastaId); }
window.cariSil = async function(id) { await supabase.from('cari_hareketler').delete().eq('id', id); window.showToast('Kayıt silindi', 'success'); window.cariHareketleriGetir(window.aktifHastaId); window.finanslariGetir(); }
window.randevuSil = async function(id) { await supabase.from('randevular').delete().eq('id', id); window.showToast('Randevu silindi', 'success'); window.randevulariGetir(); }
window.sablonSil = async function(id) { await supabase.from('sablonlar').delete().eq('id', id); window.showToast('Şablon silindi', 'success'); window.sablonlariGetir(); }

// ================= TAKVİM UYANDIRICI (ÇÖKME HATASI ÇÖZÜMÜ) =================
document.addEventListener('click', (e) => {
    // Eğer Randevular menüsüne tıklandıysa...
    const btn = e.target.closest('#nav-randevular');
    if(btn) {
        // Sayfanın açılması için çok kısa bir süre bekle ve takvimi uyar
        setTimeout(() => {
            if(window.globalCalendar) {
                window.globalCalendar.render(); // Takvime "boyutunu toparla" diyoruz
            }
        }, 150); 
    }
});

// ================= SİSTEMİ BAŞLAT =================
document.addEventListener('DOMContentLoaded', () => {
    console.log("DiyetTakibim Modüler Sistem Devrede!");
    
    if (typeof window.uretProtokol === "function") window.uretProtokol();
    
    // TAKVİM MOTORU KURULUMU
    const calendarEl = document.getElementById('calendar');
    if(calendarEl) {
        window.globalCalendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'timeGridWeek', 
            locale: 'tr', 
            height: 600,
            headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
            slotMinTime: "08:00:00", slotMaxTime: "20:00:00",
            eventClick: function(info) { window.randevuSil(info.event.extendedProps.dbId); }
        });
        window.globalCalendar.render(); // İlk render
    }
    
    danisanlariGetir();
    kayitFormunuBaslat();
    randevulariGetir();
    randevuFormunuBaslat();
    sablonlariGetir();
    finanslariGetir();
});