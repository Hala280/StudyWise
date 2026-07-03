function setTodayDate(){
  const now = new Date();
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const el = document.getElementById('todayDate');
  if(el) el.textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
}

// ═══════════ MINI CALENDAR ═══════════
function buildMiniCalendar(){
  const container = document.getElementById('miniCal');
  if(!container)return;
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const firstDay = new Date(year,month,1).getDay();
  const daysInMonth = new Date(year,month+1,0).getDate();
  const dayNames=['S','M','T','W','T','F','S'];
  let html=`<div class="cal-header">
    <button class="cal-nav">‹</button>
    <div class="cal-month">${months[month]} ${year}</div>
    <button class="cal-nav">›</button>
  </div>
  <div class="cal-days-header">${dayNames.map(d=>`<div class="cal-day-label">${d}</div>`).join('')}</div>
  <div class="cal-days">`;
  const studyDays=[2,5,8,10,12,15,17,19,22,24,26,29];
  for(let i=0;i<firstDay;i++) html+=`<div class="cal-day other"></div>`;
  for(let d=1;d<=daysInMonth;d++){
    const isToday=d===now.getDate();
    const hasStudy=studyDays.includes(d)&&!isToday;
    html+=`<div class="cal-day ${isToday?'today':''} ${hasStudy?'has-study':''}">${d}</div>`;
  }
  html+='</div>';
  container.innerHTML=html;
}
