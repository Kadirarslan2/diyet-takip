import { supabase } from './db.js';
import { danisanlariGetir, kayitFormunuBaslat } from './modules/danisan.js?v=wpyeni';
import { randevulariGetir, randevuFormunuBaslat } from './modules/randevu.js?v=wpyeni';

// ================= ÇELİK TOAST MOTORU =================
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

// ================= YENİ WHATSAPP VE PDF MOTORLARI =================

window.whatsappMesajAt = function() {
    if(!window.aktifHastaId) return;
    const d = window.danisanListesi.find(x => x.id === window.aktifHastaId);
    if(!d) return;

    let tel = d.telefon;
    if(!tel || tel === "-" || tel === "Belirtilmemiş") {
        window.showToast("Hastanın kayıtlı bir telefonu yok!", "error"); return;
    }

    // Telefon numarasını Türkiye/WhatsApp formatına çevir
    tel = tel.replace(/\D/g, ''); // Sadece rakamları bırak
    if(tel.startsWith("0")) tel = "9" + tel;
    if(!tel.startsWith("90")) tel = "90" + tel;

    const ad = d.ad || "Danışan";
    const mesaj = encodeURIComponent(`Merhaba ${ad} Hanım/Bey,\nDiyetTakibim Kliniğinden iletişime geçiyoruz. Sağlıklı günler dileriz! 🍏`);
    
    window.open(`https://wa.me/${tel}?text=${mesaj}`, '_blank');
}

window.pdfIndir = function() {
    if(!window.aktifHastaId) return;
    const d = window.danisanListesi.find(x => x.id === window.aktifHastaId);
    if(!d) return;

    window.showToast('PDF Hazırlanıyor, lütfen bekleyin...', 'success');

    // Sadece hastanın detaylarının yazdığı o güzel kutuyu seçiyoruz
    const element = document.getElementById('hasta-dosyasi-pdf');
    
    const opt = {
        margin:       10,
        filename:     `${d.ad}_${d.soyad}_Hasta_Dosyasi.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        window.showToast('PDF başarıyla indirildi!', 'success');
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
window.sablonSil = async function(id) { await supabase.from('sablonlar').delete().eq('id', id); window.showToast('Şablon silindi', 'success'); window.sablonlariGetir(); }

// ================= SİSTEMİ BAŞLAT =================
document.addEventListener('DOMContentLoaded', () => {
    console.log("DiyetTakibim Modüler Sistem Devrede!");
    
    if (typeof window.uretProtokol === "function") window.uretProtokol();
    
    danisanlariGetir();
    kayitFormunuBaslat();
    
    // YENİ RANDEVU MOTORLARI ÇALIŞIYOR
    randevulariGetir();
    randevuFormunuBaslat();
    
    sablonlariGetir();
    finanslariGetir();
});