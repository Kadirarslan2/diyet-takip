import { supabase } from './db.js';
import { danisanlariGetir, kayitFormunuBaslat } from './modules/danisan.js?v=pdfson';
import { randevulariGetir, randevuFormunuBaslat } from './modules/randevu.js?v=pdfson';

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

// ================= WHATSAPP =================
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
    const uzman = d.uzman_ad || "Dyt. Beyza";
    const mesaj = encodeURIComponent(`Merhaba ${ad} Hanım/Bey,\nDiyetTakibim Kliniğinden, ${uzman} adına iletişime geçiyoruz. Sağlıklı günler dileriz! 🍏`);
    
    window.open(`https://wa.me/${tel}?text=${mesaj}`, '_blank');
}

// ================= 1. KLİNİK RAPORU PDF MOTORU (BEYAZ SAYFA KESİN ÇÖZÜM) =================
window.pdfIndir = async function() {
    if(!window.aktifHastaId) return;
    const d = window.danisanListesi.find(x => x.id === window.aktifHastaId);
    if(!d) return;

    window.showToast('Profesyonel Klinik Raporu Hazırlanıyor...', 'success');

    let guncelKilo = "Bilinmiyor";
    let guncelVki = "-";
    const { data: olcumler } = await supabase.from('olcumler').select('*').eq('hastaid', d.id).order('tarih', { ascending: false });
    if(olcumler && olcumler.length > 0) {
        guncelKilo = olcumler[0].kilo + " kg";
        guncelVki = olcumler[0].vki || "-";
    }

    const yas = d.dogum_tarihi ? (new Date().getFullYear() - new Date(d.dogum_tarihi).getFullYear()) : "-";
    const islemTarihi = new Date().toLocaleDateString('tr-TR') + " " + new Date().toLocaleTimeString('tr-TR');
    const uzman = d.uzman_ad || "Dyt. Beyza";

    const htmlRapor = `
        <div style="padding: 40px 50px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; background: white; width: 800px; box-sizing: border-box;">
            <div style="border-bottom: 3px solid #0f766e; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <h1 style="color: #0f766e; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">DİYETTAKİBİM KLİNİĞİ</h1>
                    <p style="margin: 5px 0 0 0; color: #64748b; font-size: 13px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">Kapsamlı Hasta Analiz Raporu</p>
                </div>
                <div style="text-align: right; color: #64748b; font-size: 12px;">
                    <strong>Tarih:</strong> ${islemTarihi}<br>
                    <strong>Uzman:</strong> ${uzman}<br>
                    <strong>Protokol:</strong> ${d.protokol_no || '-'}
                </div>
            </div>
            
            <h3 style="background-color: #f8fafc; color: #334155; padding: 10px 15px; font-size: 14px; margin-bottom: 15px; border-left: 4px solid #0f766e; font-weight: bold;">Kişisel Bilgiler</h3>
            <table style="width: 100%; margin-bottom: 30px; font-size: 13px; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; width: 50%;"><strong>Ad Soyad:</strong> ${d.ad} ${d.soyad}</td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; width: 50%;"><strong>TC / Uyruk:</strong> ${d.kimlik_no || '-'} / ${d.uyruk || '-'}</td></tr>
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Telefon:</strong> ${d.telefon || '-'}</td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Cinsiyet / Yaş:</strong> ${d.cinsiyet || '-'} / ${yas}</td></tr>
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Kan Grubu:</strong> ${d.kan_grubu || '-'}</td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Meslek:</strong> ${d.meslek || '-'}</td></tr>
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
                <tr><td style="border: 1px solid #e2e8f0; padding: 10px; font-weight: bold; width: 25%; background: #f8fafc;">Boy</td><td style="border: 1px solid #e2e8f0; padding: 10px; width: 25%;">${d.boy || '-'} cm</td><td style="border: 1px solid #e2e8f0; padding: 10px; font-weight: bold; width: 25%; background: #f8fafc;">Güncel Kilo</td><td style="border: 1px solid #e2e8f0; padding: 10px; width: 25%; color: #0f766e; font-weight: bold;">${guncelKilo}</td></tr>
                <tr><td style="border: 1px solid #e2e8f0; padding: 10px; font-weight: bold; background: #f8fafc;">Hedef Kilo</td><td style="border: 1px solid #e2e8f0; padding: 10px;">${d.hedef_kilo || '-'} kg</td><td style="border: 1px solid #e2e8f0; padding: 10px; font-weight: bold; background: #f8fafc;">Güncel BMI</td><td style="border: 1px solid #e2e8f0; padding: 10px;">${guncelVki}</td></tr>
                <tr><td style="border: 1px solid #e2e8f0; padding: 10px; font-weight: bold; background: #f8fafc;">Su Tüketimi</td><td style="border: 1px solid #e2e8f0; padding: 10px;">${d.su_tuketimi || '-'} Litre</td><td style="border: 1px solid #e2e8f0; padding: 10px; font-weight: bold; background: #f8fafc;">Fiziksel Aktivite</td><td style="border: 1px solid #e2e8f0; padding: 10px;">${d.fiziksel_aktivite || '-'}</td></tr>
                <tr><td style="border: 1px solid #e2e8f0; padding: 10px; font-weight: bold; background: #f8fafc;">Uyku/Bağırsak</td><td style="border: 1px solid #e2e8f0; padding: 10px;" colspan="3">${d.uyku_duzeni || '-'} / ${d.bagirsak_duzeni || '-'}</td></tr>
            </table>

            <h3 style="background-color: #fffbeb; color: #b45309; padding: 10px 15px; font-size: 14px; margin-bottom: 15px; border-left: 4px solid #f59e0b; font-weight: bold;">Uzman Notları</h3>
            <div style="border: 1px solid #e2e8f0; background: #f8fafc; padding: 15px; font-size: 13px; line-height: 1.6; min-height: 80px; border-radius: 4px;">${d.notlar || 'Herhangi bir özel not eklenmemiştir.'}</div>
            
            <div style="margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px;">Bu rapor profesyonel takip ve bilgilendirme amaçlıdır.<br><strong>DiyetTakibim Yönetim Sistemi</strong> tarafından oluşturulmuştur.</div>
        </div>
    `;

    // ÇÖZÜM: Ekranın fotoğrafı çekilebilsin diye sağ tarafa, görünmez alana saklıyoruz. 
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlRapor;
    tempDiv.style.position = 'fixed';
    tempDiv.style.top = '0';
    tempDiv.style.left = '100vw'; // Ekranın sağına atıldı, scroll yapmaz ama DOM'da vardır
    tempDiv.style.width = '800px';
    document.body.appendChild(tempDiv);

    const opt = {
        margin: 10, filename: `${d.ad}_${d.soyad}_Klinik_Raporu.pdf`, image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(tempDiv).save().then(() => {
        window.showToast('Profesyonel Klinik Raporu başarıyla indirildi!', 'success');
        document.body.removeChild(tempDiv); // İndirme bitince çöpü temizle
    }).catch(err => {
        console.error("PDF Hatası:", err);
        window.showToast('PDF oluşturulurken hata meydana geldi.', 'error');
        document.body.removeChild(tempDiv);
    });
}

// ================= 2. EFSANEVİ VE DETAYLI DİYET LİSTESİ PDF MOTORU =================
window.diyetPdfIndir = async function(diyetId) {
    window.showToast('Profesyonel Diyet Listesi Hazırlanıyor...', 'success');
    const { data: dData } = await supabase.from('diyetler').select('*').eq('id', diyetId).single();
    if(!dData) return;
    
    const d = window.danisanListesi.find(x => x.id === dData.hastaid);
    const adSoyad = d ? `${d.ad} ${d.soyad}` : "Danışan";
    const uzman = d ? (d.uzman_ad || "Dyt. Beyza") : "Dyt. Beyza";

    // Güncel ölçümleri alıp diyet PDF'ine koyalım
    let gKilo = "-", gBoy = d ? (d.boy || "-") : "-", gVki = "-";
    const { data: olcumler } = await supabase.from('olcumler').select('*').eq('hastaid', dData.hastaid).order('tarih', { ascending: false });
    if(olcumler && olcumler.length > 0) {
        gKilo = olcumler[0].kilo + " kg";
        gVki = olcumler[0].vki || "-";
    }

    const islemTarihi = new Date(dData.kayitzamani).toLocaleDateString('tr-TR');

    // Dolu olmayan öğünleri gizleyen zeki tasarım motoru
    const ogunHtml = (baslik, renk, icerik, icon) => {
        if(!icerik || icerik.trim() === "") return "";
        return `
        <div style="background: #f8fafc; padding: 15px; margin-bottom: 12px; border-left: 5px solid ${renk}; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <h4 style="margin: 0 0 8px 0; color: ${renk}; font-size: 15px; font-weight: 800; text-transform: uppercase; display: flex; align-items: center;">
                <span style="font-size: 18px; margin-right: 8px;">${icon}</span> ${baslik}
            </h4>
            <div style="font-size: 13px; line-height: 1.6; color: #334155; font-weight: 500;">${icerik.replace(/\n/g, '<br>')}</div>
        </div>`;
    };

    const htmlDiyet = `
        <div style="padding: 40px 50px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: white; width: 800px; box-sizing: border-box;">

            <div style="text-align: center; border-bottom: 3px solid #0f766e; padding-bottom: 20px; margin-bottom: 20px;">
                <h1 style="color: #0f766e; margin: 0 0 5px 0; font-size: 32px; font-weight: 900; letter-spacing: 1px;">DİYETTAKİBİM KLİNİĞİ</h1>
                <p style="margin: 0; color: #64748b; font-size: 14px; font-weight: bold; letter-spacing: 2px;">KİŞİYE ÖZEL BESLENME PROGRAMI</p>
            </div>

            <div style="display: flex; justify-content: space-between; background: #f1f5f9; padding: 15px 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
                <div style="width: 50%;">
                    <table style="width: 100%; font-size: 13px; color: #334155;">
                        <tr><td style="padding: 3px 0;"><strong>Danışan:</strong></td><td>${adSoyad}</td></tr>
                        <tr><td style="padding: 3px 0;"><strong>Güncel Kilo / Boy:</strong></td><td>${gKilo} / ${gBoy} cm</td></tr>
                        <tr><td style="padding: 3px 0;"><strong>Vücut Kitle İndeksi:</strong></td><td>${gVki}</td></tr>
                    </table>
                </div>
                <div style="width: 50%; border-left: 2px dashed #cbd5e1; padding-left: 20px;">
                    <table style="width: 100%; font-size: 13px; color: #334155;">
                        <tr><td style="padding: 3px 0;"><strong>Uzman Diyetisyen:</strong></td><td style="color: #0f766e; font-weight: bold;">${uzman}</td></tr>
                        <tr><td style="padding: 3px 0;"><strong>Program Adı:</strong></td><td>${dData.baslik}</td></tr>
                        <tr><td style="padding: 3px 0;"><strong>Düzenlenme Tarihi:</strong></td><td>${islemTarihi}</td></tr>
                    </table>
                </div>
            </div>

            ${ogunHtml('Sabah (Kahvaltı)', '#d97706', dData.sabah, '☀️')}
            ${ogunHtml('1. Ara Öğün', '#059669', dData.ara1, '🍎')}
            ${ogunHtml('Öğle Yemeği', '#2563eb', dData.ogle, '🍲')}
            ${ogunHtml('2. Ara Öğün', '#059669', dData.ara2, '🥗')}
            ${ogunHtml('Akşam Yemeği', '#4f46e5', dData.aksam, '🌙')}
            ${ogunHtml('3. Ara Öğün (Gece)', '#059669', dData.ara3, '🥛')}

            ${dData.icerik ? `
            <div style="margin-top: 30px; padding: 20px; border: 2px solid #ef4444; background: #fef2f2; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0; color: #b91c1c; font-size: 15px; font-weight: 900; display: flex; align-items: center;"><span style="font-size: 20px; margin-right: 8px;">⚠️</span> DİYETİSYENİN ÖZEL NOTLARI VE UYARILARI</h4>
                <div style="font-size: 13px; color: #7f1d1d; line-height: 1.6; font-weight: bold;">${dData.icerik.replace(/\n/g, '<br>')}</div>
            </div>` : ''}

            <div style="margin-top: 40px; text-align: center; border-top: 2px solid #e2e8f0; padding-top: 20px;">
                <p style="margin: 0; font-size: 12px; color: #0f766e; font-weight: bold;">Sağlıklı ve Mutlu Günler Dileriz!</p>
                <p style="margin: 5px 0 0 0; font-size: 11px; color: #94a3b8;">Bu rapor DiyetTakibim Profesyonel Yönetim Sistemi üzerinden oluşturulmuştur.</p>
            </div>
        </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlDiyet;
    tempDiv.style.position = 'fixed';
    tempDiv.style.top = '0';
    tempDiv.style.left = '100vw'; // Görüş alanının dışında durur, html2canvas bunu yakalar!
    tempDiv.style.width = '800px';
    document.body.appendChild(tempDiv);

    const opt = {
        margin: 10, filename: `Diyet_Programi_${d.ad}.pdf`, image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(tempDiv).save().then(() => {
        window.showToast('Detaylı Diyet PDF başarıyla indirildi!', 'success');
        document.body.removeChild(tempDiv);
    }).catch(err => {
        console.error("PDF Hatası:", err);
        window.showToast('PDF oluşturulurken hata meydana geldi.', 'error');
        document.body.removeChild(tempDiv);
    });
}

// ================= DİYET ÇEKME VE KARTA BASMA MOTORU =================
window.diyetleriGetir = async function(hId) {
    const list = document.getElementById("tablo-diyetler");
    const { data } = await supabase.from('diyetler').select('*').eq('hastaid', hId).order('kayitzamani', { ascending: false });
    if(list) list.innerHTML = "";
    if(data) { 
        data.forEach(d => { 
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
                            <button onclick="window.diyetPdfIndir('${d.id}')" class="text-teal-600 hover:text-teal-800 bg-teal-50 px-2 py-1 rounded text-xs font-bold transition shadow-sm border border-teal-100" title="Özel Diyet PDF İndir"><i class="fas fa-file-pdf mr-1"></i>PDF</button>
                            <button onclick="window.diyetSil('${d.id}')" class="text-red-400 hover:text-red-600 bg-red-50 px-2 py-1 rounded text-xs transition border border-red-100" title="Sil"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="text-[11px] text-slate-600 leading-relaxed mb-3">${ozet || '<i>(Detaylar PDF içindedir)</i>'}</div>
                </div>
                <div class="text-[9px] font-bold text-slate-400 mt-2 border-t border-gray-50 pt-2"><i class="far fa-clock mr-1"></i>${new Date(d.kayitzamani).toLocaleDateString('tr-TR')}</div>
            </div>`; 
        }); 
    }
}

// ================= DİYET VE ŞABLON KAYDETME MOTORLARI =================
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

// ================= DİĞER VERİ ÇEKİCİLER VE SİLMELER =================
window.olcumleriGetir = async function(hId) { const tablo = document.getElementById("tablo-olcum-gecmis"); const { data } = await supabase.from('olcumler').select('*').eq('hastaid', hId).order('tarih', { ascending: false }); if(tablo) tablo.innerHTML = ""; if(data && data.length > 0) { const o = data[0]; document.getElementById("dash-kilo").innerText = o.kilo.toFixed(1); document.getElementById("dash-bmi").innerText = o.vki ? o.vki.toFixed(1) : "0.0"; document.getElementById("dash-kas").innerText = o.kas ? o.kas.toFixed(1) : "0.0"; document.getElementById("dash-yag").innerText = o.yag ? o.yag.toFixed(1) : "0.0"; data.forEach((ol) => { tablo.innerHTML += `<tr><td class="p-4">${new Date(ol.tarih).toLocaleDateString('tr-TR')}</td><td class="p-4 text-teal-600 font-black">${ol.kilo}kg / BMI:${ol.vki||'-'}</td><td class="p-4 text-slate-500">Y:%${ol.yag||0} / K:%${ol.kas||0}</td><td class="p-4">${ol.bel||'-'}cm / ${ol.kalca||'-'}cm</td><td class="p-4">${ol.gogus||'-'}cm / ${ol.boyun||'-'}cm</td><td class="p-4 text-right"><button onclick="window.olcumSil('${ol.id}')" class="text-red-300 hover:text-red-500"><i class="fas fa-trash"></i></button></td></tr>`; }); } }
window.tahlilleriGetir = async function(hId) { const tablo = document.getElementById("tablo-tahliller"); const { data } = await supabase.from('tahliller').select('*').eq('hastaid', hId).order('tarih', { ascending: false }); if(tablo) tablo.innerHTML = ""; if(data) { data.forEach(t => { tablo.innerHTML += `<tr><td class="p-4">${new Date(t.tarih).toLocaleDateString('tr-TR')}</td><td class="p-4 text-red-600 font-bold">${t.b12||'-'} / ${t.d_vitamini||'-'}</td><td class="p-4 font-bold">${t.demir||'-'}</td><td class="p-4">${t.kolesterol||'-'}</td><td class="p-4">${t.aclik_sekeri||'-'}</td><td class="p-4">${t.tsh||'-'}</td><td class="p-4 text-right"><button onclick="window.tahlilSil('${t.id}')" class="text-red-300 hover:text-red-500"><i class="fas fa-trash"></i></button></td></tr>`; }); } }
window.cariHareketleriGetir = async function(hastaId) { const tablo = document.getElementById("tablo-cari-hareketler"); const { data } = await supabase.from('cari_hareketler').select('*').eq('hastaid', hastaId).order('islem_tarihi', { ascending: false }); if(tablo) tablo.innerHTML = ""; let hizmet = 0; let odeme = 0; if(data) { data.forEach(h => { if(h.tur === 'Hizmet Bedeli') hizmet += h.tutar; else if(h.tur === 'Ödeme') odeme += h.tutar; const tRnk = h.tur === 'Hizmet Bedeli' ? "text-orange-600" : "text-emerald-600"; tablo.innerHTML += `<tr class="border-b border-gray-50"><td class="p-4">${new Date(h.islem_tarihi).toLocaleDateString('tr-TR')}</td><td class="p-4 font-black ${tRnk}">${h.tutar} ₺</td><td class="p-4"><span class="text-xs font-bold uppercase ${tRnk}">${h.tur}</span></td><td class="p-4 text-slate-500">${h.odeme_yontemi||"-"}</td><td class="p-4 text-right"><button onclick="window.cariSil('${h.id}')" class="text-red-300 hover:text-red-500"><i class="fas fa-trash"></i></button></td></tr>`; }); } const bBakiye = document.getElementById("cari-bakiye"); if(bBakiye) bBakiye.innerText = (hizmet - odeme) + " ₺"; const bHizmet = document.getElementById("cari-toplam-hizmet"); if(bHizmet) bHizmet.innerText = hizmet + " ₺"; const bOdeme = document.getElementById("cari-toplam-odeme"); if(bOdeme) bOdeme.innerText = odeme + " ₺"; }
window.finanslariGetir = async function() { const tablo = document.getElementById("kasa-tablosu"); const stat = document.getElementById("stat-kasa"); const { data } = await supabase.from('cari_hareketler').select('*, danisanlar(ad, soyad)').eq('tur', 'Ödeme').order('islem_tarihi', { ascending: false }); tablo.innerHTML = ""; let top = 0; if(data) { data.forEach(i => { top += i.tutar; const hAd = i.danisanlar ? (i.danisanlar.ad + " " + i.danisanlar.soyad) : "Bilinmiyor"; tablo.innerHTML += `<tr class="border-b border-gray-100"><td class="p-4">${new Date(i.islem_tarihi).toLocaleDateString('tr-TR')}</td><td class="p-4 font-bold">${hAd}</td><td class="p-4 font-black text-teal-700">${i.tutar} ₺</td><td class="p-4 text-right"><button onclick="window.cariSil('${i.id}')" class="text-red-300 hover:text-red-500"><i class="fas fa-trash"></i></button></td></tr>`; }); } stat.innerText = top + " ₺"; }

window.olcumSil = async function(id) { await supabase.from('olcumler').delete().eq('id', id); window.showToast('Ölçüm silindi', 'success'); window.olcumleriGetir(window.aktifHastaId); }
window.tahlilSil = async function(id) { await supabase.from('tahliller').delete().eq('id', id); window.showToast('Tahlil silindi', 'success'); window.tahlilleriGetir(window.aktifHastaId); }
window.diyetSil = async function(id) { await supabase.from('diyetler').delete().eq('id', id); window.showToast('Diyet silindi', 'success'); window.diyetleriGetir(window.aktifHastaId); }
window.cariSil = async function(id) { await supabase.from('cari_hareketler').delete().eq('id', id); window.showToast('Kayıt silindi', 'success'); window.cariHareketleriGetir(window.aktifHastaId); window.finanslariGetir(); }
window.randevuSil = async function(id) { await supabase.from('randevular').delete().eq('id', id); window.showToast('Randevu silindi', 'success'); window.randevulariGetir(); }
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