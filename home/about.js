// Scroll & Intersection Observer for Timeline Animations
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
});

const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.2 });
document.querySelectorAll('.timeline-item').forEach(el => io.observe(el));

// Theme Toggle
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  document.querySelectorAll('[id^="themeToggle"]').forEach(t => t.classList.toggle('on', !isDark));
  localStorage.setItem('sw_theme', isDark ? 'light' : 'dark');
}
(function(){
  const saved = localStorage.getItem('sw_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  const on = saved === 'dark';
  document.querySelectorAll('[id^="themeToggle"]').forEach(t => t.classList.toggle('on', on));
})();

// Footer Quotes
const quotes=[
  '"The secret of getting ahead is getting started." — Mark Twain',
  '"Study hard, for the well is deep." — Richard Baxter',
  '"An investment in knowledge pays the best interest." — Benjamin Franklin',
  '"Education is the most powerful weapon you can use." — Nelson Mandela',
  '"The more that you read, the more things you will know." — Dr. Seuss',
];
const quoteEl = document.getElementById('footerQuote');
if(quoteEl) quoteEl.textContent=quotes[Math.floor(Math.random()*quotes.length)];

// Chat logic
let chatOpen = false;
function toggleChat(){
  chatOpen = !chatOpen;
  document.getElementById('chatPanel').classList.toggle('open', chatOpen);
}
function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim(); if(!msg) return;
  const msgs = document.getElementById('chatMessages');
  msgs.innerHTML += `<div class="chat-msg user">${msg}</div>`;
  input.value = '';
  setTimeout(() => {
    msgs.innerHTML += `<div class="chat-msg bot">This is a simulated AI response. Connect your Gemini API to answer questions about: "${msg}"</div>`;
    msgs.scrollTop = msgs.scrollHeight;
  }, 1000);
}

// Modals & Auth Logic (Simulating the Backend Token Storage)
function openModal(tab) {
  document.getElementById('authModal').classList.add('open');
  switchTab(tab);
}
function closeModal() { document.getElementById('authModal').classList.remove('open'); }
function switchTab(tab) {
  ['login','register'].forEach(t => {
    document.getElementById('mpage-'+t)?.classList.toggle('active', t===tab);
    document.getElementById('tab-'+t)?.classList.toggle('active', t===tab);
  });
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const name = email.split('@')[0];
  loginUser(name, email);
  closeModal();
}
function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  loginUser(name, email);
  closeModal();
}

// This function acts like saving the JWT token and updating the UI
function loginUser(name, email) {
  localStorage.setItem('sw_user', JSON.stringify({name,email}));
  document.getElementById('btn-open-auth').style.display = 'none';
  document.getElementById('nav-theme-btn').style.display = 'none';
  document.getElementById('profile-area').style.display = 'block';
  
  const initial = name.charAt(0).toUpperCase();
  document.getElementById('profileAvatar').textContent = initial;
  document.getElementById('profileName').textContent = name.substring(0,6);
  document.getElementById('dropdownName').textContent = name;
  document.getElementById('dropdownEmail').textContent = email;
}

function logout() {
  localStorage.removeItem('sw_user');
  document.getElementById('profile-area').style.display = 'none';
  document.getElementById('btn-open-auth').style.display = 'flex';
  document.getElementById('nav-theme-btn').style.display = 'flex';
  document.getElementById('profileDropdown').classList.remove('open');
}

// On page load, check if user is logged in
(function(){
  const u = JSON.parse(localStorage.getItem('sw_user') || 'null');
  if(u) loginUser(u.name, u.email);
})();

// Profile Dropdown Toggle
document.getElementById('profileBtn')?.addEventListener('click', function(e){
  e.stopPropagation();
  document.getElementById('profileDropdown').classList.toggle('open');
});
document.addEventListener('click', () => {
  document.getElementById('profileDropdown')?.classList.remove('open');
});