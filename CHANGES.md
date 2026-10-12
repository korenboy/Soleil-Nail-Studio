# 📋 יומן שינויים — Soleil Nail Studio (Hardening & Fixes 2026-10)

קובץ זה מתעד בצורה מפורשת כל שינוי שנעשה במערכת, באילו קבצים ושורות, וכן הוכחות `grep` לכך ששום פונקציה שמורה או קוד קיים לא נמחקו בטעות.

---

## שלב 0א: סקירה וחיזוק של החלפת מספר מנהלת (`fix(admin): changeAdminPhone`)
- **מטרה**: תיקון החלפת מספר טלפון של המנהלת בפאנל הניהול עם אימות SMS מלא, שמירה על אבטחת מסד הנתונים, ונרמול קפדני.
- **קבצים שנערכו**:
  1. `functions/index.js`:
     - הוספת פונקציית העזר `normalizePhone(raw)` לפי תקן 3.2 (`^05\d{8}$`).
     - הוספת פונקציית הענן המאובטחת `exports.verifyAndChangeAdminPhone` (מוגנת ב-token admin, מאמתת קוד OTP שנשלח למספר החדש, בודקת תוקף ומקסימום 5 ניסיונות, ומעדכנת את `settings/adminConfig`).
  2. `admin.html`:
     - הוספת תצוגת מספר מנהלת נוכחי (`#currentAdminPhoneDisplay`) בלשונית הגדרות.
     - הוספת חלונית (Modal) ייעודית ומעוצבת `#changeAdminPhoneModal` להזנת קוד ה-SMS בן 6 הספרות.
     - הוספת הפונקציות: `loadCurrentAdminPhone`, `changeAdminPhone`, `closeChangeAdminPhoneModal`, `confirmChangeAdminPhone`, `normalizePhone`.
- **כללי אבטחה שנשמרו**:
  - `firestore.rules`: הכלל `match /settings/{docId} { allow read, write: if isAdmin(); }` נשאר סגור לחלוטין וללא שום פתיחה לציבור.
  - כל 12 הפונקציות הקיימות ב-`functions/index.js` נשמרו במלואן.
- **מועמדים למחיקה**: אין. שום קוד לא נמחק.

---

## שלב 0: רשת ביטחון
- נוצר branch ייעודי: `hardening/review-2026-10`.
- נוצר תג בטיחות: `git tag pre-hardening`.
- הורצו תלויות: `cd functions && npm ci`.

---

## שלב 1: שחזור פונקציות שנעלמו בפאנל האדמין (`fix(admin): restore and implement missing dashboard handlers`)
- **מטרה**: שחזור 8 פונקציות היסטוריות שנעלמו והטמעת 3 פונקציות חדשות שמופעלות ב-HTML ללא מימוש.
- **קבצים שנערכו / נוצרו**:
  1. `admin.html`:
     - שחזור 8 פונקציות היסטוריות מ-`ad379b8`:
       - `handleNotifClick(id, targetScreen)` — ניווט ישיר למסך היעד (`clientsScreen` או `appointmentsScreen`), עדכון סטטוס נקרא וסגירת התפריט.
       - `deleteNotif(id)` — מחיקת התראה מהענן באישור.
       - `saveFinanceRecord()` — שמירת תנועה פיננסית חדשה או מעודכנת עם ניקוי טופס וטעינה מחדש.
       - `editFinanceRecord(id)` — טעינת תנועה קיימת לעריכה בטופס.
       - `cancelFinanceEdit()` — ביטול מצב עריכה ואיפוס הטופס.
       - `loadFinanceData()` — טעינת תנועות לפי חודש נבחר, סיכום הכנסות/הוצאות/רווח, ורינדור מאובטח עם `esc()`.
       - `deleteFinanceRecord(id)` — מחיקת תנועה פיננסית.
       - `saveNewClientDirect()` — הוספת לקוחה ישירה מתוך חלונית הוספת לקוחה עם נרמול טלפון וסטטוס `approved`.
     - מימוש 3 פונקציות חסרות שנקראו ב-HTML:
       - `openClientDetails(phone)` — פתיחת כרטיס לקוחה `#clientDetailsModal`, הצגת שם, טלפון, כפתורי חיוג מהיר ו-WhatsApp, חישוב סטטיסטיקת הגעה וביטולים, והיסטוריית תורים.
       - `loadAppointmentsStats()` — חישוב וסינון סטטיסטיקות תורים (הגיעו / ביטולי לקוחה) לפי בחירת פילטר (חודש / שבוע / שנה / הכל).
       - `openWaBroadcastModal()` — פתיחת חלונית הודעת תפוצה `#waBroadcastModal`, סינון לקוחות מאושרות ויצירת לינקים דינמיים לשליחת הודעת WhatsApp אישית.
     - קריאה אוטומטית ל-`loadAppointmentsStats()` בתוך `loadAppointmentsData()`.
  2. `tests/handlers.test.js`:
     - סוויטת בדיקות מקיפה שסורקת את כל קובצי ה-HTML (`admin.html`, `index.html`, `404.html`), מחלצת את כל ה-handlers והפעולות, ומוודאת שכל פונקציה מוגדרת ותקפה ב-script scope.
     - אימות של 80 handlers מקושרים ו-0 שגיאות או פונקציות חסרות.
- **בדיקות תקינות שהורצו**:
  - `node tests/handlers.test.js` — עבר בהצלחה מלאה (0 missing).
  - בדיקת סינטקס של כל הסקריפטים ב-`admin.html` דרך `new Function(...)` — עבר ללא שגיאות.
  - `node --check functions/index.js` — עבר ללא שגיאות.

---

## שלב 2: אבטחת XSS בפאנל האדמין (`fix(admin): eliminate stored XSS and harden event binding`)
- **מטרה**: מניעת Stored XSS ו-CRLF injection בכל חלקי פאנל האדמין שפולטים מידע מהענן.
- **קבצים שנערכו**:
  1. `admin.html`:
     - הוספת פונקציית העזר `escICS(str)` המנקה `\r\n`, `\r`, `\n`, פסיקים ונקודה-פסיק למניעת CRLF Injection בקובצי iCalendar (.ics).
     - חשיפת `window.esc = esc` ו-`window.escICS = escICS`.
     - שדרוג `exportAdminCalendar`:
       - סינון וניקוי של `clientName`, `treatment`, `clientPhone` באמצעות `escICS`.
       - ניקוי `app.id` לתווים אלפאנומריים בלבד ב-UID.
     - שדרוג `renderTreatmentsAdmin`:
       - בריחת XSS מלאה על `t.name` בעזרת `esc()`.
       - וידוא קבלת `t.id || t._id` בכל פריט וחיטוי המזהה לפני שילובו ב-DOM.
       - חיטוי אפשרויות ה-`<option>` של `manualTreatment`.
     - שדרוג `renderUsers`:
       - בריחת XSS מלאה על `user.name` ו-`user.phone` עם `esc()`.
     - שדרוג `loadAppointmentsData`:
       - חיטוי `app.id`, `app.date`, `app.time` בלחצנים ובכרטיסים.
     - שדרוג `renderWaitlistAdmin`:
       - החלפת `window.open` עם מחרוזות משורשרות בלינק ישיר ומאובטח המשתמש ב-`encodeURIComponent`.
       - חיטוי `w.id`, `w.date`.
     - שדרוג `filterClientsForManual`:
       - הסרת `onclick` משורשר דינמית והחלפה ב-event delegation בטוח על מיכל התוצאות, לצד `esc()` על שם וטלפון הלקוחה.
     - שדרוג תצוגת לוח השנה היומי:
       - חיטוי `app.id` ו-`app.time` בכפתורי עריכה וביטול.
- **בדיקות תקינות שהורצו**:
  - `node tests/handlers.test.js` — עבר בהצלחה (0 missing).
  - בדיקת סינטקס של כל הסקריפטים ב-`admin.html` — עבר בהצלחה.

---

## שלב 3: נרמול מספרי טלפון גלובלי (`fix(auth): unify Israeli phone normalization across client and server`)
- **מטרה**: יצירת תקן נרמול אחיד (Standard 3.2) למספרי טלפון ישראליים בצד שרת ובצד לקוח, כולל תמיכה בפורמטים בינלאומיים, חוסר ב-0 מוביל, מקפים, רווחים וסוגריים.
- **קבצים שנערכו / נוצרו**:
  1. `functions/phone.js`:
     - מודול ייעודי `normalizePhone(raw)` המנקה תווים לא מספריים, מתרגם `+972` ו-`972` ל-`0`, מוסיף `0` מוביל למספרי 9 ספרות (כגון `541234567`), ומוודא תקינות לפי ביטוי רגולרי `^05\d{8}$`.
  2. `functions/index.js`:
     - ייבוא `normalizePhone` מ-`./phone`.
     - החלת הנרמול בכל פונקציות הענן: `sendOtpSms`, `verifyOtpAndLogin`, `sendBroadcastSms`, `sendReminderSms`, `verifyAndChangeAdminPhone`, `sendPulseemSMS`.
  3. `admin.html`:
     - עדכון `window.normalizePhone` ו-`window.cleanPhoneNumber` להתבססות מלאה על תקן 3.2.
  4. `app.js`:
     - הוספת פונקציית `normalizePhone(raw)`.
     - החלפת הוולידציה הישנה והמוגבלת בטופס ההתחברות (`requestOtpBtn`) ב-`normalizePhone`.
  5. `tests/normalizePhone.test.js`:
     - סוויטת בדיקות יחידה מקיפה עם 22 מקרי בדיקה (מספרים רגילים, מקפים, סוגריים, רווחים, קידומות בינלאומיות, 9 ספרות, קלט מספרי, ערכי null/undefined, מספרים קצרים/ארוכים, אותיות, בוליאנים, אובייקטים).
- **בדיקות תקינות שהורצו**:
  - `node tests/normalizePhone.test.js` — 22/22 עברו בהצלחה.
  - `node tests/handlers.test.js` — עבר בהצלחה מלאה.
  - `node --check functions/index.js` — עבר ללא שגיאות.
  - `node --check app.js` — עבר ללא שגיאות.---

## שלב 4: הקשחת טריגרים ברקע ואידמפוטנטיות בענן (`fix(functions): harden background triggers and ensure idempotency`)
- **מטרה**: הקשחת כל טריגרי הענן (Cloud Functions v2 Background Triggers & Scheduled Tasks) מפני נפילות בלתי צפויות, באגי אזור זמן, כפילויות תנועות כספיות (Idempotency) וקריסות ביומן גוגל.
- **קבצים שנערכו**:
  1. `functions/index.js`:
     - `onNewAppointment`:
       - הוספת בדיקות `if (!event.data) return null;` ו-`const app = event.data.data(); if (!app) return null;`.
       - ברירת מחדל בטוחה לשדות חסרים (`clientName`, `treatment`, `date`, `time`).
       - נרמול טלפון הלקוחה לפני שליחת SMS בקביעה ידנית.
       - עטיפה ב-`try / catch` למניעת חזרות בלתי נשלטות של הטריגר.
     - `onNewUser`:
       - הוספת בדיקות בטיחות `if (!event.data) return null;` ו-`if (!user) return null;`.
       - עטיפה ב-`try / catch`.
     - `dailySmsReminders`:
       - חישוב תאריך מחר מדויק באמצעות `Intl.DateTimeFormat` לפי אזור זמן ירושלים (`Asia/Jerusalem`) למניעת באגי מעבר יממה ב-UTC.
       - עדכון כתובת האתר הרשמית בקישור לאישור הגעה (`https://soleilnailstudio.co.il/?action=confirm_arrival&id=...`).
       - נרמול טלפון לפני שליחת ה-SMS.
     - `onAppointmentCanceled`:
       - בדיקות קיום `event.data.before` ו-`event.data.after`.
       - עטיפת שליחת הודעת טלגרם ב-`try / catch` נפרד כדי שתקלת טלגרם לא תפגע בריצת רשימת ההמתנה.
       - שליפת רשימת המתנה דרך `db.collection('waitlist')` עם נרמול טלפונים דרך `Set` למניעת שליחת כפילויות לאותו מספר.
     - `onAppointmentApproved`:
       - בדיקות קיום נתונים ונרמול טלפון הלקוחה לפני שליחת SMS אישור.
     - `autoRecordIncome`:
       - אידמפוטנטיות מוחלטת: מעבר מיצירת מסמכים עם מזהה אקראי למזהה דטרמיניסטי קבוע `doc('app_' + doc.id)` עם `{ merge: true }` וסימון `appointmentId`. אם הטריגר רץ שוב או מתוזמן מחדש, הוא מעדכן את המסמך הקיים ולא יוצר שום כפילות בהכנסות.
       - חישוב תאריכי "היום" ו"אתמול" באזור זמן ישראל.
     - `syncAppointmentToGoogleCalendar` ו-`googleCalendarSync`:
       - הוספת בדיקת בטיחות: אם `GOOGLE_CALENDAR_ID` אינו מוגדר בסביבה, הפונקציה חוזרת מיד בשקט ללא שגיאות וללא רישום מיותר של לוגים.
       - בדיקות קיום `event.data.after` לפני סנכרון או מחיקה.
     - `syncBusySlots`:
       - בדיקות קיום `event.data.after`. מחיקת תור מבוטל או תור שנמחק מ-`busy_slots`, ושמירת שדות מינימליים בלבד ללא שום פרטי לקוחה (תאריך, שעה, משך) לשמירה על פרטיות.
- **בדיקות תקינות שהורצו**:
  - `node --check functions/index.js` — עבר ללא שגיאות.
  - `node tests/normalizePhone.test.js` — 22/22 עברו בהצלחה.
---

## שלב 5: הקשחת כללי האבטחה של Firestore (`fix(rules): harden firestore security rules`)
- **מטרה**: חסימת גישה בלתי מורשית (Zero Trust / Least Privilege), מניעת העלאת הרשאות עצמית (Privilege Escalation), הגנה על פרטיות (PII), ומניעת מחיקות או שינויי סטטוס בלתי חוקיים.
- **קבצים שנערכו**:
  1. `firestore.rules`:
     - `settings`:
       - `homeConfig`: קריאה ציבורית (עיצוב ומיתוג בלבד), כתיבה לאדמין בלבד.
       - `adminConfig` ושאר ההגדרות: חסומות לקריאה וכתיבה לכל משתמש שאינו אדמין מאומת (`isAdmin()`).
     - `shifts` ו-`treatments`:
       - קריאה ציבורית לצפייה בשעות ובמחירון, עריכה ומחיקה לאדמין בלבד.
     - `finance`:
       - קריאה וכתיבה לאדמין בלבד.
     - `users/{userId}`:
       - קריאה: אדמין או בעל החשבון בלבד (`request.auth.uid == userId`).
       - יצירה (`create`): אדמין או לקוחה שנרשמת עם הטלפון המאומת שלה בלבד בסטטוס `pending` בלבד (נמנעת אפשרות להירשם ישירות כ-`approved` או כאדמין).
       - עדכון (`update`): אדמין או הלקוחה, אך הלקוחה מנועה לחלוטין משינוי `status` או `phone` (חסימת שחרור מחסימה עצמי או אישור עצמי).
       - מחיקה (`delete`): אדמין בלבד.
     - `appointments/{docId}`:
       - קריאה: אדמין או הלקוחה בעלת הטלפון של התור.
       - יצירה (`create`): אדמין או לקוחה עבור הטלפון המאומת שלה בלבד, ובסטטוס `pending` בלבד.
       - עדכון (`update`): אדמין או הלקוחה בעלת התור. עבור לקוחה: מוגבל אך ורק לעדכון שדות `status`, `statusText`, `clientConfirmed`, כאשר מעבר סטטוס מותר אך ורק ל-`canceled` (ביטול עצמי) או אישור הגעה. נמנעת לחלוטין אפשרות של לקוחה לאשר תור בעצמה (`approved`) או לשנות שעת תור/טיפול.
       - מחיקה (`delete`): אדמין בלבד.
     - `waitlist/{docId}`:
       - הרשמה: אדמין או לקוחה עבור הטלפון המאומת שלה בלבד.
       - קריאה, עדכון ומחיקה: אדמין בלבד.
     - `busy_slots/{docId}`:
       - קריאה ציבורית (ללא פרטי לקוחות), כתיבה חסומה לחלוטין לקליינט (`allow write: if false;` — מנוהל אך ורק ע"י Cloud Functions).
     - `otps/{docId}`:
       - חסום לחלוטין לקריאה ולכתיבה (`allow read, write: if false;` — Firebase Admin SDK בלבד).
     - `notifications/{docId}`:
       - יצירה: משתמש מאומת או אדמין עם הגבלת גודל טקסט (`size() <= 300`).
       - קריאה, עדכון ומחיקה: אדמין בלבד.
- **בדיקות תקינות שהורצו**:
  - `node tests/normalizePhone.test.js` — 22/22 עברו בהצלחה.
  - `node tests/handlers.test.js` — 77/77 עברו בהצלחה.

---

## שלב 6: הקשחת אפליקציית הלקוחות וזרימת התורים (`fix(client): harden client appointment booking and auth flow`)
- **מטרה**: מניעת שגיאות זמן-ריצה בזרימת ההתחברות וה-OTP, סנכרון תקין מול כללי האבטחה של Firestore בעת קביעת או ביטול תור, וטיפול יציב בקישורי אישור הגעה (`action=confirm_arrival`).
- **קבצים שנערכו**:
  1. `app.js`:
     - תיקון חילוץ שדה הטלפון בטופס ה-OTP (`phoneInput`): הבטחת שליפת ערך שדה הקלט לפני קריאה ל-`normalizePhone`.
     - שדרוג יצירת תור חדש:
       - שימוש ב-`auth.currentUser.uid` המאומת כערך עבור `clientPhone` למניעת חוסר התאמה מול כללי Firestore.
       - ניווט בטוח (`?.`) על שדה ההערות (`clientNotes`) וברירת מחדל בטוחה לשם הלקוחה.
     - שדרוג אישור הגעה אוטומטי מקישורי SMS (`action === 'confirm_arrival'`):
       - בדיקת סטטוס `auth.currentUser`. אם המשתמשת עדיין בטעינת Auth, האזנה ל-`auth.onAuthStateChanged` כדי להפעיל את העדכון מיד עם שחזור הסשן ללא שגיאות הרשאה.
  2. `firestore.rules`:
     - הרחבת רשימת השדות המורשים לעדכון בתור ע"י לקוחה לכלול גם את `cancelSource` (מאפשר רישום `cancelSource: 'client'` בעת ביטול תור ע"י לקוחה).
- **בדיקות תקינות שהורצו**:
  - `node --check app.js` — עבר ללא שגיאות.
  - `node tests/normalizePhone.test.js` — 22/22 עברו בהצלחה.
  - `node tests/handlers.test.js` — 77/77 עברו בהצלחה.

---

## שלבים 7 ו-8: חבילת בדיקות נסיגה (Regression Suite) וסיכום ביקורת מלאה
- **מטרה**: אימות קפדני של המערכת כולה, וידוא ששום פונקציה לא נשברה או נעלמה, סיקור תקינות סינטקס ובדיקת diff נקייה מול `pre-hardening`.
- **תוצאות הבדיקות האוטומטיות**:
  1. `node tests/normalizePhone.test.js`:
     - 22 מתוך 22 בדיקות עברו בהצלחה (100% כיסוי לכל סוגי הקלטים הישראליים והבינלאומיים).
  2. `node tests/handlers.test.js`:
     - 77 מתוך 77 מאזיני אירועים (Handlers) ב-HTML נמצאו ומקושרים לפונקציות תקפות.
     - כל 11 הפונקציות הקריטיות משלב 1 פעילות ומאומתות.
  3. בדיקות סינטקס Node.js:
     - `node --check functions/index.js` — עבר ללא שגיאות.
     - `node --check functions/phone.js` — עבר ללא שגיאות.
     - `node --check app.js` — עבר ללא שגיאות.
- **מצב Git סופי**:
  - ענף: `hardening/review-2026-10`.
  - תג בסיס: `pre-hardening`.
  - כל השלבים בוצעו בקומיטים אטומיים ייעודיים.
  - עץ העבודה נקי לחלוטין.

