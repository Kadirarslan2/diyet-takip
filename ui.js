// SAYFA GEÇİŞLERİ VE TAKVİM UYANDIRICI
window.switchPage = function(pageId) {
    document.querySelectorAll('.page-section').forEach(el => el.classList.add('hidden'));
    const page = document.getElementById(pageId);
    if(page) page.classList.remove('hidden');
    
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById('nav-' + pageId.replace('page-', ''));
    if(activeBtn) activeBtn.classList.add('active');

    const titles = { 
        'page-yeni-kayit': 'Yeni Danışan Ekle', 
        'page-danisan-listesi': 'Danışan Listesi', 
        'page-hasta-profili': 'Danışan Dosyası', 
        'page-dashboard': 'Özet Panel', 
        'page-randevular': 'Takvim & Randevular', 
        'page-finans': 'Klinik Finans / Kasa' 
    };
    const baslik = document.getElementById('header-title');
    if(baslik && titles[pageId]) baslik.innerText = titles[pageId];

    // TAKVİMİN GÖRÜNMESİ İÇİN HAYATİ KOD BURASI:
    if(pageId === 'page-randevular' && window.globalCalendar) {
        setTimeout(() => { 
            window.globalCalendar.render(); 
            window.globalCalendar.updateSize(); 
        }, 150);
    }
}

// FORM SEKMELERİ
window.switchFormTab = function(tabName) {
    ['bilgiler', 'ek', 'notlar'].forEach(t => { 
        const content = document.getElementById('ftab-' + t);
        const btn = document.getElementById('btn-ftab-' + t);
        if(content) content.style.display = t === tabName ? 'block' : 'none'; 
        if(btn) {
            if(t === tabName) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });
}

// PROFİL SEKMELERİ (YENİ DETAYLI YAPIYA GÖRE)
window.switchProfileTab = function(tabName) {
    ['detay', 'randevular', 'hizmetler', 'olcumler', 'cari', 'diyetler'].forEach(t => { 
        const content = document.getElementById('ptab-' + t);
        const btn = document.getElementById('btn-ptab-' + t);
        if(content) content.style.display = t === tabName ? 'block' : 'none'; 
        if(btn) {
            if(t === tabName) {
                btn.classList.add('text-teal-700', 'border-b-2', 'border-teal-700');
                btn.classList.remove('text-slate-500');
            } else {
                btn.classList.remove('text-teal-700', 'border-b-2', 'border-teal-700');
                btn.classList.add('text-slate-500');
            }
        }
    });
}

// AÇILIR PENCERELER (MODAL)
window.openModal = function(id) { 
    const modal = document.getElementById(id);
    if(modal) modal.style.display = 'flex'; 
    if(id === 'modal-olcum') {
        const t = document.getElementById('o-tarih');
        if(t) t.valueAsDate = new Date();
    }
    if(id === 'modal-finans') {
        const ft = document.getElementById('f-tarih');
        if(ft) ft.valueAsDate = new Date();
    }
    if(id === 'modal-randevu') {
        const rt = document.getElementById('r-tarih');
        if(rt) rt.valueAsDate = new Date();
    }
}

window.closeModal = function(id) { 
    const modal = document.getElementById(id);
    if(modal) modal.style.display = 'none'; 
}

// BİLDİRİM BALONCUKLARI
window.showToast = function(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? '#0d9488' : '#e11d48'; 
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-info-circle';
    toast.style.cssText = `background-color: ${bgColor}; color: white; padding: 12px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 10px; font-weight: bold; font-size: 14px; transform: translateY(50px); opacity: 0; transition: all 0.4s ease; pointer-events: auto; z-index: 99999;`;
    toast.innerHTML = `<i class="fas ${icon} text-xl"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.transform = 'translateY(0)'; toast.style.opacity = '1'; }, 50);
    setTimeout(() => { toast.style.transform = 'translateY(50px)'; toast.style.opacity = '0'; setTimeout(() => { toast.remove(); }, 3000); }, 3000);
}

// PROTOKOL ÜRETİCİ
window.uretProtokol = function() { 
    const p = document.getElementById('d-protokol'); 
    if(p) p.value = `PRT${new Date().getFullYear().toString().substr(-2)}-${Math.floor(10000 + Math.random() * 90000)}`; 
}
window.addEventListener('load', () => window.uretProtokol());

// WHATSAPP GÖNDERİCİ
window.whatsappGonder = function(tel, waIcerik) { 
    if(!tel || tel === "-") { alert("Kayıtlı telefon yok!"); return; } 
    window.open(`https://wa.me/90${tel.replace(/\D/g,'')}?text=${waIcerik}`, '_blank'); 
}