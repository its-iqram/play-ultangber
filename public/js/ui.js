// ui.js — DOM updates, board rendering, modal control
// Handles rectangular boards (cols × rows) and syncs mobile + desktop UI

const ui = {

  el: id => document.getElementById(id),

  // ── Status bar sync (mobile + desktop) ───────────────────
  updateStatus({ turnLabel, diceDisplay, statusMsg, playerPos, robotPos } = {}) {
    const set = (id, val) => { if (val !== undefined) { const e = this.el(id); if (e) e.textContent = val; } };
    set('turnLabel',           turnLabel);
    set('diceDisplay',         diceDisplay);
    set('statusMsg',           statusMsg);
    set('playerPosNumDesktop', playerPos);
    set('robotPosNumDesktop',  robotPos);
    set('mobileTurnBadge',     turnLabel);
    set('mobileDiceVal',       diceDisplay);
    set('mobileStatusBar',     statusMsg);
    set('playerPosNum',        playerPos);
    set('robotPosNum',         robotPos);
  },

  setPlayerColor(color) {
    ['playerTokenDot', 'playerTokenDotDesktop'].forEach(id => {
      const e = this.el(id);
      if (e) e.style.background = color;
    });
  },

  setActiveTurn(who) {
    ['playerCardDesktop', 'playerCard'].forEach(id => {
      const e = this.el(id);
      if (e) e.classList.toggle('active-turn', who === 'player');
    });
    ['robotCardDesktop', 'robotCard'].forEach(id => {
      const e = this.el(id);
      if (e) e.classList.toggle('active-turn', who === 'robot');
    });
  },

  setRollEnabled(on) {
    ['rollDiceBtn', 'rollDiceBtnDesktop'].forEach(id => {
      const b = this.el(id);
      if (b) b.disabled = !on;
    });
  },

  animateDice() {
    ['diceDisplay', 'mobileDiceVal'].forEach(id => {
      const e = this.el(id);
      if (!e) return;
      e.classList.remove('dice-anim');
      void e.offsetWidth;
      e.classList.add('dice-anim');
      e.addEventListener('animationend', () => e.classList.remove('dice-anim'), { once: true });
    });
  },

  // ── Square size calculation ───────────────────────────────
  // Board is cols × rows (rectangular, wider or narrower)
  calcSquarePx(cols, rows) {
    const isDesktop = window.innerWidth >= 960;

    if (isDesktop) {
      const sideW  = 240;
      const padW   = 48;
      const padH   = 80; // topbar + status bar
      const availW = window.innerWidth  - sideW - padW;
      const availH = window.innerHeight - padH;
      const byW    = Math.floor(availW / cols);
      const byH    = Math.floor(availH / rows);
      return Math.min(byW, byH, 72);
    } else {
      const padW   = 24;
      const availW = window.innerWidth - padW;
      // On mobile, cols determines width
      const byW    = Math.floor(availW / cols);
      return Math.max(44, Math.min(byW, 68));
    }
  },

  // ── Board rendering ───────────────────────────────────────
  // squares: array in DOM order (top-left first)
  // Board image reference: START bottom-right, END top-right
  // Numbers in snake-pattern, sq 1 = bottom-right
  renderBoard(squares, cols, rows) {
    const board = this.el('gameBoard');
    const sqPx  = this.calcSquarePx(cols, rows);

    board.style.gridTemplateColumns = `repeat(${cols}, ${sqPx}px)`;
    board.innerHTML = '';

    const sizeEl = this.el('boardSizeLabel');
    if (sizeEl) sizeEl.textContent = `${cols} × ${rows}`;

    const total = cols * rows;

    squares.forEach((sq) => {
      const cell = document.createElement('div');
      cell.classList.add('sq');
      cell.id = `sq-${sq.number}`;
      cell.style.width  = `${sqPx}px`;
      cell.style.height = `${sqPx}px`;

      // ── Background colour per type / position ─────────────
      if (sq.number === 1)     cell.classList.add('sq-start');
      else if (sq.number === total) cell.classList.add('sq-end');
      else if (sq.type === 'ladder')  cell.classList.add('sq-ladder');
      else if (sq.type === 'snake')   cell.classList.add('sq-snake');
      else if (sq.type === 'int-pos') cell.classList.add('sq-int-pos');
      else if (sq.type === 'int-neg') cell.classList.add('sq-int-neg');
      else if (sq.type === 'freeze')  cell.classList.add('sq-freeze');
      else {
        // Alternating row colours matching the physical board
        const row = Math.floor((sq.number - 1) / cols); // row from bottom
        const col = (sq.number - 1) % cols;
        const colorIndex = (row + col) % 2 === 0 ? 'sq-alt-a' : 'sq-alt-b';
        cell.classList.add(colorIndex);
      }

      // ── Square number badge ───────────────────────────────
      const numEl = document.createElement('span');
      numEl.classList.add('sq-n');
      if (['sq-start','sq-end','sq-snake','sq-freeze'].some(c => cell.classList.contains(c))) {
        numEl.classList.add('sq-n-light');
      }
      numEl.textContent = sq.number;

      // ── Square content ────────────────────────────────────
      let content = '';
      if (sq.number === 1) {
        content = `<span class="sq-start-lbl">START</span>`;
      } else if (sq.number === total) {
        content = `<span class="sq-end-lbl">END</span>`;
      } else if (sq.type === 'ladder') {
        content = `<span class="sq-special-icon">🪜</span><span class="sq-special-val pos">+${sq.value}</span>`;
      } else if (sq.type === 'snake') {
        content = `<span class="sq-special-icon">🐍</span><span class="sq-special-val neg">${sq.value}</span>`;
      } else if (sq.type === 'int-pos') {
        content = `<span class="sq-special-val pos big">+${sq.value}</span>`;
      } else if (sq.type === 'int-neg') {
        content = `<span class="sq-special-val neg big">${sq.value}</span>`;
      } else if (sq.type === 'freeze') {
        content = `<span class="sq-freeze-icon">❄️</span><span class="sq-freeze-label">YOU<br>FROZEN!</span>`;
      }

      // ── Token slot ────────────────────────────────────────
      const tokenSlot = document.createElement('span');
      tokenSlot.classList.add('sq-tokens');
      tokenSlot.id = `tokens-${sq.number}`;

      cell.appendChild(numEl);
      cell.insertAdjacentHTML('beforeend', content);
      cell.appendChild(tokenSlot);
      board.appendChild(cell);
    });
  },

  // ── Token placement ───────────────────────────────────────
  updateTokens(positions, playerColor) {
    document.querySelectorAll('.sq-tokens').forEach(el => (el.innerHTML = ''));
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

  // ── Flash label ───────────────────────────────────────────
  flashSquare(num, text) {
    const sq = this.el(`sq-${num}`);
    if (!sq) return;
    sq.querySelectorAll('.sq-flash').forEach(e => e.remove());
    const f = document.createElement('div');
    f.classList.add('sq-flash');
    f.textContent = text;
    sq.style.overflow = 'visible';
    sq.appendChild(f);
    f.addEventListener('animationend', () => { f.remove(); }, { once: true });
  },

  // ── Question modal ────────────────────────────────────────
  showQuestionModal(squareType, questionData) {
    const labels = {
      ladder:    '🪜 LADDER',
      snake:     '🐍 SNAKE',
      'int-pos': '➕ BONUS',
      'int-neg': '➖ PENALTY',
      freeze:    '🧊 FREEZE — UNFREEZE',
      end:       '🏁 END SQUARE — ANSWER TO WIN',
    };
    this.el('modalSquareLabel').textContent = labels[squareType] || '❓ CHALLENGE';

    const diffEl = this.el('modalDiff');
    diffEl.textContent = questionData.difficulty || 'Medium';
    diffEl.className   = `modal-diff-tag ${questionData.difficulty || 'Medium'}`;

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
      ? 'Excellent! You answered the final question correctly!'
      : 'Better luck next time. The Robot conquered the board!';
    this.el('gameOverModal').classList.remove('hidden');
  },
};
