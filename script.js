// Configuration: set your backend endpoint here to receive submissions.
// For GitHub Pages, this should be a serverless URL (Google Apps Script, Azure Function, etc.)
const BACKEND_ENDPOINT = ""; // e.g. "https://script.google.com/macros/s/your-id/exec"

let QUIZ_DATA = null;
const PAGE_SIZE = 10;
let currentPage = 0; // zero-based

async function loadQuestions(){
  const res = await fetch('questions.json');
  QUIZ_DATA = await res.json();
  return QUIZ_DATA;
}

function renderQuizPage(pageIndex){
  const container = document.getElementById('quiz');
  container.innerHTML = '';
  const start = pageIndex * PAGE_SIZE;
  const pageQuestions = QUIZ_DATA.questions.slice(start, start + PAGE_SIZE);
  pageQuestions.forEach((q, idx)=>{
    const card = document.createElement('div');
    card.className = 'card question';
    const h = document.createElement('h3');
    h.textContent = (start + idx + 1) + '. ' + q.question;
    card.appendChild(h);

    if(q.type === 'mcq'){
      const choices = document.createElement('div');
      choices.className = 'choices';
      q.choices.forEach((c,i)=>{
        const id = `q-${q.id}-${i}`;
        const label = document.createElement('label');
        label.htmlFor = id;
        label.innerHTML = `<input type='radio' name='${q.id}' id='${id}' value='${i}'> ${c}`;
        choices.appendChild(label);
      });
      card.appendChild(choices);
    } else if(q.type === 'text'){
      const input = document.createElement('textarea');
      input.name = q.id;
      input.placeholder = 'Type your answer here';
      input.rows = 3;
      card.appendChild(input);
    }

    container.appendChild(card);
  });
  updatePageInfo();
}

function updatePageInfo(){
  const info = document.getElementById('pageInfo');
  const totalPages = Math.ceil(QUIZ_DATA.questions.length / PAGE_SIZE);
  info.textContent = `Page ${currentPage+1} / ${totalPages}`;
}

function gatherAnswersForPage(pageIndex){
  const start = pageIndex * PAGE_SIZE;
  const pageQuestions = QUIZ_DATA.questions.slice(start, start + PAGE_SIZE);
  const out = {responses:[], score:0, total:0};
  pageQuestions.forEach(q=>{
    let resp = {id:q.id, topic:q.topic, type:q.type};
    if(q.type === 'mcq'){
      out.total++;
      const el = document.querySelector(`input[name='${q.id}']:checked`);
      resp.answer = el ? Number(el.value) : null;
      resp.correct = (resp.answer === q.answerIndex);
      if(resp.correct) out.score++;
    } else {
      const el = document.querySelector(`[name='${q.id}']`);
      resp.answer = el ? el.value.trim() : '';
      resp.correct = null;
    }
    out.responses.push(resp);
  });
  return out;
}

function showPageResult(result, pageIndex){
  const el = document.getElementById('result');
  el.classList.remove('hidden');
  const start = pageIndex * PAGE_SIZE;
  let html = `<div class='card'><h3>Page Result</h3>`;
  html += `<p>Score: ${result.score} / ${result.total}</p>`;
  html += `<details open><summary>Answers & explanations (this page)</summary><div>`;
  const pageQuestions = QUIZ_DATA.questions.slice(start, start + PAGE_SIZE);
  pageQuestions.forEach((q, idx)=>{
    html += `<strong>${start + idx + 1}. ${q.question}</strong><br>`;
    if(q.type === 'mcq'){
      html += `Correct answer: ${q.choices[q.answerIndex]}<br>`;
    } else {
      html += `Expected / sample answer: ${q.answerText || '—'}<br>`;
    }
    html += `Explanation: ${q.explanation || ''}<hr>`;
  });
  html += '</div></details></div>';
  el.innerHTML = html;
}

async function postSubmission(payload){
  const status = document.getElementById('status');
  if(!BACKEND_ENDPOINT){
    status.textContent = 'No backend endpoint configured — saved only to localStorage.';
    return {ok:false, reason:'no-endpoint'};
  }
  try{
    status.textContent = 'Sending submission...';
    const res = await fetch(BACKEND_ENDPOINT, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if(res.ok){
      status.textContent = 'Submitted to backend successfully.';
      return {ok:true};
    } else {
      const text = await res.text();
      status.textContent = 'Backend returned error: ' + res.status;
      return {ok:false, reason:text};
    }
  }catch(err){
    status.textContent = 'Error sending submission: ' + err.message;
    return {ok:false, reason:err.message};
  }
}

function saveLocal(payload){
  const key = 'aksexam_submissions';
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  existing.push({...payload, savedAt:new Date().toISOString()});
  localStorage.setItem(key, JSON.stringify(existing));
  document.getElementById('status').textContent = 'Saved to localStorage.';
}

document.getElementById('submitPage').addEventListener('click', async ()=>{
  const result = gatherAnswersForPage(currentPage);
  showPageResult(result, currentPage);
  const payload = {submittedAt:new Date().toISOString(), page:currentPage+1, result, questionsTitle:QUIZ_DATA.title};
  saveLocal(payload);
  await postSubmission(payload);
});

document.getElementById('savePage').addEventListener('click', async ()=>{
  const result = gatherAnswersForPage(currentPage);
  const payload = {submittedAt:new Date().toISOString(), page:currentPage+1, result, questionsTitle:QUIZ_DATA.title};
  saveLocal(payload);
});

document.getElementById('prev').addEventListener('click', ()=>{
  if(currentPage > 0){
    currentPage--;
    renderQuizPage(currentPage);
    document.getElementById('result').classList.add('hidden');
  }
});

document.getElementById('next').addEventListener('click', ()=>{
  const totalPages = Math.ceil(QUIZ_DATA.questions.length / PAGE_SIZE);
  if(currentPage < totalPages - 1){
    currentPage++;
    renderQuizPage(currentPage);
    document.getElementById('result').classList.add('hidden');
  }
});

// initial render
loadQuestions().then(()=>{
  currentPage = 0;
  renderQuizPage(currentPage);
}).catch(err=>{
  document.getElementById('quiz').innerText = 'Failed to load questions: ' + err.message;
});
