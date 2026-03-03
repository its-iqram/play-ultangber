// create-set.js — Create question set page logic

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('questionsContainer');
  const addBtn    = document.getElementById('addQuestionBtn');
  const saveBtn   = document.getElementById('saveSetBtn');
  const errorEl   = document.getElementById('createError');
  const successEl = document.getElementById('createSuccess');

  let qCount = 0;

  // ── Add question entry card ───────────────────────────
  function addQuestion() {
    qCount++;
    const i = qCount;

    const card = document.createElement('div');
    card.classList.add('q-entry');
    card.id = `q-entry-${i}`;
    card.innerHTML = `
      <div class="q-entry-head">
        <span class="q-entry-num">QUESTION ${i}</span>
        <button class="btn-remove-q" onclick="removeQ(${i})">✕ REMOVE</button>
      </div>
      <div class="q-entry-body">
        <div class="create-field">
          <label class="create-label">Question</label>
          <textarea class="create-textarea" id="q-text-${i}" placeholder="Enter the question text…"></textarea>
        </div>
        <div class="create-field">
          <label class="create-label">Correct Answer</label>
          <input class="create-input" type="text" id="q-ans-${i}" placeholder="e.g. Paris" />
        </div>
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

  window.removeQ = (i) => {
    const el = document.getElementById(`q-entry-${i}`);
    if (el) el.remove();
  };

  function collectQuestions() {
    return [...container.querySelectorAll('.q-entry')].map(card => {
      const id = card.id.replace('q-entry-', '');
      return {
        question:   (document.getElementById(`q-text-${id}`)?.value || '').trim(),
        answer:     (document.getElementById(`q-ans-${id}`)?.value  || '').trim(),
        difficulty:  document.getElementById(`q-diff-${id}`)?.value  || 'Easy',
      };
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
