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
