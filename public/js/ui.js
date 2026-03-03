// ui.js — DOM updates for ULTANGBER game page
// Syncs both mobile (top bar) and desktop (sidebar) UI simultaneously

const ui = {

  el: id => document.getElementById(id),

  // ── Status: update turn label, dice, message, positions ──
  updateStatus({ turnLabel, diceDisplay, statusMsg, playerPos, robotPos } = {}) {
    const set = (id, val) => {
      if (val === undefined) return;
      const e = this.el(id);
      if (e) e.textContent = val;
    };
    // Desktop sidebar
    set('turnLabel',           turnLabel);
    set('diceDisplay',         diceDisplay);
    set('statusMsg',           statusMsg);
    set('playerPosNumDesktop', playerPos);
    set('robotPosNumDesktop',  robotPos);
    // Mobile header + bar
    set('mobileTurnBadge',     turnLabel);
    set('mobileDiceVal',       diceDisplay);
    set('mobileStatusBar',     statusMsg);
    set('playerPosNum',        playerPos);
    set('robotPosNum',         robotPos);
  },

  // ── Set player token colour on all token elements ─────────
  setPlayerColor(color) {
    ['playerTokenDot', 'playerTokenDotDesktop'].forEach(id => {
      const e = this.el(id);
      if (e) e.style.background = color;
    });
  },

  // ── Highlight whose turn it is ────────────────────────────
  setActiveTurn(who) {
    // Desktop cards
    const pDesk = this.el('playerCardDesktop');
    const rDesk = this.el('robotCardDesktop');
    if (pDesk) pDesk.classList.toggle('active-turn', who === 'player');
    if (rDesk) rDesk.classList.toggle('active-turn', who === 'robot');
    // Mobile score items
    const pMob = this.el('playerCard');
    const rMob = this.el('robotCard');
    if (pMob) pMob.classList.toggle('active-turn', who === 'player');
    if (rMob) rMob.classList.toggle('active-turn', who === 'robot');
  },

  // ── Enable / disable both roll buttons ───────────────────
  setRollEnabled(on) {
    ['rollDiceBtn', 'rollDiceBtnDesktop'].forEach(id => {
      const b = this.el(id);
      if (b) b.disabled = !on;
    });
  },

  // ── Shake dice animation on both display elements ─────────
  animateDice() {
    ['diceDisplay', 'mobileDiceVal'].forEach(id => {
      const e = this.el(id);
      if (!e) return;
      e.classList.remove('dice-anim');
      void e.offsetWidth; // force reflow
      e.classList.add('dice-anim');
      e.addEventListener('animationend', () => e.classList.remove('dice-anim'), { once: true });
    });
  },

  // ── Calculate square px size to fill available screen ─────
  calcSquarePx(gridSize) {
    const isDesktop = window.innerWidth >= 960;
    if (isDesktop) {
      const sidebarW = 236 + 3;
      const padding  = 40;
      const availW   = window.innerWidth  - sidebarW - padding;
      const availH   = window.innerHeight - 36 - 20; // topbar + padding
      const byW = Math.floor(availW / gridSize);
      const byH = Math.floor(availH / gridSize);
      return Math.min(byW, byH, 62);
    } else {
      const padding = 22;
      const availW  = window.innerWidth - padding;
      const ideal   = Math.floor(availW / gridSize);
      return Math.max(30, Math.min(ideal, 50));
    }
  },

  // ── Build the board grid ──────────────────────────────────
  renderBoard(squares, size) {
    const board = this.el('gameBoard');
    const sqPx  = this.calcSquarePx(size);
    const scale = sqPx / 58; // 58px = design baseline

    board.style.gridTemplateColumns = `repeat(${size}, ${sqPx}px)`;
    board.innerHTML = '';

    const sizeEl = this.el('boardSizeLabel');
    if (sizeEl) sizeEl.textContent = `${size} × ${size}`;

    const darkClasses = ['sq-c1', 'sq-c3', 'sq-c7', 'sq-start', 'sq-end'];

    squares.forEach((sq, idx) => {
      const cell = document.createElement('div');
      cell.classList.add('sq');
      cell.id = `sq-${sq.number}`;
      cell.style.width  = `${sqPx}px`;
      cell.style.height = `${sqPx}px`;

      // Colour
      if      (sq.number === 1)           cell.classList.add('sq-start');
      else if (sq.number === size * size) cell.classList.add('sq-end');
      else if (sq.type === 'ladder')      cell.classList.add('sq-ladder');
      else if (sq.type === 'snake')       cell.classList.add('sq-snake');
      else if (sq.type === 'int-pos')     cell.classList.add('sq-int-pos');
      else if (sq.type === 'int-neg')     cell.classList.add('sq-int-neg');
      else if (sq.type === 'freeze')      cell.classList.add('sq-freeze');
      else                                cell.classList.add(`sq-c${idx % 8}`);

      // Square number badge
      const numEl = document.createElement('span');
      numEl.classList.add('sq-n');
      numEl.style.fontSize = `${Math.max(0.38, 0.6 * scale)}rem`;
      if (darkClasses.some(c => cell.classList.contains(c))) numEl.classList.add('sq-n-light');
      numEl.textContent = sq.number;

      // Inner content
      let innerHTML = '';
      const fs = (base) => `font-size:${Math.max(0.5, base * scale)}rem`;
      if      (sq.number === 1)           innerHTML = `<span class="sq-start-lbl" style="${fs(0.82)}"">START</span>`;
      else if (sq.number === size * size) innerHTML = `<span class="sq-end-lbl" style="${fs(0.78)}">END</span>`;
      else if (sq.type === 'ladder')      innerHTML = `<span class="sq-icon" style="${fs(1.2)}">🪜</span>`;
      else if (sq.type === 'snake')       innerHTML = `<span class="sq-icon" style="${fs(1.2)}">🐍</span>`;
      else if (sq.type === 'int-pos')     innerHTML = `<span class="sq-val pos" style="${fs(0.95)}">+${sq.value}</span>`;
      else if (sq.type === 'int-neg')     innerHTML = `<span class="sq-val neg" style="${fs(0.95)}">${sq.value}</span>`;
      else if (sq.type === 'freeze')      innerHTML = `<div class="sq-freeze-wrap"><span class="sq-freeze-flake" style="${fs(0.9)}">❄️</span><span class="sq-freeze-txt" style="${fs(0.38)}">FREEZE!</span></div>`;

      // Token slot
      const tokensEl = document.createElement('span');
      tokensEl.classList.add('sq-tokens');
      tokensEl.id = `tokens-${sq.number}`;

      cell.appendChild(numEl);
      cell.insertAdjacentHTML('beforeend', innerHTML);
      cell.appendChild(tokensEl);
      board.appendChild(cell);
    });
  },

  // ── Place player/robot tokens on board ───────────────────
  updateTokens(positions, playerColor) {
    document.querySelectorAll('.sq-tokens').forEach(el => el.innerHTML = '');
    const place = (pos, color, label) => {
      if (pos < 1) return;
      const slot = this.el(`tokens-${pos}`);
      if (!slot) return;
      const dot = document.createElement('span');
      dot.classList.add('token-dot');
      dot.style.background = color;
      dot.title = label;
      slot.appendChild(dot);
    };
    place(positions.player, playerColor, 'You');
    place(positions.robot,  '#888888',   'Robot');
  },

  // ── Flash label rising up from a square ──────────────────
  flashSquare(num, text) {
    const sq = this.el(`sq-${num}`);
    if (!sq) return;
    sq.querySelectorAll('.sq-flash').forEach(e => e.remove());
    const f = document.createElement('div');
    f.classList.add('sq-flash');
    f.textContent = text;
    sq.style.overflow = 'visible';
    sq.appendChild(f);
    f.addEventListener('animationend', () => {
      f.remove();
      sq.style.overflow = 'hidden';
    });
  },

  // ── Question modal ────────────────────────────────────────
  showQuestionModal(squareType, questionData) {
    const labels = {
      ladder:    '🪜 LADDER',
      snake:     '🐍 SNAKE',
      'int-pos': '➕ BONUS',
      'int-neg': '➖ PENALTY',
      freeze:    '🧊 FREEZE',
    };
    this.el('modalSquareLabel').textContent = labels[squareType] || '❓ SPECIAL';

    const diffEl = this.el('modalDiff');
    diffEl.textContent = questionData.difficulty;
    diffEl.className   = `modal-diff-tag ${questionData.difficulty}`;

    this.el('questionText').textContent = questionData.question;
    this.el('answerInput').value        = '';
    this.el('reportZone').classList.add('hidden');
    this.el('reportReason').value       = '';
    this.el('reportMsg').classList.add('hidden');
    this.el('reportMsg').textContent    = '';
    this.el('questionModal').classList.remove('hidden');
    setTimeout(() => this.el('answerInput').focus(), 150);
  },

  hideQuestionModal() {
    this.el('questionModal').classList.add('hidden');
  },

  // ── Game over modal ───────────────────────────────────────
  showGameOver(playerWon) {
    this.el('gameOverEmoji').textContent = playerWon ? '🏆' : '🤖';
    this.el('gameOverTitle').textContent = playerWon ? 'YOU WIN!' : 'ROBOT WINS!';
    this.el('gameOverMsg').textContent   = playerWon
      ? 'Excellent! You reached the final square first!'
      : 'Better luck next time. The Robot conquered the board!';
    this.el('gameOverModal').classList.remove('hidden');
  },
};
