// ui.js — DOM updates, board rendering, modal control
// Supports rectangular boards, MCQ questions, and animated tokens

const ui = {

  el: id => document.getElementById(id),

  // ── Status bar sync (mobile + desktop) ───────────────
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

  // ── Dice animation — full rolling sequence ────────────
  animateDice() {
    const FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];
    ['diceDisplay', 'mobileDiceVal'].forEach(id => {
      const e = this.el(id);
      if (!e) return;
      // Rapid face-cycling for 600ms before settling
      let ticks = 0;
      const maxTicks = 10;
      const interval = setInterval(() => {
        e.textContent = FACES[Math.floor(Math.random() * 6)];
        e.classList.remove('dice-anim');
        void e.offsetWidth;
        e.classList.add('dice-anim');
        ticks++;
        if (ticks >= maxTicks) clearInterval(interval);
      }, 60);

      // Also do the shake animation on the button itself
      const btn = this.el(id === 'diceDisplay' ? 'rollDiceBtnDesktop' : 'rollDiceBtn');
      if (btn) {
        btn.classList.remove('btn-rolling');
        void btn.offsetWidth;
        btn.classList.add('btn-rolling');
        btn.addEventListener('animationend', () => btn.classList.remove('btn-rolling'), { once: true });
      }
    });
  },

  // ── Square size ───────────────────────────────────────
  calcSquarePx(cols, rows) {
    const isDesktop = window.innerWidth >= 960;
    if (isDesktop) {
      const sideW  = 252;
      const padW   = 48;
      const padH   = 80;
      const availW = window.innerWidth  - sideW - padW;
      const availH = window.innerHeight - padH;
      const byW    = Math.floor(availW / cols);
      const byH    = Math.floor(availH / rows);
      return Math.min(byW, byH, 76);
    } else {
      const padW   = 28;
      const availW = window.innerWidth - padW;
      const byW    = Math.floor(availW / cols);
      return Math.max(48, Math.min(byW, 72));
    }
  },

  // ── Board rendering ───────────────────────────────────
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

      if (sq.number === 1)     cell.classList.add('sq-start');
      else if (sq.number === total) cell.classList.add('sq-end');
      else if (sq.type === 'ladder')  cell.classList.add('sq-ladder');
      else if (sq.type === 'snake')   cell.classList.add('sq-snake');
      else if (sq.type === 'int-pos') cell.classList.add('sq-int-pos');
      else if (sq.type === 'int-neg') cell.classList.add('sq-int-neg');
      else if (sq.type === 'freeze')  cell.classList.add('sq-freeze');
      else {
        const row = Math.floor((sq.number - 1) / cols);
        const col = (sq.number - 1) % cols;
        cell.classList.add((row + col) % 2 === 0 ? 'sq-alt-a' : 'sq-alt-b');
      }

      const numEl = document.createElement('span');
      numEl.classList.add('sq-n');
      if (['sq-start','sq-end','sq-snake','sq-freeze'].some(c => cell.classList.contains(c))) {
        numEl.classList.add('sq-n-light');
      }
      numEl.textContent = sq.number;

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
        content = `<span class="sq-freeze-icon">❄️</span><span class="sq-freeze-label">FROZEN!</span>`;
      }

      const tokenSlot = document.createElement('span');
      tokenSlot.classList.add('sq-tokens');
      tokenSlot.id = `tokens-${sq.number}`;

      cell.appendChild(numEl);
      cell.insertAdjacentHTML('beforeend', content);
      cell.appendChild(tokenSlot);
      board.appendChild(cell);
    });
  },

  // ── Token placement — bigger, pulsing on active square ─
  updateTokens(positions, playerColor) {
    document.querySelectorAll('.sq-tokens').forEach(el => (el.innerHTML = ''));

    const place = (pos, color, label, isPlayer) => {
      if (pos < 1) return;
      const slot = this.el(`tokens-${pos}`);
      if (!slot) return;
      const dot = document.createElement('span');
      dot.classList.add('token-dot');
      if (isPlayer) dot.classList.add('token-player');
      else          dot.classList.add('token-robot');
      dot.style.background = color;
      dot.title = label;
      // Pulse animation on every move
      dot.classList.add('token-just-moved');
      dot.addEventListener('animationend', () => dot.classList.remove('token-just-moved'), { once: true });
      slot.appendChild(dot);
    };

    place(positions.player, playerColor, 'You',   true);
    place(positions.robot,  '#888888',   'Robot', false);
  },

  // ── Flash label ───────────────────────────────────────
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

  // ── Question modal — supports both open & MCQ ─────────
  showQuestionModal(squareType, questionData) {
    const labels = {
      ladder:    '🪜 LADDER',
      snake:     '🐍 SNAKE',
      'int-pos': '➕ BONUS',
      'int-neg': '➖ PENALTY',
      freeze:    '🧊 UNFREEZE',
      end:       '🏁 ANSWER TO WIN',
    };
    this.el('modalSquareLabel').textContent = labels[squareType] || '❓ CHALLENGE';

    const diffEl = this.el('modalDiff');
    diffEl.textContent = questionData.difficulty || 'Medium';
    diffEl.className   = `modal-diff-tag ${questionData.difficulty || 'Medium'}`;

    this.el('questionText').textContent = questionData.question;
    this.el('reportZone').classList.add('hidden');
    this.el('reportReason').value       = '';
    this.el('reportMsg').classList.add('hidden');
    this.el('reportMsg').textContent    = '';

    const isMCQ = questionData.type === 'mcq' && Array.isArray(questionData.choices) && questionData.choices.length >= 2;

    // Toggle open vs MCQ input
    const answerInputWrap = this.el('answerInputWrap');
    const mcqChoicesWrap  = this.el('mcqChoicesWrap');

    if (isMCQ) {
      this.el('answerInput').value = '';
      answerInputWrap.classList.add('hidden');
      mcqChoicesWrap.classList.remove('hidden');

      // Shuffle choices and render buttons
      const shuffled = [...questionData.choices].sort(() => Math.random() - 0.5);
      mcqChoicesWrap.innerHTML = '';
      shuffled.forEach(choice => {
        const btn = document.createElement('button');
        btn.classList.add('mcq-choice-btn');
        btn.textContent = choice;
        btn.addEventListener('click', () => {
          // Set the hidden answer input so onPlayerAnswer works unchanged
          this.el('answerInput').value = choice;
          this.el('submitAnswerBtn').click();
        });
        mcqChoicesWrap.appendChild(btn);
      });
      // Hide text submit button — clicking a choice submits automatically
      this.el('submitAnswerBtn').classList.add('hidden');
    } else {
      this.el('answerInput').value = '';
      answerInputWrap.classList.remove('hidden');
      mcqChoicesWrap.classList.add('hidden');
      this.el('submitAnswerBtn').classList.remove('hidden');
      setTimeout(() => this.el('answerInput').focus(), 150);
    }

    this.el('questionModal').classList.remove('hidden');
  },

  hideQuestionModal() {
    this.el('questionModal').classList.add('hidden');
    // Reset MCQ state
    const mcqChoicesWrap = this.el('mcqChoicesWrap');
    if (mcqChoicesWrap) mcqChoicesWrap.innerHTML = '';
    const answerInputWrap = this.el('answerInputWrap');
    if (answerInputWrap) answerInputWrap.classList.remove('hidden');
    this.el('submitAnswerBtn')?.classList.remove('hidden');
  },

  // ── Game over modal ───────────────────────────────────
  showGameOver(playerWon) {
    this.el('gameOverEmoji').textContent = playerWon ? '🏆' : '🤖';
    this.el('gameOverTitle').textContent = playerWon ? 'YOU WIN!' : 'ROBOT WINS!';
    this.el('gameOverMsg').textContent   = playerWon
      ? 'Excellent! You answered the final question correctly!'
      : 'Better luck next time. The Robot conquered the board!';
    this.el('gameOverModal').classList.remove('hidden');
  },
};
