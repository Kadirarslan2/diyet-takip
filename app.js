import { supabase } from './db.js';
import { danisanlariGetir, kayitFormunuBaslat } from './modules/danisan.js?v=tamSurum1';
import { randevuFormunuBaslat } from './modules/randevu.js?v=tamSurum1';
import { initAuth } from './modules/auth.js?v=tamSurum1'; // GÜVENLİK DOSYASINI BURADAN ÇEKİYORUZ!
import { initDashboard } from './modules/dashboard.js?v=kadirDashboard1';
// ================= BİLDİRİM MOTORU =================
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
    toast.className = `fixed bottom-6 right-6 z-[9999] flex items-center gap-3 ${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl font-bold transition-all duration-300`;
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${mesaj}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
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
    if(!tel || tel === "-" || tel === "Belirtilmemiş") { 
        window.showToast("Hastanın kayıtlı telefonu yok!", "error"); 
        return; 
    }
    tel = tel.replace(/\D/g, ''); 
    if(tel.startsWith("0")) tel = "9" + tel; 
    if(!tel.startsWith("90")) tel = "90" + tel;
    const ad = d.ad || "Danışan"; 
    const uzman = d.uzman_ad || "Dyt. Beyza";
    const mesaj = encodeURIComponent(`Merhaba ${ad} Hanım/Bey,\nDiyetTakibim Kliniğinden, ${uzman} adına iletişime geçiyoruz. Sağlıklı günler dileriz! 🍏`);
    window.open(`https://wa.me/${tel}?text=${mesaj}`, '_blank');
};

// ================= KADİR'İN MANUEL PDF MOTORU (DOKUNULMADI) =================
const pdfOlusturVeIndir = (htmlIcerik, dosyaAdi) => {
    let modal = document.getElementById('pdf-manuel-modal');
    if(modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'pdf-manuel-modal';
    modal.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:#e2e8f0; z-index:999999; overflow-y:auto; display:flex; flex-direction:column;";

    const topBar = document.createElement('div');
    topBar.className = "print-gizle"; 
    topBar.style.cssText = "position:sticky; top:0; background:#0f766e; padding:15px 20px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 4px 6px rgba(0,0,0,0.1); z-index:10;";
    
    topBar.innerHTML = `
        <div style="color:white; font-weight:bold; font-size:16px;"><i class="fas fa-file-pdf mr-2"></i>PDF Önizleme Ekranı</div>
        <div style="display:flex; gap:10px;">
            <button id="btn-kapat" style="background:#ef4444; color:white; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">İptal Et</button>
            <button id="btn-indir" style="background:#ffffff; color:#0f766e; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer;"><i class="fas fa-print mr-1"></i> Yazdır / İndir</button>
        </div>
    `;

    const a4Kagit = document.createElement('div');
    a4Kagit.id = 'a4-kagit';
    a4Kagit.style.cssText = "background:white; width:100%; max-width:800px; margin:20px auto; padding:40px; box-shadow:0 10px 25px rgba(0,0,0,0.2); border-radius:8px; box-sizing:border-box;";
    a4Kagit.innerHTML = htmlIcerik;

    modal.appendChild(topBar);
    modal.appendChild(a4Kagit);
    document.body.appendChild(modal);

    document.getElementById('btn-kapat').onclick = () => modal.remove();
    
    document.getElementById('btn-indir').onclick = () => {
        const printStyle = document.createElement('style');
        printStyle.innerHTML = `
            @media print {
                body > *:not(#pdf-manuel-modal) { display: none !important; }
                #pdf-manuel-modal { position: absolute !important; top: 0 !important; left: 0 !important; background: white !important; overflow: visible !important; height: auto !important; width: 100% !important; padding: 0 !important; }
                .print-gizle { display: none !important; }
                #a4-kagit { box-shadow: none !important; margin: 0 !important; padding: 0 !important; max-width: 100% !important; border-radius: 0 !important; }
                @page { margin: 10mm; size: A4; }
            }
        `;
        document.head.appendChild(printStyle);
        const oldTitle = document.title;
        document.title = dosyaAdi; 
        
        window.print(); 
        
        document.title = oldTitle;
        setTimeout(() => printStyle.remove(), 1000);
    };
};
// ================= KLİNİK RAPORU PDF =================
window.pdfIndir = async function() {
    if(!window.aktifHastaId) return;
    const d = window.danisanListesi.find(x => x.id === window.aktifHastaId);
    if(!d) return;

    let olcumHtml = "";
    const { data: olcumler } = await supabase.from('olcumler').select('*').eq('hastaid', d.id).order('tarih', { ascending: false });
    if(olcumler && olcumler.length > 0) {
        olcumler.forEach(o => { 
            olcumHtml += `<tr><td style="border: 1px solid #e2e8f0; padding: 8px;">${new Date(o.tarih).toLocaleDateString('tr-TR')}</td><td style="border: 1px solid #e2e8f0; padding: 8px; font-weight:bold; color:#0f766e;">${o.kilo} kg</td><td style="border: 1px solid #e2e8f0; padding: 8px;">%${o.yag||0} / %${o.kas||0}</td><td style="border: 1px solid #e2e8f0; padding: 8px;">${o.bel||'-'} / ${o.kalca||'-'}</td><td style="border: 1px solid #e2e8f0; padding: 8px;">${o.vki||'-'}</td></tr>`; 
        });
    } else { 
        olcumHtml = `<tr><td colspan="5" style="border: 1px solid #e2e8f0; padding: 10px; text-align: center; color: #94a3b8;">Kayıtlı ölçüm bulunmamaktadır.</td></tr>`; 
    }

    let tahlilHtml = "";
    const { data: tahliller } = await supabase.from('tahliller').select('*').eq('hastaid', d.id).order('tarih', { ascending: false });
    if(tahliller && tahliller.length > 0) {
        tahliller.forEach(t => { 
            tahlilHtml += `<tr><td style="border: 1px solid #e2e8f0; padding: 8px;">${new Date(t.tarih).toLocaleDateString('tr-TR')}</td><td style="border: 1px solid #e2e8f0; padding: 8px; color:#b91c1c; font-weight:bold;">${t.b12||'-'} / ${t.d_vitamini||'-'}</td><td style="border: 1px solid #e2e8f0; padding: 8px;">${t.demir||'-'}</td><td style="border: 1px solid #e2e8f0; padding: 8px;">${t.kolesterol||'-'}</td><td style="border: 1px solid #e2e8f0; padding: 8px;">${t.aclik_sekeri||'-'}</td><td style="border: 1px solid #e2e8f0; padding: 8px;">${t.tsh||'-'}</td></tr>`; 
        });
    } else { 
        tahlilHtml = `<tr><td colspan="6" style="border: 1px solid #e2e8f0; padding: 10px; text-align: center; color: #94a3b8;">Kayıtlı kan tahlili bulunmamaktadır.</td></tr>`; 
    }

    const yas = d.dogum_tarihi ? (new Date().getFullYear() - new Date(d.dogum_tarihi).getFullYear()) : "-";
    const islemTarihi = new Date().toLocaleDateString('tr-TR'); 
    const uzman = d.uzman_ad || "Dyt. Beyza";

    const htmlRapor = `
        <div style="padding: 40px 50px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; width: 100%; box-sizing: border-box;">
            <div style="border-bottom: 3px solid #0f766e; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <h1 style="color: #0f766e; margin: 0; font-size: 28px; font-weight: 900;">DİYETTAKİBİM KLİNİĞİ</h1>
                    <p style="margin: 5px 0 0 0; color: #64748b; font-size: 13px; font-weight: bold; text-transform: uppercase;">Kapsamlı Hasta Analiz Raporu</p>
                </div>
                <div style="text-align: right; color: #64748b; font-size: 12px;">
                    <strong>Tarih:</strong> ${islemTarihi}<br>
                    <strong>Uzman:</strong> ${uzman}<br>
                    <strong>Protokol:</strong> ${d.protokol_no || '-'}
                </div>
            </div>
            
            <h3 style="background-color: #f8fafc; color: #334155; padding: 10px 15px; font-size: 14px; margin-bottom: 15px; border-left: 4px solid #0f766e; font-weight: bold;">Kişisel ve Tıbbi Bilgiler</h3>
            <table style="width: 100%; margin-bottom: 30px; font-size: 13px; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; width: 50%;"><strong>Ad Soyad:</strong> ${d.ad} ${d.soyad}</td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; width: 50%;"><strong>Cinsiyet / Yaş:</strong> ${d.cinsiyet || '-'} / ${yas}</td></tr>
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Kronik Hastalıklar:</strong> <span style="color:#b91c1c">${d.kronik_hastaliklar || '-'}</span></td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Alerjiler:</strong> <span style="color:#b91c1c">${d.alerjiler || '-'}</span></td></tr>
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Sürekli İlaçlar:</strong> ${d.surekli_ilaclar || '-'}</td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Geçirilen Operasyonlar:</strong> ${d.gecirilen_operasyonlar || '-'}</td></tr>
            </table>

            <h3 style="background-color: #f0fdfa; color: #0f766e; padding: 10px 15px; font-size: 14px; margin-bottom: 15px; border-left: 4px solid #14b8a6; font-weight: bold;">Geçmiş Mezura ve Tartı Ölçümleri</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; text-align: left;">
                <thead style="background-color: #f8fafc; color: #475569;"><tr><th style="border: 1px solid #e2e8f0; padding: 8px;">Tarih</th><th style="border: 1px solid #e2e8f0; padding: 8px;">Kilo</th><th style="border: 1px solid #e2e8f0; padding: 8px;">Yağ / Kas (%)</th><th style="border: 1px solid #e2e8f0; padding: 8px;">Bel / Kalça (cm)</th><th style="border: 1px solid #e2e8f0; padding: 8px;">BMI</th></tr></thead>
                <tbody>${olcumHtml}</tbody>
            </table>

            <h3 style="background-color: #fef2f2; color: #b91c1c; padding: 10px 15px; font-size: 14px; margin-bottom: 15px; border-left: 4px solid #b91c1c; font-weight: bold;">Laboratuvar ve Kan Tahlili Sonuçları</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; text-align: left;">
                <thead style="background-color: #f8fafc; color: #475569;"><tr><th style="border: 1px solid #e2e8f0; padding: 8px;">Tarih</th><th style="border: 1px solid #e2e8f0; padding: 8px;">B12 / D-Vit</th><th style="border: 1px solid #e2e8f0; padding: 8px;">Demir</th><th style="border: 1px solid #e2e8f0; padding: 8px;">Kolesterol</th><th style="border: 1px solid #e2e8f0; padding: 8px;">Açlık Şekeri</th><th style="border: 1px solid #e2e8f0; padding: 8px;">TSH</th></tr></thead>
                <tbody>${tahlilHtml}</tbody>
            </table>

            <div style="margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                Bu rapor profesyonel takip amaçlıdır. DiyetTakibim Yönetim Sistemi tarafından oluşturulmuştur.
            </div>
        </div>
    `;

    pdfOlusturVeIndir(htmlRapor, `${d.ad}_Klinik_Raporu`);
};

// ================= DİYET LİSTESİ PDF =================
window.diyetPdfIndir = async function(diyetId) {
    const { data: dData } = await supabase.from('diyetler').select('*').eq('id', diyetId).single();
    if(!dData) return;
    
    const d = window.danisanListesi.find(x => x.id === dData.hastaid);
    const adSoyad = d ? `${d.ad} ${d.soyad}` : "Danışan";
    const uzman = d ? (d.uzman_ad || "Dyt. Beyza") : "Dyt. Beyza";

    let gKilo = "-", gBoy = d ? (d.boy || "-") : "-", gVki = "-";
    const { data: olcumler } = await supabase.from('olcumler').select('*').eq('hastaid', dData.hastaid).order('tarih', { ascending: false });
    if(olcumler && olcumler.length > 0) {
        gKilo = olcumler[0].kilo + " kg";
        gVki = olcumler[0].vki || "-";
    }

    const islemTarihi = new Date(dData.kayitzamani).toLocaleDateString('tr-TR');

    const ogunHtml = (baslik, renk, icerik, icon) => { 
        if(!icerik || icerik.trim() === "") return ""; 
        return `
        <div style="background: #f8fafc; padding: 15px; margin-bottom: 15px; border-left: 5px solid ${renk}; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <h4 style="margin: 0 0 8px 0; color: ${renk}; font-size: 16px; font-weight: 800; text-transform: uppercase;">
                ${icon} ${baslik}
            </h4>
            <div style="font-size: 14px; line-height: 1.6; color: #334155;">${icerik.replace(/\n/g, '<br>')}</div>
        </div>`; 
    };

    const htmlDiyet = `
        <div style="padding: 40px 50px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: white; width: 100%; box-sizing: border-box;">
            <div style="text-align: center; border-bottom: 3px solid #0f766e; padding-bottom: 20px; margin-bottom: 25px;">
                <h1 style="color: #0f766e; margin: 0 0 5px 0; font-size: 32px; font-weight: 900; letter-spacing: 1px;">DİYETTAKİBİM KLİNİĞİ</h1>
                <p style="margin: 0; color: #64748b; font-size: 15px; font-weight: bold; letter-spacing: 2px;">KİŞİYE ÖZEL BESLENME PROGRAMI</p>
            </div>
            
            <div style="display: flex; justify-content: space-between; background: #f1f5f9; padding: 15px 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
                <div style="width: 50%;">
                    <table style="width: 100%; font-size: 14px; color: #334155; border:none;">
                        <tr><td style="padding: 3px 0; border:none;"><strong>Danışan:</strong></td><td style="border:none;">${adSoyad}</td></tr>
                        <tr><td style="padding: 3px 0; border:none;"><strong>Güncel Kilo/Boy:</strong></td><td style="border:none;">${gKilo} / ${gBoy} cm</td></tr>
                        <tr><td style="padding: 3px 0; border:none;"><strong>Vücut Kitle İndeksi:</strong></td><td style="border:none;">${gVki}</td></tr>
                    </table>
                </div>
                <div style="width: 50%; border-left: 2px dashed #cbd5e1; padding-left: 20px;">
                    <table style="width: 100%; font-size: 14px; color: #334155; border:none;">
                        <tr><td style="padding: 3px 0; border:none;"><strong>Uzman Diyetisyen:</strong></td><td style="color: #0f766e; font-weight: bold; border:none;">${uzman}</td></tr>
                        <tr><td style="padding: 3px 0; border:none;"><strong>Program Adı:</strong></td><td style="border:none;">${dData.baslik}</td></tr>
                        <tr><td style="padding: 3px 0; border:none;"><strong>Düzenlenme Tarihi:</strong></td><td style="border:none;">${islemTarihi}</td></tr>
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
                <h4 style="margin: 0 0 10px 0; color: #b91c1c; font-size: 16px; font-weight: 900;">⚠️ DİYETİSYENİN ÖZEL NOTLARI</h4>
                <div style="font-size: 14px; color: #7f1d1d; line-height: 1.6; font-weight: bold;">${dData.icerik.replace(/\n/g, '<br>')}</div>
            </div>` : ''}
            
            <div style="margin-top: 40px; text-align: center; border-top: 2px solid #e2e8f0; padding-top: 20px;">
                <p style="margin: 0; font-size: 13px; color: #0f766e; font-weight: bold;">Sağlıklı ve Mutlu Günler Dileriz!</p>
                <p style="margin: 5px 0 0 0; font-size: 11px; color: #94a3b8;">Bu rapor DiyetTakibim Profesyonel Yönetim Sistemi üzerinden oluşturulmuştur.</p>
            </div>
        </div>`;

    pdfOlusturVeIndir(htmlDiyet, `Diyet_Programi_${d.ad}`);
};

// ================= TAKVİM MOTORU (AYLIK VE GÜNE TIKLAMA) =================
window.randevulariGetir = async function() {
    const { data } = await supabase.from('randevular').select('*');
    window.tamRandevular = data || []; 
    
    if(document.getElementById("stat-randevular")) {
        document.getElementById("stat-randevular").innerText = data ? data.length : 0;
    }
    
    if(window.globalCalendar) {
        window.globalCalendar.removeAllEvents();
        data?.forEach(r => {
            let rRenk = "#3b82f6"; 
            if(r.tip === "Kontrol Seansı") rRenk = "#f97316"; 
            if(r.durum === "Geldi") rRenk = "#10b981"; 
            if(r.durum === "İptal Etti") rRenk = "#ef4444"; 

            window.globalCalendar.addEvent({ 
                title: `${r.saat || ''} ${r.hastaad}`, 
                start: r.tarih, 
                allDay: true, 
                color: rRenk,
                extendedProps: { dbId: r.id, durum: r.durum || 'Bekliyor' }
            });
        });
    }
};

window.gunlukRandevulariGoster = function(tarihStr) {
    if(!window.tamRandevular) return;
    const oGun = window.tamRandevular.filter(r => r.tarih === tarihStr);
    
    if(oGun.length === 0) {
        window.showToast('Bu güne ait randevu kaydı bulunmamaktadır.', 'error');
        return;
    }
    
    oGun.sort((a,b) => (a.saat || "").localeCompare(b.saat || ""));

    let div = document.getElementById('custom-gunluk-modal');
    if(div) div.remove();
    div = document.createElement('div');
    div.id = "custom-gunluk-modal";
    div.className = "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4";
    
    let listeHtml = "";
    oGun.forEach(r => {
        let rRenk = "bg-blue-100 text-blue-700";
        if(r.durum === "Geldi") rRenk = "bg-emerald-100 text-emerald-700";
        if(r.durum === "İptal Etti") rRenk = "bg-red-100 text-red-700";
        
        listeHtml += `
            <div onclick="document.getElementById('custom-gunluk-modal').remove(); window.randevuIslem('${r.id}', '${r.durum || 'Bekliyor'}')" 
                 class="flex justify-between items-center p-4 mb-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-slate-50 transition shadow-sm bg-white">
                <div class="font-bold text-slate-800 text-sm"><i class="far fa-clock text-teal-600 mr-2"></i>${r.saat || '-'} <span class="mx-2 text-gray-300">|</span> ${r.hastaad}</div>
                <div class="text-xs font-black px-3 py-1 rounded-full ${rRenk}">${r.durum || 'Bekliyor'}</div>
            </div>
        `;
    });

    const displayDate = new Date(tarihStr).toLocaleDateString('tr-TR');

    div.innerHTML = `
        <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl relative max-h-[80vh] overflow-y-auto">
            <button onclick="document.getElementById('custom-gunluk-modal').remove()" class="absolute top-4 right-4 text-slate-400 hover:text-red-500 text-2xl"><i class="fas fa-times"></i></button>
            <h3 class="text-xl font-black mb-1 text-slate-800"><i class="far fa-calendar-check text-teal-600 mr-2"></i>Günlük Ajanda</h3>
            <p class="text-xs font-bold text-slate-500 mb-6 pb-4 border-b border-gray-100">${displayDate} Tarihli Randevular</p>
            <div class="space-y-1">${listeHtml}</div>
            <div class="mt-4 text-center text-[10px] text-slate-400">İşlem yapmak için randevunun üstüne tıklayın.</div>
        </div>
    `;
    document.body.appendChild(div);
};

// ================= DANIŞAN SEÇ KUTUSUNU DOLDURMA (GİZLİ ID KONTROLÜ) =================
window.randevuSelectDoldur = async function() {
    const s = document.getElementById('r-hasta');
    if(!s) return;
    const { data } = await supabase.from('danisanlar').select('id, ad, soyad').order('ad', { ascending: true });
    if(data) {
        // value="" kısmını ekleyerek varsayılan seçeneğin boş dönmesini garanti ediyoruz
        s.innerHTML = '<option value="" disabled selected>Danışan Seçiniz...</option>';
        data.forEach(d => {
            // Arka planda "value" olarak gizli d.id (UUID) gönderiyoruz!
            s.innerHTML += `<option value="${d.id}">${d.ad} ${d.soyad}</option>`;
        });
    }
};

// ================= DİYET BÖLÜMÜ MOTORLARI =================
window.diyetleriGetir = async function(hId) {
    const list = document.getElementById("tablo-diyetler");
    const { data } = await supabase.from('diyetler').select('*').eq('hastaid', hId).order('kayitzamani', { ascending: false });
    
    if(list) {
        list.innerHTML = "";
        if(data && data.length > 0) {
            data.forEach(d => {
                let ozet = "";
                if(d.sabah) ozet += `<span class="text-amber-600 font-bold">Sabah:</span> ${d.sabah.substring(0, 30)}...<br>`;
                if(d.ogle) ozet += `<span class="text-blue-600 font-bold">Öğle:</span> ${d.ogle.substring(0, 30)}...<br>`;
                if(d.aksam) ozet += `<span class="text-indigo-600 font-bold">Akşam:</span> ${d.aksam.substring(0, 30)}...`;
                
                list.innerHTML += `
                <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between mb-3">
                    <div>
                        <div class="flex justify-between items-start mb-3 border-b border-gray-100 pb-2">
                            <h4 class="font-black text-slate-800 text-sm">${d.baslik}</h4>
                            <div class="flex gap-2">
                                <button onclick="window.diyetPdfIndir('${d.id}')" class="text-teal-600 hover:text-teal-800 bg-teal-50 px-2 py-1 rounded text-xs font-bold shadow-sm border border-teal-100" title="PDF İndir"><i class="fas fa-file-pdf mr-1"></i>PDF</button>
                                <button onclick="window.diyetSil('${d.id}')" class="text-red-400 hover:text-red-600 bg-red-50 px-2 py-1 rounded text-xs border border-red-100" title="Sil"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                        <div class="text-[11px] text-slate-600 leading-relaxed mb-3">${ozet || '<i>(PDF içindedir)</i>'}</div>
                    </div>
                    <div class="text-[9px] font-bold text-slate-400 mt-2 border-t border-gray-50 pt-2">
                        <i class="far fa-clock mr-1"></i>${new Date(d.kayitzamani).toLocaleDateString('tr-TR')}
                    </div>
                </div>`;
            });
        } else {
            list.innerHTML = `<div class="col-span-full text-center p-5 text-slate-400 font-bold">Kayıtlı diyet programı bulunmamaktadır.</div>`;
        }
    }
};

// ================= ŞABLON MOTORLARI =================
window.sablonlariGetir = async function() {
    const { data } = await supabase.from('sablonlar').select('*');
    const lists = document.querySelectorAll('#sablon-listesi');
    const sels = document.querySelectorAll('#diy-sablon-secici');
    window.sablonListesi = data ? [...data].reverse() : [];

    lists.forEach(list => {
        list.innerHTML = "";
        if (window.sablonListesi.length === 0) {
            list.innerHTML = `<div class="col-span-full text-center p-5 text-slate-400 font-bold">Kayıtlı şablon bulunamadı.</div>`;
        } else {
            window.sablonListesi.forEach(s => {
                list.innerHTML += `
                <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-3">
                    <div class="flex justify-between items-center mb-2">
                        <h4 class="font-bold text-slate-800">${s.baslik}</h4>
                        <button onclick="window.sablonSil('${s.id}')" class="text-red-400 hover:text-red-600"><i class="fas fa-trash"></i></button>
                    </div>
                    <p class="text-[10px] text-slate-500 font-bold"><i class="fas fa-check text-teal-500 mr-1"></i>Profesyonel Şablon</p>
                </div>`;
            });
        }
    });

    sels.forEach(sel => {
        let opts = '<option value="">Şablon Seçiniz veya Kendiniz Yazın...</option>';
        window.sablonListesi.forEach(s => { opts += `<option value="${s.id}">${s.baslik}</option>`; });
        sel.innerHTML = opts;
        
        sel.onchange = (e) => {
            const s = window.sablonListesi.find(x => x.id === e.target.value);
            const setV = (boxId, val) => { const el = document.getElementById(boxId); if(el) el.value = val || ""; };
            if(s) {
                setV('diy-baslik', s.baslik); setV('diy-sabah', s.sabah); setV('diy-ara1', s.ara1);
                setV('diy-ogle', s.ogle); setV('diy-ara2', s.ara2); setV('diy-aksam', s.aksam);
                setV('diy-ara3', s.ara3); setV('diy-notlar', s.icerik);
            } else {
                setV('diy-baslik',''); setV('diy-sabah',''); setV('diy-ara1','');
                setV('diy-ogle',''); setV('diy-ara2',''); setV('diy-aksam','');
                setV('diy-ara3',''); setV('diy-notlar','');
            }
        };
    });
};

// ================= TÜM KAYIT FORMLARININ MOTORLARI (EKSİKSİZ VE KISALTILMAMIŞ) =================
const frmRandevu = document.getElementById('form-yeni-randevu');
if(frmRandevu) {
    frmRandevu.onsubmit = async (e) => {
        e.preventDefault();
        const hSel = document.getElementById('r-hasta');
        const secilenId = hSel.value; // Bu artık "Kadir Arslan" değil, arkadaki gizli kod (UUID) olacak!
        const secilenAd = hSel.options[hSel.selectedIndex].text;

        if(!secilenId || secilenId === "") { 
            window.showToast('Lütfen listeden bir danışan seçin!', 'error'); 
            return; 
        }
        
        const tarih = document.getElementById('r-tarih').value;
        const saat = document.getElementById('r-saat').value;
        const tip = document.getElementById('r-tip').value;

        // Zaman formatını güvenli hale getiriyoruz
        let timeStr;
        try { timeStr = new Date(`${tarih}T${saat}:00`).toISOString(); }
        catch(err) { timeStr = new Date().toISOString(); }

        const { error } = await supabase.from('randevular').insert([{
            hastaid: secilenId, 
            hastaad: secilenAd, 
            tarih: tarih, 
            saat: saat, 
            tip: tip, 
            durum: 'Bekliyor', 
            timestamp: timeStr
        }]);

        if(!error) { 
            frmRandevu.reset(); 
            window.closeModal('modal-randevu'); 
            window.showToast('Randevu başarıyla eklendi!', 'success'); 
            window.randevulariGetir(); 
        } else {
            window.showToast('Randevu Eklenemedi: ' + error.message, 'error');
            console.error(error);
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
            sabah: document.getElementById('diy-sabah').value, 
            ara1: document.getElementById('diy-ara1').value,
            ogle: document.getElementById('diy-ogle').value, 
            ara2: document.getElementById('diy-ara2').value,
            aksam: document.getElementById('diy-aksam').value, 
            ara3: document.getElementById('diy-ara3').value,
            icerik: document.getElementById('diy-notlar').value
        }]);

        if(!error) { 
            frmDiyet.reset(); 
            window.closeModal('modal-diyet'); 
            window.showToast('Diyet başarıyla kaydedildi!'); 
            window.diyetleriGetir(window.aktifHastaId); 
        }
    };
}

const frmSablon = document.getElementById('form-yeni-sablon');
if(frmSablon) {
    frmSablon.onsubmit = async (e) => {
        e.preventDefault();
        const { error } = await supabase.from('sablonlar').insert([{
            baslik: document.getElementById('s-baslik').value, 
            sabah: document.getElementById('s-sabah').value, 
            ara1: document.getElementById('s-ara1').value, 
            ogle: document.getElementById('s-ogle').value, 
            ara2: document.getElementById('s-ara2').value, 
            aksam: document.getElementById('s-aksam').value, 
            ara3: document.getElementById('s-ara3').value, 
            icerik: document.getElementById('s-notlar').value
        }]);

        if(!error) { 
            frmSablon.reset(); 
            window.closeModal('modal-sablon'); 
            window.showToast('Şablon eklendi!'); 
            window.sablonlariGetir(); 
        }
    };
}

const frmOlcum = document.getElementById('form-yeni-olcum');
if(frmOlcum) {
    frmOlcum.onsubmit = async (e) => {
        e.preventDefault();
        const kilo = parseFloat(document.getElementById('o-kilo').value) || 0;
        const boy = window.aktifHastaBoy ? (window.aktifHastaBoy / 100) : 0;
        const vki = boy > 0 ? (kilo / (boy * boy)).toFixed(2) : 0;

        const { error } = await supabase.from('olcumler').insert([{
            hastaid: window.aktifHastaId, 
            tarih: document.getElementById('o-tarih').value, 
            kilo: kilo, 
            vki: vki,
            yag: document.getElementById('o-yag').value || 0, 
            kas: document.getElementById('o-kas').value || 0,
            bel: document.getElementById('o-bel').value || 0, 
            kalca: document.getElementById('o-kalca').value || 0,
            gogus: document.getElementById('o-gogus').value || 0, 
            boyun: document.getElementById('o-boyun').value || 0
        }]);

        if(!error) { 
            frmOlcum.reset(); 
            window.closeModal('modal-olcum'); 
            window.showToast('Ölçüm başarıyla kaydedildi!'); 
            window.olcumleriGetir(window.aktifHastaId); 
        }
    };
}

const frmTahlil = document.getElementById('form-yeni-tahlil');
if(frmTahlil) {
    frmTahlil.onsubmit = async (e) => {
        e.preventDefault();
        const { error } = await supabase.from('tahliller').insert([{
            hastaid: window.aktifHastaId, 
            tarih: document.getElementById('t-tarih').value, 
            b12: document.getElementById('t-b12').value || '-',
            d_vitamini: document.getElementById('t-dvit').value || '-', 
            demir: document.getElementById('t-demir').value || '-',
            kolesterol: document.getElementById('t-kolesterol').value || '-', 
            aclik_sekeri: document.getElementById('t-seker').value || '-', 
            tsh: document.getElementById('t-tsh').value || '-'
        }]);

        if(!error) { 
            frmTahlil.reset(); 
            window.closeModal('modal-tahlil'); 
            window.showToast('Kan tahlili eklendi!'); 
            window.tahlilleriGetir(window.aktifHastaId); 
        }
    };
}

const frmCariHizmet = document.getElementById('form-cari-hizmet');
if(frmCariHizmet) {
    frmCariHizmet.onsubmit = async (e) => {
        e.preventDefault();
        const { error } = await supabase.from('cari_hareketler').insert([{ 
            hastaid: window.aktifHastaId, 
            tutar: document.getElementById('ch-tutar').value, 
            tur: 'Hizmet Bedeli', 
            islem_tarihi: new Date().toISOString().split('T')[0] 
        }]);
        if(!error) { 
            frmCariHizmet.reset(); 
            window.closeModal('modal-cari-hizmet'); 
            window.showToast('Hizmet eklendi!'); 
            window.cariHareketleriGetir(window.aktifHastaId); 
            window.finanslariGetir(); 
        }
    };
}

const frmCariOdeme = document.getElementById('form-cari-odeme');
if(frmCariOdeme) {
    frmCariOdeme.onsubmit = async (e) => {
        e.preventDefault();
        const { error } = await supabase.from('cari_hareketler').insert([{ 
            hastaid: window.aktifHastaId, 
            tutar: document.getElementById('co-tutar').value, 
            tur: 'Ödeme', 
            odeme_yontemi: document.getElementById('co-yontem').value, 
            islem_tarihi: new Date().toISOString().split('T')[0] 
        }]);
        if(!error) { 
            frmCariOdeme.reset(); 
            window.closeModal('modal-cari-odeme'); 
            window.showToast('Ödeme alındı!'); 
            window.cariHareketleriGetir(window.aktifHastaId); 
            window.finanslariGetir(); 
        }
    };
}

const frmGenelFinans = document.getElementById('form-finans');
if(frmGenelFinans) {
    frmGenelFinans.onsubmit = async (e) => {
        e.preventDefault();
        const sel = document.getElementById('f-hasta');
        const hId = sel.options[sel.selectedIndex].dataset.dbid;
        const { error } = await supabase.from('cari_hareketler').insert([{ 
            hastaid: hId, 
            tutar: document.getElementById('f-tutar').value, 
            tur: 'Ödeme', 
            odeme_yontemi: document.getElementById('f-tip').value, 
            islem_tarihi: document.getElementById('f-tarih').value 
        }]);
        if(!error) { 
            frmGenelFinans.reset(); 
            window.closeModal('modal-finans'); 
            window.showToast('Tahsilat kaydedildi!'); 
            window.finanslariGetir(); 
        }
    };
}

// ================= DİĞER VERİ GETİRİCİLER =================
window.olcumleriGetir = async function(hId) {
    const tablo = document.getElementById("tablo-olcum-gecmis"); 
    const { data } = await supabase.from('olcumler').select('*').eq('hastaid', hId).order('tarih', { ascending: false });
    if(tablo) { 
        tablo.innerHTML = ""; 
        if(data && data.length > 0) { 
            const o = data[0]; 
            document.getElementById("dash-kilo").innerText = o.kilo.toFixed(1); 
            document.getElementById("dash-bmi").innerText = o.vki ? o.vki.toFixed(1) : "0.0"; 
            document.getElementById("dash-kas").innerText = o.kas ? o.kas.toFixed(1) : "0.0"; 
            document.getElementById("dash-yag").innerText = o.yag ? o.yag.toFixed(1) : "0.0"; 
            data.forEach((ol) => { 
                tablo.innerHTML += `<tr><td class="p-4 border-b border-gray-100">${new Date(ol.tarih).toLocaleDateString('tr-TR')}</td><td class="p-4 border-b border-gray-100 text-teal-600 font-bold">${ol.kilo} kg</td><td class="p-4 border-b border-gray-100">${ol.vki||'-'}</td><td class="p-4 border-b border-gray-100 text-right"><button onclick="window.olcumSil('${ol.id}')" class="text-red-400 hover:text-red-600"><i class="fas fa-trash"></i></button></td></tr>`; 
            }); 
        } else {
            document.getElementById("dash-kilo").innerText = "0.0"; 
            document.getElementById("dash-bmi").innerText = "0.0"; 
            document.getElementById("dash-kas").innerText = "0.0"; 
            document.getElementById("dash-yag").innerText = "0.0"; 
        }
    }
};

window.tahlilleriGetir = async function(hId) {
    const tablo = document.getElementById("tablo-tahliller"); 
    const { data } = await supabase.from('tahliller').select('*').eq('hastaid', hId).order('tarih', { ascending: false });
    if(tablo) {
        tablo.innerHTML = data ? data.map(t => `<tr><td class="p-4 border-b border-gray-100">${new Date(t.tarih).toLocaleDateString('tr-TR')}</td><td class="p-4 border-b border-gray-100 text-red-600 font-bold">${t.b12||'-'} / ${t.d_vitamini||'-'}</td><td class="p-4 border-b border-gray-100">${t.demir||'-'}</td><td class="p-4 border-b border-gray-100 text-right"><button onclick="window.tahlilSil('${t.id}')" class="text-red-400 hover:text-red-600"><i class="fas fa-trash"></i></button></td></tr>`).join('') : "";
    }
};

window.cariHareketleriGetir = async function(hastaId) { 
    const tablo = document.getElementById("tablo-cari-hareketler"); 
    const { data } = await supabase.from('cari_hareketler').select('*').eq('hastaid', hastaId).order('islem_tarihi', { ascending: false }); 
    if(tablo) {
        tablo.innerHTML = ""; let hiz = 0; let ode = 0; 
        if(data) { 
            data.forEach(h => { 
                if(h.tur === 'Hizmet Bedeli') hiz += h.tutar; else ode += h.tutar; 
                const tR = h.tur === 'Hizmet Bedeli' ? "text-orange-600" : "text-emerald-600"; 
                tablo.innerHTML += `<tr><td class="p-4 border-b border-gray-100">${new Date(h.islem_tarihi).toLocaleDateString('tr-TR')}</td><td class="p-4 border-b border-gray-100 font-black ${tR}">${h.tutar} ₺</td><td class="p-4 border-b border-gray-100"><span class="text-xs font-bold uppercase ${tR}">${h.tur}</span></td><td class="p-4 border-b border-gray-100 text-slate-500">${h.odeme_yontemi||"-"}</td><td class="p-4 border-b border-gray-100 text-right"><button onclick="window.cariSil('${h.id}')" class="text-red-300 hover:text-red-500"><i class="fas fa-trash"></i></button></td></tr>`; 
            }); 
        } 
        if(document.getElementById("cari-bakiye")) document.getElementById("cari-bakiye").innerText = (hiz - ode) + " ₺";
    }
};

window.finanslariGetir = async function() { 
    const tablo = document.getElementById("kasa-tablosu"); 
    const { data } = await supabase.from('cari_hareketler').select('*, danisanlar(ad, soyad)').eq('tur', 'Ödeme').order('islem_tarihi', { ascending: false }); 
    if(tablo) { 
        tablo.innerHTML = ""; let top = 0; 
        if(data) { 
            data.forEach(i => { 
                top += i.tutar; 
                tablo.innerHTML += `<tr><td class="p-4 border-b border-gray-100">${new Date(i.islem_tarihi).toLocaleDateString('tr-TR')}</td><td class="p-4 border-b border-gray-100 font-bold">${i.danisanlar ? i.danisanlar.ad + " " + i.danisanlar.soyad : "Bilinmiyor"}</td><td class="p-4 border-b border-gray-100 font-black text-teal-700">${i.tutar} ₺</td><td class="p-4 border-b border-gray-100 text-right"><button onclick="window.cariSil('${i.id}')" class="text-red-300 hover:text-red-500"><i class="fas fa-trash"></i></button></td></tr>`; 
            }); 
        } 
        if(document.getElementById("stat-kasa")) document.getElementById("stat-kasa").innerText = top + " ₺"; 
    } 
};

// ================= SİLME İŞLEMLERİ =================
window.olcumSil = async (id) => { await supabase.from('olcumler').delete().eq('id', id); window.showToast('Ölçüm silindi', 'success'); window.olcumleriGetir(window.aktifHastaId); };
window.tahlilSil = async (id) => { await supabase.from('tahliller').delete().eq('id', id); window.showToast('Tahlil silindi', 'success'); window.tahlilleriGetir(window.aktifHastaId); };
window.diyetSil = async (id) => { await supabase.from('diyetler').delete().eq('id', id); window.showToast('Diyet silindi', 'success'); window.diyetleriGetir(window.aktifHastaId); };
window.sablonSil = async (id) => { await supabase.from('sablonlar').delete().eq('id', id); window.showToast('Şablon silindi', 'success'); window.sablonlariGetir(); };
window.cariSil = async (id) => { await supabase.from('cari_hareketler').delete().eq('id', id); window.showToast('İşlem silindi', 'success'); window.cariHareketleriGetir(window.aktifHastaId); window.finanslariGetir(); };

// ================= RANDEVU MENÜSÜ İŞLEMLERİ =================
window.randevuIslem = function(id, durum) { 
    let div = document.getElementById('custom-randevu-modal'); 
    if(div) div.remove(); 
    div = document.createElement('div'); 
    div.id = "custom-randevu-modal"; 
    div.className = "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"; 
    div.innerHTML = ` 
        <div class="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl relative transition-all"> 
            <button onclick="document.getElementById('custom-randevu-modal').remove()" class="absolute top-4 right-4 text-slate-400 hover:text-red-500 text-xl"><i class="fas fa-times"></i></button> 
            <h3 class="text-lg font-black mb-2 text-slate-800">Randevu İşlemi</h3> 
            <p class="text-xs font-bold text-slate-500 mb-6 uppercase tracking-wider">Şu anki durum: <span class="text-teal-600">${durum}</span></p> 
            <div class="space-y-3"> 
                <button onclick="window.randevuDurumGuncelle('${id}', 'Geldi')" class="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold py-3 rounded-lg hover:bg-emerald-100 transition"><i class="fas fa-check-circle"></i> Danışan Geldi</button> 
                <button onclick="window.randevuDurumGuncelle('${id}', 'İptal Etti')" class="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 font-bold py-3 rounded-lg hover:bg-red-100 transition"><i class="fas fa-times-circle"></i> İptal Etti / Gelmedi</button> 
                <div class="border-t border-gray-100 my-2 pt-2"></div> 
                <button onclick="window.randevuKalicSil('${id}')" class="w-full flex items-center justify-center gap-2 bg-slate-800 text-white font-bold py-3 rounded-lg shadow-md hover:bg-slate-900 transition"><i class="fas fa-trash"></i> Takvimden Sil</button> 
            </div> 
        </div> `; 
    document.body.appendChild(div); 
};

window.randevuDurumGuncelle = async function(id, yeniDurum) { 
    document.getElementById('custom-randevu-modal').remove(); 
    await supabase.from('randevular').update({ durum: yeniDurum }).eq('id', id); 
    window.showToast('Randevu güncellendi!'); 
    window.randevulariGetir(); 
};

window.randevuKalicSil = async function(id) { 
    document.getElementById('custom-randevu-modal').remove(); 
    if(confirm("Bu randevuyu silmek istiyor musunuz?")) { 
        await supabase.from('randevular').delete().eq('id', id); 
        window.showToast('Randevu silindi!'); 
        window.randevulariGetir(); 
    } 
};

// ================= BAŞLATICI MOTOR =================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Önce Güvenlik Kontrolü
    initAuth();
    initDashboard();
    // 2. Ardından Sistemin Kalanı
    if (typeof window.uretProtokol === "function") window.uretProtokol();
    
    const calendarEl = document.getElementById('calendar');
    if(calendarEl) {
        window.globalCalendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth', locale: 'tr', height: 600,
            headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth' },
            eventClick: function(info) { window.randevuIslem(info.event.extendedProps.dbId, info.event.extendedProps.durum); },
            dateClick: function(info) { window.gunlukRandevulariGoster(info.dateStr); }
        });
        window.globalCalendar.render(); 
    }
    
    danisanlariGetir(); 
    kayitFormunuBaslat(); 
    window.randevuSelectDoldur(); 
    window.finanslariGetir();
    
    setTimeout(() => { 
        window.randevulariGetir(); 
        window.sablonlariGetir(); 
    }, 500);
});