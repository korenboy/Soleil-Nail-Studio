// חיבור ל-Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD7-YseNYz58r2GlnpFxF4IJdi0bUW8_aw",
  authDomain: "nails-by-natali.firebaseapp.com",
  projectId: "nails-by-natali",
  storageBucket: "nails-by-natali.firebasestorage.app",
  messagingSenderId: "979982578170",
  appId: "1:979982578170:web:06c30fff4385d0d4327443"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const functions = firebase.functions();

let currentUserPhone = null;
let currentUserName = null;

db.collection('shifts').onSnapshot(snap => {
    let shifts = [];
    snap.forEach(doc => shifts.push(doc.data()));
    localStorage.setItem('adminShifts', JSON.stringify(shifts));
    if(document.getElementById('datetimeSection') && document.getElementById('datetimeSection').style.display === 'block') {
        renderBookingDays(); 
    }
});

db.collection('appointments').onSnapshot(snap => {
    let apps = [];
    snap.forEach(doc => apps.push(doc.data()));
    localStorage.setItem('myAppointments', JSON.stringify(apps));
    if(document.getElementById('myAppointmentsScreen')?.style.display !== 'none') renderMyAppointments();
    
    if(document.getElementById('datetimeSection') && document.getElementById('datetimeSection').style.display === 'block') {
        let dayCard = document.querySelector('.day-card.selected');
        if(dayCard) {
            let sDate = dayCard.getAttribute('data-fulldate');
            let sDisp = dayCard.getAttribute('data-display');
            let shifts = JSON.parse(localStorage.getItem('adminShifts'))||[];
            let s = shifts.find(x => x.date === sDate);
            if(s) renderBookingTimes(s, sDisp);
        }
    }
});

db.collection('treatments').onSnapshot(snap => {
    const list = document.getElementById('treatmentsList');
    if(!list) return;
    list.innerHTML = '';
    
    if(snap.empty) {
        list.innerHTML = '<p style="text-align:center; color:#777;">הטיפולים בטעינה או שעוד לא הוגדרו...</p>';
        return;
    }

    let treatments = [];
    snap.forEach(doc => {
        let t = doc.data();
        t.id = doc.id;
        treatments.push(t);
    });

    // סידור הטיפולים לפי הסדר שנקבע באדמין
    treatments.sort((a, b) => (a.order || 0) - (b.order || 0));

    treatments.forEach(t => {
        // בודק בוודאות אם נטלי סימנה שזה מחיר התחלתי
        let isStart = (t.isStartingPrice === true || t.isStartingPrice === "true");
        let priceHtml = isStart ? `<span style="font-size: 14px; font-weight: normal; color: #777;">החל מ-</span>${t.price}` : `${t.price}`;
        
        list.innerHTML += `
        <div class="treatment-card" data-duration="${t.duration}">
            <div class="info">
                <h2>${t.name}</h2>
                <p>⏱️ ${t.duration} דקות</p>
            </div>
            <div class="price">${priceHtml} ₪</div>
        </div>`;
    });

    document.querySelectorAll('.treatment-card').forEach(card => { 
        card.addEventListener('click', () => { 
            document.querySelectorAll('.treatment-card').forEach(c => c.classList.remove('selected')); 
            card.classList.add('selected'); 
            window.selectedTreatmentDuration = parseInt(card.getAttribute('data-duration') || "60"); 
        }); 
    });
});

db.collection('settings').doc('homeConfig').onSnapshot(doc => {
    if(doc.exists) {
        localStorage.setItem('appHomeConfig', JSON.stringify(doc.data()));
        let user = JSON.parse(localStorage.getItem('currentUser'));
        if(user) applyHomeConfig(user.name);
    }
});

const mainHeader = document.getElementById('mainHeader');
const loginScreen = document.getElementById('loginScreen');
const pendingApprovalScreen = document.getElementById('pendingApprovalScreen'); 
const homeScreen = document.getElementById('homeScreen');
const myAppointmentsScreen = document.getElementById('myAppointmentsScreen');
const bookingFlow = document.getElementById('bookingFlow');
const summaryScreen = document.getElementById('summaryScreen');

window.selectedTreatmentDuration = 60; 

function applyHomeConfig(userName) {
    const titleEl = document.getElementById('homeTitle');
    const subEl = document.getElementById('homeSub');
    const msgEl = document.getElementById('homeAnnounce');
    
    const hour = new Date().getHours();
    let greeting = "שלום";
    if (hour >= 5 && hour < 12) greeting = "בוקר טוב";
    else if (hour >= 12 && hour < 18) greeting = "צהריים טובים";
    else if (hour >= 18 && hour < 22) greeting = "ערב טוב";
    else greeting = "לילה טוב";
    
    if(titleEl) titleEl.innerText = `${greeting}, ${userName}! ✨`;
    if(subEl) subEl.innerText = "מה בא לך לעשות היום?";
    
    try {
        const config = JSON.parse(localStorage.getItem('appHomeConfig'));
        if(config) {
            if(config.msg && msgEl) {
                msgEl.innerText = config.msg;
                msgEl.style.display = 'block';
            } else if(msgEl) {
                msgEl.style.display = 'none';
            }
            const img1 = document.getElementById('galleryImg1');
            const img2 = document.getElementById('galleryImg2');
            const img3 = document.getElementById('galleryImg3');
            if(img1 && config.img1) img1.src = config.img1;
            if(img2 && config.img2) img2.src = config.img2;
            if(img3 && config.img3) img3.src = config.img3;
        } else if(msgEl) {
            msgEl.style.display = 'none';
        }
    } catch(e) {}
}

function notifyAdmin(message, type, targetId = null) {
    const notifId = Date.now().toString();
    db.collection("notifications").doc(notifId).set({
        id: notifId, text: message, type: type, targetId: targetId, read: false, time: new Date().toLocaleString('he-IL')
    });
}

function performLogout() {
  localStorage.removeItem('currentUser'); closeMenu(); 
  if(mainHeader) mainHeader.style.display = 'none'; 
  showScreen(loginScreen);
  if(document.getElementById('loginFormSection')) document.getElementById('loginFormSection').style.display = 'block';
  if(document.getElementById('otpFormSection')) document.getElementById('otpFormSection').style.display = 'none';
  if(document.getElementById('loginName')) document.getElementById('loginName').value = '';
  if(document.getElementById('loginPhone')) document.getElementById('loginPhone').value = '';
}

function showScreen(screenToShow) {
  if(loginScreen) loginScreen.style.display = 'none';
  if(pendingApprovalScreen) pendingApprovalScreen.style.display = 'none';
  if(homeScreen) homeScreen.style.display = 'none';
  if(myAppointmentsScreen) myAppointmentsScreen.style.display = 'none';
  if(bookingFlow) bookingFlow.style.display = 'none';
  if(summaryScreen) summaryScreen.style.display = 'none';
  if(screenToShow) screenToShow.style.display = 'flex';

  if(screenToShow === homeScreen && currentUserName) {
      applyHomeConfig(currentUserName);
  }
}

let savedUser = JSON.parse(localStorage.getItem('currentUser'));
let userUnsubscribe = null;

function listenToCurrentUser(phone) {
    if(userUnsubscribe) userUnsubscribe();
    userUnsubscribe = db.collection("users").doc(phone).onSnapshot(doc => {
        if(doc.exists) {
            let syncedUser = doc.data();
            localStorage.setItem('currentUser', JSON.stringify(syncedUser));
            currentUserPhone = phone;
            currentUserName = syncedUser.name;
            
            if (syncedUser.status === 'blocked') {
                alert("חשבונך נחסם על ידי הנהלת הקליניקה. 🚫"); performLogout();
            } else if (syncedUser.status === 'approved') {
                applyHomeConfig(syncedUser.name);
                if(mainHeader) mainHeader.style.display = 'flex';
                if(document.getElementById('pendingApprovalScreen')?.style.display !== 'none' || document.getElementById('loginScreen')?.style.display !== 'none') {
                    
                    // הניתוב החכם למסך תורים
                    if(sessionStorage.getItem('redirectAfterLogin') === 'myAppointments') {
                        sessionStorage.removeItem('redirectAfterLogin');
                        renderMyAppointments();
                        showScreen(myAppointmentsScreen);
                    } else {
                        showScreen(homeScreen);
                    }
                }
            } else if (syncedUser.status === 'pending') {
                if(mainHeader) mainHeader.style.display = 'none';
                if(document.getElementById('pendingNameText')) document.getElementById('pendingNameText').innerText = syncedUser.name;
                showScreen(pendingApprovalScreen);
            }
        }
    });
}

if (savedUser) { listenToCurrentUser(savedUser.phone); } else { showScreen(loginScreen); }

let pendingUserDetails = null;

// ==========================================
// בקשת SMS אמיתי - עם עדכון פניה לשרת וטיפול שגיאות
// ==========================================
document.getElementById('requestOtpBtn')?.addEventListener('click', async () => {
  const nameInput = document.getElementById('loginName')?.value.trim() || ""; 
  const phoneInput = document.getElementById('loginPhone')?.value.trim() || "";
  
  // הורדנו את חסימת השפה העברית למקרה שזה עשה בעיות בשקט
  if (nameInput.length < 2) { alert("❌ אנא הכניסי שם (לפחות 2 תווים)."); return; }
  if (!/^05\d-?\d{7}$/.test(phoneInput)) { alert("❌ אנא הכניסי מספר טלפון נייד ישראלי תקין."); return; }
  
  pendingUserDetails = { name: nameInput, phone: phoneInput };
  const btn = document.getElementById('requestOtpBtn');
  btn.innerText = "שולח הודעה...";
  btn.disabled = true;

  try {
      const sendOtpSms = functions.httpsCallable('sendOtpSms');
      const result = await sendOtpSms({ phone: phoneInput });
      
      // בודקים שהשרת אישר שההודעה נשלחה בהצלחה
      if (result.data.success) {
          document.getElementById('loginFormSection').style.display = 'none'; 
          document.getElementById('otpFormSection').style.display = 'block'; 
          document.getElementById('displayOtpPhone').innerText = phoneInput;
          
          // מקפיץ פוקוס לקובייה הראשונה אוטומטית
          const firstOtpInput = document.querySelector('.otp-digit');
          if(firstOtpInput) firstOtpInput.focus();
      } else {
          alert("❌ שגיאה בשליחת ההודעה: " + (result.data.error || "לא ידוע"));
      }
  } catch (error) {
      console.error(error);
      alert("שגיאה בתקשורת עם השרת. אנא נסי שוב בעוד דקה.");
  } finally {
      btn.innerText = "שלחי לי קוד ב-SMS";
      btn.disabled = false;
  }
});

// ==========================================
// קפיצה אוטומטית לקוביות בצד הלקוח (הקוד החכם!)
// ==========================================
const otpInputs = document.querySelectorAll('.otp-digit');
otpInputs.forEach((input, index) => { 
    input.addEventListener('input', (event) => { 
        if (event.target.value.length > 1) {
            event.target.value = event.target.value.slice(-1);
        }
        if(event.target.value !== '' && index < otpInputs.length - 1) { 
            otpInputs[index + 1].focus(); 
        } 
    }); 
    input.addEventListener('keydown', (event) => { 
        if(event.key === 'Backspace' && event.target.value === '' && index > 0) { 
            otpInputs[index - 1].focus(); 
        } 
    }); 
});

window.cancelOtp = function() { 
    document.getElementById('otpFormSection').style.display = 'none'; 
    document.getElementById('loginFormSection').style.display = 'block'; 
    otpInputs.forEach(i => i.value = ''); 
};

// ==========================================
// אימות ה-OTP מול מסד הנתונים
// ==========================================
document.getElementById('verifyOtpBtn')?.addEventListener('click', async () => {
    let enteredCode = Array.from(otpInputs).map(i => i.value).join('');
    if (enteredCode.length !== 4) { alert("אנא הזיני 4 ספרות"); return; }
    
    if (!pendingUserDetails || !pendingUserDetails.phone) {
        alert("שגיאה במערכת, אנא חזרי אחורה והקלידי את המספר מחדש.");
        cancelOtp();
        return;
    }
    
    const phone = pendingUserDetails.phone;
    const btn = document.getElementById('verifyOtpBtn');
    btn.innerText = "מאמת..."; btn.disabled = true;

    try {
        const otpDoc = await db.collection('otps').doc(phone).get();
        
        if (otpDoc.exists && otpDoc.data().code === enteredCode) {
            const userDoc = await db.collection("users").doc(phone).get();
            let userToSave;
            if (userDoc.exists) {
                userToSave = userDoc.data();
                if (userToSave.status === 'blocked') { alert("חשבונך נחסם. 🚫"); cancelOtp(); btn.innerText = "אימות וכניסה"; btn.disabled = false; return; }
            } else {
                userToSave = { name: pendingUserDetails.name, phone: phone, status: 'pending' };
                await db.collection("users").doc(phone).set(userToSave);
                notifyAdmin(`לקוחה חדשה ממתינה לאישור: ${pendingUserDetails.name}`, 'user', phone);
            }
            localStorage.setItem('currentUser', JSON.stringify(userToSave));
            listenToCurrentUser(phone);
        } else {
            alert("❌ הקוד שהזנת שגוי, אנא נסי שוב.");
            otpInputs.forEach(i => i.value = '');
            otpInputs[0].focus();
        }
    } catch (error) {
        console.error("Verification error:", error);
        alert("שגיאה בחיבור למערכת.");
    } finally {
        btn.innerText = "אימות וכניסה";
        btn.disabled = false;
    }
});

document.getElementById('menuLogout')?.addEventListener('click', performLogout); document.getElementById('logoutFromPendingBtn')?.addEventListener('click', performLogout);
const sideMenu = document.getElementById('sideMenu'); const menuOverlay = document.getElementById('menuOverlay');
document.getElementById('openMenuBtn')?.addEventListener('click', () => { sideMenu?.classList.add('open'); menuOverlay?.classList.add('active'); });
function closeMenu() { sideMenu?.classList.remove('open'); menuOverlay?.classList.remove('active'); }
document.getElementById('closeMenuBtn')?.addEventListener('click', closeMenu); menuOverlay?.addEventListener('click', closeMenu);
document.getElementById('menuHome')?.addEventListener('click', () => { closeMenu(); showScreen(homeScreen); });
document.getElementById('goToMyAppointments')?.addEventListener('click', () => { renderMyAppointments(); showScreen(myAppointmentsScreen); });
document.getElementById('menuMyApps')?.addEventListener('click', () => { closeMenu(); renderMyAppointments(); showScreen(myAppointmentsScreen); });
document.getElementById('backToHomeFromApps')?.addEventListener('click', () => { showScreen(homeScreen); });
document.getElementById('backToHomeBtn')?.addEventListener('click', () => { showScreen(homeScreen); });
document.getElementById('menuBookAppointment')?.addEventListener('click', () => { closeMenu(); document.getElementById('startBookingFlow').click(); });

function renderMyAppointments() {
  const listContainer = document.getElementById('appointmentsList'); const statsContainer = document.getElementById('myStatsContainer');
  if(!listContainer || !statsContainer) return; listContainer.innerHTML = ''; 
  const appointments = JSON.parse(localStorage.getItem('myAppointments')) || []; 
  const myOwnAppointments = appointments.filter(app => app && app.clientPhone === currentUserPhone);

  let arrived = 0, cancelMe = 0, cancelNatali = 0; const todayStr = new Date().toISOString().split('T')[0];
  myOwnAppointments.forEach(app => {
      if(app.status === 'approved' && app.fullDate < todayStr) arrived++;
      if(app.status === 'canceled') { if(app.cancelSource === 'client' || (app.statusText && app.statusText.includes('ידך'))) cancelMe++; else cancelNatali++; }
  });

  statsContainer.innerHTML = `<div class="stat-box"><span class="num">${arrived}</span><span class="lbl">הגעתי</span></div><div class="stat-box"><span class="num" style="color:#dc3545;">${cancelMe}</span><span class="lbl">ביטלתי</span></div><div class="stat-box"><span class="num" style="color:#777;">${cancelNatali}</span><span class="lbl">בוטלו ע"י נטלי</span></div>`;
  if (myOwnAppointments.length === 0) { listContainer.innerHTML = `<div class="empty-state" style="text-align:center; margin-top:40px;"><div style="font-size: 50px; margin-bottom: 15px;">🤷‍♀️</div><h3 style="margin:0;">עדיין אין לך תורים</h3><p style="color:#777;">זה הזמן לקבוע טיפול חדש!</p></div>`; return; }
  
  const now = new Date();

  myOwnAppointments.slice().reverse().forEach(app => {
    if(app.status === 'canceled') {
        listContainer.innerHTML += `<div class="appointment-card"><div class="status-badge status-canceled">${app.statusText}</div><div style="display: flex; justify-content: space-between; margin-bottom: 10px;"><strong>${app.treatment}</strong><span style="color: #C2A878;">${app.date}, ${app.time}</span></div><button class="primary-btn" disabled style="background-color: #ddd; color: #777; padding: 12px; font-size: 14px;">התור בוטל</button></div>`;
        return;
    }

    const appDateTime = new Date(`${app.fullDate}T${app.time || "00:00"}:00`);
    const hoursLeft = (appDateTime - now) / (1000 * 60 * 60);

    let statusClass = app.status === 'approved' ? 'status-approved' : 'status-pending';
    let actionButtonHtml = '';

    if (hoursLeft > 0) {
        if (hoursLeft <= 24 && app.status === 'approved' && !app.clientConfirmed) {
            actionButtonHtml = `<button class="primary-btn" onclick="confirmMyArrival('${app.id}')" style="background-color: #28a745; color: white; padding: 12px; font-size: 14px; box-shadow: 0 4px 15px rgba(40,167,69,0.3);">אני מגיעה! ✅</button>`;
        } else if (app.clientConfirmed) {
            actionButtonHtml = `<div style="text-align:center; color:#28a745; font-weight:bold; padding:10px; border:1px solid #28a745; border-radius:12px;">אישרת הגעה לתור זה 🤍</div>`;
        } else {
            actionButtonHtml = `<button class="primary-btn cancel-action-btn" data-id="${app.id}" style="background-color: transparent; color: #dc3545; border: 1px solid #dc3545; padding: 12px; font-size: 14px;">ביטול תור</button>`;
        }
    } else {
        actionButtonHtml = `<button class="primary-btn" disabled style="background-color: #eee; color: #aaa; padding: 12px; font-size: 14px;">התור הסתיים</button>`;
    }

    listContainer.innerHTML += `<div class="appointment-card"><div class="status-badge ${statusClass}">${app.statusText}</div><div style="display: flex; justify-content: space-between; margin-bottom: 10px;"><strong>${app.treatment}</strong><span style="color: #C2A878;">${app.date}, ${app.time}</span></div>${actionButtonHtml}</div>`;
  });

  document.querySelectorAll('.cancel-action-btn').forEach(btn => { btn.addEventListener('click', (e) => { openCancelModal(e.target.getAttribute('data-id')); }); });
}

window.confirmMyArrival = function(id) {
    db.collection("appointments").doc(id.toString()).update({
        clientConfirmed: true,
        statusText: "אישרה הגעה ✅"
    }).then(() => {
        alert("איזה כיף, נטלי מחכה לך בקליניקה! ✨");
    });
};

const cancelModal = document.getElementById('cancelModal'); let currentAppToCancel = null;
function openCancelModal(id) {
  const appointments = JSON.parse(localStorage.getItem('myAppointments')) || []; const app = appointments.find(a => String(a.id) === String(id)); if(!app) return; 
  if(app.fullDate && app.time) { const apptDate = new Date(`${app.fullDate}T${app.time}:00`); const now = new Date(); const diffHours = (apptDate - now) / (1000 * 60 * 60); if (diffHours < 24 && diffHours > 0) { alert("❌ לא ניתן לבטל תור פחות מ-24 שעות מראש. נא ליצור קשר עם נטלי."); return; } }
  currentAppToCancel = id; document.getElementById('cancelAppointmentDetails').innerHTML = `<strong>${app.treatment}</strong><br>${app.date}, בשעה ${app.time}`; cancelModal?.classList.add('active');
}
document.getElementById('abortCancelBtn')?.addEventListener('click', () => { cancelModal?.classList.remove('active'); currentAppToCancel = null; });

document.getElementById('confirmCancelBtn')?.addEventListener('click', () => {
  if(currentAppToCancel) {
      db.collection("appointments").doc(currentAppToCancel.toString()).update({
          status: 'canceled', statusText: 'בוטל על ידך ❌', cancelSource: 'client'
      }).then(() => {
          let appointments = JSON.parse(localStorage.getItem('myAppointments')) || []; 
          let app = appointments.find(a => String(a.id) === String(currentAppToCancel));
          if(app) notifyAdmin(`לקוחה הפעילה ביטול תור: ${app.clientName} (${app.date})`, 'app', app.id);
          cancelModal?.classList.remove('active');
      });
  }
});

function isOverlapping(start1, end1, start2, end2) { return Math.max(start1, start2) < Math.min(end1, end2); }
function timeToMinutes(timeStr) { let [h, m] = (timeStr||"00:00").split(':').map(Number); return h * 60 + m; }

function renderBookingDays() {
    const daysList = document.getElementById('dynamicDaysList'); daysList.innerHTML = '';
    let adminShifts = JSON.parse(localStorage.getItem('adminShifts')) || []; const todayStr = new Date().toISOString().split('T')[0]; adminShifts = adminShifts.filter(s => s && s.date >= todayStr).sort((a,b) => a.date.localeCompare(b.date));
    if(adminShifts.length === 0) { daysList.innerHTML = '<p style="color:#777; width:100%; text-align:center;">נטלי עדיין לא פתחה יומן לתקופה הקרובה. חזרי להתעדכן בקרוב! 🤍</p>'; return; }
    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    adminShifts.forEach((shift) => {
        let d = new Date(shift.date); let dayName = dayNames[d.getDay()]; let dateFormatted = `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}`;
        let div = document.createElement('div'); div.className = 'day-card'; div.innerHTML = `${dayName}<br><strong>${dateFormatted}</strong>`; div.setAttribute('data-fulldate', shift.date); div.setAttribute('data-display', dateFormatted);
        div.onclick = () => { document.querySelectorAll('.day-card').forEach(el => el.classList.remove('selected')); div.classList.add('selected'); document.getElementById('timeWrapper').style.display = 'block'; renderBookingTimes(shift, dateFormatted); };
        daysList.appendChild(div);
    });
}

function renderBookingTimes(shift, dateFormatted) {
    const timesList = document.getElementById('dynamicTimesList'); timesList.innerHTML = ''; document.getElementById('confirmTimeAction').style.display = 'none';
    let curr = timeToMinutes(shift.start); let end = timeToMinutes(shift.end); let bs = shift.breakStart ? timeToMinutes(shift.breakStart) : -1; let be = shift.breakEnd ? timeToMinutes(shift.breakEnd) : -1;
    const allApps = JSON.parse(localStorage.getItem('myAppointments')) || []; const bookedApps = allApps.filter(a => a && a.status !== 'canceled' && a.date === dateFormatted);
    let hasSlots = false; let treatmentDuration = window.selectedTreatmentDuration || 60;
    
    // --- חישוב זמן נוכחי מדויק במכשיר המשתמש ---
    const now = new Date();
    const localYear = now.getFullYear();
    const localMonth = String(now.getMonth() + 1).padStart(2, '0');
    const localDay = String(now.getDate()).padStart(2, '0');
    const localTodayStr = `${localYear}-${localMonth}-${localDay}`;
    
    const isToday = (shift.date === localTodayStr);
    
    // הוספת באפר: חוסמים שעות קרובות (פחות מ-30 דקות מעכשיו) כדי שלא יקבעו תור לעוד שנייה
    const currentMinutesWithBuffer = (now.getHours() * 60) + now.getMinutes() + 30;

    while(curr + treatmentDuration <= end) {
        let slotStart = curr; let slotEnd = curr + treatmentDuration; let timeStr = `${String(Math.floor(curr/60)).padStart(2,'0')}:${String(curr%60).padStart(2,'0')}`;
        let overlapsBreak = (bs !== -1 && isOverlapping(slotStart, slotEnd, bs, be));
        let overlapsBooked = bookedApps.some(a => { let aStart = timeToMinutes(a.time); let aDuration = parseInt(a.duration || 60); let aEnd = aStart + aDuration; return isOverlapping(slotStart, slotEnd, aStart, aEnd); });
        
        // הבדיקה שמסננת את שעות העבר
        let isPastTime = isToday && (slotStart <= currentMinutesWithBuffer);

        if(!overlapsBreak && !overlapsBooked && !isPastTime) { 
            hasSlots = true; 
            let btn = document.createElement('div'); btn.className = 'time-btn'; btn.innerText = timeStr; 
            btn.onclick = () => { document.querySelectorAll('.time-btn').forEach(el => el.classList.remove('selected')); btn.classList.add('selected'); document.getElementById('confirmTimeAction').style.display = 'block'; }; 
            timesList.appendChild(btn); 
        }
        curr += 30; 
    }
    
    if(!hasSlots) {
        timesList.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding: 20px; background: #fff3cd; border: 1px dashed #856404; border-radius: 16px;">
            <div style="font-size:30px; margin-bottom:10px;">🥺</div>
            <p style="color:#856404; font-weight:bold; margin-top:0; font-size:16px;">אוי, היום הזה מלא לגמרי...</p>
            <p style="color:#555; font-size:14px;">רוצה שניצור איתך קשר אם יתפנה מקום?</p>
            <div style="display:flex; justify-content:center; gap:15px; margin: 20px 0; font-size: 14px;">
                <label><input type="checkbox" class="wl-pref" value="בוקר"> בוקר</label>
                <label><input type="checkbox" class="wl-pref" value="צהריים"> צהריים</label>
                <label><input type="checkbox" class="wl-pref" value="ערב"> ערב</label>
            </div>
            <button class="primary-btn" style="background:#856404; color:#fff; width:100%;" onclick="joinWaitlist('${shift.date}', '${dateFormatted}')">הכניסי אותי לרשימת המתנה</button>
        </div>`;
    }
}


// הפונקציה ששומרת את הבקשה בענן
window.joinWaitlist = function(fullDate, displayDate) {
    const prefs = Array.from(document.querySelectorAll('.wl-pref:checked')).map(cb => cb.value);
    if(prefs.length === 0) { alert("אנא בחרי מתי נוח לך (בוקר / צהריים / ערב)"); return; }
    
    const selectedTreatment = document.querySelector('.treatment-card.selected h2')?.innerText || "לא נבחר טיפול";
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    const wlId = Date.now().toString();
    db.collection('waitlist').doc(wlId).set({
        id: wlId, clientName: currentUserName || currentUser.name, clientPhone: currentUserPhone || currentUser.phone,
        treatment: selectedTreatment, fullDate: fullDate, date: displayDate, preferences: prefs, timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        document.getElementById('dynamicTimesList').innerHTML = '<p style="text-align:center; color:#28a745; font-weight:bold; grid-column:1/-1; padding:20px; border:1px solid #28a745; border-radius:12px;">✨ נרשמת לרשימת ההמתנה! נעדכן אותך אם יתפנה מקום.</p>';
        notifyAdmin(`לקוחה בהמתנה ל-${displayDate}: ${currentUser.name} (מעדיפה: ${prefs.join(', ')})`, 'app');
    });
};

document.getElementById('startBookingFlow')?.addEventListener('click', () => { showScreen(bookingFlow); document.getElementById('titleSection').style.display = 'block'; document.getElementById('treatmentsList').style.display = 'flex'; document.getElementById('bottomAction').style.display = 'block'; document.getElementById('datetimeSection').style.display = 'none'; if(document.getElementById('timeWrapper')) document.getElementById('timeWrapper').style.display = 'none'; if(document.getElementById('confirmTimeAction')) document.getElementById('confirmTimeAction').style.display = 'none'; document.querySelectorAll('.treatment-card').forEach(el => el.classList.remove('selected')); renderBookingDays(); });
document.getElementById('continueBtn')?.addEventListener('click', () => { if(!document.querySelector('.treatment-card.selected')) { alert("אנא בחרי טיפול קודם"); return; } document.getElementById('titleSection').style.display = 'none'; document.getElementById('treatmentsList').style.display = 'none'; document.getElementById('bottomAction').style.display = 'none'; document.getElementById('datetimeSection').style.display = 'block'; });

const termsModal = document.getElementById('termsModal');
document.getElementById('confirmTimeBtn')?.addEventListener('click', () => { termsModal?.classList.add('active'); }); document.getElementById('closeModalBtn')?.addEventListener('click', () => { termsModal?.classList.remove('active'); });

document.getElementById('approveTermsBtn')?.addEventListener('click', () => {
  termsModal?.classList.remove('active');
  const selectedTreatment = document.querySelector('.treatment-card.selected h2')?.innerText || "טיפול כלשהו"; const dayCard = document.querySelector('.day-card.selected'); const selectedDayDisplay = dayCard?.getAttribute('data-display') || "תאריך"; const selectedFullDate = dayCard?.getAttribute('data-fulldate') || "2026-06-14"; const selectedTime = document.querySelector('.time-btn.selected')?.innerText || "שעה"; const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {name: 'לא ידוע', phone: '0500000000'};
  
  const appId = Date.now().toString();
  const treatmentDur = window.selectedTreatmentDuration || 60;
  const newAppointment = { id: appId, clientName: currentUserName || currentUser.name, clientPhone: currentUserPhone || currentUser.phone, treatment: selectedTreatment, duration: treatmentDur, date: selectedDayDisplay, fullDate: selectedFullDate, time: selectedTime, status: 'pending', statusText: 'מחכה לאישור ⏳', clientConfirmed: false };
  
  db.collection("appointments").doc(appId).set(newAppointment).then(() => {
      notifyAdmin(`תור חדש ממתין לאישור: ${currentUserName || currentUser.name} ל-${selectedDayDisplay} בשעה ${selectedTime}`, 'app', appId);
      const sumScreen = document.getElementById('summaryScreen'); 
      sumScreen.setAttribute('data-last-date', selectedFullDate); 
      sumScreen.setAttribute('data-last-time', selectedTime); 
      sumScreen.setAttribute('data-last-treatment', selectedTreatment);
      sumScreen.setAttribute('data-last-duration', treatmentDur); 
      document.getElementById('summaryCardDetails').innerHTML = `<p><strong>טיפול:</strong> ${selectedTreatment}</p><p><strong>מתי:</strong> ${selectedDayDisplay}, בשעה ${selectedTime}</p><p><strong>מיקום:</strong> הקליניקה של נטלי</p>`; showScreen(summaryScreen);
  });
});

document.getElementById('addToCalendarBtn')?.addEventListener('click', () => {
  const sumScreen = document.getElementById('summaryScreen'); 
  const dateStr = sumScreen.getAttribute('data-last-date'); 
  const timeStr = sumScreen.getAttribute('data-last-time'); 
  const treatmentStr = sumScreen.getAttribute('data-last-treatment'); 
  const duration = parseInt(sumScreen.getAttribute('data-last-duration') || 60);
  
  if(!dateStr || !timeStr) return;
  
  let [h, m] = timeStr.split(':').map(Number);
  const startHStr = String(h).padStart(2, '0');
  const startMStr = String(m).padStart(2, '0');
  const icsStartDate = dateStr.replace(/-/g, '') + 'T' + startHStr + startMStr + '00';
  
  let endMin = h * 60 + m + duration;
  let endHStr = String(Math.floor(endMin / 60)).padStart(2, '0');
  let endMStr = String(endMin % 60).padStart(2, '0');
  const icsEndDate = dateStr.replace(/-/g, '') + 'T' + endHStr + endMStr + '00';

  const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Soleil Nail Studio//Client//HE\nBEGIN:VEVENT\nSUMMARY:תור ל-Soleil Nail Studio - ${treatmentStr}\nDESCRIPTION:איזה כיף, אנחנו מחכות לך בסטודיו! ✨\nDTSTART:${icsStartDate}\nDTEND:${icsEndDate}\nLOCATION:Soleil Nail Studio\nEND:VEVENT\nEND:VCALENDAR`;  
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' }); 
  const url = URL.createObjectURL(blob); 
  const a = document.createElement('a'); 
  a.href = url; a.download = 'Natali_Appointment.ics'; 
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
});