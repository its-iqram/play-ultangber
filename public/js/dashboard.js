// ============================================================
// dashboard.js — Logic for the setup/dashboard page (index.html)
// Handles: loading question sets, color picker, and starting game
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {

  // ---- Element references ----
  const select   = document.getElementById('questionSetSelect');
  const startBtn = document.getElementById('startGameBtn');
  const errorMsg = document.getElementById('dashboardError');

  // ---- Color picker ----
  let selectedColor = '#e74c3c'; // Default red

  document.querySelectorAll('.color-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      // Remove 'selected' from all, add to clicked
      document.querySelectorAll('.color-btn').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedColor = btn.dataset.color;
    });
  });

  // ---- Load question sets from API ----
  try {
    const sets = await api.getQuestionSets();

    select.innerHTML = '<option value="">-- Select a question set --</option>';

    if (sets.length === 0) {
      select.innerHTML = '<option value="">No question sets found. Create one! →</option>';
    } else {
      sets.forEach((set) => {
        const opt = document.createElement('option');
        opt.value = set._id;
        opt.textContent = `${set.title} — ${set.subject}`;
        select.appendChild(opt);
      });
    }
  } catch (err) {
    select.innerHTML = '<option value="">⚠️ Could not load sets</option>';
    showError('Failed to connect to server. Is it running?');
  }

  // ---- Start Game button ----
  startBtn.addEventListener('click', () => {
    const questionSetId = select.value;
    const size = parseInt(document.querySelector('input[name="boardSize"]:checked').value);

    // Validate selections
    if (!questionSetId) {
      showError('Please select a question set to play with.');
      return;
    }

    // Save settings to sessionStorage (passed to game.html)
    sessionStorage.setItem('gameSettings', JSON.stringify({
      questionSetId,
      size,
      playerColor: selectedColor,
    }));

    // Navigate to game page
    window.location.href = 'game.html';
  });

  // ---- Helper: show error message ----
  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
    setTimeout(() => errorMsg.classList.add('hidden'), 4000);
  }
});
