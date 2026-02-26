// ============================================================
// ui.js — All DOM manipulation and UI helper functions
// This keeps visual code separate from game logic
// ============================================================

const ui = {

  // ---- Element references ----
  // We grab elements once and reuse them throughout
  els: {
    board:         () => document.getElementById('gameBoard'),
    rollBtn:       () => document.getElementById('rollDiceBtn'),
    turnLabel:     () => document.getElementById('turnLabel'),
    diceResult:    () => document.getElementById('diceResult'),
    statusMsg:     () => document.getElementById('statusMessage'),
    playerPos:     () => document.getElementById('playerPos'),
    robotPos:      () => document.getElementById('robotPos'),
    playerToken:   () => document.getElementById('playerTokenDot'),

    // Modal elements
    modal:         () => document.getElementById('questionModal'),
    squareBadge:   () => document.getElementById('squareTypeLabel'),
    diffBadge:     () => document.getElementById('difficultyLabel'),
    questionText:  () => document.getElementById('questionText'),
    answerInput:   () => document.getElementById('answerInput'),
    submitBtn:     () => document.getElementById('submitAnswerBtn'),
    reportBtn:     () => document.getElementById('reportQuestionBtn'),
    reportForm:    () => document.getElementById('reportForm'),
    reportReason:  () => document.getElementById('reportReason'),
    submitReport:  () => document.getElementById('submitReportBtn'),
    reportStatus:  () => document.getElementById('reportStatus'),

    // Game over modal
    gameOverModal: () => document.getElementById('gameOverModal'),
    gameOverEmoji: () => document.getElementById('gameOverEmoji'),
    gameOverTitle: () => document.getElementById('gameOverTitle'),
    gameOverMsg:   () => document.getElementById('gameOverMessage'),
    playAgainBtn:  () => document.getElementById('playAgainBtn'),
  },

  // ----------------------------------------------------------
  // Build the board grid in the DOM
  // squares: array from game.buildSquares()
  // size: 8, 10, or 12
  // ----------------------------------------------------------
  renderBoard(squares, size) {
    const board = this.els.board();
    board.style.gridTemplateColumns = `repeat(${size}, 60px)`;
    board.innerHTML = ''; // Clear any previous board

    squares.forEach((sq) => {
      const cell = document.createElement('div');
      cell.classList.add('square');
      cell.id = `sq-${sq.number}`;

      // Apply color class for special squares
      if (sq.type !== 'normal') {
        cell.classList.add(`sq-${sq.type.replace('+', 'int-pos').replace('-', 'int-neg')}`);
      }
      if (sq.number === 1) cell.classList.add('sq-start');
      if (sq.number === size * size) cell.classList.add('sq-end');

      // Square number label
      const numLabel = document.createElement('span');
      numLabel.classList.add('square-num');
      numLabel.textContent = sq.number;

      // Icon for special squares
      const icon = document.createElement('span');
      icon.classList.add('square-icon');
      icon.textContent = sq.icon || '';

      // Token container (tokens shown here when players are on this square)
      const tokens = document.createElement('span');
      tokens.classList.add('square-tokens');
      tokens.id = `tokens-${sq.number}`;

      cell.appendChild(numLabel);
      if (sq.icon) cell.appendChild(icon);
      cell.appendChild(tokens);
      board.appendChild(cell);
    });
  },

  // ----------------------------------------------------------
  // Place/update token markers on the board
  // positions: { player: 5, robot: 12 }
  // playerColor: hex color string
  // ----------------------------------------------------------
  updateTokens(positions, playerColor) {
    // Clear all token displays first
    document.querySelectorAll('.square-tokens').forEach((el) => el.innerHTML = '');

    // Draw player token
    if (positions.player >= 1) {
      const el = document.getElementById(`tokens-${positions.player}`);
      if (el) {
        const dot = document.createElement('span');
        dot.classList.add('token-marker');
        dot.style.background = playerColor;
        dot.title = 'You';
        el.appendChild(dot);
      }
    }

    // Draw robot token
    if (positions.robot >= 1) {
      const el = document.getElementById(`tokens-${positions.robot}`);
      if (el) {
        const dot = document.createElement('span');
        dot.classList.add('token-marker');
        dot.style.background = '#aaa';
        dot.title = 'Robot';
        el.appendChild(dot);
      }
    }
  },

  // ----------------------------------------------------------
  // Update the status panel on the left
  // ----------------------------------------------------------
  updateStatus({ turnLabel, diceResult, statusMsg, playerPos, robotPos }) {
    if (turnLabel  !== undefined) this.els.turnLabel().textContent  = turnLabel;
    if (diceResult !== undefined) this.els.diceResult().textContent = diceResult;
    if (statusMsg  !== undefined) this.els.statusMsg().textContent  = statusMsg;
    if (playerPos  !== undefined) this.els.playerPos().textContent  = playerPos;
    if (robotPos   !== undefined) this.els.robotPos().textContent   = robotPos;
  },

  // Set the player token color in the sidebar
  setPlayerTokenColor(color) {
    const dot = this.els.playerToken();
    if (dot) dot.style.color = color;
  },

  // Enable or disable the roll dice button
  setRollEnabled(enabled) {
    this.els.rollBtn().disabled = !enabled;
    this.els.rollBtn().style.opacity = enabled ? '1' : '0.5';
  },

  // ----------------------------------------------------------
  // Show the question modal with data from a question
  // squareType: 'ladder', 'snake', 'int-pos', 'int-neg', 'freeze'
  // questionData: { question, answer, difficulty }
  // ----------------------------------------------------------
  showQuestionModal(squareType, questionData) {
    // Map square types to emoji labels
    const labels = {
      ladder:   '🪜 Ladder',
      snake:    '🐍 Snake',
      'int-pos':'➕ Bonus',
      'int-neg':'➖ Penalty',
      freeze:   '🧊 Freeze',
    };

    this.els.squareBadge().textContent = labels[squareType] || '❓ Special';
    this.els.diffBadge().textContent   = questionData.difficulty;
    this.els.diffBadge().className     = `difficulty-badge ${questionData.difficulty}`;
    this.els.questionText().textContent = questionData.question;

    // Clear previous answer/report state
    this.els.answerInput().value = '';
    this.els.reportForm().classList.add('hidden');
    this.els.reportReason().value = '';
    this.els.reportStatus().textContent = '';

    this.els.modal().classList.remove('hidden');
    this.els.answerInput().focus();
  },

  // Hide the question modal
  hideQuestionModal() {
    this.els.modal().classList.add('hidden');
  },

  // ----------------------------------------------------------
  // Show the Game Over modal
  // ----------------------------------------------------------
  showGameOver(playerWon) {
    this.els.gameOverEmoji().textContent = playerWon ? '🏆' : '🤖';
    this.els.gameOverTitle().textContent = playerWon ? 'You Win!' : 'Robot Wins!';
    this.els.gameOverMsg().textContent   = playerWon
      ? 'Excellent! You reached the final square first!'
      : 'Better luck next time! The Robot got there first.';
    this.els.gameOverModal().classList.remove('hidden');
  },

  // Show a temporary flash message on a square (e.g. "+3 moves!")
  flashSquare(squareNumber, text) {
    const sq = document.getElementById(`sq-${squareNumber}`);
    if (!sq) return;

    const flash = document.createElement('div');
    flash.textContent = text;
    flash.style.cssText = `
      position:absolute; top:-22px; left:50%; transform:translateX(-50%);
      background:var(--accent); color:#000; padding:2px 6px;
      border-radius:4px; font-size:0.7rem; font-weight:700;
      animation: fadeUp 1.5s ease forwards; white-space:nowrap; z-index:10;
    `;
    sq.style.position = 'relative';
    sq.appendChild(flash);
    setTimeout(() => flash.remove(), 1500);
  },
};

// CSS keyframe for flash animation (injected once)
const style = document.createElement('style');
style.textContent = `@keyframes fadeUp { 0%{opacity:1;transform:translateX(-50%) translateY(0)} 100%{opacity:0;transform:translateX(-50%) translateY(-12px)} }`;
document.head.appendChild(style);
