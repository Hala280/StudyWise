import { Component, AfterViewInit, OnDestroy, ElementRef, NgZone } from '@angular/core';
import { RouterLink, Router } from '@angular/router';

/**
 * Home / landing page.
 * Ported 1:1 from the original static home/index.html + home/home.js.
 * The original script relied on global functions wired up via inline
 * onclick="" attributes and document.getElementById lookups — that
 * behaviour is preserved here by attaching the same functions onto
 * `window` for the lifetime of this component, and running all the
 * original bootstrap code inside ngAfterViewInit (once the template
 * has been rendered into the DOM, just like a page load would).
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  private chatOpen = false;
  private io?: IntersectionObserver;
  private particlesRafId?: number;
  private boundHandlers: Record<string, EventListener> = {};

  constructor(private el: ElementRef<HTMLElement>, private zone: NgZone, private router: Router) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => this.initPage());
  }

  ngOnDestroy(): void {
    if (this.particlesRafId) cancelAnimationFrame(this.particlesRafId);
    this.io?.disconnect();
    Object.entries(this.boundHandlers).forEach(([evt, handler]) => window.removeEventListener(evt, handler));
    // Clean up the global functions this component registered.
    [
      'scrollToSection', 'toggleTheme', 'toggleFaq', 'toggleChat', 'sendChat',
      'openModal', 'closeModal', 'switchTab', 'handleLogin', 'handleRegister',
      'loginUser', 'logout', 'forgotStep', 'handlePasswordReset', 'otpNext', 'togglePw',
    ].forEach((k) => { try { delete (window as any)[k]; } catch { /* noop */ } });
  }

  private initPage(): void {
    const root = this.el.nativeElement;
    const $ = <T extends Element = Element>(sel: string) => root.querySelector<T>(sel);
    const $$ = <T extends Element = Element>(sel: string) => Array.from(root.querySelectorAll<T>(sel));

    // ═══ PARTICLES CANVAS ═══
    const c = $<HTMLCanvasElement>('#particles');
    if (c) {
      const ctx = c.getContext('2d')!;
      let W = 0, H = 0;
      let pts: any[] = [];
      const resize = () => {
        W = c.width = c.offsetWidth;
        H = c.height = c.offsetHeight;
        pts = Array.from({ length: 80 }, () => ({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
          r: Math.random() * 2 + 0.5,
          col: ['#a78bfa', '#22d3ee', '#818cf8', '#f472b6', '#34d399'][Math.floor(Math.random() * 5)],
          a: Math.random() * 0.5 + 0.15,
        }));
      };
      const draw = () => {
        ctx.clearRect(0, 0, W, H);
        pts.forEach((p) => {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > W) p.vx *= -1;
          if (p.y < 0 || p.y > H) p.vy *= -1;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.col + Math.floor(p.a * 255).toString(16).padStart(2, '0');
          ctx.fill();
        });
        pts.forEach((p, i) => {
          for (let j = i + 1; j < pts.length; j++) {
            const d = Math.hypot(p.x - pts[j].x, p.y - pts[j].y);
            if (d < 100) {
              ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(pts[j].x, pts[j].y);
              ctx.strokeStyle = p.col + Math.floor((1 - d / 100) * 40).toString(16).padStart(2, '0');
              ctx.lineWidth = 0.6; ctx.stroke();
            }
          }
        });
        this.particlesRafId = requestAnimationFrame(draw);
      };
      resize(); draw();
      const onResize = () => resize();
      window.addEventListener('resize', onResize);
      this.boundHandlers['resize'] = onResize;
    }

    // ═══ NAVBAR SCROLL ═══
    const onScroll = () => { $('#navbar')?.classList.toggle('scrolled', window.scrollY > 60); };
    window.addEventListener('scroll', onScroll);
    this.boundHandlers['scroll'] = onScroll;

    (window as any).scrollToSection = (id: string) => {
      root.querySelector(`#${id}`)?.scrollIntoView({ behavior: 'smooth' });
    };

    // ═══ INTERSECTION OBSERVER ═══
    this.io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const d = (e.target as HTMLElement).dataset['delay'] || '0';
          setTimeout(() => e.target.classList.add('visible'), +d);
          this.io?.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    $$('.feat-card, .annotation').forEach((elm) => this.io!.observe(elm));

    // ═══ MOCKUP PARALLAX ═══
    const onMouseMove = (e: Event) => {
      const me = e as MouseEvent;
      const frame = $<HTMLElement>('#mockupFrame');
      if (!frame) return;
      const x = (me.clientX / window.innerWidth - 0.5) * 8;
      const y = (me.clientY / window.innerHeight - 0.5) * 6;
      frame.style.transform = `perspective(1000px) rotateY(${x}deg) rotateX(${-y}deg)`;
    };
    document.addEventListener('mousemove', onMouseMove);
    this.boundHandlers['mousemove'] = onMouseMove;

    // ═══ THEME TOGGLE ═══
    (window as any).toggleTheme = () => {
      const html = document.documentElement;
      const isDark = html.getAttribute('data-theme') === 'dark';
      html.setAttribute('data-theme', isDark ? 'light' : 'dark');
      document.querySelectorAll('[id^="themeToggle"]').forEach((t) => t.classList.toggle('on', !isDark));
      try { localStorage.setItem('sw_theme', isDark ? 'light' : 'dark'); } catch { /* noop */ }
    };
    (() => {
      let saved = 'dark';
      try { saved = localStorage.getItem('sw_theme') || 'dark'; } catch { /* noop */ }
      document.documentElement.setAttribute('data-theme', saved);
      const on = saved === 'dark';
      document.querySelectorAll('[id^="themeToggle"]').forEach((t) => t.classList.toggle('on', on));
    })();

    // ═══ FAQ ACCORDION ═══
    (window as any).toggleFaq = (btn: HTMLElement) => {
      const item = btn.parentElement!;
      const isOpen = item.classList.contains('open');
      $$('.faq-item.open').forEach((i) => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    };

    // ═══ FOOTER QUOTES ═══
    const quotes = [
      '"The secret of getting ahead is getting started." — Mark Twain',
      '"Study hard, for the well is deep." — Richard Baxter',
      '"An investment in knowledge pays the best interest." — Benjamin Franklin',
      '"Education is the most powerful weapon you can use." — Nelson Mandela',
      '"The more that you read, the more things you will know." — Dr. Seuss',
    ];
    const quoteEl = $('#footerQuote');
    if (quoteEl) quoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];

    // ═══ CHAT ═══
    (window as any).toggleChat = () => {
      this.chatOpen = !this.chatOpen;
      $('#chatPanel')?.classList.toggle('open', this.chatOpen);
      if (this.chatOpen) $<HTMLInputElement>('#chatInput')?.focus();
    };

    const GEMINI_KEY = 'AQ.Ab8RN6LvY7hJfJXGLhgD9GeTlgbjIyLcvitiAl8B_tLih1zzZQ';
    (window as any).sendChat = async () => {
      const input = $<HTMLInputElement>('#chatInput');
      if (!input) return;
      const msg = input.value.trim();
      if (!msg) return;
      const msgs = $('#chatMessages');
      if (!msgs) return;
      msgs.innerHTML += `<div class="chat-msg user">${msg}</div>`;
      input.value = '';
      msgs.scrollTop = msgs.scrollHeight;
      const typing = document.createElement('div');
      typing.className = 'chat-msg bot chat-typing';
      typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
      msgs.appendChild(typing);
      msgs.scrollTop = msgs.scrollHeight;
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'You are StudyWise AI Tutor, a helpful and friendly academic assistant for students. ' + msg }] }] }),
        });
        const data = await res.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not get a response right now.';
        typing.remove();
        msgs.innerHTML += `<div class="chat-msg bot">${reply}</div>`;
      } catch {
        typing.remove();
        msgs.innerHTML += `<div class="chat-msg bot">⚠️ Add your Gemini API key in the code to enable AI responses!</div>`;
      }
      msgs.scrollTop = msgs.scrollHeight;
    };

    // ═══ MODAL ═══
    (window as any).openModal = (tab = 'login') => {
      $('#authModal')?.classList.add('open');
      (window as any).switchTab(tab);
      document.body.style.overflow = 'hidden';
    };
    (window as any).closeModal = () => {
      $('#authModal')?.classList.remove('open');
      document.body.style.overflow = '';
    };
    $('#authModal')?.addEventListener('click', function (this: Element, e: Event) {
      if (e.target === this) (window as any).closeModal();
    });

    (window as any).switchTab = (tab: string) => {
      ['login', 'register', 'forgot'].forEach((t) => {
        $('#mpage-' + t)?.classList.toggle('active', t === tab);
        $('#tab-' + t)?.classList.toggle('active', t === tab);
      });
    };

    // ═══ GREETING ═══
    (() => {
      const key = 'sw_visited';
      let visited = false;
      try { visited = !!localStorage.getItem(key); } catch { /* noop */ }
      const title = $('#greet-title');
      const lbl = $('#greet-label');
      const sub = $('#greet-sub');
      if (visited) {
        if (lbl) lbl.textContent = 'Welcome back';
        if (title) title.innerHTML = 'Welcome back to <span class="grad">StudyWise!</span>';
        if (sub) sub.innerHTML = 'Good to see you again. <a onclick="switchTab(\'register\')">Create a free account →</a>';
      } else {
        try { localStorage.setItem(key, '1'); } catch { /* noop */ }
      }
      const emailInput = $<HTMLInputElement>('#login-email');
      emailInput?.addEventListener('blur', function (this: HTMLInputElement) {
        const v = this.value.trim();
        if (v && v.includes('@')) {
          const n = v.split('@')[0].replace(/[._\-+]/g, ' ').trim();
          const name = n.charAt(0).toUpperCase() + n.slice(1);
          if (title) {
            (title as HTMLElement).style.animation = 'none';
            void (title as HTMLElement).offsetWidth;
            (title as HTMLElement).style.animation = '';
            title.innerHTML = `Hey, <span class="grad">${name}!</span>`;
          }
          if (lbl) lbl.textContent = 'Hey there';
        }
      });
    })();

    // ═══ AUTH HANDLERS ═══
    (window as any).handleLogin = (e: Event) => {
      e.preventDefault();
      const email = $<HTMLInputElement>('#login-email')?.value.trim();
      if (!email) return;
      const name = email.split('@')[0].replace(/[._\-+]/g, ' ').trim();
      const displayName = name.charAt(0).toUpperCase() + name.slice(1);
      (window as any).loginUser(displayName, email);
      (window as any).closeModal();
    };

    (window as any).handleRegister = (e: Event) => {
      e.preventDefault();
      const name = $<HTMLInputElement>('#reg-name')?.value.trim();
      const email = $<HTMLInputElement>('#reg-email')?.value.trim();
      if (!name || !email) return;
      (window as any).loginUser(name, email);
      (window as any).closeModal();
    };

    (window as any).loginUser = (name: string, email: string) => {
      try {
        localStorage.setItem('sw_user', JSON.stringify({ name, email, loggedIn: true }));
        localStorage.setItem('sw_visited', '1');
      } catch { /* noop */ }

      const btnOpenAuth = $<HTMLElement>('#btn-open-auth');
      const navThemeBtn = $<HTMLElement>('#nav-theme-btn');
      const profileArea = $<HTMLElement>('#profile-area');
      if (btnOpenAuth) btnOpenAuth.style.display = 'none';
      if (navThemeBtn) navThemeBtn.style.display = 'none';
      if (profileArea) profileArea.style.display = 'block';

      const initial = name.charAt(0).toUpperCase();
      const avatar = $('#profileAvatar'); if (avatar) avatar.textContent = initial;
      const pname = $('#profileName'); if (pname) pname.textContent = name.split(' ')[0];
      const dname = $('#dropdownName'); if (dname) dname.textContent = name;
      const demail = $('#dropdownEmail'); if (demail) demail.textContent = email;

      // Route to the dashboard using the Angular router instead of a hard page reload.
      setTimeout(() => {
        this.zone.run(() => this.router.navigateByUrl('/dashboard'));
      }, 800);
    };

    (window as any).logout = () => {
      try { localStorage.removeItem('sw_user'); } catch { /* noop */ }
      const profileArea = $<HTMLElement>('#profile-area');
      const btnOpenAuth = $<HTMLElement>('#btn-open-auth');
      const navThemeBtn = $<HTMLElement>('#nav-theme-btn');
      if (profileArea) profileArea.style.display = 'none';
      if (btnOpenAuth) btnOpenAuth.style.display = 'flex';
      if (navThemeBtn) navThemeBtn.style.display = 'flex';
      $('#profileDropdown')?.classList.remove('open');
      (window as any).showToastHome?.('Signed out successfully.', 'success');
    };

    // Restore session
    (() => {
      try {
        const u = JSON.parse(localStorage.getItem('sw_user') || 'null');
        if (u) (window as any).loginUser(u.name, u.email);
      } catch { /* noop */ }
    })();

    // Profile dropdown toggle
    $('#profileBtn')?.addEventListener('click', function (this: Element, e: Event) {
      e.stopPropagation();
      const dd = root.querySelector('#profileDropdown');
      dd?.classList.toggle('open');
      this.classList.toggle('open');
    });
    document.addEventListener('click', () => {
      $('#profileDropdown')?.classList.remove('open');
      $('#profileBtn')?.classList.remove('open');
    });

    // ═══ FORGOT PASSWORD STEPS ═══
    (window as any).forgotStep = (n: number) => {
      [1, 2, 3].forEach((i) => {
        const step = $<HTMLElement>('#fstep' + i);
        if (step) step.style.display = i === n ? 'block' : 'none';
        const s = $<HTMLElement>('#fi' + i);
        const l = $<HTMLElement>('#fl' + i);
        if (i < n) { if (s) { s.className = 'stind done'; s.textContent = '✓'; } if (l) l.className = 'stind-line done'; }
        else if (i === n) { if (s) { s.className = 'stind active'; s.textContent = String(i); } if (l) l.className = 'stind-line'; }
        else { if (s) { s.className = 'stind pending'; s.textContent = String(i); } if (l) l.className = 'stind-line'; }
      });
    };
    (window as any).handlePasswordReset = () => {
      (window as any).closeModal();
    };

    // OTP auto-advance
    (window as any).otpNext = (elm: HTMLInputElement, idx: number) => {
      const inputs = $$<HTMLInputElement>('.otp-row input');
      if (elm.value && idx < 5) inputs[idx + 1]?.focus();
    };

    // Password eye toggle
    (window as any).togglePw = (id: string, btn: HTMLElement) => {
      const input = $<HTMLInputElement>('#' + id);
      if (!input) return;
      const isPass = input.type === 'password';
      input.type = isPass ? 'text' : 'password';
      btn.textContent = isPass ? '🙈' : '👁';
    };
  }

  /** Angular-native helper kept for the template if needed directly. */
  goToDashboard(): void {
    this.router.navigateByUrl('/dashboard');
  }
}
