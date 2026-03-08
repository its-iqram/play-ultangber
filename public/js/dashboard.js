// dashboard.js — Setup page logic

document.addEventListener('DOMContentLoaded', async () => {
  const selectEl = document.getElementById('questionSetSelect');
  const startBtn = document.getElementById('startGameBtn');
  const errorEl  = document.getElementById('dashError');

  let selectedColor = '#E74C3C';

  // ── Info accordion (mobile) ───────────────────────────────
  const accordionBtn  = document.getElementById('infoToggleBtn');
  const accordionBody = document.getElementById('infoAccordionBody');
  if (accordionBtn && accordionBody) {
    accordionBtn.addEventListener('click', () => {
      const isOpen = accordionBody.classList.toggle('open');
      accordionBtn.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // ── Colour swatches ───────────────────────────────────────
  document.querySelectorAll('.swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.swatch').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedColor = btn.dataset.color;
    });
  });

  // ── Load question sets ────────────────────────────────────
  try {
    const sets = await api.getQuestionSets();
    selectEl.innerHTML = '<option value="">— Select a question set —</option>';
    if (sets.length === 0) {
      selectEl.innerHTML = '<option value="">No sets found — create one first</option>';
    } else {
      sets.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s._id;
        opt.textContent = `${s.title} · ${s.subject}`;
        selectEl.appendChild(opt);
      });
    }
  } catch (err) {
    selectEl.innerHTML = '<option value="">⚠️ Could not load sets</option>';
    showError('Failed to connect to server. Check your connection.');
  }

  // ── Start game ────────────────────────────────────────────
  startBtn.addEventListener('click', () => {
    const qId      = selectEl.value;
    // boardKey is the radio value: '5x8' | '6x9' | '7x10'
    const boardKey = document.querySelector('input[name="boardSize"]:checked')?.value || '5x8';

    if (!qId) { showError('Please select a question set first!'); return; }

    sessionStorage.setItem('gameSettings', JSON.stringify({
      questionSetId: qId,
      boardKey,
      playerColor: selectedColor,
    }));
    window.location.href = 'game.html';
  });

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
    setTimeout(() => { errorEl.style.display = 'none'; }, 4500);
  }
});
