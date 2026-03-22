// api/onesignal.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({error: 'Sadece POST kabul edilir'});

    const ONESIGNAL_APP_ID = "ddce2b71-4b68-4437-bc90-7a8f52daca38";
    
    // İŞTE SENİN YAKALADIĞIN YEPYENİ, IP ENGELSİZ ŞİFRE!
    const ONESIGNAL_REST_API_KEY = "os_v2_app_3xhcw4klnbcdppeqpkhvfwwkhdzaxfpjq4kespeer22wa3vkpibwfpvzzwbeqccjun3oxwto7qbawjydx46mmp5y5xrwernww3fwdbi"; 

    try {
        const response = await fetch("https://onesignal.com/api/v1/notifications", {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`
            },
            body: JSON.stringify({
                app_id: ONESIGNAL_APP_ID,
                included_segments: ["Subscribed Users"],
                headings: req.body.headings,
                contents: req.body.contents
            })
        });

        const data = await response.json();
        
        if (!response.ok || data.errors) {
            return res.status(400).json({ success: false, error: data.errors });
        }

        res.status(200).json({ success: true, data: data });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
}