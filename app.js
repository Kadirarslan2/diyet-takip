import { supabase } from './db.js';
import { danisanlariGetir, kayitFormunuBaslat } from './modules/danisan.js';

// GLOBAL YARDIMCI MOTORLAR (Sistemin kilitlenmesini önler)
window.uretProtokol = function() {
    const rnd = Math.floor(10000 + Math.random() * 90000);
    const el = document.getElementById('d-protokol');
    if(el) el.value = "PRT-" + rnd;
};

// Sayfa yüklendiğinde çalışacaklar
document.addEventListener('DOMContentLoaded', () => {
    console.log("DiyetTakibim Modüler Sistem Devrede!");
    
    // Açılışta ilk protokolü hazır et
    if (typeof window.uretProtokol === "function") window.uretProtokol();
    
    // İşçi modülleri çalıştır
    danisanlariGetir();
    kayitFormunuBaslat();
});