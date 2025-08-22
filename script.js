
/* ========= SpeakEasy — Pro (Single-file JS) =========
   Features implemented:
   - 30 levels with sample Hindi prompts and English answers
   - Timer per level (default 60s for words, 90s for sentences, 180s for paragraphs)
   - Unlock system, per-level time-tracking, localStorage persistence
   - Winner banner at completion showing user's name and total time
*/

// ---------- Data: 30 level items (prompt in Hindi, expected English answer) ----------
const LEVELS = [
  // Levels 1-10: words (Hindi -> English single word)
  { type: 'word', q: 'नमस्ते', a: 'Hello' },
  { type: 'word', q: 'धन्यवाद', a: 'Thank you' },
  { type: 'word', q: 'पानी', a: 'Water' },
  { type: 'word', q: 'घर', a: 'House' },
  { type: 'word', q: 'किताब', a: 'Book' },
  { type: 'word', q: 'स्कूल', a: 'School' },
  { type: 'word', q: 'दोस्त', a: 'Friend' },
  { type: 'word', q: 'भोजन', a: 'Food' },
  { type: 'word', q: 'सूरज', a: 'Sun' },
  { type: 'word', q: 'रात', a: 'Night' },

  // Levels 11-20: sentences
  { type: 'sentence', q: 'मुझे एक कप चाय चाहिए।', a: 'I need a cup of tea.' },
  { type: 'sentence', q: 'वह बाजार जा रहा है।', a: 'He is going to the market.' },
  { type: 'sentence', q: 'क्या आप मेरी मदद कर सकते हैं?', a: 'Can you help me?' },
  { type: 'sentence', q: 'यह बहुत महंगा है।', a: 'This is very expensive.' },
  { type: 'sentence', q: 'मुझे अंग्रेजी सीखनी है।', a: 'I want to learn English.' },
  { type: 'sentence', q: 'कृपया दरवाजा बंद करो।', a: 'Please close the door.' },
  { type: 'sentence', q: 'मैं कल दिल्ली जाऊंगा।', a: 'I will go to Delhi tomorrow.' },
  { type: 'sentence', q: 'वह हिंदी बोलती है।', a: 'She speaks Hindi.' },
  { type: 'sentence', q: 'मुझे समझ नहीं आया।', a: 'I did not understand.' },
  { type: 'sentence', q: 'वे बहुत खुश हैं।', a: 'They are very happy.' },

  // Levels 21-30: paragraphs (short)
  { type: 'paragraph', q: 'मैं हर सुबह जल्दी उठता हूँ और सैर पर जाता हूँ। इससे मेरा स्वास्थ्य अच्छा रहता है।', a: 'I wake up early every morning and go for a walk. It keeps my health good.' },
  { type: 'paragraph', q: 'मेरी माँ अच्छी रसोइया हैं। वह हर दिन स्वादिष्ट भोजन बनाती हैं और हम सब उनका आभार महसूस करते हैं।', a: 'My mother is a good cook. She prepares delicious food every day and we all feel grateful to her.' },
  { type: 'paragraph', q: 'हमारे स्कूल में विज्ञान प्रयोगशाला बहुत अच्छी है। वहाँ प्रयोग करके छात्रों को सीखने में मज़ा आता है।', a: 'Our school has a very good science laboratory. Doing experiments there makes learning enjoyable for students.' },
  { type: 'paragraph', q: 'टिकट खरीदने के बाद हमें स्टेशन पर जल्दी पहुँचना चाहिए ताकि सीट सुरक्षित रहे।', a: 'After buying the ticket we should reach the station early so that the seat remains secure.' },
  { type: 'paragraph', q: 'प्रौद्योगिकी ने हमारे जीवन को सरल कर दिया है; हम दूर बैठे हुए भी बहुत काम कर सकते हैं।', a: 'Technology has made our lives simple; we can do a lot of work while sitting far away.' },
  { type: 'paragraph', q: 'पर्यावरण की रक्षा करना हम सबकी जिम्मेदारी है। पेड़ लगाना और पानी बचाना महत्वपूर्ण है।', a: 'Protecting the environment is everyone’s responsibility. Planting trees and saving water are important.' },
  { type: 'paragraph', q: 'एक अच्छी आदत धीरे-धीरे बनती है। छोटे-छोटे कदम उठाकर आप बड़ी सफलता पाते हैं।', a: 'A good habit builds slowly. By taking small steps you achieve great success.' },
  { type: 'paragraph', q: 'यात्रा करते समय हमें स्थानीय संस्कृति का सम्मान करना चाहिए और जगह को साफ रखना चाहिए।', a: 'While traveling we should respect the local culture and keep the place clean.' },
  { type: 'paragraph', q: 'कठिनाई के समय में धैर्य बनाए रखना और मेहनत करना ही सफलता की कुंजी है।', a: 'In times of difficulty, keeping patience and working hard is the key to success.' },
  { type: 'paragraph', q: 'एक अच्छा नेता वह है जो लोगों की सुनता है, समझता है और उन्हें आगे बढ़ने में मदद करता है।', a: 'A good leader is one who listens to people, understands them, and helps them move forward.' }
];

// ---------- Configuration ----------
const DEFAULT_TIMERS = { word: 60, sentence: 90, paragraph: 180 }; // seconds

// ---------- State ----------
let state = {
  name: null,
  currentLevel: 1,
  completed: {}, // level -> {timeTaken, correct, answerGiven}
  levelStartAt: null,
  timerRemaining: 0,
  timerInterval: null
};

// ---------- Persistence ----------
const STORAGE_KEY = 'speakeasy_pro_v1';

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed };
    } catch (e) { console.warn('loadState parse err', e); }
  }
}
function saveState() {
  const toSave = {
    name: state.name,
    currentLevel: state.currentLevel,
    completed: state.completed
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

// ---------- Utilities ----------
function secsToMMSS(s) {
  s = Math.max(0, Math.floor(s));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// ---------- UI Rendering ----------
const contentArea = document.getElementById('contentArea');
const currentLevelEl = document.getElementById('currentLevel');
const levelsListEl = document.getElementById('levelsList');
const recentListEl = document.getElementById('recentList');
const timerDisplay = document.getElementById('timerDisplay');
const userNameDisplay = document.getElementById('user-name-display');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resetBtn = document.getElementById('resetBtn');

resetBtn.addEventListener('click', () => {
  if (!confirm('Are you sure? This will clear progress.')) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
});

function renderApp() {
  // header name
  if (state.name) { userNameDisplay.style.display = 'inline-block'; userNameDisplay.textContent = 'Hi, ' + state.name; } else { userNameDisplay.style.display = 'none'; }

  // left content: if no name -> show name input
  if (!state.name) {
    renderNameInput();
  } else {
    // if completed all levels -> show winner
    if (state.currentLevel > LEVELS.length) {
      renderWinner();
    } else {
      renderLevelView(state.currentLevel);
    }
  }

  renderLevelsList();
  renderRecent();
  renderProgress();
  currentLevelEl.textContent = state.currentLevel <= LEVELS.length ? `Level ${state.currentLevel}` : '—';
}

function renderNameInput() {
  contentArea.innerHTML = `
<div class="center">
  <h2>Welcome to SpeakEasy — Pro</h2>
  <p class="small" style="margin-top:8px">Enter your name to start the 30-level challenge.</p>
  <div style="width:100%;max-width:420px;margin-top:14px">
    <input id="nameInput" class="input" placeholder="Enter your name (e.g., Rahul)" />
    <div style="display:flex;gap:8px;margin-top:12px;justify-content:center">
      <button class="btn" id="startBtn">Start</button>
    </div>
    <p class="hint">Your progress will be saved locally in this browser.</p>
  </div>
</div>
`;
  document.getElementById('startBtn').addEventListener('click', () => {
    const nm = document.getElementById('nameInput').value.trim();
    if (!nm) { alert('Please enter a name'); return; }
    state.name = nm;
    saveState();
    renderApp();
  });
}

function renderLevelView(levelIndex) {
  const idx = levelIndex - 1;
  const item = LEVELS[idx];
  const timerSec = DEFAULT_TIMERS[item.type] || 90;
  // layout
  contentArea.innerHTML = `
<div>
  <div style="display:flex;justify-content:space-between;align-items:center">
    <div>
      <div class="small">Level ${levelIndex} — ${item.type.toUpperCase()}</div>
      <div style="font-weight:800;font-size:20px;margin-top:6px">Translate to English</div>
    </div>
    <div style="text-align:right">
      <div class="small">Best of Luck</div>
      <div class="small">Name: <strong>${escapeHtml(state.name)}</strong></div>
    </div>
  </div>

  <div style="margin-top:16px" class="panel">
    <div class="question">${escapeHtml(item.q)}</div>
    <input id="answerInput" class="answer-input" placeholder="Type your English translation here..." autocomplete="off" />
    <div style="display:flex;gap:8px;margin-top:12px;align-items:center;justify-content:space-between">
      <div>
        <button class="btn" id="submitBtn">Submit</button>
        <button class="btn ghost" id="skipBtn">Skip</button>
        <button class="btn ghost" id="hintBtn">Show Answer (forfeit)</button>
      </div>
      <div class="small">
        Timer: <span id="levelTimer">${secsToMMSS(timerSec)}</span>
      </div>
    </div>
    <p class="hint">Type the exact answer or a close match (case-insensitive). Use "Show Answer" to forfeit and mark level complete.</p>
  </div>
</div>
`;

  // prepare timer state
  stopTimer();
  state.levelStartAt = Date.now();
  state.timerRemaining = timerSec;
  updateTimerDisplay();
  startTimer(() => { // on timeout
    // auto-handle as failed
    handleSubmit(true, true); // timed out + auto
  });

  // focus input
  document.getElementById('answerInput').focus();

  // event handlers
  document.getElementById('submitBtn').addEventListener('click', () => handleSubmit(false, false));
  document.getElementById('skipBtn').addEventListener('click', () => {
    if (!confirm('Skip this level? You will mark it as failed.')) return;
    handleSubmit(true, false);
  });
  document.getElementById('hintBtn').addEventListener('click', () => {
    if (!confirm('Showing answer will mark this level completed but as forfeited. Continue?')) return;
    // show correct answer then mark completed (forfeit)
    alert('Answer: ' + LEVELS[idx].a);
    handleSubmit(true, false, true);
  });

  function handleSubmit(markFailed, timedOut, forceForfeit) {
    // stop timer
    stopTimer();
    const answerGiven = (document.getElementById('answerInput') || {}).value || '';
    const correctAnswer = LEVELS[idx].a;
    const normalizedGiven = normalize(answerGiven);
    const normalizedCorrect = normalize(correctAnswer);
    const timeTaken = Math.round((Date.now() - state.levelStartAt) / 1000);
    // check correctness: accept case-insensitive and allow small differences
    const similarity = stringSimilarity(normalizedGiven, normalizedCorrect);
    const accepted = (!markFailed && (similarity >= 0.65 || normalizedGiven === normalizedCorrect));
    const record = {
      timeTaken: timeTaken,
      correct: accepted && !forceForfeit && !timedOut,
      answerGiven: answerGiven,
      timedOut: Boolean(timedOut),
      forfeited: Boolean(forceForfeit),
      similarity: Math.round(similarity * 100) / 100
    };
    state.completed[levelIndex] = record;
    // advance
    state.currentLevel = Math.min(LEVELS.length + 1, state.currentLevel + 1);
    saveState();
    renderFeedback(levelIndex, record);
    renderApp(); // update right panel/levels/progress
  }
}

function renderFeedback(levelIndex, record) {
  // show a small modal-like feedback in content area briefly
  const correctText = record.correct ? '<span class="success">Correct</span>' : '<span class="fail">Not correct / Forfeited</span>';
  contentArea.innerHTML = `
<div class="center">
  <div style="max-width:720px">
    <div style="font-size:20px;font-weight:800">Level ${levelIndex} Completed</div>
    <div class="meta" style="margin-top:10px">Time taken: <strong>${record.timeTaken}s</strong></div>
    <div style="margin-top:8px">Result: ${correctText}</div>
    <div class="hint" style="margin-top:10px">Your answer: "${escapeHtml(record.answerGiven || '—')}" • similarity: ${record.similarity}</div>
    <div style="margin-top:14px;display:flex;gap:8px;justify-content:center">
      <button class="btn" id="nextBtn">Continue</button>
      <button class="btn ghost" id="viewProgressBtn">View Progress</button>
    </div>
  </div>
</div>
`;
  document.getElementById('nextBtn').addEventListener('click', () => renderApp());
  document.getElementById('viewProgressBtn').addEventListener('click', () => { /* keep on same */ renderApp(); });
}

function renderWinner() {
  // calculate total time
  let total = 0; let correctCount = 0;
  for (let i = 1; i <= LEVELS.length; i++) {
    const r = state.completed[i];
    if (r) { total += (r.timeTaken || 0); if (r.correct) correctCount++; }
  }
  const avg = (total / LEVELS.length).toFixed(1);
  contentArea.innerHTML = `
<div class="center">
  <div class="winner">
    🎉 Congratulations, ${escapeHtml(state.name)}! 🎉
  </div>
  <div style="margin-top:14px;font-weight:700;font-size:18px">You completed all ${LEVELS.length} levels</div>
  <div style="margin-top:8px" class="meta">Total time: <strong>${total}s</strong> • Average per level: <strong>${avg}s</strong></div>
  <div style="margin-top:10px" class="small">Correct answers: <strong>${correctCount}</strong> / ${LEVELS.length}</div>
  <div style="margin-top:16px;display:flex;gap:10px;justify-content:center">
    <button class="btn" id="reviewBtn">Review All Answers</button>
    <button class="btn ghost" id="restartBtn">Restart (Reset progress)</button>
  </div>
</div>
`;
  document.getElementById('reviewBtn').addEventListener('click', () => renderReview());
  document.getElementById('restartBtn').addEventListener('click', () => {
    if (!confirm('Reset all progress and start again?')) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });
}

function renderReview() {
  // show a list of all levels with answers and user's attempt
  let html = '<div style="padding:8px"><h3>Review — All Levels</h3>';
  html += '<div class="list" style="max-height:520px;margin-top:8px">';
  for (let i = 1; i <= LEVELS.length; i++) {
    const l = LEVELS[i - 1];
    const r = state.completed[i];
    html += `<div class="row"><div style="flex:1">
  <div style="font-weight:700">Level ${i} • ${l.type}</div>
  <div class="small" style="margin-top:4px">Q: ${escapeHtml(l.q)}</div>
  <div class="small" style="margin-top:4px">Correct: ${escapeHtml(l.a)}</div>
  <div class="small" style="margin-top:6px">Your answer: ${escapeHtml((r && r.answerGiven) || '—')}</div>
</div>
<div style="width:140px;text-align:right">
  <div class="${r && r.correct ? 'success' : 'fail'}">${r && r.correct ? 'Correct' : 'Not/Forfeit'}</div>
  <div class="small" style="margin-top:6px">${r ? r.timeTaken + 's' : '--'}</div>
</div></div>`;
  }
  html += '</div><div style="margin-top:12px;display:flex;gap:8px;justify-content:center"><button class="btn" id="backBtn">Back</button></div></div>';
  contentArea.innerHTML = html;
  document.getElementById('backBtn').addEventListener('click', () => renderApp());
}

// ---------- Right panel renders ----------
function renderLevelsList() {
  levelsListEl.innerHTML = '';
  for (let i = 1; i <= LEVELS.length; i++) {
    const isLocked = i > state.currentLevel;
    const el = document.createElement('div');
    el.className = 'level-card ' + (isLocked ? 'locked' : '');
    el.innerHTML = `<div style="font-weight:700">L ${i}</div><div class="small">${LEVELS[i - 1].type}</div>`;
    el.addEventListener('click', () => {
      if (isLocked) { alert('This level is locked. Complete previous levels to unlock.'); return; }
      // go to that level
      state.currentLevel = i;
      saveState();
      renderApp();
    });
    levelsListEl.appendChild(el);
  }
}

function renderRecent() {
  recentListEl.innerHTML = '';
  const entries = Object.entries(state.completed).sort((a, b) => b[0] - a[0]).slice(0, 6); // latest 6
  if (entries.length === 0) {
    recentListEl.innerHTML = '<div class="small">No recent activity yet.</div>';
    return;
  }
  entries.forEach(([lvl, rec]) => {
    const row = document.createElement('div'); row.className = 'row';
    row.innerHTML = `<div style="flex:1"><div style="font-weight:700">Level ${lvl}</div><div class="small">${rec.answerGiven || '—'}</div></div>
  <div style="text-align:right"><div class="${rec.correct ? 'success' : 'fail'}">${rec.correct ? 'Correct' : (rec.forfeited ? 'Forfeit' : rec.timedOut ? 'Timed out' : 'Wrong')}</div><div class="small">${rec.timeTaken}s</div></div>`;
    recentListEl.appendChild(row);
  });
}

function renderProgress() {
  const done = Object.keys(state.completed).length;
  const pct = Math.round((done / LEVELS.length) * 100);
  progressFill.style.width = pct + '%';
  progressText.textContent = `${done} / ${LEVELS.length} completed • ${pct}%`;
}

// ---------- Timer functions ----------
function startTimer(onTimeout) {
  stopTimer();
  updateTimerDisplay();
  state.timerInterval = setInterval(() => {
    state.timerRemaining--;
    if (state.timerRemaining <= 0) {
      stopTimer();
      timerDisplay.textContent = '00:00';
      if (typeof onTimeout === 'function') onTimeout();
      return;
    }
    updateTimerDisplay();
  }, 1000);
}
function stopTimer() { if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; } }
function updateTimerDisplay() {
  timerDisplay.textContent = secsToMMSS(state.timerRemaining || 0);
  const el = document.getElementById('levelTimer');
  if (el) el.textContent = secsToMMSS(state.timerRemaining || 0);
}

// ---------- Helpers ----------
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
}
function normalize(s) {
  return String(s || '').toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
}
function stringSimilarity(s1, s2) {
  // simple Jaccard on words + character overlap hybrid
  if (!s1 && !s2) return 1;
  if (!s1 || !s2) return 0;
  const w1 = new Set(s1.split(' '));
  const w2 = new Set(s2.split(' '));
  const inter = [...w1].filter(x => w2.has(x)).length;
  const union = new Set([...w1, ...w2]).size || 1;
  const jaccard = inter / union;
  // char overlap
  const chars1 = new Set(s1), chars2 = new Set(s2);
  const cinter = [...chars1].filter(x => chars2.has(x)).length;
  const cunion = new Set([...chars1, ...chars2]).size || 1;
  const cscore = cinter / cunion;
  return (jaccard * 0.7) + (cscore * 0.3);
}

// ---------- Init ----------
function init() {
  loadState();
  // if currentLevel stored but some levels missing, clamp
  state.currentLevel = Math.max(1, Math.min(LEVELS.length + 1, state.currentLevel || 1));
  // if there is a current incomplete level, set timerRemaining accordingly; else default for current level
  if (state.currentLevel <= LEVELS.length) {
    const it = LEVELS[state.currentLevel - 1];
    state.timerRemaining = DEFAULT_TIMERS[it.type];
  }
  renderApp();
}

// ---------- Start ----------
init();
