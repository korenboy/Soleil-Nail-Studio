const { onCall } = require('firebase-functions/v2/https');
    const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
    const { onSchedule } = require('firebase-functions/v2/scheduler');
    const admin = require('firebase-admin');
    const axios = require('axios');

    admin.initializeApp();
    const db = admin.firestore();

    // הגדרות טלגרם
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; 
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID; 
    const ADMIN_APP_URL = "https://soleilnailstudio.co.il/admin.html";

    const { onDocumentWritten } = require('firebase-functions/v2/firestore');
    const { google } = require('googleapis');

    const { normalizePhone } = require('./phone');

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

    // ====== פונקציות ה-SMS מול האפליקציה (גרסה מחוזקת ומוגנת) ======

    exports.sendOtpSms = onCall({ cors: true, invoker: "public" }, async (request) => {
        try {
            const rawPhone = request.data.phone || request.data.phoneNumber;
            const phone = normalizePhone(rawPhone);
            if (!phone) throw new Error("מספר טלפון לא תקין. יש להזין מספר נייד ישראלי תקין.");

            const otpRef = db.collection('otps').doc(phone);
            const existing = await otpRef.get();
            
            // הגנת ספאם: חובה לחכות דקה שלמה בין בקשת SMS אחת לשנייה!
            if (existing.exists && Date.now() - (existing.data().timestamp?.toMillis() || 0) < 60000) {
                return { success: false, error: "אנא המתיני דקה לפני בקשת קוד נוסף" };
            }

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            
            // שומרים את הקוד, מאפסים את מונה הניסיונות ל-0, ושומרים שעה מדויקת
            await otpRef.set({ 
                code: otp, 
                attempts: 0, 
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

    // 🌟 פונקציית האימות המאובטחת עם הגנת פריצות ותג מנהלת 🌟
    exports.verifyOtpAndLogin = onCall({ cors: true, invoker: "public" }, async (request) => {
        try {
            const rawPhone = request.data.phone || request.data.phoneNumber;
            const phone = normalizePhone(rawPhone);
            const { code } = request.data;
            if (!phone || !code) throw new Error("מספר טלפון או קוד אימות חסר או לא תקין");

            const otpRef = db.collection('otps').doc(phone);
            const doc = await otpRef.get();

            if (!doc.exists) return { success: false, error: "לא נשלח קוד למספר הזה" };
            
            const data = doc.data();
            
            // הגנת תוקף: הקוד יפוג אוטומטית אחרי 5 דקות
            if (Date.now() - (data.timestamp?.toMillis() || 0) > 5 * 60 * 1000) {
                return { success: false, error: "הקוד פג תוקף, אנא בקשי חדש" };
            }
            
            // הגנת פריצה (Brute-force): מקסימום 5 ניסיונות שגויים
            if ((data.attempts || 0) >= 5) {
                return { success: false, error: "יותר מדי ניסיונות שגויים. בקשי קוד חדש." };
            }

            // אם הלקוחה טעתה בקוד - מעלים את מונה הניסיונות ב-1
            if (data.code !== code) {
                await otpRef.update({ attempts: admin.firestore.FieldValue.increment(1) });
                return { success: false, error: "קוד שגוי" };
            }

            // הקוד נכון! מוחקים אותו כדי שלא ישמש פעמיים
            await otpRef.delete();

            // 👑 בדיקה חכמה לזיהוי המנהלת (נטלי) עם נרמול טלפונים 👑
            let isAdmin = false;
            const adminConfig = await db.collection('settings').doc('adminConfig').get();
            if (adminConfig.exists && adminConfig.data()?.adminPhone) {
                const dbAdminPhone = normalizePhone(adminConfig.data().adminPhone) || adminConfig.data().adminPhone.replace(/[\s\-+]/g, '');
                const cleanIncoming = normalizePhone(phone) || phone.replace(/[\s\-+]/g, '');

                if (dbAdminPhone === cleanIncoming) {
                    isAdmin = true;
                }
            } else {
                // ברירת מחדל ראשונית אם המסמך טרם נוצר במסד הנתונים
                const defaultAdmin = "0501234567";
                if (normalizePhone(phone) === defaultAdmin) {
                    isAdmin = true;
                    await db.collection('settings').doc('adminConfig').set({
                        adminPhone: defaultAdmin,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                }
            }

            // המרת ההצלחה לטוקן מאובטח רשמי של פיירבייס, ו"הדבקת" תג מנהלת במידת הצורך!
            const customToken = await admin.auth().createCustomToken(phone, { admin: isAdmin });

            return { success: true, token: customToken, isAdmin: isAdmin };
        } catch (error) {
            console.error("ERROR IN VERIFY:", error);
            return { success: false, error: error.message };
        }
    });

    exports.sendBroadcastSms = onCall({ cors: true }, async (request) => {
        // 🔥 חסימה: רק מנהלת אמיתית עם טוקן יכולה לשלוח תפוצה! 🔥
        if (!request.auth || request.auth.token.admin !== true) {
            return { success: false, error: "Permission denied. Admin only." };
        }
        const { message, phones } = request.data;
        if (phones && Array.isArray(phones)) {
            for (const rawPhone of phones) {
                const phone = normalizePhone(rawPhone);
                if (phone) await sendPulseemSMS(phone, message);
            }
        }
        return { success: true };
    });

    exports.sendReminderSms = onCall({ cors: true }, async (request) => {
        // 🔥 חסימה: רק מנהלת יכולה לשלוח תזכורות ידניות! 🔥
        if (!request.auth || request.auth.token.admin !== true) {
            return { success: false, error: "Permission denied. Admin only." };
        }
        const { clientName, date, time, id } = request.data; 
        const phone = normalizePhone(request.data.phone);
        if (!phone) {
            return { success: false, error: "מספר טלפון לא תקין." };
        }
        const address = process.env.CLINIC_ADDRESS || "";
        const confirmLink = `https://soleilnailstudio.co.il/?action=confirm_arrival&id=${id}`;
        
        await sendPulseemSMS(phone, `היי ${clientName}, תזכורת לתור ב-Soleil ב-${date} בשעה ${time} ✨\n\nלאישור הגעה לחצי כאן:\n${confirmLink}\n\nכתובתנו: ${address}`);
        return { success: true };
    });

    // 🌟 שינוי מספר מנהלת מאובטח עם אימות SMS מלא - מוגן בטוקן Admin 🌟
    exports.verifyAndChangeAdminPhone = onCall({ cors: true }, async (request) => {
        try {
            if (!request.auth || request.auth.token.admin !== true) {
                return { success: false, error: "אין הרשאה. פעולה זו מותרת למנהלת מחוברת בלבד." };
            }

            const { newPhone, code } = request.data;
            if (!newPhone || !code) {
                return { success: false, error: "חסר מספר טלפון או קוד אימות." };
            }

            const cleanPhone = normalizePhone(String(newPhone));
            if (!cleanPhone) {
                return { success: false, error: "מספר טלפון לא תקין. יש להזין מספר נייד ישראלי תקין בן 10 ספרות (לדוגמה: 0501234567)." };
            }

            const otpRef = db.collection('otps').doc(cleanPhone);
            let otpDoc = await otpRef.get();
            if (!otpDoc.exists) {
                const rawDoc = await db.collection('otps').doc(String(newPhone).trim()).get();
                if (rawDoc.exists) otpDoc = rawDoc;
            }

            if (!otpDoc.exists) {
                return { success: false, error: "לא נמצא קוד אימות פעיל למספר זה. שלחי קוד שוב." };
            }

            const otpData = otpDoc.data();

            if (Date.now() - (otpData.timestamp?.toMillis() || 0) > 5 * 60 * 1000) {
                return { success: false, error: "הקוד פג תוקף. שלחי קוד חדש." };
            }

            if ((otpData.attempts || 0) >= 5) {
                return { success: false, error: "יותר מדי ניסיונות שגויים. שלחי קוד חדש." };
            }

            if (String(otpData.code).trim() !== String(code).trim()) {
                await otpDoc.ref.update({ attempts: admin.firestore.FieldValue.increment(1) });
                return { success: false, error: "קוד אימות שגוי. נסי שוב." };
            }

            await otpDoc.ref.delete();

            await db.collection('settings').doc('adminConfig').set({
                adminPhone: cleanPhone,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedBy: request.auth.uid
            }, { merge: true });

            console.log(`Admin phone successfully updated to: ${cleanPhone}`);
            return { success: true, newPhone: cleanPhone };
        } catch (error) {
            console.error("ERROR IN VERIFYANDCHANGEADMINPHONE:", error);
            return { success: false, error: error.message };
        }
    });

    exports.onNewAppointment = onDocumentCreated('appointments/{appId}', async (event) => {
        try {
            if (!event.data) return null;
            const app = event.data.data();
            if (!app) return null;
            const appId = event.params.appId;
            
            // 1. אם הלקוחה קבעה בעצמה (הסטטוס ממתין) -> נשלח הודעה לנטלי בטלגרם לאישור
            if (app.status === 'pending') {
                const text = `🗓 <b>תור חדש ל-Soleil!</b>\n\n👤 ${app.clientName || 'לקוחה'}\n💅 ${app.treatment || ''}\n📅 ${app.date || ''} | ${app.time || ''}\n\n<a href="${ADMIN_APP_URL}?action=approve_app&id=${appId}">✅ לאישור</a>`;
                await sendTelegramMessage(text);
            } 
            // 2. אם נטלי קבעה ידנית (הסטטוס נוצר מראש כמאושר) -> נשלח SMS ללקוחה
            else if (app.status === 'approved') {
                const phone = normalizePhone(app.clientPhone);
                if (phone) {
                    const address = process.env.CLINIC_ADDRESS || "";
                    const msg = `היי ${app.clientName || ''}, נקבע לך תור חדש ב-Soleil! ✨\nניפגש ב-${app.date || ''} בשעה ${app.time || ''}.\nכתובתנו: ${address}`;
                    await sendPulseemSMS(phone, msg);
                    console.log(`Manual booking SMS sent to ${app.clientName || phone}`);
                }
            }
        } catch (err) {
            console.error("Error in onNewAppointment trigger:", err);
        }
        return null;
    });

    exports.onNewUser = onDocumentCreated('users/{phone}', async (event) => {
        try {
            if (!event.data) return null;
            const user = event.data.data();
            if (!user) return null;
            const phone = event.params.phone;
            if (user.status === 'pending') {
                const text = `👥 <b>לקוחה חדשה!</b>\n\n👤 ${user.name || 'לקוחה'}\n📞 ${phone}\n\n<a href="${ADMIN_APP_URL}?action=approve_user&phone=${phone}">✅ לאישור</a>`;
                await sendTelegramMessage(text);
            }
        } catch (err) {
            console.error("Error in onNewUser trigger:", err);
        }
        return null;
    });

    // ====== שעון מעורר לתזכורות אוטומטיות ======

    exports.dailySmsReminders = onSchedule({
        schedule: 'every day 20:00',
        timeZone: 'Asia/Jerusalem'
    }, async (event) => {
        try {
            // חישוב תאריך מחר לפי אזור הזמן של ישראל באופן מדויק ומוגן מבאגי UTC
            const nowParts = new Intl.DateTimeFormat('en-US', {
                timeZone: 'Asia/Jerusalem',
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            }).formatToParts(new Date());

            const y = parseInt(nowParts.find(p => p.type === 'year').value, 10);
            const m = parseInt(nowParts.find(p => p.type === 'month').value, 10) - 1;
            const d = parseInt(nowParts.find(p => p.type === 'day').value, 10);

            const todayInIL = new Date(Date.UTC(y, m, d));
            todayInIL.setUTCDate(todayInIL.getUTCDate() + 1);
            const tomorrowStr = todayInIL.toISOString().split('T')[0];
            const address = process.env.CLINIC_ADDRESS || "";

            const snapshot = await db.collection('appointments')
                .where('fullDate', '==', tomorrowStr)
                .where('status', '==', 'approved')
                .where('reminderSmsSent', '==', false)
                .get();

            if (snapshot.empty) return null;

            for (const doc of snapshot.docs) {
                const app = doc.data();
                const phone = normalizePhone(app.clientPhone);
                if (!phone) continue;

                const confirmLink = `https://soleilnailstudio.co.il/?action=confirm_arrival&id=${doc.id}`;
                const msg = `היי ${app.clientName || ''}, תזכורת לתור ב-Soleil מחר (${app.date || ''}) בשעה ${app.time || ''} ✨\n\nלאישור הגעה לחצי כאן:\n${confirmLink}\n\nכתובתנו: ${address}`;
                const success = await sendPulseemSMS(phone, msg);
                if (success) await doc.ref.update({ reminderSmsSent: true });
            }
        } catch (error) {
            console.error("Error in dailySmsReminders:", error);
        }
        return null;
    });
    // ============================================================================
    // אוטומציה: התראת טלגרם למנהלת + שליחת SMS אוטומטי לרשימת המתנה בעת ביטול תור
    // ============================================================================
    exports.onAppointmentCanceled = onDocumentUpdated('appointments/{appId}', async (event) => {
        try {
            if (!event.data || !event.data.before || !event.data.after) return null;
            const before = event.data.before.data();
            const after = event.data.after.data();
            if (!before || !after) return null;

            // בודק אם הסטטוס השתנה עכשיו ל-"canceled" (בוטל)
            if (before.status !== 'canceled' && after.status === 'canceled') {
                const date = after.date || ""; // לדוגמה: "24.06"
                const fullDate = after.fullDate || ""; // לדוגמה: "2026-06-24"
                const time = after.time || "";
                const clientName = after.clientName || "לקוחה";

                console.log(`Appointment canceled by ${clientName} on ${date} at ${time}. Starting automation...`);

                // 1. שליחת התראה לנטלי בטלגרם
                const telegramMsg = `❌ ביטול תור:\nהלקוחה ${clientName} הרגע ביטלה את התור שלה בתאריך ${date} בשעה ${time}.\nהמערכת בודקת כעת את רשימת ההמתנה.`;
                
                try {
                    await sendTelegramMessage(telegramMsg); 
                } catch (err) {
                    console.error("Failed to send Telegram cancel alert", err);
                }

                // 2. חיפוש בנות ברשימת ההמתנה של אותו תאריך
                try {
                    const waitlistSnapshot = await db.collection('waitlist').where('fullDate', '==', fullDate).get();
                    
                    if (!waitlistSnapshot.empty) {
                        const phonesToAlert = new Set();
                        waitlistSnapshot.forEach(doc => {
                            const rawPhone = doc.data().clientPhone;
                            const p = normalizePhone(rawPhone);
                            if (p) phonesToAlert.add(p);
                        });

                        const uniquePhones = Array.from(phonesToAlert);

                        // 3. שליחת SMS לבנות הממתינות
                        if (uniquePhones.length > 0) {
                            const smsMsg = `היי! התפנה תור מפתיע בקליניקה בתאריך ${date} בשעה ${time}. מהרי לתפוס אותו באפליקציה לפני שייתפס: https://soleilnailstudio.co.il`;
                            
                            for (const phone of uniquePhones) {
                                await sendPulseemSMS(phone, smsMsg);
                            }
                            
                            console.log(`Waitlist SMS sent to ${uniquePhones.length} clients.`);
                            
                            // עדכון נוסף לנטלי ש-SMS נשלח
                            try {
                                await sendTelegramMessage(`✅ הודעת SMS נשלחה אוטומטית ל-${uniquePhones.length} בנות מרשימת ההמתנה!`);
                            } catch (tgErr) {
                                console.error("Failed to send Telegram waitlist count alert", tgErr);
                            }
                        }
                    } else {
                        console.log("No one on the waitlist for this date.");
                    }
                } catch (err) {
                    console.error("Failed to process waitlist automation", err);
                }
            }
        } catch (error) {
            console.error("Error in onAppointmentCanceled trigger:", error);
        }
        return null;
    });

    // ============================================================================
    // אוטומציה: שליחת SMS ללקוחה כשהתור מאושר
    // ============================================================================
    exports.onAppointmentApproved = onDocumentUpdated('appointments/{appId}', async (event) => {
        try {
            if (!event.data || !event.data.before || !event.data.after) return null;
            const before = event.data.before.data();
            const after = event.data.after.data();
            if (!before || !after) return null;

            // בודק אם הסטטוס השתנה מ-pending ל-approved
            if (before.status !== 'approved' && after.status === 'approved') {
                const clientName = after.clientName || "";
                const phone = normalizePhone(after.clientPhone);
                const date = after.date || "";
                const time = after.time || "";
                const address = process.env.CLINIC_ADDRESS || "";

                if (phone) {
                    const msg = `היי ${clientName}, התור שלך ב-Soleil אושר! ✨\nניפגש ב-${date} בשעה ${time}.\nכתובתנו: ${address}`;
                    await sendPulseemSMS(phone, msg);
                    console.log(`Approval SMS sent to ${clientName} for ${date} at ${time}`);
                }
            }
        } catch (error) {
            console.error("Error in onAppointmentApproved trigger:", error);
        }
        return null;
    });

    // ============================================================================
    // אוטומציה: סריקת תורים שהסתיימו ועדכון הכנסות אוטומטי (כל שעה עגולה) - מיועל פי 100!
    // ============================================================================
    exports.autoRecordIncome = onSchedule({ schedule: '0 * * * *', timeZone: 'Asia/Jerusalem' }, async (event) => {
        try {
            const nowParts = new Intl.DateTimeFormat('en-US', {
                timeZone: 'Asia/Jerusalem',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).formatToParts(new Date());

            const getPart = type => (nowParts.find(p => p.type === type) || {}).value || '00';
            const currentYear = getPart('year');
            const currentMonth = getPart('month');
            const currentDay = getPart('day');
            const currentHour = getPart('hour');
            const currentMin = getPart('minute');

            const todayStr = `${currentYear}-${currentMonth}-${currentDay}`;
            const currentTimeStr = `${currentHour}:${currentMin}`;

            // חישוב תאריך אתמול באזור זמן ירושלים
            const todayDate = new Date(Date.UTC(parseInt(currentYear, 10), parseInt(currentMonth, 10) - 1, parseInt(currentDay, 10)));
            todayDate.setUTCDate(todayDate.getUTCDate() - 1);
            const yesterdayStr = todayDate.toISOString().split('T')[0];

            // מושכים אך ורק תורים של "היום" ושל "אתמול"
            const snapshot = await db.collection('appointments')
                .where('fullDate', 'in', [todayStr, yesterdayStr])
                .get();

            if (snapshot.empty) return null;

            // מושכים מחירון עדכני של טיפולים
            const treatmentsSnap = await db.collection('treatments').get();
            const prices = {};
            treatmentsSnap.forEach(doc => {
                let p = doc.data().price;
                prices[doc.data().name] = (typeof p === 'string') ? parseFloat(p.replace(/[^0-9.]/g, '')) || 0 : (p || 0);
            });

            const batch = db.batch();
            let addedCount = 0;

            snapshot.forEach(doc => {
                const app = doc.data();
                
                // סינון: רק תורים מאושרים שעדיין לא נרשמו כהכנסה
                if (app.status !== 'approved') return;
                if (app.financeRecorded) return;

                // מוודאים אישור לקוחה או קביעה ידנית ע"י נטלי
                const isConfirmed = app.clientConfirmed === true || (app.statusText && app.statusText.includes("נקבע ע\"י הקליניקה"));
                if (!isConfirmed) return;

                // בודקים אם שעת התור עברה
                const isPastDay = app.fullDate < todayStr;
                const isPastTimeToday = (app.fullDate === todayStr && app.time <= currentTimeStr);

                if (isPastDay || isPastTimeToday) {
                    const price = prices[app.treatment] || 0;
                    
                    // אידמפוטנטיות: שימוש במזהה דטרמיניסטי app_<appId>
                    const finRef = db.collection('finance').doc(`app_${doc.id}`);
                    batch.set(finRef, {
                        id: finRef.id,
                        appointmentId: doc.id,
                        type: 'income',
                        amount: price,
                        desc: `טיפול: ${app.treatment} (${app.clientName || 'לקוחה'})`,
                        date: app.fullDate,
                        month: (app.fullDate || '').substring(0, 7),
                        timestamp: admin.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });

                    batch.update(doc.ref, { financeRecorded: true });
                    addedCount++;
                }
            });

            if (addedCount > 0) {
                await batch.commit();
                console.log(`Successfully recorded ${addedCount} incomes for completed appointments.`);
            } else {
                console.log("No new completed appointments to record.");
            }
        } catch (error) {
            console.error("Error in autoRecordIncome:", error);
        }
        return null;
    });

    // ============================================================================
    // אוטומציה: סנכרון חי ודו-כיווני מול Google Calendar
    // ============================================================================
    const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

    async function syncAppointmentToGoogleCalendar(appId, appData) {
        if (!GOOGLE_CALENDAR_ID) {
            return;
        }
        try {
            const auth = new google.auth.GoogleAuth({
                scopes: ['https://www.googleapis.com/auth/calendar']
            });
            const calendar = google.calendar({ version: 'v3', auth });
            
            const gEventId = Buffer.from(appId).toString('hex'); 
            
            // אם התור בוטל או שזה לא סטטוס מאושר - נמחק אותו מהיומן
            if (!appData || appData.status !== 'approved') {
                try {
                    await calendar.events.delete({ calendarId: GOOGLE_CALENDAR_ID, eventId: gEventId });
                    console.log(`Deleted event ${gEventId} from Google Calendar`);
                } catch (e) {
                    if (e.code !== 404) console.error("Error deleting event:", e);
                }
                return;
            }

            // חישוב שעות וזמנים
            const [startH, startM] = (appData.time || "00:00").split(':').map(Number);
            const duration = parseInt(appData.duration || 60, 10);
            const endMin = (startH || 0) * 60 + (startM || 0) + duration;
            const endH = String(Math.floor(endMin / 60)).padStart(2, '0');
            const endM = String(endMin % 60).padStart(2, '0');

            const startTimeStr = `${appData.fullDate}T${String(startH || 0).padStart(2, '0')}:${String(startM || 0).padStart(2, '0')}:00`;
            const endTimeStr = `${appData.fullDate}T${endH}:${endM}:00`;

            const event = {
                summary: `💅 ${appData.clientName || 'לקוחה'} - ${appData.treatment || ''}`,
                description: `טלפון: ${appData.clientPhone || ''}\nטיפול: ${appData.treatment || ''}\nמשך: ${duration} דק'`,
                start: { dateTime: startTimeStr, timeZone: 'Asia/Jerusalem' },
                end: { dateTime: endTimeStr, timeZone: 'Asia/Jerusalem' },
                colorId: '4'
            };

            try {
                await calendar.events.get({ calendarId: GOOGLE_CALENDAR_ID, eventId: gEventId });
                await calendar.events.update({ calendarId: GOOGLE_CALENDAR_ID, eventId: gEventId, resource: event });
                console.log(`Updated event ${gEventId} in Google Calendar`);
            } catch (e) {
                if (e.code === 404) {
                    event.id = gEventId;
                    await calendar.events.insert({ calendarId: GOOGLE_CALENDAR_ID, resource: event });
                    console.log(`Inserted new event ${gEventId} to Google Calendar`);
                } else {
                    throw e;
                }
            }
        } catch (error) {
            console.error("Error syncing to Google Calendar:", error);
        }
    }

    // פונקציית האזנה שמזהה *כל* שינוי בתור ומפעילה את הסנכרון
    exports.googleCalendarSync = onDocumentWritten('appointments/{appId}', async (event) => {
        try {
            const appId = event.params.appId;
            
            if (!event.data || !event.data.after || !event.data.after.exists) {
                await syncAppointmentToGoogleCalendar(appId, { status: 'canceled' });
                return null;
            }
            
            const appData = event.data.after.data();
            await syncAppointmentToGoogleCalendar(appId, appData);
        } catch (error) {
            console.error("Error in googleCalendarSync:", error);
        }
        return null;
    });

    // ============================================================================
    // 🚀 אוטומציה: סנכרון זמנים תפוסים (ללא פרטי לקוחות) עבור יומן הלקוחות
    // ============================================================================
    exports.syncBusySlots = onDocumentWritten('appointments/{appId}', async (event) => {
        try {
            const appId = event.params.appId;
            
            if (!event.data || !event.data.after || !event.data.after.exists) {
                await db.collection('busy_slots').doc(appId).delete();
                return null;
            }
            
            const appData = event.data.after.data();
            
            if (!appData || appData.status === 'canceled') {
                await db.collection('busy_slots').doc(appId).delete();
            } else {
                await db.collection('busy_slots').doc(appId).set({
                    id: appId,
                    fullDate: appData.fullDate || '',
                    time: appData.time || '',
                    duration: appData.duration || 60
                }, { merge: true });
            }
        } catch (error) {
            console.error("Error in syncBusySlots:", error);
        }
        return null;
    });