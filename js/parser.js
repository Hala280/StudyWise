// ═══════════ AI PARSER ═══════════
function handleFileSelect(e){
  const file = e.target.files[0];
  if(!file)return;
  selectedFile=file;
  const preview=document.getElementById('uploadPreview');
  document.getElementById('previewName').textContent=file.name;
  document.getElementById('previewSize').textContent=formatFileSize(file.size);
  document.getElementById('previewIcon').textContent=file.type.includes('pdf')?'📄':file.type.includes('image')?'🖼️':'📝';
  preview.classList.add('show');
  document.getElementById('parseBtn').disabled=false;
  showToast('File ready! Click "Parse with AI" to extract course info.','info');
}
function removeFile(){
  selectedFile=null;
  document.getElementById('fileInput').value='';
  document.getElementById('uploadPreview').classList.remove('show');
  document.getElementById('parseBtn').disabled=true;
}
function formatFileSize(b){
  if(b<1024)return b+'B';
  if(b<1024*1024)return (b/1024).toFixed(1)+'KB';
  return (b/1024/1024).toFixed(1)+'MB';
}

async function parseSyllabus(){
  if(!selectedFile)return;
  document.getElementById('resultPlaceholder').style.display='none';
  document.getElementById('resultContent').classList.remove('show');
  document.getElementById('parsingLoader').classList.add('show');
  document.getElementById('parseBtn').disabled=true;

  // Simulate AI parsing (replace with real API call to your .NET backend)
  try{
    // Demo: generate realistic-looking parsed data
    await new Promise(r=>setTimeout(r,2500));

    const mockResult = getMockParseResult(selectedFile.name);
    displayParseResult(mockResult);
  }catch(err){
    showToast('Parsing failed. Connect your .NET backend API.','error');
    document.getElementById('parsingLoader').classList.remove('show');
    document.getElementById('resultPlaceholder').style.display='flex';
  }
  document.getElementById('parseBtn').disabled=false;
}

function getMockParseResult(filename){
  const name=filename.replace(/\.[^.]+$/,'').replace(/[-_]/g,' ');
  return{
    courseName: name.charAt(0).toUpperCase()+name.slice(1)||'Advanced Mathematics',
    weeks:16, creditHours:3,
    topics:[
      {name:'Introduction & Fundamentals',weeks:'Weeks 1–2'},
      {name:'Core Concepts & Theory',weeks:'Weeks 3–5'},
      {name:'Applied Problems',weeks:'Weeks 6–8'},
      {name:'Mid-term Review',weeks:'Week 9'},
      {name:'Advanced Topics',weeks:'Weeks 10–13'},
      {name:'Final Exam Preparation',weeks:'Weeks 14–16'},
    ],
    deadlines:[
      {name:'Assignment 1',date:'Week 4',type:'assign'},
      {name:'Mid-term Exam',date:'Week 9',type:'exam'},
      {name:'Project Submission',date:'Week 12',type:'assign'},
      {name:'Final Exam',date:'Week 16',type:'exam'},
    ]
  };
}

function displayParseResult(data){
  document.getElementById('parsingLoader').classList.remove('show');
  document.getElementById('parsedCourseName').textContent=data.courseName;
  document.getElementById('parsedCourseInfo').innerHTML=`
    <span class="info-chip">📅 ${data.weeks} Weeks</span>
    <span class="info-chip">📝 ${data.topics.length} Topics</span>
    <span class="info-chip">⚠️ ${data.deadlines.length} Deadlines</span>
    <span class="info-chip">🎓 ${data.creditHours} Credits</span>
  `;
  document.getElementById('parsedTopics').innerHTML=data.topics.map((t,i)=>`
    <div class="topic-item" style="animation-delay:${i*80}ms">
      <div class="topic-num">${i+1}</div>
      <span class="topic-name">${t.name}</span>
      <span class="topic-weeks">${t.weeks}</span>
    </div>
  `).join('');
  const dtypes={exam:'dtype-exam',assign:'dtype-assign',quiz:'dtype-quiz'};
  const dlabels={exam:'Exam',assign:'Assignment',quiz:'Quiz'};
  document.getElementById('parsedDeadlines').innerHTML=data.deadlines.map(d=>`
    <div class="deadline-item">
      <span class="deadline-icon">${d.type==='exam'?'📝':d.type==='quiz'?'✏️':'📋'}</span>
      <span class="deadline-name">${d.name}</span>
      <span class="deadline-date">${d.date}</span>
      <span class="deadline-type ${dtypes[d.type]||'dtype-assign'}">${dlabels[d.type]||'Task'}</span>
    </div>
  `).join('');
  document.getElementById('resultContent').classList.add('show');
  // Store for adding
  window._parsedCourse=data;
}

function addParsedCourse(){
  const d=window._parsedCourse;
  if(!d)return;
  const course={
    name:d.courseName,emoji:'📚',color:'#7c3aed',
    code:'',credits:d.creditHours,
    examDate:'',diff:'Medium',
    progress:0,addedAt:new Date().toISOString(),
    fromParser:true,topics:d.topics,deadlines:d.deadlines
  };
  courses.push(course);
  try{localStorage.setItem('sw_courses',JSON.stringify(courses));}catch(e){}
  document.getElementById('coursesGrid').innerHTML='<div class="empty-state" id="emptyState" style="display:none;"></div>';
  updateCoursesUI();
  showToast(`"${d.courseName}" added to your courses! 🎉`,'success');
  showView('courses');
}

function resetParser(){
  selectedFile=null;
  document.getElementById('fileInput').value='';
  document.getElementById('uploadPreview').classList.remove('show');
  document.getElementById('parseBtn').disabled=true;
  document.getElementById('resultContent').classList.remove('show');
  document.getElementById('parsingLoader').classList.remove('show');
  document.getElementById('resultPlaceholder').style.display='flex';
  window._parsedCourse=null;
}
