const { onCall } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();
const db = admin.firestore();

// הגדרות טלגרם
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_TOKEN; 
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID; 
const ADMIN_APP_URL = "https://nails-by-natali.web.app/admin.html";

async function sendTelegramMessage(text) {
    if (!TELEGRAM_BOT_TOKEN) return;
    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, { 
            chat_id: TELEGRAM_CHAT_ID, text: text, parse_mode: "HTML" 
        });
    } catch (e) { console.error("Telegram error:", e); }
}

// התחברות ל-Pulseem עם ה-URL והמבנה הסופי שהתמיכה נתנו!
async function sendPulseemSMS(phone, message) {
    const PULSEEM_API_TOKEN = process.env.PULSEEM_API_TOKEN; 
    const pulseemUrl = "https://api.pulseem.com/api/v1/SmsApi/SendSms";
    
    let cleanPhone = phone.replace(/-/g, '');

    const payload = {
        "sendId": Date.now().toString(),
        "smsSendData": {
            "fromNumber": "0528381886",
            "toNumberList": [cleanPhone],
            "referenceList": ["Soleil_System"],
            "textList": [message]
        }
    };

    try {
        console.log(`Sending SMS to ${cleanPhone} via Pulseem...`);
        const response = await axios.post(pulseemUrl, payload, { 
            headers: { 
                "APIKEY": PULSEEM_API_TOKEN,
                "Content-Type": "application/json",
                "Accept": "application/json"
            } 
        });
        
        // 🔥 התיקון החדש: בודקים אם פולסים החביאו שגיאת יתרה בתוך התשובה!
        if (response.data && response.data.status === 'Error') {
            console.error("Pulseem Business Error (e.g., No Balance):", response.data.error);
            return false;
        }

        console.log("Pulseem SMS Sent Perfectly:", response.data);
        return true;
    } catch (e) { 
        console.error("Pulseem Error Details:", e.response ? e.response.data : e.message);
        return false; 
    }
}

// ====== פונקציות ה-SMS מול האפליקציה (עם פתרון ה-CORS) ======

exports.sendOtpSms = onCall({ cors: true, invoker: "public" }, async (request) => {
    try {
        const phone = request.data.phone || request.data.phoneNumber;
        if (!phone) throw new Error("No phone number received");

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        
        await db.collection('otps').doc(phone).set({ 
            code: otp, 
            timestamp: admin.firestore.FieldValue.serverTimestamp() 
        });

        const smsSent = await sendPulseemSMS(phone, `קוד האימות שלך ל-Soleil Nail Studio הוא: ${otp} 🔒`);
        if (!smsSent) {
            return { success: false, error: "Failed to send SMS via Pulseem" };
        }
        
        return { success: true };
    } catch (error) {
        console.error("ERROR IN SENDOTPSMS:", error);
        return { success: false, error: error.message };
    }
});

exports.sendBroadcastSms = onCall({ cors: true, invoker: "public" }, async (request) => {
    const { message, phones } = request.data;
    if (phones) {
        for (const phone of phones) { await sendPulseemSMS(phone, message); }
    }
    return { success: true };
});

exports.sendReminderSms = onCall({ cors: true, invoker: "public" }, async (request) => {
    const { phone, clientName, date, time } = request.data;
    await sendPulseemSMS(phone, `היי ${clientName}, תזכורת לתור ב-Soleil ב-${date} בשעה ${time} ✨`);
    return { success: true };
});

// ====== טריגרים אוטומטיים לטלגרם ======

exports.onNewAppointment = onDocumentCreated('appointments/{appId}', async (event) => {
    const app = event.data.data();
    const appId = event.params.appId;
    const text = `🗓 <b>תור חדש ל-Soleil!</b>\n\n👤 ${app.clientName}\n💅 ${app.treatment}\n📅 ${app.date} | ${app.time}\n\n<a href="${ADMIN_APP_URL}?action=approve_app&id=${appId}">✅ לאישור</a>`;
    await sendTelegramMessage(text);
});

exports.onNewUser = onDocumentCreated('users/{phone}', async (event) => {
    const user = event.data.data();
    const phone = event.params.phone;
    if (user.status === 'pending') {
        const text = `👥 <b>לקוחה חדשה!</b>\n\n👤 ${user.name}\n📞 ${phone}\n\n<a href="${ADMIN_APP_URL}?action=approve_user&phone=${phone}">✅ לאישור</a>`;
        await sendTelegramMessage(text);
    }
});

// ====== שעון מעורר לתזכורות אוטומטיות ======

exports.dailySmsReminders = onSchedule({
    schedule: 'every day 10:00',
    timeZone: 'Asia/Jerusalem'
}, async (event) => {
    try {
        const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' });
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = formatter.format(tomorrow); 

        const snapshot = await db.collection('appointments')
            .where('fullDate', '==', tomorrowStr)
            .where('status', '==', 'approved')
            .where('reminderSmsSent', '==', false)
            .get();

        if (snapshot.empty) return;

        for (const doc of snapshot.docs) {
            const app = doc.data();
            const msg = `היי ${app.clientName}, תזכורת לתור ב-Soleil מחר (${app.date}) בשעה ${app.time} ✨`;
            const success = await sendPulseemSMS(app.clientPhone, msg);
            if (success) await doc.ref.update({ reminderSmsSent: true });
        }
    } catch (error) {
        console.error("Error in dailySmsReminders:", error);
    }
});
// ============================================================================
// אוטומציה: התראת טלגרם למנהלת + שליחת SMS אוטומטי לרשימת המתנה בעת ביטול תור
// ============================================================================
exports.onAppointmentCanceled = onDocumentUpdated('appointments/{appId}', async (event) => {
        const before = event.data.before.data();
        const after = event.data.after.data();

        // בודק אם הסטטוס השתנה עכשיו ל-"canceled" (בוטל)
        if (before.status !== 'canceled' && after.status === 'canceled') {
            const date = after.date; // לדוגמה: "24.06"
            const fullDate = after.fullDate; // לדוגמה: "2026-06-24"
            const time = after.time;
            const clientName = after.clientName;

            console.log(`Appointment canceled by ${clientName} on ${date} at ${time}. Starting automation...`);

            // 1. שליחת התראה לנטלי בטלגרם
            const telegramMsg = `❌ ביטול תור:\nהלקוחה ${clientName} הרגע ביטלה את התור שלה בתאריך ${date} בשעה ${time}.\nהמערכת בודקת כעת את רשימת ההמתנה.`;
            
            try {
                // מניח שיש לך פונקציה כזו ב-index.js, אם קראת לה בשם אחר, שנה כאן
                await sendTelegramMessage(telegramMsg); 
            } catch (err) {
                console.error("Failed to send Telegram cancel alert", err);
            }

            // 2. חיפוש בנות ברשימת ההמתנה של אותו תאריך
            try {
                const waitlistSnapshot = await admin.firestore().collection('waitlist').where('fullDate', '==', fullDate).get();
                
                if (!waitlistSnapshot.empty) {
                    const phonesToAlert = [];
                    waitlistSnapshot.forEach(doc => {
                        let phone = doc.data().clientPhone;
                        if (phone) phonesToAlert.push(phone);
                    });

                    // 3. שליחת SMS לבנות הממתינות
                    if (phonesToAlert.length > 0) {
                        const smsMsg = `היי! התפנה תור מפתיע בקליניקה בתאריך ${date} בשעה ${time}. מהרי לתפוס אותו באפליקציה לפני שייתפס: https://nails-by-natali.web.app`;
                        
                        // קריאה לפונקציית ה-SMS עבור כל לקוחה ברשימה
                        for (const phone of phonesToAlert) {
                            await sendPulseemSMS(phone, smsMsg);
                        }
                        
                        console.log(`Waitlist SMS sent to ${phonesToAlert.length} clients.`);
                        
                        // עדכון נוסף לנטלי ש-SMS נשלח
                        await sendTelegramMessage(`✅ הודעת SMS נשלחה אוטומטית ל-${phonesToAlert.length} בנות מרשימת ההמתנה!`);
                    }
                } else {
                    console.log("No one on the waitlist for this date.");
                }
            } catch (err) {
                console.error("Failed to process waitlist automation", err);
            }
        }
        
        return null;
    });