// api/notify.js
import webpush from 'web-push';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({error: 'Sadece POST kabul edilir'});

    const { baslik, mesaj } = req.body;

    // KENDİ VAPID ŞİFRELERİN (Kimseye verme dediğim şifreler burada çalışıyor 😎)
    webpush.setVapidDetails(
        'mailto:kadir.arslan.9039@gmail.com',
        'BMZPdMy08ZwicPimS3ylir2d9UeqvUAm2wJqxO5n9MOzBtJYQ-pkulj8CmxUNAkkBdPlCGVBKhfSGO453xzzfek',
        'IAymiN6z4thXUM4pltbK3jK8WbrVfEdEeOCIn0xW_FI'
    );

    // SUPABASE BİLGİLERİNİ BURAYA YAPIŞTIR!
    const SUPABASE_URL = "https://SENIN_PROJEN.supabase.co"; 
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..._SENIN_ANON_KEY_BURAYA";

    try {
        // 1. Veritabanından (tablodan) kayıtlı cihazları çekiyoruz
        const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/bildirim_aboneleri?select=*`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const aboneler = await dbRes.json();

        if (!aboneler || aboneler.length === 0) {
            return res.status(400).json({ error: 'Sistemde kayıtlı hiçbir telefon/cihaz yok!' });
        }

        const payload = JSON.stringify({ title: baslik, body: mesaj });

        // 2. Vercel üzerinden herkese o füzeyi fırlatıyoruz!
        const gonderimler = aboneler.map(abone => {
            return webpush.sendNotification({
                endpoint: abone.endpoint,
                keys: { p256dh: abone.p256dh, auth: abone.auth }
            }, payload).catch(e => console.log('Hatalı veya silinmiş abone çöpe atıldı.'));
        });

        await Promise.all(gonderimler);
        res.status(200).json({ success: true, mesaj: `${aboneler.length} cihaza fırlatıldı!` });

    } catch (error) {
        res.status(500).json({ success: false, error: 'Sunucu hatası: ' + error.message });
    }
}