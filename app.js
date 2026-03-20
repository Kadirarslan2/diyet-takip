import { supabase } from './db.js';
import { danisanlariGetir, kayitFormunuBaslat } from './modules/danisan.js?v=tamirSon';
import { randevulariGetir, randevuFormunuBaslat } from './modules/randevu.js?v=tamirSon';

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
    toast.className = `fixed bottom-6 right-6 z-[9999] flex items-center gap-3 ${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl font-bold transition-all duration-300 transform translate-y-0 opacity-100`;
    toast.innerHTML = `<i class="fas fa-check-circle"></i> <span>${mesaj}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

window.uretProtokol = function() {
    const rnd = Math.floor(10000 + Math.random() * 90000);
    const el = document.getElementById('d-protokol');
    if(el) el.value = "PRT-" + rnd;
};

// ================= WHATSAPP MOTORU =================
window.whatsappMesajAt = function() {
    if(!window.aktifHastaId) return;
    const d = window.danisanListesi.find(x => x.id === window.aktifHastaId);
    if(!d) return;
    let tel = d.telefon;
    if(!tel || tel === "-" || tel === "Belirtilmemiş") {
        window.showToast("Telefon numarası bulunamadı!", "error");
        return;
    }
    tel = tel.replace(/\D/g, '');
    if(tel.startsWith("0")) tel = "9" + tel;
    if(!tel.startsWith("90")) tel = "90" + tel;
    const ad = d.ad || "Danışan";
    const mesaj = encodeURIComponent(`Merhaba ${ad} Hanım/Bey,\nDiyetTakibim Kliniğinden iletişime geçiyoruz. Sağlıklı günler dileriz! 🍏`);
    window.open(`https://wa.me/${tel}?text=${mesaj}`, '_blank');
};

// ================= PDF MOTORU (ESKİ VE ÇALIŞAN HALİ) =================
const pdfOlusturVeIndir = (htmlIcerik, dosyaAdi) => {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.top = '0';
    wrapper.style.left = '0';
    wrapper.style.width = '100vw';
    wrapper.style.height = '100vh';
    wrapper.style.backgroundColor = '#f8fafc';
    wrapper.style.zIndex = '999999';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'center';
    wrapper.style.overflow = 'auto';

    const loader = document.createElement('div');
    loader.innerHTML = '<h2 style="margin-top: 50px; color: #0f766e; font-family: sans-serif;"><i class="fas fa-spinner fa-spin mr-2"></i> PDF Hazırlanıyor...</h2>';
    wrapper.appendChild(loader);

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlIcerik;
    tempDiv.style.width = '800px';
    tempDiv.style.backgroundColor = '#ffffff';
    tempDiv.style.margin = '20px';
    tempDiv.style.padding = '40px';
    tempDiv.style.boxShadow = '0 0 15px rgba(0,0,0,0.1)';
    wrapper.appendChild(tempDiv);
    document.body.appendChild(wrapper);

    const opt = {
        margin: 10,
        filename: dosyaAdi,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    setTimeout(() => {
        html2pdf().set(opt).from(tempDiv).save().then(() => {
            window.showToast('PDF Başarıyla İndirildi!');
            wrapper.remove();
        }).catch(err => {
            console.error("PDF Hatası:", err);
            wrapper.remove();
        });
    }, 800);
};

// ================= KLİNİK RAPORU PDF =================
window.pdfIndir = async function() {
    if(!window.aktifHastaId) return;
    const d = window.danisanListesi.find(x => x.id === window.aktifHastaId);
    if(!d) return;

    window.showToast('Rapor Hazırlanıyor...');
    
    let olcumHtml = "";
    const { data: olcumler } = await supabase.from('olcumler').select('*').eq('hastaid', d.id).order('tarih', { ascending: false });
    if(olcumler) {
        olcumler.forEach(o => {
            olcumHtml += `<tr><td style="border:1px solid #ddd;padding:8px;">${o.tarih}</td><td style="border:1px solid #ddd;padding:8px;">${o.kilo} kg</td><td style="border:1px solid #ddd;padding:8px;">${o.vki || '-'}</td></tr>`;
        });
    }

    let tahlilHtml = "";
    const { data: tahliller } = await supabase.from('tahliller').select('*').eq('hastaid', d.id).order('tarih', { ascending: false });
    if(tahliller) {
        tahliller.forEach(t => {
            tahlilHtml += `<tr><td style="border:1px solid #ddd;padding:8px;">${t.tarih}</td><td style="border:1px solid #ddd;padding:8px;">${t.b12 || '-'}</td><td style="border:1px solid #ddd;padding:8px;">${t.demir || '-'}</td></tr>`;
        });
    }

    const html = `
        <div style="font-family:sans-serif; padding:20px;">
            <h1 style="color:#0f766e; border-bottom:2px solid #0f766e; padding-bottom:10px;">DİYETTAKİBİM KLİNİK RAPORU</h1>
            <p><b>Danışan:</b> ${d.ad} ${d.soyad}</p>
            <p><b>Tarih:</b> ${new Date().toLocaleDateString('tr-TR')}</p>
            
            <h3 style="background:#f0fdfa; padding:5px;">Ölçüm Geçmişi</h3>
            <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
                <thead style="background:#f4f4f4;"><tr><th style="border:1px solid #ddd;padding:8px;">Tarih</th><th style="border:1px solid #ddd;padding:8px;">Kilo</th><th style="border:1px solid #ddd;padding:8px;">BMI</th></tr></thead>
                <tbody>${olcumHtml || '<tr><td colspan="3">Kayıt yok</td></tr>'}</tbody>
            </table>

            <h3 style="background:#fef2f2; padding:5px;">Tahlil Özeti</h3>
            <table style="width:100%; border-collapse:collapse;">
                <thead style="background:#f4f4f4;"><tr><th style="border:1px solid #ddd;padding:8px;">Tarih</th><th style="border:1px solid #ddd;padding:8px;">B12</th><th style="border:1px solid #ddd;padding:8px;">Demir</th></tr></thead>
                <tbody>${tahlilHtml || '<tr><td colspan="3">Kayıt yok</td></tr>'}</tbody>
            </table>
        </div>
    `;
    pdfOlusturVeIndir(html, `${d.ad}_Klinik_Raporu.pdf`);
};

// ================= DİYET PDF =================
window.diyetPdfIndir = async function(diyetId) {
    const { data: diyet } = await supabase.from('diyetler').select('*').eq('id', diyetId).single();
    if(!diyet) return;
    
    const d = window.danisanListesi.find(x => x.id === diyet.hastaid);
    
    const html = `
        <div style="font-family:sans-serif; padding:20px;">
            <h1 style="color:#0f766e; text-align:center;">BESLENME PROGRAMI</h1>
            <div style="background:#f1f5f9; padding:15px; border-radius:8px; margin-bottom:20px;">
                <p><b>Danışan:</b> ${d ? d.ad + ' ' + d.soyad : 'Danışan'}</p>
                <p><b>Program:</b> ${diyet.baslik}</p>
            </div>
            <div style="margin-bottom:15px; border-left:4px solid #d97706; padding-left:10px;">
                <h4 style="color:#d97706; margin:0;">SABAH</h4>
                <p>${diyet.sabah || '-'}</p>
            </div>
            <div style="margin-bottom:15px; border-left:4px solid #2563eb; padding-left:10px;">
                <h4 style="color:#2563eb; margin:0;">ÖĞLE</h4>
                <p>${diyet.ogle || '-'}</p>
            </div>
            <div style="margin-bottom:15px; border-left:4px solid #4f46e5; padding-left:10px;">
                <h4 style="color:#4f46e5; margin:0;">AKŞAM</h4>
                <p>${diyet.aksam || '-'}</p>
            </div>
            <div style="margin-top:30px; border-top:1px solid #eee; padding-top:10px; font-size:12px; color:#666; text-align:center;">
                DiyetTakibim Profesyonel Yönetim Sistemi
            </div>
        </div>
    `;
    pdfOlusturVeIndir(html, `Diyet_Programi.pdf`);
};

// ================= ŞABLON MOTORU =================
window.sablonlariGetir = async function() {
    const { data } = await supabase.from('sablonlar').select('*');
    const lists = document.querySelectorAll('#sablon-listesi');
    const sels = document.querySelectorAll('#diy-sablon-secici');
    window.sablonListesi = data || [];

    lists.forEach(list => {
        list.innerHTML = window.sablonListesi.map(s => `
            <div class="bg-white p-4 rounded-xl shadow-sm border mb-2 flex justify-between items-center">
                <span class="font-bold">${s.baslik}</span>
                <button onclick="window.sablonSil('${s.id}')" class="text-red-400"><i class="fas fa-trash"></i></button>
            </div>
        `).join('');
    });

    sels.forEach(sel => {
        sel.innerHTML = '<option value="">Şablon Seçiniz...</option>' + 
            window.sablonListesi.map(s => `<option value="${s.id}">${s.baslik}</option>`).join('');
        
        sel.onchange = (e) => {
            const s = window.sablonListesi.find(x => x.id === e.target.value);
            if(s) {
                if(document.getElementById('diy-baslik')) document.getElementById('diy-baslik').value = s.baslik;
                if(document.getElementById('diy-sabah')) document.getElementById('diy-sabah').value = s.sabah || "";
                if(document.getElementById('diy-ogle')) document.getElementById('diy-ogle').value = s.ogle || "";
                if(document.getElementById('diy-aksam')) document.getElementById('diy-aksam').value = s.aksam || "";
            }
        };
    });
};

// ================= DİYET LİSTESİ ÇEKİCİ =================
window.diyetleriGetir = async function(hId) {
    const list = document.getElementById("tablo-diyetler");
    const { data } = await supabase.from('diyetler').select('*').eq('hastaid', hId).order('kayitzamani', { ascending: false });
    if(list) {
        list.innerHTML = data ? data.map(d => `
            <div class="bg-white p-4 rounded-xl shadow-sm border mb-2 flex justify-between items-center">
                <div>
                    <div class="font-bold text-slate-800">${d.baslik}</div>
                    <div class="text-xs text-slate-500">${new Date(d.kayitzamani).toLocaleDateString('tr-TR')}</div>
                </div>
                <div class="flex gap-2">
                    <button onclick="window.diyetPdfIndir('${d.id}')" class="bg-teal-50 text-teal-600 p-2 rounded-lg"><i class="fas fa-file-pdf"></i></button>
                    <button onclick="window.diyetSil('${d.id}')" class="bg-red-50 text-red-600 p-2 rounded-lg"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('') : "Kayıt yok.";
    }
};

// ================= TÜM KAYDETME FORMLARI =================
document.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    
    if(f.id === 'form-yeni-randevu') {
        const hSel = document.getElementById('r-hasta');
        const hId = hSel.value;
        const hAd = hSel.options[hSel.selectedIndex].text;
        const { error } = await supabase.from('randevular').insert([{
            hastaid: hId, hastaad: hAd, tarih: document.getElementById('r-tarih').value,
            saat: document.getElementById('r-saat').value, tip: document.getElementById('r-tip').value, durum: 'Bekliyor'
        }]);
        if(!error) { f.reset(); window.closeModal('modal-randevu'); window.showToast('Randevu eklendi!'); window.randevulariGetir(); }
    }

    if(f.id === 'form-yeni-diyet') {
        const { error } = await supabase.from('diyetler').insert([{
            hastaid: window.aktifHastaId,
            baslik: document.getElementById('diy-baslik').value,
            sabah: document.getElementById('diy-sabah').value,
            ogle: document.getElementById('diy-ogle').value,
            aksam: document.getElementById('diy-aksam').value
        }]);
        if(!error) { f.reset(); window.closeModal('modal-diyet'); window.showToast('Diyet kaydedildi!'); window.diyetleriGetir(window.aktifHastaId); }
    }

    if(f.id === 'form-yeni-sablon') {
        const { error } = await supabase.from('sablonlar').insert([{
            baslik: document.getElementById('s-baslik').value,
            sabah: document.getElementById('s-sabah').value,
            ogle: document.getElementById('s-ogle').value,
            aksam: document.getElementById('s-aksam').value
        }]);
        if(!error) { f.reset(); window.closeModal('modal-sablon'); window.showToast('Şablon kaydedildi!'); window.sablonlariGetir(); }
    }
});

// ================= VERİ ÇEKİCİLER =================
window.olcumleriGetir = async function(hId) {
    const tablo = document.getElementById("tablo-olcum-gecmis");
    const { data } = await supabase.from('olcumler').select('*').eq('hastaid', hId).order('tarih', { ascending: false });
    if(tablo) tablo.innerHTML = data ? data.map(o => `<tr><td class="p-4">${o.tarih}</td><td class="p-4 font-bold">${o.kilo}kg</td><td class="p-4">${o.vki || '-'}</td><td class="p-4 text-right"><button onclick="window.olcumSil('${o.id}')" class="text-red-400"><i class="fas fa-trash"></i></button></td></tr>`).join('') : "";
};

window.tahlilleriGetir = async function(hId) {
    const tablo = document.getElementById("tablo-tahliller");
    const { data } = await supabase.from('tahliller').select('*').eq('hastaid', hId).order('tarih', { ascending: false });
    if(tablo) tablo.innerHTML = data ? data.map(t => `<tr><td class="p-4">${t.tarih}</td><td class="p-4">${t.b12 || '-'}</td><td class="p-4">${t.demir || '-'}</td><td class="p-4 text-right"><button onclick="window.tahlilSil('${t.id}')" class="text-red-400"><i class="fas fa-trash"></i></button></td></tr>`).join('') : "";
};

window.randevulariGetir = async function() {
    const { data } = await supabase.from('randevular').select('*');
    if(document.getElementById("stat-randevular")) document.getElementById("stat-randevular").innerText = data ? data.length : 0;
    if(window.globalCalendar) {
        window.globalCalendar.removeAllEvents();
        data?.forEach(r => {
            window.globalCalendar.addEvent({ title: r.hastaad, start: r.tarih, color: '#3b82f6' });
        });
    }
};

window.randevuSelectDoldur = async function() {
    const sel = document.getElementById('r-hasta');
    if(!sel) return;
    const { data } = await supabase.from('danisanlar').select('id, ad, soyad');
    if(data) sel.innerHTML = '<option value="">Seçiniz...</option>' + data.map(d => `<option value="${d.id}">${d.ad} ${d.soyad}</option>`).join('');
};

// ================= BAŞLATICI =================
document.addEventListener('DOMContentLoaded', () => {
    const calendarEl = document.getElementById('calendar');
    if(calendarEl) {
        window.globalCalendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth', locale: 'tr', height: 600,
            headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth' }
        });
        window.globalCalendar.render();
    }
    danisanlariGetir();
    kayitFormunuBaslat();
    window.randevuSelectDoldur();
    setTimeout(() => { window.randevulariGetir(); window.sablonlariGetir(); }, 500);
});

// SİLMELER
window.olcumSil = async (id) => { await supabase.from('olcumler').delete().eq('id', id); window.olcumleriGetir(window.aktifHastaId); };
window.tahlilSil = async (id) => { await supabase.from('tahliller').delete().eq('id', id); window.tahlilleriGetir(window.aktifHastaId); };
window.diyetSil = async (id) => { await supabase.from('diyetler').delete().eq('id', id); window.diyetleriGetir(window.aktifHastaId); };
window.sablonSil = async (id) => { await supabase.from('sablonlar').delete().eq('id', id); window.sablonlariGetir(); };