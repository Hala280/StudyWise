import { Component, AfterViewInit, OnDestroy, ElementRef, NgZone } from '@angular/core';
import { Router } from '@angular/router';

interface Course {
  name: string;
  emoji: string;
  color: string;
  code?: string;
  credits?: number | string;
  startDate?: string;
  examDate?: string;
  diff?: string;
  progress: number;
  addedAt: string;
  fromParser?: boolean;
  topics?: any[];
  deadlines?: any[];
}

/**
 * Dashboard shell (sidebar + topbar) plus all 8 dashboard views
 * (overview, courses, parser, analytics, schedule, tutor, goals,
 * achievements), ported 1:1 from dashboard.html + views/*.html +
 * js/common.js + js/overview.js + js/courses.js + js/parser.js +
 * js/analytics.js + js/tutor.js.
 *
 * The original app kept every view's markup in the DOM at once and
 * toggled a CSS "active" class to switch tabs (see showView()) —
 * that exact mechanism is preserved here instead of using Angular
 * child routes, to keep the behaviour identical to the static site.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  private courses: Course[] = [];
  private selectedEmoji = '📐';
  private selectedColor = '#7c3aed';
  private selectedFile: File | null = null;
  private currentEditIndex: number | null = null;
  private chartsBuilt = false;
  private readonly CLAUDE_API = 'https://api.anthropic.com/v1/messages';

  private readonly registeredGlobals = [
    'openSidebar', 'closeSidebar', 'showView', 'toggleTheme', 'logout', 'goHome', 'showToast',
    'openAddCourse', 'closeAddCourse', 'selectEmoji', 'selectColor', 'saveCourse', 'editCourse',
    'deleteCourse', 'openCourseDetail', 'handleFileSelect', 'removeFile', 'parseSyllabus',
    'addParsedCourse', 'resetParser', 'sendTutorMsg',
  ];

  constructor(private el: ElementRef<HTMLElement>, private zone: NgZone, private router: Router) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => this.initPage());
  }

  ngOnDestroy(): void {
    this.registeredGlobals.forEach((k) => { try { delete (window as any)[k]; } catch { /* noop */ } });
  }

  private initPage(): void {
    const root = this.el.nativeElement;
    const $ = <T extends Element = Element>(sel: string) => root.querySelector<T>(sel);
    const $$ = <T extends Element = Element>(sel: string) => Array.from(root.querySelectorAll<T>(sel));

    // ═══════════ SIDEBAR ═══════════
    (window as any).openSidebar = () => {
      $('#sidebar')?.classList.add('open');
      $('#sidebarOverlay')?.classList.add('show');
    };
    (window as any).closeSidebar = () => {
      $('#sidebar')?.classList.remove('open');
      $('#sidebarOverlay')?.classList.remove('show');
    };

    // ═══════════ VIEWS ═══════════
    const viewTitles: Record<string, string> = {
      overview: 'Dashboard', courses: 'My Courses', parser: 'AI Syllabus Parser',
      analytics: 'Analytics', schedule: 'Schedule', tutor: 'AI Tutor',
      goals: 'Goals', achievements: 'Achievements',
    };
    (window as any).showView = (name: string) => {
      $$('.view').forEach((v) => v.classList.remove('active'));
      $$('.nav-item').forEach((n) => n.classList.remove('active'));
      const v = $('#view-' + name);
      if (v) v.classList.add('active');
      const navItems = $$('.nav-item');
      navItems.forEach((n) => {
        if (n.textContent!.trim().toLowerCase().includes(name.replace('-', ' '))) n.classList.add('active');
      });
      const title = $('#topbarTitle'); if (title) title.textContent = viewTitles[name] || name;
      const bread = $('#topbarBread'); if (bread) bread.textContent = viewTitles[name] || name;
      (window as any).closeSidebar();
      if (name === 'analytics') setTimeout(() => this.buildCharts(root), 100);
    };

    // ═══════════ STREAK (sidebar widget) ═══════════
    const buildStreakDays = () => {
      const container = $('#streakDays');
      if (!container) return;
      const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
      let html = '';
      days.forEach((_, i) => {
        const cls = i < 5 ? 'done' : i === 5 ? 'today' : '';
        html += `<div class="streak-day ${cls}" title="${days[i]}"></div>`;
      });
      container.innerHTML = html;
    };

    // ═══════════ THEME / LOGOUT / NAV ═══════════
    (window as any).toggleTheme = () => {
      const html = document.documentElement;
      const isDark = html.getAttribute('data-theme') === 'dark';
      html.setAttribute('data-theme', isDark ? 'light' : 'dark');
      try { localStorage.setItem('sw_theme', isDark ? 'light' : 'dark'); } catch { /* noop */ }
      this.chartsBuilt = false;
    };
    (window as any).logout = () => {
      if (confirm('Are you sure you want to sign out?')) {
        localStorage.removeItem('sw_user');
        this.zone.run(() => this.router.navigateByUrl('/'));
      }
    };
    (window as any).goHome = () => { this.zone.run(() => this.router.navigateByUrl('/')); };

    (window as any).showToast = (msg: string, type = 'success') => {
      const t = $<HTMLElement>('#swToast');
      if (!t) return;
      t.textContent = msg;
      t.className = `sw-toast ${type}`;
      requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
      setTimeout(() => t.classList.remove('show'), 3500);
    };

    // ═══════════ OVERVIEW HELPERS ═══════════
    const setTodayDate = () => {
      const now = new Date();
      const daysArr = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const monthsArr = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const elm = $('#todayDate');
      if (elm) elm.textContent = `${daysArr[now.getDay()]}, ${monthsArr[now.getMonth()]} ${now.getDate()}`;
    };

    const buildMiniCalendar = () => {
      const container = $('#miniCal');
      if (!container) return;
      const now = new Date();
      const month = now.getMonth();
      const year = now.getFullYear();
      const monthsArr = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      let html = `<div class="cal-header">
        <button class="cal-nav">‹</button>
        <div class="cal-month">${monthsArr[month]} ${year}</div>
        <button class="cal-nav">›</button>
      </div>
      <div class="cal-days-header">${dayNames.map((d) => `<div class="cal-day-label">${d}</div>`).join('')}</div>
      <div class="cal-days">`;
      const studyDays = [2, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26, 29];
      for (let i = 0; i < firstDay; i++) html += `<div class="cal-day other"></div>`;
      for (let d = 1; d <= daysInMonth; d++) {
        const isToday = d === now.getDate();
        const hasStudy = studyDays.includes(d) && !isToday;
        html += `<div class="cal-day ${isToday ? 'today' : ''} ${hasStudy ? 'has-study' : ''}">${d}</div>`;
      }
      html += '</div>';
      container.innerHTML = html;
    };

    // ═══════════ COURSES ═══════════
    const getStatusClass = (pct: number) => (pct >= 75 ? 'status-active' : pct >= 50 ? 'status-ontrack' : 'status-behind');
    const getStatusLabel = (pct: number) => (pct >= 75 ? 'On Track' : pct >= 50 ? 'In Progress' : 'Needs Focus');

    const updateCoursesUI = () => {
      const grid = $('#coursesGrid');
      const empty = $<HTMLElement>('#emptyState');
      const subjectList = $('#subjectList');
      const badge = $('#coursesBadge');
      const countEl = $('#coursesCount');
      const statEl = $('#statCourses');

      if (badge) badge.textContent = String(this.courses.length);
      if (statEl) statEl.textContent = String(this.courses.length);
      if (countEl) countEl.textContent = this.courses.length
        ? `${this.courses.length} course${this.courses.length > 1 ? 's' : ''} · ${this.courses.filter((c) => c.progress > 80).length} on track`
        : 'No courses yet — add your first one!';

      if (!this.courses.length) {
        if (empty) empty.style.display = 'block';
        if (subjectList) subjectList.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text3);font-size:13px;">Add courses to see your progress here 📚</div>';
        return;
      }
      if (empty) empty.style.display = 'none';

      const cardsHTML = this.courses.map((c, i) => `
        <div class="course-card" onclick="openCourseDetail(${i})">
          <div class="course-card-top" style="background:linear-gradient(135deg,${c.color}22,${c.color}11);">
            <span style="font-size:40px;">${c.emoji}</span>
            <div style="position:absolute;top:10px;right:10px;">
              <span class="course-status ${getStatusClass(c.progress)}">
                ${getStatusLabel(c.progress)}
              </span>
            </div>
          </div>
          <div class="course-card-body">
            <div class="course-card-name">${c.name}</div>
            <div class="course-card-code">${c.code || 'No code'} · ${c.credits || 3} Credits · ${c.diff || 'Medium'}</div>
            <div class="course-progress-row">
              <span class="course-progress-label">Progress</span>
              <span class="course-progress-pct" style="color:${c.color}">${c.progress}%</span>
            </div>
            <div class="course-track">
              <div class="course-fill" style="width:${c.progress}%;background:linear-gradient(90deg,${c.color},${c.color}aa);"></div>
            </div>
            <div class="course-meta">
              <div class="course-meta-item">📅 <span>${c.examDate || 'No exam set'}</span></div>
            </div>
          </div>
        </div>
      `).join('');

      if (grid) {
        Array.from(grid.children).forEach((c) => { if (!c.id) c.remove(); });
        grid.insertAdjacentHTML('beforeend', cardsHTML);
      }

      if (subjectList) {
        subjectList.innerHTML = this.courses.map((c) => `
          <div class="subject-item">
            <div class="subject-row">
              <span class="subject-name"><span class="subject-dot" style="background:${c.color}"></span>${c.name}</span>
              <span class="subject-pct" style="color:${c.color}">${c.progress}%</span>
            </div>
            <div class="subject-track">
              <div class="subject-fill" style="width:${c.progress}%;background:linear-gradient(90deg,${c.color},${c.color}99);"></div>
            </div>
          </div>
        `).join('');
      }
    };

    (window as any).openAddCourse = () => {
      $('#addCourseModal')?.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    (window as any).closeAddCourse = () => {
      $('#addCourseModal')?.classList.remove('open');
      document.body.style.overflow = '';
    };

    (window as any).selectEmoji = (elm: HTMLElement) => {
      $$('.emoji-opt').forEach((e) => e.classList.remove('selected'));
      elm.classList.add('selected');
      this.selectedEmoji = elm.dataset['emoji'] || this.selectedEmoji;
    };
    (window as any).selectColor = (elm: HTMLElement) => {
      $$('.color-swatch').forEach((e) => e.classList.remove('selected'));
      elm.classList.add('selected');
      this.selectedColor = elm.dataset['color'] || this.selectedColor;
    };

    (window as any).saveCourse = () => {
      const name = $<HTMLInputElement>('#cName')?.value.trim() || '';
      if (!name) { (window as any).showToast('Please enter a course name', 'error'); return; }
      const course: Course = {
        name, emoji: this.selectedEmoji, color: this.selectedColor,
        code: $<HTMLInputElement>('#cCode')?.value.trim(),
        credits: $<HTMLInputElement>('#cCredits')?.value || 3,
        startDate: $<HTMLInputElement>('#cStart')?.value,
        examDate: $<HTMLInputElement>('#cExam')?.value,
        diff: $<HTMLSelectElement>('#cDiff')?.value,
        progress: Math.floor(Math.random() * 60) + 10,
        addedAt: new Date().toISOString(),
      };
      this.courses.push(course);
      try { localStorage.setItem('sw_courses', JSON.stringify(this.courses)); } catch { /* noop */ }
      (window as any).closeAddCourse();
      const cName = $<HTMLInputElement>('#cName'); if (cName) cName.value = '';
      const cCode = $<HTMLInputElement>('#cCode'); if (cCode) cCode.value = '';
      const cCredits = $<HTMLInputElement>('#cCredits'); if (cCredits) cCredits.value = '';
      const grid = $('#coursesGrid');
      if (grid) grid.innerHTML = '<div class="empty-state" id="emptyState" style="display:none;"></div>';
      updateCoursesUI();
      (window as any).showToast(`"${name}" added successfully! 🎉`, 'success');
    };

    (window as any).editCourse = (i: number) => {
      const c = this.courses[i];
      if (!c) return;
      this.currentEditIndex = i;
      const cName = $<HTMLInputElement>('#cName'); if (cName) cName.value = c.name || '';
      const cCode = $<HTMLInputElement>('#cCode'); if (cCode) cCode.value = c.code || '';
      const cExam = $<HTMLInputElement>('#cExam'); if (cExam) cExam.value = c.examDate || '';
      const cCredits = $<HTMLInputElement>('#cCredits'); if (cCredits) cCredits.value = String(c.credits || 3);
      $('#addCourseModal')?.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    (window as any).deleteCourse = (i: number) => {
      if (confirm(`Delete "${this.courses[i].name}"?`)) {
        this.courses.splice(i, 1);
        localStorage.setItem('sw_courses', JSON.stringify(this.courses));
        updateCoursesUI();
        (window as any).showToast('Course deleted successfully', 'success');
      }
    };
    (window as any).openCourseDetail = (i: number) => {
      (window as any).showToast(`Opening ${this.courses[i].name}… (connect to backend for full view)`, 'info');
    };

    // ═══════════ AI PARSER (dashboard tool) ═══════════
    const formatFileSize = (b: number) => {
      if (b < 1024) return b + 'B';
      if (b < 1024 * 1024) return (b / 1024).toFixed(1) + 'KB';
      return (b / 1024 / 1024).toFixed(1) + 'MB';
    };

    (window as any).handleFileSelect = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;
      this.selectedFile = file;
      const preview = $<HTMLElement>('#uploadPreview');
      const pName = $('#previewName'); if (pName) pName.textContent = file.name;
      const pSize = $('#previewSize'); if (pSize) pSize.textContent = formatFileSize(file.size);
      const pIcon = $('#previewIcon'); if (pIcon) pIcon.textContent = file.type.includes('pdf') ? '📄' : file.type.includes('image') ? '🖼️' : '📝';
      preview?.classList.add('show');
      const btn = $<HTMLButtonElement>('#parseBtn'); if (btn) btn.disabled = false;
      (window as any).showToast('File ready! Click "Parse with AI" to extract course info.', 'info');
    };
    (window as any).removeFile = () => {
      this.selectedFile = null;
      const fi = $<HTMLInputElement>('#fileInput'); if (fi) fi.value = '';
      $('#uploadPreview')?.classList.remove('show');
      const btn = $<HTMLButtonElement>('#parseBtn'); if (btn) btn.disabled = true;
    };

    const getMockParseResult = (filename: string) => {
      const name = filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      return {
        courseName: (name.charAt(0).toUpperCase() + name.slice(1)) || 'Advanced Mathematics',
        weeks: 16, creditHours: 3,
        topics: [
          { name: 'Introduction & Fundamentals', weeks: 'Weeks 1–2' },
          { name: 'Core Concepts & Theory', weeks: 'Weeks 3–5' },
          { name: 'Applied Problems', weeks: 'Weeks 6–8' },
          { name: 'Mid-term Review', weeks: 'Week 9' },
          { name: 'Advanced Topics', weeks: 'Weeks 10–13' },
          { name: 'Final Exam Preparation', weeks: 'Weeks 14–16' },
        ],
        deadlines: [
          { name: 'Assignment 1', date: 'Week 4', type: 'assign' },
          { name: 'Mid-term Exam', date: 'Week 9', type: 'exam' },
          { name: 'Project Submission', date: 'Week 12', type: 'assign' },
          { name: 'Final Exam', date: 'Week 16', type: 'exam' },
        ],
      };
    };

    const displayParseResult = (data: ReturnType<typeof getMockParseResult>) => {
      $('#parsingLoader')?.classList.remove('show');
      const pcn = $('#parsedCourseName'); if (pcn) pcn.textContent = data.courseName;
      const pci = $('#parsedCourseInfo');
      if (pci) pci.innerHTML = `
        <span class="info-chip">📅 ${data.weeks} Weeks</span>
        <span class="info-chip">📝 ${data.topics.length} Topics</span>
        <span class="info-chip">⚠️ ${data.deadlines.length} Deadlines</span>
        <span class="info-chip">🎓 ${data.creditHours} Credits</span>
      `;
      const pt = $('#parsedTopics');
      if (pt) pt.innerHTML = data.topics.map((t, i) => `
        <div class="topic-item" style="animation-delay:${i * 80}ms">
          <div class="topic-num">${i + 1}</div>
          <span class="topic-name">${t.name}</span>
          <span class="topic-weeks">${t.weeks}</span>
        </div>
      `).join('');
      const dtypes: Record<string, string> = { exam: 'dtype-exam', assign: 'dtype-assign', quiz: 'dtype-quiz' };
      const dlabels: Record<string, string> = { exam: 'Exam', assign: 'Assignment', quiz: 'Quiz' };
      const pd = $('#parsedDeadlines');
      if (pd) pd.innerHTML = data.deadlines.map((d) => `
        <div class="deadline-item">
          <span class="deadline-icon">${d.type === 'exam' ? '📝' : d.type === 'quiz' ? '✏️' : '📋'}</span>
          <span class="deadline-name">${d.name}</span>
          <span class="deadline-date">${d.date}</span>
          <span class="deadline-type ${dtypes[d.type] || 'dtype-assign'}">${dlabels[d.type] || 'Task'}</span>
        </div>
      `).join('');
      $('#resultContent')?.classList.add('show');
      (window as any)._parsedCourse = data;
    };

    (window as any).parseSyllabus = async () => {
      if (!this.selectedFile) return;
      const placeholder = $<HTMLElement>('#resultPlaceholder');
      if (placeholder) placeholder.style.display = 'none';
      $('#resultContent')?.classList.remove('show');
      $('#parsingLoader')?.classList.add('show');
      const btn = $<HTMLButtonElement>('#parseBtn'); if (btn) btn.disabled = true;

      try {
        await new Promise((r) => setTimeout(r, 2500));
        const mockResult = getMockParseResult(this.selectedFile.name);
        displayParseResult(mockResult);
      } catch {
        (window as any).showToast('Parsing failed. Connect your .NET backend API.', 'error');
        $('#parsingLoader')?.classList.remove('show');
        if (placeholder) placeholder.style.display = 'flex';
      }
      if (btn) btn.disabled = false;
    };

    (window as any).addParsedCourse = () => {
      const d = (window as any)._parsedCourse;
      if (!d) return;
      const course: Course = {
        name: d.courseName, emoji: '📚', color: '#7c3aed',
        code: '', credits: d.creditHours,
        examDate: '', diff: 'Medium',
        progress: 0, addedAt: new Date().toISOString(),
        fromParser: true, topics: d.topics, deadlines: d.deadlines,
      };
      this.courses.push(course);
      try { localStorage.setItem('sw_courses', JSON.stringify(this.courses)); } catch { /* noop */ }
      const grid = $('#coursesGrid');
      if (grid) grid.innerHTML = '<div class="empty-state" id="emptyState" style="display:none;"></div>';
      updateCoursesUI();
      (window as any).showToast(`"${d.courseName}" added to your courses! 🎉`, 'success');
      (window as any).showView('courses');
    };

    (window as any).resetParser = () => {
      this.selectedFile = null;
      const fi = $<HTMLInputElement>('#fileInput'); if (fi) fi.value = '';
      $('#uploadPreview')?.classList.remove('show');
      const btn = $<HTMLButtonElement>('#parseBtn'); if (btn) btn.disabled = true;
      $('#resultContent')?.classList.remove('show');
      $('#parsingLoader')?.classList.remove('show');
      const placeholder = $<HTMLElement>('#resultPlaceholder'); if (placeholder) placeholder.style.display = 'flex';
      (window as any)._parsedCourse = null;
    };

    // ═══════════ AI TUTOR ═══════════
    (window as any).sendTutorMsg = async () => {
      const input = $<HTMLInputElement>('#tutorInput');
      if (!input) return;
      const msg = input.value.trim(); if (!msg) return;
      const msgs = $('#tutorMessages'); if (!msgs) return;
      msgs.innerHTML += `<div style="background:linear-gradient(135deg,var(--purple),var(--cyan));border-radius:14px;border-bottom-right-radius:4px;padding:12px 16px;font-size:13px;color:#fff;max-width:80%;align-self:flex-end;margin-left:auto;">${msg}</div>`;
      input.value = ''; msgs.scrollTop = msgs.scrollHeight;
      try {
        const res = await fetch(this.CLAUDE_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6', max_tokens: 500,
            messages: [{ role: 'user', content: `You are StudyWise AI Tutor, a friendly academic assistant. Be concise and helpful. Student asks: ${msg}` }],
          }),
        });
        const data = await res.json();
        const reply = data?.content?.[0]?.text || 'Connect your backend API for AI responses.';
        msgs.innerHTML += `<div style="background:var(--input-bg);border:1px solid var(--input-bdr);border-radius:14px;border-bottom-left-radius:4px;padding:12px 16px;font-size:13px;color:var(--text);max-width:80%;">${reply}</div>`;
      } catch {
        msgs.innerHTML += `<div style="background:var(--input-bg);border:1px solid var(--input-bdr);border-radius:14px;border-bottom-left-radius:4px;padding:12px 16px;font-size:13px;color:var(--text);max-width:80%;">I'm ready to help! Add your API key to enable AI responses.</div>`;
      }
      msgs.scrollTop = msgs.scrollHeight;
    };

    // ═══════════ INIT (equivalent to the old init()/DOMContentLoaded) ═══════════
    try {
      let u = JSON.parse(localStorage.getItem('sw_user') || 'null');
      if (!u) { u = { name: 'Student', email: 'student@studywise.io' }; }
      const av = $('#sidebarAvatar'); if (av) av.textContent = u.name.charAt(0).toUpperCase();
      const sn = $('#sidebarName'); if (sn) sn.textContent = u.name.split(' ')[0];
      const wn = $('#welcomeName'); if (wn) wn.textContent = u.name.split(' ')[0];
    } catch { /* noop */ }

    try {
      this.courses = JSON.parse(localStorage.getItem('sw_courses') || '[]');
    } catch { this.courses = []; }

    buildStreakDays();
    buildMiniCalendar();
    updateCoursesUI();
    setTodayDate();

    try {
      const t = localStorage.getItem('sw_theme') || 'dark';
      document.documentElement.setAttribute('data-theme', t);
    } catch { /* noop */ }

    const modal = $('#addCourseModal');
    modal?.addEventListener('click', function (this: Element, e: Event) {
      if (e.target === this) (window as any).closeAddCourse();
    });

    const uz = $<HTMLElement>('#uploadZone');
    if (uz) {
      uz.addEventListener('dragover', (e) => { e.preventDefault(); uz.classList.add('drag'); });
      uz.addEventListener('dragleave', () => uz.classList.remove('drag'));
      uz.addEventListener('drop', (e) => {
        e.preventDefault(); uz.classList.remove('drag');
        const dt = (e as DragEvent).dataTransfer;
        const file = dt?.files?.[0];
        if (file) {
          this.selectedFile = file;
          const pName = $('#previewName'); if (pName) pName.textContent = file.name;
          const pSize = $('#previewSize'); if (pSize) pSize.textContent = formatFileSize(file.size);
          $('#uploadPreview')?.classList.add('show');
          const btn = $<HTMLButtonElement>('#parseBtn'); if (btn) btn.disabled = false;
        }
      });
    }
  }

  private buildCharts(root: HTMLElement): void {
    if (this.chartsBuilt) return;
    this.chartsBuilt = true;
    // Note: the bar/pie Chart.js graphs are commented out in the original
    // source too (chart.js is loaded but unused) — only the CSS heatmap
    // is actually rendered, so behaviour here matches the original exactly.
    const heatmap = root.querySelector('#heatmapGrid');
    if (heatmap) {
      const levels = ['', 'l1', 'l2', 'l3', 'l4'];
      let h = '';
      for (let i = 0; i < 28; i++) {
        const lvl = levels[Math.floor(Math.random() * levels.length)];
        h += `<div class="heatmap-cell ${lvl}" title="Day ${i + 1}"></div>`;
      }
      heatmap.innerHTML = h;
    }
  }
}
