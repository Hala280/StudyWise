// ═══════════ AUTH GUARD ═══════════
if (!localStorage.getItem('sw_user')) {
  window.location.href = 'dashboard.html';
}

// ═══════════ STATE ═══════════
let courses = [];
let selectedEmoji = '📐';
let selectedColor = '#7c3aed';
let selectedFile = null;
const CLAUDE_API = 'https://api.anthropic.com/v1/messages';

// View partials are now separate files, loaded once on startup
const VIEW_IDS = ['overview','courses','parser','analytics','schedule','tutor','goals','achievements'];

async function loadViews(){
  await Promise.all(VIEW_IDS.map(async id=>{
    const res = await fetch(`views/${id}.html`);
    const html = await res.text();
    const target = document.getElementById('view-'+id);
    if(target) target.innerHTML = html;
  }));
}

// ═══════════ INIT ═══════════
async function init(){
  // Load all page/tab partials first so their DOM elements exist
  await loadViews();

  // Restore user
  try{
    let u = JSON.parse(localStorage.getItem('sw_user') || 'null');
    if(!u){ u = {name:'Student', email:'student@studywise.io'}; }
    document.getElementById('sidebarAvatar').textContent = u.name.charAt(0).toUpperCase();
    document.getElementById('sidebarName').textContent = u.name.split(' ')[0];
    document.getElementById('welcomeName').textContent = u.name.split(' ')[0];
  }catch(e){}

  // Restore courses
  try{
    courses = JSON.parse(localStorage.getItem('sw_courses') || '[]');
  }catch(e){ courses=[]; }

  // Build UI
  buildStreakDays();
  buildMiniCalendar();
  updateCoursesUI();
  setTodayDate();

  // Load theme
  try{
    const t = localStorage.getItem('sw_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
  }catch(e){}

  // Modal close-on-overlay-click
  const modal = document.getElementById('addCourseModal');
  if(modal){
    modal.addEventListener('click', function(e){
      if(e.target === this) closeAddCourse();
    });
  }

  // Drag & drop on upload zone (parser view)
  const uz = document.getElementById('uploadZone');
  if(uz){
    uz.addEventListener('dragover', e=>{ e.preventDefault(); uz.classList.add('drag'); });
    uz.addEventListener('dragleave', ()=>uz.classList.remove('drag'));
    uz.addEventListener('drop', e=>{
      e.preventDefault(); uz.classList.remove('drag');
      const file = e.dataTransfer.files[0];
      if(file){
        selectedFile = file;
        document.getElementById('previewName').textContent = file.name;
        document.getElementById('previewSize').textContent = formatFileSize(file.size);
        document.getElementById('uploadPreview').classList.add('show');
        document.getElementById('parseBtn').disabled = false;
      }
    });
  }
}
init();

// ═══════════ SIDEBAR ═══════════
function openSidebar(){
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('show');
}
function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('show');
}

// ═══════════ VIEWS ═══════════
const viewTitles = {
  overview:'Dashboard', courses:'My Courses', parser:'AI Syllabus Parser',
  analytics:'Analytics', schedule:'Schedule', tutor:'AI Tutor',
  goals:'Goals', achievements:'Achievements'
};
function showView(name){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const v = document.getElementById('view-'+name);
  if(v) v.classList.add('active');
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(n=>{ if(n.textContent.trim().toLowerCase().includes(name.replace('-',' '))) n.classList.add('active'); });
  document.getElementById('topbarTitle').textContent = viewTitles[name] || name;
  document.getElementById('topbarBread').textContent = viewTitles[name] || name;
  closeSidebar();
  if(name==='analytics') setTimeout(buildCharts,100);
}

// ═══════════ STREAK (sidebar widget, always present) ═══════════
function buildStreakDays(){
  const container = document.getElementById('streakDays');
  if(!container)return;
  const days=['M','T','W','T','F','S','S'];
  let html='';
  days.forEach((_,i)=>{
    const cls = i<5?'done':i===5?'today':'';
    html+=`<div class="streak-day ${cls}" title="${days[i]}"></div>`;
  });
  container.innerHTML=html;
}

// ═══════════ UTILS ═══════════
function toggleTheme(){
  const html=document.documentElement;
  const isDark=html.getAttribute('data-theme')==='dark';
  html.setAttribute('data-theme',isDark?'light':'dark');
  try{localStorage.setItem('sw_theme',isDark?'light':'dark');}catch(e){}
  chartsBuilt=false;
}
function logout(){
  if(confirm("Are you sure you want to sign out?")){
    localStorage.removeItem('sw_user');
    window.location.href = 'home/index.html';
  }
}
function goHome(){ window.location.href='home/index.html'; }

function showToast(msg,type='success'){
  const t=document.getElementById('swToast');
  t.textContent=msg;
  t.className=`sw-toast ${type}`;
  requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.add('show')));
  setTimeout(()=>t.classList.remove('show'),3500);
}
