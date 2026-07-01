// ═══════════ AI TUTOR ═══════════
async function sendTutorMsg(){
  const input=document.getElementById('tutorInput');
  const msg=input.value.trim();if(!msg)return;
  const msgs=document.getElementById('tutorMessages');
  msgs.innerHTML+=`<div style="background:linear-gradient(135deg,var(--purple),var(--cyan));border-radius:14px;border-bottom-right-radius:4px;padding:12px 16px;font-size:13px;color:#fff;max-width:80%;align-self:flex-end;margin-left:auto;">${msg}</div>`;
  input.value='';msgs.scrollTop=msgs.scrollHeight;
  // Call Claude API
  try{
    const res=await fetch(CLAUDE_API,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'claude-sonnet-4-6',max_tokens:500,
        messages:[{role:'user',content:`You are StudyWise AI Tutor, a friendly academic assistant. Be concise and helpful. Student asks: ${msg}`}]
      })
    });
    const data=await res.json();
    const reply=data?.content?.[0]?.text||'Connect your backend API for AI responses.';
    msgs.innerHTML+=`<div style="background:var(--input-bg);border:1px solid var(--input-bdr);border-radius:14px;border-bottom-left-radius:4px;padding:12px 16px;font-size:13px;color:var(--text);max-width:80%;">${reply}</div>`;
  }catch(e){
    msgs.innerHTML+=`<div style="background:var(--input-bg);border:1px solid var(--input-bdr);border-radius:14px;border-bottom-left-radius:4px;padding:12px 16px;font-size:13px;color:var(--text);max-width:80%;">I'm ready to help! Add your API key to enable AI responses.</div>`;
  }
  msgs.scrollTop=msgs.scrollHeight;
}
