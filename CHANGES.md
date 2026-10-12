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


