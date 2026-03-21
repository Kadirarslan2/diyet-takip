// modules/dashboard.js
import { supabase } from '../db.js';

export async function initDashboard() {
    // 1. GRAFİK MOTORU
    const ctx = document.getElementById('anaGrafik');
    if (ctx) {
        try {
            const { data: randevular } = await supabase.from('randevular').select('*');
            const randevuSayisi = randevular ? randevular.length : 0;
            const gelenRandevu = randevular ? randevular.filter(r => r.durum === 'Geldi').length : 0;
            const iptalRandevu = randevular ? randevular.filter(r => r.durum === 'İptal Etti').length : 0;

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Toplam Planlanan', 'Gelen Danışan', 'İptal / Gelmeyen'],
                    datasets: [{
                        label: 'Randevu Durumu',
                        data: [randevuSayisi, gelenRandevu, iptalRandevu],
                        backgroundColor: [
                            'rgba(59, 130, 246, 0.85)', // Mavi
                            'rgba(16, 185, 129, 0.85)', // Yeşil
                            'rgba(239, 68, 68, 0.85)'   // Kırmızı
                        ],
                        borderRadius: 8,
                        borderSkipped: false
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    plugins: { legend: { display: false } }, 
                    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } 
                }
            });
        } catch(e) { console.error("Grafik Hatası:", e); }
    }

    // 2. YAKLAŞAN RANDEVULAR MOTORU
    const listRandevu = document.getElementById('dash-yaklasan-randevular');
    if(listRandevu) {
        try {
            // Sadece "Bekliyor" durumundaki en yakın 5 randevuyu çekiyoruz
            const { data: yRandevular } = await supabase.from('randevular')
                .select('*')
                .eq('durum', 'Bekliyor')
                .order('tarih', { ascending: true })
                .limit(5);

            if(yRandevular && yRandevular.length > 0) {
                listRandevu.innerHTML = yRandevular.map(r => `
                    <div class="flex justify-between items-center p-3 hover:bg-slate-50 rounded-2xl border border-gray-100 transition-colors shadow-sm bg-white">
                        <div class="flex items-center gap-4">
                            <div class="bg-teal-50 text-teal-700 font-black p-2 rounded-xl text-sm min-w-[55px] text-center border border-teal-100">
                                ${r.saat || '-'}
                            </div>
                            <div>
                                <div class="font-black text-slate-700">${r.hastaad}</div>
                                <div class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">${new Date(r.tarih).toLocaleDateString('tr-TR')} • ${r.tip || 'Seans'}</div>
                            </div>
                        </div>
                        <div class="text-[10px] font-black px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 uppercase tracking-widest border border-blue-100">Bekliyor</div>
                    </div>
                `).join('');
            } else {
                listRandevu.innerHTML = '<div class="text-center text-sm text-slate-400 py-6 font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">Yaklaşan randevu bulunmuyor. 🎉</div>';
            }
        } catch (e) { listRandevu.innerHTML = '<div class="text-red-500 text-xs">Yüklenemedi.</div>'; }
    }

    // 3. SON EKLENEN DANIŞANLAR MOTORU
    const listDanisan = document.getElementById('dash-son-danisanlar');
    if(listDanisan) {
        try {
            // Sisteme en son kaydedilen 5 kişiyi çekiyoruz
            const { data: sDanisanlar } = await supabase.from('danisanlar')
                .select('id, ad, soyad, telefon')
                .order('id', { ascending: false })
                .limit(5);

            if(sDanisanlar && sDanisanlar.length > 0) {
                listDanisan.innerHTML = sDanisanlar.map(d => `
                    <div class="flex justify-between items-center p-3 hover:bg-slate-50 rounded-2xl border border-gray-100 transition-colors shadow-sm bg-white">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-sm border border-slate-200">
                                ${d.ad.charAt(0)}${d.soyad ? d.soyad.charAt(0) : ''}
                            </div>
                            <div>
                                <div class="font-black text-slate-700">${d.ad} ${d.soyad}</div>
                                <div class="text-[10px] text-slate-400 font-bold tracking-widest">${d.telefon || 'Telefon Yok'}</div>
                            </div>
                        </div>
                        <button class="text-teal-600 hover:text-white hover:bg-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors border border-teal-100">İncele</button>
                    </div>
                `).join('');
            } else {
                listDanisan.innerHTML = '<div class="text-center text-sm text-slate-400 py-6 font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">Henüz danışan eklenmemiş.</div>';
            }
        } catch (e) { listDanisan.innerHTML = '<div class="text-red-500 text-xs">Yüklenemedi.</div>'; }
    }
}