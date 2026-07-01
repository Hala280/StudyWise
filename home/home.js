(function(){
  const c=document.getElementById('particles'), ctx=c.getContext('2d');
  let W,H,pts=[];
  function resize(){
    W=c.width=c.offsetWidth; H=c.height=c.offsetHeight;
    pts=Array.from({length:80},()=>({
      x:Math.random()*W, y:Math.random()*H,
      vx:(Math.random()-.5)*.3, vy:(Math.random()-.5)*.3,
      r:Math.random()*2+.5,
      col:['#a78bfa','#22d3ee','#818cf8','#f472b6','#34d399'][Math.floor(Math.random()*5)],
      a:Math.random()*.5+.15
    }));
  }
  function draw(){
    ctx.clearRect(0,0,W,H);
    pts.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0||p.x>W)p.vx*=-1; if(p.y<0||p.y>H)p.vy*=-1;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=p.col+Math.floor(p.a*255).toString(16).padStart(2,'0');
      ctx.fill();
    });
    pts.forEach((p,i)=>{
      for(let j=i+1;j<pts.length;j++){
        const d=Math.hypot(p.x-pts[j].x,p.y-pts[j].y);
        if(d<100){ ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(pts[j].x,pts[j].y);
          ctx.strokeStyle=p.col+Math.floor((1-d/100)*40).toString(16).padStart(2,'0');
          ctx.lineWidth=.6; ctx.stroke(); }
      }
    });
    requestAnimationFrame(draw);
  }
  window.addEventListener('load',()=>{ resize(); draw(); });
  window.addEventListener('resize',resize);
})();

// ═══ NAVBAR SCROLL ═══
window.addEventListener('scroll',()=>{
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY>60);
});
function scrollToSection(id){ document.getElementById(id)?.scrollIntoView({behavior:'smooth'}); }

// ═══ INTERSECTION OBSERVER ═══
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      const d = e.target.dataset.delay || 0;
      setTimeout(()=> e.target.classList.add('visible'), +d);
      io.unobserve(e.target);
    }
  });
},{threshold:0.15});
document.querySelectorAll('.feat-card, .annotation').forEach(el=>io.observe(el));

// ═══ MOCKUP PARALLAX ═══
document.addEventListener('mousemove',(e)=>{
  const frame=document.getElementById('mockupFrame'); if(!frame)return;
  const x=(e.clientX/window.innerWidth-.5)*8;
  const y=(e.clientY/window.innerHeight-.5)*6;
  frame.style.transform=`perspective(1000px) rotateY(${x}deg) rotateX(${-y}deg)`;
});

// ═══ THEME TOGGLE ═══
function toggleTheme(){
  const html=document.documentElement;
  const isDark=html.getAttribute('data-theme')==='dark';
  html.setAttribute('data-theme', isDark?'light':'dark');
  document.querySelectorAll('[id^="themeToggle"]').forEach(t=>{
    t.classList.toggle('on', !isDark);
  });
  try{ localStorage.setItem('sw_theme', isDark?'light':'dark'); }catch(e){}
}
(function(){
  let saved='dark';
  try{ saved=localStorage.getItem('sw_theme')||'dark'; }catch(e){}
  document.documentElement.setAttribute('data-theme',saved);
  const on=saved==='dark';
  document.querySelectorAll('[id^="themeToggle"]').forEach(t=>t.classList.toggle('on',on));
})();

// ═══ FAQ ACCORDION ═══
function toggleFaq(btn){
  const item=btn.parentElement;
  const isOpen=item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(i=>i.classList.remove('open'));
  if(!isOpen) item.classList.add('open');
}

// ═══ FOOTER QUOTES ═══
const quotes=[
  '"The secret of getting ahead is getting started." — Mark Twain',
  '"Study hard, for the well is deep." — Richard Baxter',
  '"An investment in knowledge pays the best interest." — Benjamin Franklin',
  '"Education is the most powerful weapon you can use." — Nelson Mandela',
  '"The more that you read, the more things you will know." — Dr. Seuss',
];
document.getElementById('footerQuote').textContent=quotes[Math.floor(Math.random()*quotes.length)];

// ═══ CHAT ═══
let chatOpen=false;
function toggleChat(){
  chatOpen=!chatOpen;
  document.getElementById('chatPanel').classList.toggle('open',chatOpen);
  if(chatOpen) document.getElementById('chatInput').focus();
}

const GEMINI_KEY = 'AQ.Ab8RN6LvY7hJfJXGLhgD9GeTlgbjIyLcvitiAl8B_tLih1zzZQ'; // ← ضع مفتاح Gemini هنا
async function sendChat(){
  const input=document.getElementById('chatInput');
  const msg=input.value.trim(); if(!msg)return;
  const msgs=document.getElementById('chatMessages');
  msgs.innerHTML+=`<div class="chat-msg user">${msg}</div>`;
  input.value='';
  msgs.scrollTop=msgs.scrollHeight;
  // Typing indicator
  const typing=document.createElement('div');
  typing.className='chat-msg bot chat-typing';
  typing.innerHTML='<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
  msgs.appendChild(typing);
  msgs.scrollTop=msgs.scrollHeight;
  try{
    const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({contents:[{parts:[{text:'You are StudyWise AI Tutor, a helpful and friendly academic assistant for students. '+msg}]}]})
    });
    const data=await res.json();
    const reply=data?.candidates?.[0]?.content?.parts?.[0]?.text||'Sorry, I could not get a response right now.';
    typing.remove();
    msgs.innerHTML+=`<div class="chat-msg bot">${reply}</div>`;
  }catch(err){
    typing.remove();
    msgs.innerHTML+=`<div class="chat-msg bot">⚠️ Add your Gemini API key in the code to enable AI responses!</div>`;
  }
  msgs.scrollTop=msgs.scrollHeight;
}

// ═══ MODAL ═══
function openModal(tab='login'){
  document.getElementById('authModal').classList.add('open');
  switchTab(tab);
  document.body.style.overflow='hidden';
}
function closeModal(){
  document.getElementById('authModal').classList.remove('open');
  document.body.style.overflow='';
}
document.getElementById('authModal').addEventListener('click',function(e){ if(e.target===this) closeModal(); });

function switchTab(tab){
  ['login','register','forgot'].forEach(t=>{
    document.getElementById('mpage-'+t)?.classList.toggle('active',t===tab);
    document.getElementById('tab-'+t)?.classList.toggle('active',t===tab);
  });
}

// ═══ GREETING ═══
(function(){
  const key='sw_visited';
  let visited=false;
  try{ visited=!!localStorage.getItem(key); }catch(e){}
  const title=document.getElementById('greet-title');
  const lbl=document.getElementById('greet-label');
  const sub=document.getElementById('greet-sub');
  if(visited){
    lbl.textContent='Welcome back';
    title.innerHTML='Welcome back to <span class="grad">StudyWise!</span>';
    sub.innerHTML='Good to see you again. <a onclick="switchTab(\'register\')">Create a free account →</a>';
  } else {
    try{ localStorage.setItem(key,'1'); }catch(e){}
  }
  const emailInput=document.getElementById('login-email');
  emailInput?.addEventListener('blur',function(){
    const v=this.value.trim();
    if(v&&v.includes('@')){
      const n=v.split('@')[0].replace(/[._\-+]/g,' ').trim();
      const name=n.charAt(0).toUpperCase()+n.slice(1);
      title.style.animation='none'; void title.offsetWidth; title.style.animation='';
      title.innerHTML=`Hey, <span class="grad">${name}!</span>`;
      lbl.textContent='Hey there';
    }
  });
})();

// ═══ AUTH HANDLERS ═══
// function handleLogin(e){
//   e.preventDefault();
//   const email=document.getElementById('login-email').value;
//   const name=email.split('@')[0].replace(/[._\-+]/g,' ').trim();
//   const displayName=name.charAt(0).toUpperCase()+name.slice(1);
//   loginUser(displayName, email);
//   closeModal();
//   showToast('Welcome back, '+displayName+'! 🎉','success');
// }
// function handleRegister(e){
//   e.preventDefault();
//   const name=document.getElementById('reg-name').value;
//   const email=document.getElementById('reg-email').value;
//   loginUser(name, email);
//   closeModal();
//   showToast('Account created! Welcome, '+name+'! 🚀','success');
// }
function handleLogin(e){
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  if(!email) return;
  
  const name = email.split('@')[0].replace(/[._\-+]/g,' ').trim();
  const displayName = name.charAt(0).toUpperCase() + name.slice(1);
  
  loginUser(displayName, email);
  closeModal();
}

function handleRegister(e){
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  
  if(!name || !email) return;
  
  loginUser(name, email);
  closeModal();
}
// function loginUser(name, email){
//   try{
//     localStorage.setItem('sw_user', JSON.stringify({name,email}));
//     localStorage.setItem('sw_visited','1');
//   }catch(e){}
//   document.getElementById('btn-open-auth').style.display='none';
//   document.getElementById('nav-theme-btn').style.display='none';
//   document.getElementById('profile-area').style.display='block';
//   const initial=name.charAt(0).toUpperCase();
//   document.getElementById('profileAvatar').textContent=initial;
//   document.getElementById('profileName').textContent=name.split(' ')[0];
//   document.getElementById('dropdownName').textContent=name;
//   document.getElementById('dropdownEmail').textContent=email;
// }
function loginUser(name, email){
  try{
    localStorage.setItem('sw_user', JSON.stringify({name, email, loggedIn: true}));
    localStorage.setItem('sw_visited','1');
  }catch(e){}

  // إخفاء أزرار اللوجين
  document.getElementById('btn-open-auth').style.display='none';
  document.getElementById('nav-theme-btn').style.display='none';
  document.getElementById('profile-area').style.display='block';

  // تحديث البروفايل
  const initial = name.charAt(0).toUpperCase();
  document.getElementById('profileAvatar').textContent = initial;
  document.getElementById('profileName').textContent = name.split(' ')[0];
  document.getElementById('dropdownName').textContent = name;
  document.getElementById('dropdownEmail').textContent = email;

  // ←←← المهم: التوجيه للداش بورد
  setTimeout(() => {
    window.location.href = '../dashboard.html';   // أو 'Dashboard.html' حسب اسم الملف
  }, 800);
}
function logout(){
  try{ localStorage.removeItem('sw_user'); }catch(e){}
  document.getElementById('profile-area').style.display='none';
  document.getElementById('btn-open-auth').style.display='flex';
  document.getElementById('nav-theme-btn').style.display='flex';
  document.getElementById('profileDropdown').classList.remove('open');
  showToast('Signed out successfully.','success');
}

// Restore session
(function(){
  try{
    const u=JSON.parse(localStorage.getItem('sw_user')||'null');
    if(u) loginUser(u.name, u.email);
  }catch(e){}
})();

// Profile dropdown toggle
document.getElementById('profileBtn')?.addEventListener('click',function(e){
  e.stopPropagation();
  const dd=document.getElementById('profileDropdown');
  dd.classList.toggle('open');
  this.classList.toggle('open');
});
document.addEventListener('click',()=>{
  document.getElementById('profileDropdown')?.classList.remove('open');
  document.getElementById('profileBtn')?.classList.remove('open');
});

// ═══ FORGOT PASSWORD STEPS ═══
function forgotStep(n){
  [1,2,3].forEach(i=>{
    document.getElementById('fstep'+i).style.display=i===n?'block':'none';
    const s=document.getElementById('fi'+i);
    const l=document.getElementById('fl'+i);
    if(i<n){s.className='stind done';s.textContent='✓';if(l)l.className='stind-line done';}
    else if(i===n){s.className='stind active';s.textContent=i;if(l)l.className='stind-line';}
    else{s.className='stind pending';s.textContent=i;if(l)l.className='stind-line';}
  });
}
function handlePasswordReset(){
  closeModal();
  showToast('Password reset successful! 🔒','success');
}

// OTP auto-advance
function otpNext(el,idx){
  const inputs=document.querySelectorAll('.otp-row input');
  if(el.value&&idx<5) inputs[idx+1].focus();
}

// Password eye toggle
function togglePw(id,btn){
  const input=document.getElementById(id);
  const isPass=input.type==='password';
  input.type=isPass?'text':'password';
  btn.textContent=isPass?'🙈':'👁';
}

// ═══ TOAST ═══
function showToast(msg,type='success'){
  const old=document.querySelector('.sw-toast'); if(old)old.remove();
  const t=document.createElement('div');
  t.className=`sw-toast ${type}`;
  t.textContent=msg;
  document.body.appendChild(t);
  requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.add('show')));
  setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),300); },3500);
}