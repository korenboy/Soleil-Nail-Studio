# 🌐 הגדרות DNS נדרשות עבור soleilnailstudio.co.il

שלושת הסעיפים האחרונים שנסרקו על ידי Rowly (CAA, DMARC, SPF) הם **רשומות DNS** ברמת השרת של שמות המתחם (Nameservers).
הדומיין שלך מנוהל כרגע ב-**JetServer** (`ns1.jetdns.net` - `ns4.jetdns.net`).

כדי לפתור אותם ב-100%, יש להוסיף את הרשומות הבאות באזור ניהול ה-DNS (Zone Editor) ב-JetServer / cPanel:

---

## 1. רשומות CAA (הגבלת מנפיקי תעודות SSL)
מגדיר שרק Let's Encrypt ו-Google רשאים להנפיק תעודות SSL לדומיין שלך:

| Type | Name / Host | TTL | Flag | Tag | Value |
|---|---|---|---|---|---|
| `CAA` | `soleilnailstudio.co.il` (או `@`) | `3600` | `0` | `issue` | `"letsencrypt.org"` |
| `CAA` | `soleilnailstudio.co.il` (או `@`) | `3600` | `0` | `issuewild` | `"letsencrypt.org"` |
| `CAA` | `soleilnailstudio.co.il` (או `@`) | `3600` | `0` | `issue` | `"pki.goog"` |
| `CAA` | `soleilnailstudio.co.il` (או `@`) | `3600` | `0` | `issuewild` | `"pki.goog"` |

---

## 2. רשומת DMARC (הגנה מפני התחזות למיילים)
מגדיר לספקי דואר מה לעשות אם מישהו שולח מייל מזויף בשם הדומיין:

| Type | Name / Host | TTL | Value |
|---|---|---|---|
| `TXT` | `_dmarc.soleilnailstudio.co.il` (או `_dmarc`) | `3600` | `"v=DMARC1; p=quarantine; rua=mailto:security@soleilnailstudio.co.il; pct=100; adkim=r; aspf=r"` |

---

## 3. רשומת SPF (הגדרת שרתי דואר מורשים)
מונע משרתים זרים לשלוח דואר אלקטרוני מתחזה בשמך:

| Type | Name / Host | TTL | Value |
|---|---|---|---|
| `TXT` | `soleilnailstudio.co.il` (או `@`) | `3600` | `"v=spf1 -all"` |

*(אם בעתיד תשתמשי ב-Google Workspace / Gmail תחת הדומיין, הערך יהיה: `"v=spf1 include:_spf.google.com ~all"`).*
