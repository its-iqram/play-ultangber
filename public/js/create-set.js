// ============================================================
// create-set.js — Logic for the create-set.html page
// Allows anyone to build and save a new question set
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const container   = document.getElementById('questionsContainer');
  const addBtn      = document.getElementById('addQuestionBtn');
  const saveBtn     = document.getElementById('saveSetBtn');
  const errorEl     = document.getElementById('createError');
  const successEl   = document.getElementById('createSuccess');

  let questionCount = 0;

  // ---- Add a new question entry form ----
  function addQuestion() {
    questionCount++;
    const index = questionCount;

    const entry = document.createElement('div');
    entry.classList.add('question-entry');
    entry.id = `q-entry-${index}`;

    entry.innerHTML = `
      <div class="question-entry-header">
        <span>Question ${index}</span>
        <button class="remove-q-btn" title="Remove this question" onclick="removeQuestion(${index})">✕</button>
      </div>

      <textarea
        id="q-text-${index}"
        placeholder="Enter the question (e.g. What is the capital of France?)"
        rows="2"
      ></textarea>

      <input
        type="text"
        id="q-answer-${index}"
        placeholder="Correct answer (e.g. Paris)"
      />

      <select id="q-difficulty-${index}">
        <option value="Easy">Easy</option>
        <option value="Medium">Medium</option>
        <option value="Hard">Hard</option>
      </select>
    `;

    container.appendChild(entry);
  }

  // ---- Remove a question entry ----
  window.removeQuestion = function (index) {
    const el = document.getElementById(`q-entry-${index}`);
    if (el) el.remove();
  };

  // ---- Collect all question entries from the DOM ----
  function collectQuestions() {
    const entries = container.querySelectorAll('.question-entry');
    const questions = [];

    entries.forEach((entry) => {
      // Extract index from id: "q-entry-3" → 3
      const id = entry.id.replace('q-entry-', '');

      const questionText = (document.getElementById(`q-text-${id}`)?.value || '').trim();
      const answer       = (document.getElementById(`q-answer-${id}`)?.value || '').trim();
      const difficulty   = document.getElementById(`q-difficulty-${id}`)?.value || 'Easy';

      if (questionText || answer) {
        questions.push({ question: questionText, answer, difficulty });
      }
    });

    return questions;
  }

  // ---- Save button click ----
  saveBtn.addEventListener('click', async () => {
    hideMessages();

    const title   = document.getElementById('setTitle').value.trim();
    const subject = document.getElementById('setSubject').value.trim();
    const questions = collectQuestions();

    // Frontend validation before sending to server
    if (!title)          return showError('Please enter a title.');
    if (!subject)        return showError('Please enter a subject.');
    if (questions.length < 1) return showError('Add at least one question.');

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      await api.createQuestionSet({ title, subject, questions });

      showSuccess('✅ Question set saved! Redirecting to dashboard...');
      setTimeout(() => { window.location.href = 'index.html'; }, 1800);
    } catch (err) {
      showError(err.message || 'Failed to save. Check your inputs.');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = '💾 Save Question Set';
    }
  });

  // ---- Add Question button ----
  addBtn.addEventListener('click', addQuestion);

  // ---- Helpers ----
  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
    successEl.classList.add('hidden');
  }

  function showSuccess(msg) {
    successEl.textContent = msg;
    successEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
  }

  function hideMessages() {
    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');
  }

  // Start with one question entry ready
  addQuestion();
});
