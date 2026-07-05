import { Component, AfterViewInit, OnDestroy, ElementRef, NgZone } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

/**
 * Public "AI Syllabus Parser" marketing/demo page.
 * Ported 1:1 from home/ai_syllabus_parser.html (inline <style> moved to
 * parser-landing.css, inline <script> moved here).
 */
@Component({
  selector: 'app-parser-landing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './parser-landing.html',
})
export class ParserLandingComponent implements AfterViewInit, OnDestroy {
  private onScroll?: EventListener;
  private timeoutId?: ReturnType<typeof setTimeout>;

  constructor(private el: ElementRef<HTMLElement>, private zone: NgZone, private router: Router) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => this.initPage());
  }

  ngOnDestroy(): void {
    if (this.onScroll) window.removeEventListener('scroll', this.onScroll);
    if (this.timeoutId) clearTimeout(this.timeoutId);
    try { delete (window as any).toggleTheme; } catch { /* noop */ }
  }

  private initPage(): void {
    const root = this.el.nativeElement;
    const $ = <T extends Element = Element>(sel: string) => root.querySelector<T>(sel);

    // 1. Theme Toggle logic
    (window as any).toggleTheme = () => {
      const html = document.documentElement;
      const isDark = html.getAttribute('data-theme') === 'dark';
      html.setAttribute('data-theme', isDark ? 'light' : 'dark');
      $('#themeToggleNav')?.classList.toggle('on', !isDark);
      try { localStorage.setItem('sw_theme', isDark ? 'light' : 'dark'); } catch { /* noop */ }
    };
    (() => {
      let saved = 'dark';
      try { saved = localStorage.getItem('sw_theme') || 'dark'; } catch { /* noop */ }
      document.documentElement.setAttribute('data-theme', saved);
      const on = saved === 'dark';
      $('#themeToggleNav')?.classList.toggle('on', on);
    })();

    // 2. Navbar Scroll Effect
    this.onScroll = () => { $('#navbar')?.classList.toggle('scrolled', window.scrollY > 60); };
    window.addEventListener('scroll', this.onScroll);

    // 3. AI Parser Upload Logic
    const dropZone = $<HTMLElement>('#dropZone');
    const fileInput = $<HTMLInputElement>('#fileInput');
    const processingMsg = $<HTMLElement>('#processingMsg');
    const results = $<HTMLElement>('#results');

    if (dropZone && fileInput) {
      dropZone.onclick = () => fileInput.click();

      fileInput.onchange = () => {
        if (fileInput.files && fileInput.files.length > 0) {
          const h3 = dropZone.querySelector<HTMLElement>('h3');
          const p = dropZone.querySelector<HTMLElement>('p');
          const icon = dropZone.querySelector<HTMLElement>('.upload-icon');
          if (h3) h3.style.display = 'none';
          if (p) p.style.display = 'none';
          if (icon) icon.style.display = 'none';
          if (processingMsg) processingMsg.style.display = 'block';

          this.timeoutId = setTimeout(() => {
            dropZone.style.display = 'none';
            if (results) results.style.display = 'grid';
          }, 3000);
        }
      };
    }
  }

  goToDashboard(): void {
    this.router.navigateByUrl('/dashboard');
  }
}
