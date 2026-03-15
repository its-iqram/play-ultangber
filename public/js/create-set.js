// create-set.js — Create question set page logic
// Supports both Open-ended and MCQ (3 choices) question types

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('questionsContainer');
  const addBtn    = document.getElementById('addQuestionBtn');
  const saveBtn   = document.getElementById('saveSetBtn');
  const errorEl   = document.getElementById('createError');
  const successEl = document.getElementById('createSuccess');

  let qCount = 0;

  // ── Build a single question card ─────────────────────
  function addQuestion() {
    qCount++;
    const i = qCount;

    const card = document.createElement('div');
    card.classList.add('q-entry');
    card.id = `q-entry-${i}`;

    card.innerHTML = `
      <div class="q-entry-head">
        <span class="q-entry-num">QUESTION ${i}</span>
        <button class="btn-remove-q" onclick="removeQ(${i})">✕ Remove</button>
      </div>

      <!-- Question type toggle -->
      <div class="q-type-row">
        <span class="q-type-label">Question type:</span>
        <div class="q-type-toggle">
          <button class="q-type-btn active" id="q-type-open-${i}" onclick="setQType(${i},'open')">
            ✏️ Open-Ended
          </button>
          <button class="q-type-btn" id="q-type-mcq-${i}" onclick="setQType(${i},'mcq')">
            🔘 Multiple Choice
          </button>
        </div>
      </div>

      <div class="q-entry-body" id="q-body-${i}">

        <!-- Question text — always shown -->
        <div class="create-field q-full">
          <label class="create-label">Question</label>
          <textarea class="create-textarea" id="q-text-${i}" placeholder="Enter the question text…"></textarea>
        </div>

        <!-- OPEN-ENDED fields -->
        <div id="q-open-fields-${i}">
          <div class="create-field">
            <label class="create-label">Correct Answer</label>
            <input class="create-input" type="text" id="q-ans-${i}" placeholder="e.g. 42" />
          </div>
        </div>

        <!-- MCQ fields (hidden by default) -->
        <div id="q-mcq-fields-${i}" class="hidden">
          <div class="mcq-choices">
            <div class="create-field">
              <label class="create-label mcq-correct-label">✅ Choice A — Correct Answer</label>
              <input class="create-input" type="text" id="q-choiceA-${i}" placeholder="Correct answer" />
            </div>
            <div class="create-field">
              <label class="create-label">❌ Choice B — Wrong Option</label>
              <input class="create-input" type="text" id="q-choiceB-${i}" placeholder="Wrong option 1" />
            </div>
            <div class="create-field">
              <label class="create-label">❌ Choice C — Wrong Option</label>
              <input class="create-input" type="text" id="q-choiceC-${i}" placeholder="Wrong option 2" />
            </div>
          </div>
          <p class="mcq-note">Players will see all 3 choices shuffled. Choice A is always the correct one.</p>
        </div>

        <!-- Difficulty — always shown -->
        <div class="create-field">
          <label class="create-label">Difficulty</label>
          <select class="create-select" id="q-diff-${i}">
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

      </div>
    `;

    container.appendChild(card);
  }

  // ── Switch question type ──────────────────────────────
  window.setQType = (i, type) => {
    const openBtn    = document.getElementById(`q-type-open-${i}`);
    const mcqBtn     = document.getElementById(`q-type-mcq-${i}`);
    const openFields = document.getElementById(`q-open-fields-${i}`);
    const mcqFields  = document.getElementById(`q-mcq-fields-${i}`);

    if (type === 'open') {
      openBtn.classList.add('active');
      mcqBtn.classList.remove('active');
      openFields.classList.remove('hidden');
      mcqFields.classList.add('hidden');
    } else {
      mcqBtn.classList.add('active');
      openBtn.classList.remove('active');
      mcqFields.classList.remove('hidden');
      openFields.classList.add('hidden');
    }
  };

  window.removeQ = (i) => {
    const el = document.getElementById(`q-entry-${i}`);
    if (el) el.remove();
  };

  // ── Collect questions (handles both types) ────────────
  function collectQuestions() {
    return [...container.querySelectorAll('.q-entry')].map(card => {
      const id      = card.id.replace('q-entry-', '');
      const isMCQ   = document.getElementById(`q-type-mcq-${id}`)?.classList.contains('active');
      const qText   = (document.getElementById(`q-text-${id}`)?.value || '').trim();
      const diff    = document.getElementById(`q-diff-${id}`)?.value || 'Easy';

      if (isMCQ) {
        const choiceA = (document.getElementById(`q-choiceA-${id}`)?.value || '').trim();
        const choiceB = (document.getElementById(`q-choiceB-${id}`)?.value || '').trim();
        const choiceC = (document.getElementById(`q-choiceC-${id}`)?.value || '').trim();
        return {
          question:   qText,
          answer:     choiceA,           // correct answer is always choiceA
          choices:    [choiceA, choiceB, choiceC].filter(Boolean),
          type:       'mcq',
          difficulty: diff,
        };
      } else {
        return {
          question:   qText,
          answer:     (document.getElementById(`q-ans-${id}`)?.value || '').trim(),
          type:       'open',
          difficulty: diff,
        };
      }
    }).filter(q => q.question || q.answer);
  }

  // ── Save set ──────────────────────────────────────────
  saveBtn.addEventListener('click', async () => {
    clearMsgs();
    const title     = document.getElementById('setTitle').value.trim();
    const subject   = document.getElementById('setSubject').value.trim();
    const questions = collectQuestions();

    if (!title)            return showError('Please enter a set title.');
    if (!subject)          return showError('Please enter a subject.');
    if (!questions.length) return showError('Add at least one question.');

    // Validate MCQ: correct answer must not be empty
    for (const q of questions) {
      if (!q.question) return showError('One or more questions have no text.');
      if (!q.answer)   return showError('One or more questions have no correct answer.');
      if (q.type === 'mcq' && q.choices.length < 2)
        return showError('MCQ questions need at least 2 choices (A and B).');
    }

    try {
      saveBtn.disabled    = true;
      saveBtn.textContent = 'SAVING…';
      await api.createQuestionSet({ title, subject, questions });
      showSuccess('✅ Saved! Redirecting to dashboard…');
      setTimeout(() => { window.location.href = 'index.html'; }, 1800);
    } catch (err) {
      showError(err.message || 'Failed to save. Please try again.');
    } finally {
      saveBtn.disabled    = false;
      saveBtn.textContent = '💾 SAVE SET';
    }
  });

  addBtn.addEventListener('click', addQuestion);

  function showError(m) {
    errorEl.textContent = m;
    errorEl.classList.remove('hidden');
    successEl.classList.add('hidden');
  }
  function showSuccess(m) {
    successEl.textContent = m;
    successEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
  }
  function clearMsgs() {
    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');
  }

  // Start with one question pre-loaded
  addQuestion();
});
