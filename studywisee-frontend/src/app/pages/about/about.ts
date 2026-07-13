import { Component, AfterViewInit, OnDestroy, ElementRef, NgZone } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * About page. Ported 1:1 from home/about.html + home/about.js
 * using the same "attach globals in ngAfterViewInit" strategy as HomeComponent.
 */
@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './about.html',
})
export class AboutComponent implements AfterViewInit, OnDestroy {
  private io?: IntersectionObserver;
  private onScroll?: EventListener;
  private onDocClick?: EventListener;

  constructor(private el: ElementRef<HTMLElement>, private zone: NgZone) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => this.initPage());
  }

  ngOnDestroy(): void {
    this.io?.disconnect();
    if (this.onScroll) window.removeEventListener('scroll', this.onScroll);
    if (this.onDocClick) document.removeEventListener('click', this.onDocClick);
    [
      'toggleTheme', 'toggleChat', 'sendChat', 'openModal', 'closeModal', 'switchTab',
      'handleLogin', 'handleRegister', 'loginUser', 'logout',
    ].forEach((k) => { try { delete (window as any)[k]; } catch { /* noop */ } });
  }

  private initPage(): void {
    const root = this.el.nativeElement;
    const $ = <T extends Element = Element>(sel: string) => root.querySelector<T>(sel);
    const $$ = <T extends Element = Element>(sel: string) => Array.from(root.querySelectorAll<T>(sel));

    this.onScroll = () => { $('#navbar')?.classList.toggle('scrolled', window.scrollY > 50); };
    window.addEventListener('scroll', this.onScroll);

    this.io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.2 });
    $$('.timeline-item').forEach((elm) => this.io!.observe(elm));

    // Theme Toggle
    (window as any).toggleTheme = () => {
      const html = document.documentElement;
      const isDark = html.getAttribute('data-theme') === 'dark';
      html.setAttribute('data-theme', isDark ? 'light' : 'dark');
      document.querySelectorAll('[id^="themeToggle"]').forEach((t) => t.classList.toggle('on', !isDark));
      localStorage.setItem('sw_theme', isDark ? 'light' : 'dark');
    };
    (() => {
      const saved = localStorage.getItem('sw_theme') || 'dark';
      document.documentElement.setAttribute('data-theme', saved);
      const on = saved === 'dark';
      document.querySelectorAll('[id^="themeToggle"]').forEach((t) => t.classList.toggle('on', on));
    })();

    // Footer Quotes
    const quotes = [
      '"The secret of getting ahead is getting started." — Mark Twain',
      '"Study hard, for the well is deep." — Richard Baxter',
      '"An investment in knowledge pays the best interest." — Benjamin Franklin',
      '"Education is the most powerful weapon you can use." — Nelson Mandela',
      '"The more that you read, the more things you will know." — Dr. Seuss',
    ];
    const quoteEl = $('#footerQuote');
    if (quoteEl) quoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];

    // Chat logic
    let chatOpen = false;
    (window as any).toggleChat = () => {
      chatOpen = !chatOpen;
      $('#chatPanel')?.classList.toggle('open', chatOpen);
    };
    (window as any).sendChat = () => {
      const input = $<HTMLInputElement>('#chatInput');
      if (!input) return;
      const msg = input.value.trim(); if (!msg) return;
      const msgs = $('#chatMessages'); if (!msgs) return;
      msgs.innerHTML += `<div class="chat-msg user">${msg}</div>`;
      input.value = '';
      setTimeout(() => {
        msgs.innerHTML += `<div class="chat-msg bot">This is a simulated AI response. Connect your Gemini API to answer questions about: "${msg}"</div>`;
        msgs.scrollTop = msgs.scrollHeight;
      }, 1000);
    };

    // Modals & Auth Logic
    (window as any).openModal = (tab: string) => {
      $('#authModal')?.classList.add('open');
      (window as any).switchTab(tab);
    };
    (window as any).closeModal = () => { $('#authModal')?.classList.remove('open'); };
    (window as any).switchTab = (tab: string) => {
      ['login', 'register'].forEach((t) => {
        $('#mpage-' + t)?.classList.toggle('active', t === tab);
        $('#tab-' + t)?.classList.toggle('active', t === tab);
      });
    };

    (window as any).handleLogin = (e: Event) => {
      e.preventDefault();
      const email = $<HTMLInputElement>('#login-email')?.value ?? '';
      const name = email.split('@')[0];
      (window as any).loginUser(name, email);
      (window as any).closeModal();
    };
    (window as any).handleRegister = (e: Event) => {
      e.preventDefault();
      const name = $<HTMLInputElement>('#reg-name')?.value ?? '';
      const email = $<HTMLInputElement>('#reg-email')?.value ?? '';
      (window as any).loginUser(name, email);
      (window as any).closeModal();
    };

    (window as any).loginUser = (name: string, email: string) => {
      localStorage.setItem('sw_user', JSON.stringify({ name, email }));
      const btnOpenAuth = $<HTMLElement>('#btn-open-auth');
      const navThemeBtn = $<HTMLElement>('#nav-theme-btn');
      const profileArea = $<HTMLElement>('#profile-area');
      if (btnOpenAuth) btnOpenAuth.style.display = 'none';
      if (navThemeBtn) navThemeBtn.style.display = 'none';
      if (profileArea) profileArea.style.display = 'block';

      const initial = name.charAt(0).toUpperCase();
      const av = $('#profileAvatar'); if (av) av.textContent = initial;
      const pn = $('#profileName'); if (pn) pn.textContent = name.substring(0, 6);
      const dn = $('#dropdownName'); if (dn) dn.textContent = name;
      const de = $('#dropdownEmail'); if (de) de.textContent = email;
    };

    (window as any).logout = () => {
      localStorage.removeItem('sw_user');
      const profileArea = $<HTMLElement>('#profile-area');
      const btnOpenAuth = $<HTMLElement>('#btn-open-auth');
      const navThemeBtn = $<HTMLElement>('#nav-theme-btn');
      if (profileArea) profileArea.style.display = 'none';
      if (btnOpenAuth) btnOpenAuth.style.display = 'flex';
      if (navThemeBtn) navThemeBtn.style.display = 'flex';
      $('#profileDropdown')?.classList.remove('open');
    };

    // On page load, check if user is logged in
    (() => {
      const u = JSON.parse(localStorage.getItem('sw_user') || 'null');
      if (u) (window as any).loginUser(u.name, u.email);
    })();

    // Profile Dropdown Toggle
    $('#profileBtn')?.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      $('#profileDropdown')?.classList.toggle('open');
    });
    this.onDocClick = () => { $('#profileDropdown')?.classList.remove('open'); };
    document.addEventListener('click', this.onDocClick);
  }
}
