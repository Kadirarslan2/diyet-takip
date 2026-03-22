// api/onesignal.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Sadece POST kabul edilir');

    const ONESIGNAL_APP_ID = "ddce2b71-4b68-4437-bc90-7a8f52daca38";
    const ONESIGNAL_REST_API_KEY = "os_v2_app_3xhcw4klnbcdppeqpkhvfwwkhcdpgunnkpfeew4vub33oe6cmhutvis5a4ixdxchp4qgrsqn6unrnge3jau3qrkbfe6mon2svfsnotq";

    try {
        // Yeni API linkini kullanıyoruz
        const response = await fetch("https://api.onesignal.com/notifications", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // İŞTE BÜTÜN DÜĞÜMÜ ÇÖZEN KELİME: "Basic" yerine "Key" kullanıyoruz!
                "Authorization": "Key " + ONESIGNAL_REST_API_KEY
            },
            body: JSON.stringify({
                app_id: ONESIGNAL_APP_ID,
                target_channel: "push",
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