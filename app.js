import { supabase } from './db.js';
import { danisanlariGetir, kayitFormunuBaslat } from './modules/danisan.js';

// GLOBAL YARDIMCI MOTORLAR
window.uretProtokol = function() {
    const rnd = Math.floor(10000 + Math.random() * 90000);
    const el = document.getElementById('d-protokol');
    if(el) el.value = "PRT-" + rnd;
};

// ================= PROFİL İÇİ SEKME VERİLERİNİ ÇEKME MOTORLARI =================
// (Bu motorlar şimdilik burada, ileride kendi modüllerine gidecekler)

// 1. Ölçümler Sekmesi
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
        
        data.forEach((ol) => { 
            tablo.innerHTML += `<tr><td class="p-4">${new Date(ol.tarih).toLocaleDateString('tr-TR')}</td><td class="p-4 text-teal-600 font-black">${ol.kilo}kg / BMI:${ol.vki||'-'}</td><td class="p-4 text-slate-500">Y:%${ol.yag||0} / K:%${ol.kas||0}</td><td class="p-4">${ol.bel||'-'}cm / ${ol.kalca||'-'}cm</td><td class="p-4">${ol.gogus||'-'}cm / ${ol.boyun||'-'}cm</td><td class="p-4 text-right"><button onclick="window.olcumSil('${ol.id}')" class="text-red-300 hover:text-red-500"><i class="fas fa-trash"></i></button></td></tr>`; 
        });
    } else { 
        document.getElementById("dash-kilo").innerText = "0.0"; document.getElementById("dash-bmi").innerText = "0.0"; document.getElementById("dash-kas").innerText = "0.0"; document.getElementById("dash-yag").innerText = "0.0"; 
    }
}

// 2. Kan Tahlilleri Sekmesi
window.tahlilleriGetir = async function(hId) {
    const tablo = document.getElementById("tablo-tahliller");
    const { data } = await supabase.from('tahliller').select('*').eq('hastaid', hId).order('tarih', { ascending: false });
    if(tablo) tablo.innerHTML = "";
    if(data) {
        data.forEach(t => {
            tablo.innerHTML += `<tr><td class="p-4">${new Date(t.tarih).toLocaleDateString('tr-TR')}</td><td class="p-4 text-red-600 font-bold">${t.b12||'-'} / ${t.d_vitamini||'-'}</td><td class="p-4 font-bold">${t.demir||'-'}</td><td class="p-4">${t.kolesterol||'-'}</td><td class="p-4">${t.aclik_sekeri||'-'}</td><td class="p-4">${t.tsh||'-'}</td><td class="p-4 text-right"><button onclick="window.tahlilSil('${t.id}')" class="text-red-300 hover:text-red-500"><i class="fas fa-trash"></i></button></td></tr>`;
        });
    }
}

// 3. Diyetler Sekmesi
window.diyetleriGetir = async function(hId) {
    const list = document.getElementById("tablo-diyetler");
    const { data } = await supabase.from('diyetler').select('*').eq('hastaid', hId).order('kayitzamani', { ascending: false });
    if(list) list.innerHTML = "";
    if(data) {
        data.forEach(d => { 
            list.innerHTML += `<div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200"><div class="flex justify-between items-start mb-3 border-b border-gray-100 pb-2"><h4 class="font-bold text-slate-800">${d.baslik}</h4><button onclick="window.diyetSil('${d.id}')" class="text-red-400 hover:text-red-600"><i class="fas fa-trash"></i></button></div><p class="text-xs text-slate-600 leading-relaxed">${d.icerik.replace(/\n/g, '<br>')}</p></div>`; 
        });
    }
}

// 4. Kasa/Bakiye Sekmesi
window.cariHareketleriGetir = async function(hastaId) {
    const tablo = document.getElementById("tablo-cari-hareketler");
    const { data } = await supabase.from('cari_hareketler').select('*').eq('hastaid', hastaId).order('islem_tarihi', { ascending: false });
    if(tablo) tablo.innerHTML = ""; 
    let hizmet = 0; let odeme = 0;
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

// ================= SİSTEMİ BAŞLAT =================
document.addEventListener('DOMContentLoaded', () => {
    console.log("DiyetTakibim Modüler Sistem Devrede!");
    
    // Açılışta ilk protokolü hazır et
    if (typeof window.uretProtokol === "function") window.uretProtokol();
    
    // İşçi modülleri çalıştır
    danisanlariGetir();
    kayitFormunuBaslat();
});