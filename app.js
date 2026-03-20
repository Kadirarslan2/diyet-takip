import { supabase } from './db.js';
import { danisanlariGetir } from './modules/danisan.js';
// İleride buraya olcum.js, randevu.js falan eklenecek...

document.addEventListener('DOMContentLoaded', () => {
    console.log("DiyetTakibim Sistemi Başlatılıyor...");
    
    // Uygulama açıldığında çalışacak ilk modüller
    danisanlariGetir();
});
import { supabase } from './db.js';
import { danisanlariGetir, kayitFormunuBaslat } from './modules/danisan.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("DiyetTakibim Modüler Sistem Devrede!");
    
    // Çalışacak işçiler:
    danisanlariGetir();
    kayitFormunuBaslat();
});