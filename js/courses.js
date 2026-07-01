// ═══════════ COURSES ═══════════
function updateCoursesUI(){
  const grid = document.getElementById('coursesGrid');
  const empty = document.getElementById('emptyState');
  const subjectList = document.getElementById('subjectList');
  const badge = document.getElementById('coursesBadge');
  const countEl = document.getElementById('coursesCount');
  const statEl = document.getElementById('statCourses');

  if(badge) badge.textContent = courses.length;
  if(statEl) statEl.textContent = courses.length;
  if(countEl) countEl.textContent = courses.length ? `${courses.length} course${courses.length>1?'s':''} · ${courses.filter(c=>c.progress>80).length} on track` : 'No courses yet — add your first one!';

  if(!courses.length){
    if(empty) empty.style.display='block';
    if(subjectList) subjectList.innerHTML='<div style="text-align:center;padding:30px;color:var(--text3);font-size:13px;">Add courses to see your progress here 📚</div>';
    return;
  }
  if(empty) empty.style.display='none';

  // Course cards
  const cardsHTML = courses.map((c,i)=>`
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
        <div class="course-card-code">${c.code||'No code'} · ${c.credits||3} Credits · ${c.diff||'Medium'}</div>
        <div class="course-progress-row">
          <span class="course-progress-label">Progress</span>
          <span class="course-progress-pct" style="color:${c.color}">${c.progress}%</span>
        </div>
        <div class="course-track">
          <div class="course-fill" style="width:${c.progress}%;background:linear-gradient(90deg,${c.color},${c.color}aa);"></div>
        </div>
        <div class="course-meta">
          <div class="course-meta-item">📅 <span>${c.examDate||'No exam set'}</span></div>
        </div>
      </div>
    </div>
  `).join('');

  if(grid){
    // Remove old cards (not empty state)
    [...grid.children].forEach(c=>{ if(!c.id) c.remove(); });
    grid.insertAdjacentHTML('beforeend',cardsHTML);
  }

  // Subject list in overview
  if(subjectList){
    subjectList.innerHTML = courses.map(c=>`
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
}

function getStatusClass(pct){ return pct>=75?'status-active':pct>=50?'status-ontrack':'status-behind'; }
function getStatusLabel(pct){ return pct>=75?'On Track':pct>=50?'In Progress':'Needs Focus'; }

// Open / Close Add Course Modal
function openAddCourse(){
  document.getElementById('addCourseModal').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeAddCourse(){
  document.getElementById('addCourseModal').classList.remove('open');
  document.body.style.overflow='';
}

function selectEmoji(el){
  document.querySelectorAll('.emoji-opt').forEach(e=>e.classList.remove('selected'));
  el.classList.add('selected');
  selectedEmoji=el.dataset.emoji;
}
function selectColor(el){
  document.querySelectorAll('.color-swatch').forEach(e=>e.classList.remove('selected'));
  el.classList.add('selected');
  selectedColor=el.dataset.color;
}

// Save Course
function saveCourse(){
  const name=document.getElementById('cName').value.trim();
  if(!name){showToast('Please enter a course name','error');return;}
  const course={
    name, emoji:selectedEmoji, color:selectedColor,
    code:document.getElementById('cCode').value.trim(),
    credits:document.getElementById('cCredits').value||3,
    startDate:document.getElementById('cStart').value,
    examDate:document.getElementById('cExam').value,
    diff:document.getElementById('cDiff').value,
    progress:Math.floor(Math.random()*60)+10,
    addedAt:new Date().toISOString()
  };
  courses.push(course);
  try{localStorage.setItem('sw_courses',JSON.stringify(courses));}catch(e){}
  closeAddCourse();
  // Clear form
  document.getElementById('cName').value='';
  document.getElementById('cCode').value='';
  document.getElementById('cCredits').value='';
  // Re-render
  document.getElementById('coursesGrid').innerHTML='<div class="empty-state" id="emptyState" style="display:none;"></div>';
  updateCoursesUI();
  showToast(`"${name}" added successfully! 🎉`,'success');
}

// Edit / Delete Course (kept for parity with original logic)
function editCourse(i){
  const c = courses[i];
  currentEditIndex = i;

  document.getElementById('cName').value = c.name || '';
  document.getElementById('cCode').value = c.code || '';
  document.getElementById('cExam').value = c.examDate || '';
  document.getElementById('cCredits').value = c.credits || 3;

  document.getElementById('addCourseModal').classList.add('open');
  document.body.style.overflow='hidden';
}
function deleteCourse(i){
  if(confirm(`Delete "${courses[i].name}"?`)){
    courses.splice(i, 1);
    localStorage.setItem('sw_courses', JSON.stringify(courses));
    updateCoursesUI();
    showToast('Course deleted successfully', 'success');
  }
}

function openCourseDetail(i){
  showToast(`Opening ${courses[i].name}… (connect to backend for full view)`,'info');
}
