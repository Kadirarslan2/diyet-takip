// api/onesignal.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Sadece POST kabul edilir');

    // Şifrelerimiz artık güvende, sunucu tarafında!
    const ONESIGNAL_APP_ID = "ddce2b71-4b68-4437-bc90-7a8f52daca38";
    const ONESIGNAL_REST_API_KEY = "os_v2_app_3xhcw4klnbcdppeqpkhvfwwkhcdpgunnkpfeew4vub33oe6cmhutvis5a4ixdxchp4qgrsqn6unrnge3jau3qrkbfe6mon2svfsnotq";

    try {
        const response = await fetch("https://onesignal.com/api/v1/notifications", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // İşte Vercel'in yolda düşürdüğü o şifreyi şimdi direkt ana kapıdan veriyoruz!
                "Authorization": "Basic " + ONESIGNAL_REST_API_KEY
            },
            body: JSON.stringify({
                app_id: ONESIGNAL_APP_ID,
                included_segments: ["Subscribed Users"],
                headings: req.body.headings,
                contents: req.body.contents
            })
        });

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Sunucu hatası yaşandı' });
    }
}