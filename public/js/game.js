// game.js — ULTANGBER Game Engine
// All logic follows the official Guide Book (Buku Panduan)

// ── Board configs: cols × rows ────────────────────────────────
const BOARD_CONFIGS = {
  '5x8':  { cols: 5, rows: 8  },
  '6x9':  { cols: 6, rows: 9  },
  '7x10': { cols: 7, rows: 10 },
};

const state = {
  cols: 5,
  rows: 8,
  totalSquares: 40,
  questionSetId: null,
  playerColor: '#E74C3C',
  positions: { player: 1, robot: 1 },
  currentTurn: 'player',
  isWaiting: false,

  // Freeze phases per guide book:
  // null              = not frozen
  // 'frozen-skip'     = must skip this coming turn (no dice, no question)
  // 'frozen-question' = must answer question correctly before rolling
  playerFreezePhase: null,
  robotFreezePhase: null,

  squares: [],
  currentQuestion: null,
  currentSquareType: null,
};

// ─────────────────────────────────────────────────────────────
// BOARD GENERATION
// Each special square stores:
//   ladder: { type:'ladder', dest: topSquare,  value: +N }
//   snake:  { type:'snake',  dest: tailSquare, value: -N }
//   int-pos/int-neg/freeze: { type, value }
// ─────────────────────────────────────────────────────────────

function generateSpecialSquares(cols, rows) {
  const total   = cols * rows;
  const used    = new Set([1, total]);
  const specials = {};

  function pick(min, max) {
    let n, tries = 0;
    do {
      n = Math.floor(Math.random() * (max - min + 1)) + min;
      if (++tries > 300) return null;
    } while (used.has(n) || n < 1 || n > total);
    used.add(n);
    return n;
  }

  // counts: +20% more specials (5×8→3, 6×9→4, 7×10→5)
  const count = cols === 5 ? 3 : cols === 6 ? 4 : 5;
  const half  = Math.floor(total / 2);

  for (let i = 0; i < count; i++) {
    // Ladder bottom in lower half, top in upper half
    const lb = pick(2, half - cols);
    if (lb) {
      const lt = pick(lb + cols, Math.min(total - 1, lb + cols * 3));
      if (lt) specials[lb] = { type: 'ladder', dest: lt,  value: lt - lb };
    }

    // Snake head in upper half, tail in lower half
    const sh = pick(half + cols, total - 2);
    if (sh) {
      const st = pick(Math.max(2, sh - cols * 3), sh - cols);
      if (st) specials[sh] = { type: 'snake', dest: st, value: st - sh };
    }

    // Positive integer bonus (lower half)
    const pn = pick(2, half);
    if (pn) specials[pn] = { type: 'int-pos', value: Math.floor(Math.random() * 4) + 3 };

    // Negative integer penalty (upper half)
    const nn = pick(half + 1, total - 2);
    if (nn) specials[nn] = { type: 'int-neg', value: -(Math.floor(Math.random() * 4) + 2) };

    // Freeze (anywhere)
    const fn = pick(2, total - 2);
    if (fn) specials[fn] = { type: 'freeze', value: 0 };
  }

  return specials;
}

// Build DOM-order array of squares (top-left first, snake numbering)
// Board numbering: sq 1 = bottom-right, snake pattern going up
function buildSquares(cols, rows, specials) {
  const squares = [];
  for (let r = 0; r < rows; r++) {
    const rowFromBottom = rows - 1 - r; // 0 = bottom row
    // Even rows from bottom: numbers go right-to-left (1 at right)
    // Odd rows from bottom: numbers go left-to-right
    const rightToLeft = rowFromBottom % 2 === 0;

    for (let c = 0; c < cols; c++) {
      const colIndex = rightToLeft ? (cols - 1 - c) : c;
      const number   = rowFromBottom * cols + colIndex + 1;
      const sp       = specials[number];
      squares.push({
        number,
        type:  sp ? sp.type  : 'normal',
        value: sp ? sp.value : 0,
        dest:  sp ? sp.dest  : null,
      });
    }
  }
  return squares;
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const rollDice   = ()  => Math.floor(Math.random() * 6) + 1;
const delay      = ms  => new Promise(r => setTimeout(r, ms));
const getSquare  = n   => state.squares.find(s => s.number === n);
const robotRight = ()  => Math.random() < 0.7;
const norm       = s   => s.trim().toLowerCase().replace(/\s+/g, ' ');

function moveToken(cur, steps) {
  const next = cur + steps;
  return next > state.totalSquares ? cur : Math.max(1, next);
}

const sqLabel = t => ({
  ladder: '🪜 Ladder', snake: '🐍 Snake',
  'int-pos': '➕ Bonus', 'int-neg': '➖ Penalty',
  freeze: '🧊 Freeze', end: '🏁 End Square',
}[t] || t);

// ─────────────────────────────────────────────────────────────
// GUIDE-BOOK EFFECTS
// ─────────────────────────────────────────────────────────────

function applyCorrect(who, sq) {
  const pos = state.positions[who];
  switch (sq.type) {
    case 'ladder':
      // Correct → climb to top of ladder
      return { newPos: sq.dest, msg: `🪜 Climbed the ladder to sq ${sq.dest}!` };
    case 'snake':
      // Correct → stay (avoided the snake)
      return { newPos: pos, msg: `🐍 Correct! Stayed safe on sq ${pos}.` };
    case 'int-pos':
      // Correct → move forward by value
      return { newPos: Math.min(state.totalSquares, pos + sq.value), msg: `✅ +${sq.value} steps forward!` };
    case 'int-neg':
      // Correct → stay (avoided penalty)
      return { newPos: pos, msg: `✅ Correct! Penalty avoided — stay on sq ${pos}.` };
    case 'end':
      // Correct → WIN
      return { newPos: state.totalSquares, msg: `🏆 Correct! Victory!` };
    default:
      return { newPos: pos, msg: '' };
  }
}

function applyWrong(who, sq) {
  const pos = state.positions[who];
  switch (sq.type) {
    case 'ladder':
      // Wrong → stay at bottom (don't climb)
      return { newPos: pos, msg: `❌ Wrong! Missed the ladder — stay on sq ${pos}.` };
    case 'snake':
      // Wrong → slide down to snake's tail
      return { newPos: sq.dest, msg: `❌ Wrong! Slid down the snake to sq ${sq.dest}!` };
    case 'int-pos':
      // Wrong → stay (no bonus)
      return { newPos: pos, msg: `❌ Wrong! No bonus — stay on sq ${pos}.` };
    case 'int-neg':
      // Wrong → move backward by the penalty value
      return { newPos: Math.max(1, pos + sq.value), msg: `❌ Wrong! Moved back ${Math.abs(sq.value)} steps.` };
    case 'end':
      // Wrong → move back 5 squares
      return { newPos: Math.max(1, pos - 5), msg: `❌ Wrong! Moved back 5 squares.` };
    default:
      return { newPos: pos, msg: '' };
  }
}

// ─────────────────────────────────────────────────────────────
// TURN FLOW
// ─────────────────────────────────────────────────────────────

async function playerTurn(diceValue) {
  ui.setRollEnabled(false);

  // Phase: frozen-skip → skip this turn automatically
  if (state.playerFreezePhase === 'frozen-skip') {
    state.playerFreezePhase = 'frozen-question';
    ui.updateStatus({ diceDisplay: '❄️', statusMsg: '🧊 You are frozen! Turn skipped.' });
    await delay(1600);
    switchToRobot();
    return;
  }

  // Phase: frozen-question → must answer correctly before rolling
  if (state.playerFreezePhase === 'frozen-question') {
    ui.updateStatus({ statusMsg: '🧊 Answer correctly to unfreeze and roll!' });
    try {
      const qData = await api.getRandomQuestion(state.questionSetId);
      state.currentQuestion   = qData;
      state.currentSquareType = 'freeze-unlock';
      state.isWaiting         = true;
      ui.showQuestionModal('freeze', qData);
    } catch (e) {
      ui.updateStatus({ statusMsg: '⚠️ Could not load question — still frozen.' });
      await delay(1400);
      switchToRobot();
    }
    return;
  }

  // Normal turn — move the token
  state.positions.player = moveToken(state.positions.player, diceValue);
  ui.updateTokens(state.positions, state.playerColor);
  ui.updateStatus({ playerPos: state.positions.player });

  const sq = getSquare(state.positions.player);

  // Landed on END square?
  if (state.positions.player === state.totalSquares) {
    ui.updateStatus({ statusMsg: '🏁 You reached the END! Answer correctly to win!' });
    await delay(600);
    try {
      const qData = await api.getRandomQuestion(state.questionSetId);
      state.currentQuestion   = qData;
      state.currentSquareType = 'end';
      state.isWaiting         = true;
      ui.showQuestionModal('end', qData);
    } catch (e) {
      ui.showGameOver(true);
    }
    return;
  }

  // Landed on FREEZE? — no question, just skip next turn
  if (sq && sq.type === 'freeze') {
    state.playerFreezePhase = 'frozen-skip';
    ui.updateStatus({ statusMsg: '🧊 FROZEN! Your next turn is skipped.' });
    await delay(1600);
    switchToRobot();
    return;
  }

  // Landed on other special square?
  if (sq && sq.type !== 'normal') {
    try {
      const qData = await api.getRandomQuestion(state.questionSetId);
      state.currentQuestion   = qData;
      state.currentSquareType = sq.type;
      state.isWaiting         = true;
      ui.showQuestionModal(sq.type, qData);
    } catch (e) {
      ui.updateStatus({ statusMsg: '⚠️ Could not load question — skipping.' });
      await delay(1400);
      switchToRobot();
    }
    return;
  }

  // Normal square — just pass
  await delay(400);
  switchToRobot();
}

function onPlayerAnswer(answer) {
  const isEnd          = state.currentSquareType === 'end';
  const isFreezeUnlock = state.currentSquareType === 'freeze-unlock';
  const sq             = isEnd
    ? { type: 'end', value: 0, dest: null }
    : isFreezeUnlock
    ? null
    : getSquare(state.positions.player);

  const correct = norm(answer) === norm(state.currentQuestion.answer);

  ui.hideQuestionModal();
  state.isWaiting = false;
  ui.setRollEnabled(false); // prevent double-fire during transition delay

  // ── Freeze-unlock ─────────────────────────────────────────
  if (isFreezeUnlock) {
    if (correct) {
      state.playerFreezePhase = null;
      ui.updateStatus({ statusMsg: '✅ Correct! Unfrozen — roll the dice!' });
      ui.setActiveTurn('player');
      ui.setRollEnabled(true);
    } else {
      state.playerFreezePhase = 'frozen-question'; // stays frozen
      ui.updateStatus({ statusMsg: '❌ Wrong! Still frozen — try again next turn.' });
      setTimeout(switchToRobot, 1600);
    }
    return;
  }

  // ── Normal answer ─────────────────────────────────────────
  const { newPos, msg } = correct ? applyCorrect('player', sq) : applyWrong('player', sq);
  state.positions.player = newPos;
  ui.updateTokens(state.positions, state.playerColor);
  ui.updateStatus({ playerPos: newPos, statusMsg: msg });

  if (correct && isEnd) {
    setTimeout(() => ui.showGameOver(true), 900);
    return;
  }
  if (state.positions.player >= state.totalSquares) {
    setTimeout(() => ui.showGameOver(true), 900);
    return;
  }
  setTimeout(switchToRobot, 1500);
}

async function robotTurn() {
  ui.updateStatus({ turnLabel: "ROBOT'S TURN", diceDisplay: '🎲', statusMsg: 'Robot is thinking…' });
  await delay(800);

  // Frozen-skip
  if (state.robotFreezePhase === 'frozen-skip') {
    state.robotFreezePhase = 'frozen-question';
    ui.updateStatus({ diceDisplay: '❄️', statusMsg: '🧊 Robot is frozen! Turn skipped.' });
    await delay(1500);
    switchToPlayer();
    return;
  }

  // Frozen-question
  if (state.robotFreezePhase === 'frozen-question') {
    ui.updateStatus({ statusMsg: '🧊 Robot must answer to unfreeze…' });
    await delay(900);
    if (robotRight()) {
      state.robotFreezePhase = null;
      ui.updateStatus({ statusMsg: '🤖 Robot answered correctly — unfrozen!' });
    } else {
      ui.updateStatus({ statusMsg: '🤖 Robot answered wrong — still frozen.' });
    }
    await delay(1300);
    switchToPlayer();
    return;
  }

  // Normal roll
  const dv = rollDice();
  ui.animateDice();
  ui.updateStatus({ diceDisplay: `${dv}`, statusMsg: `Robot rolled ${dv}!` });
  await delay(700);

  state.positions.robot = moveToken(state.positions.robot, dv);
  ui.updateTokens(state.positions, state.playerColor);
  ui.updateStatus({ robotPos: state.positions.robot });
  await delay(400);

  // Robot hits END
  if (state.positions.robot === state.totalSquares) {
    ui.updateStatus({ statusMsg: '🤖 Robot reached the END! Answering…' });
    await delay(900);
    if (robotRight()) {
      ui.updateStatus({ statusMsg: '🤖 Robot answered correctly — ROBOT WINS!' });
      setTimeout(() => ui.showGameOver(false), 900);
    } else {
      state.positions.robot = Math.max(1, state.positions.robot - 5);
      ui.updateTokens(state.positions, state.playerColor);
      ui.updateStatus({ robotPos: state.positions.robot, statusMsg: '🤖 Robot wrong at END — back 5 squares.' });
      await delay(1400);
      switchToPlayer();
    }
    return;
  }

  const sq = getSquare(state.positions.robot);

  // Robot hits FREEZE
  if (sq && sq.type === 'freeze') {
    state.robotFreezePhase = 'frozen-skip';
    ui.updateStatus({ statusMsg: '🧊 Robot is FROZEN! Next robot turn is skipped.' });
    await delay(1500);
    switchToPlayer();
    return;
  }

  // Robot hits special square
  if (sq && sq.type !== 'normal') {
    ui.updateStatus({ statusMsg: `🤖 Robot on ${sqLabel(sq.type)} square…` });
    await delay(700);
    try {
      await api.getRandomQuestion(state.questionSetId);
      ui.updateStatus({ statusMsg: '🤖 Answering…' });
      await delay(1200);
      const correct = robotRight();
      const { newPos, msg } = correct ? applyCorrect('robot', sq) : applyWrong('robot', sq);
      state.positions.robot = newPos;
      ui.updateTokens(state.positions, state.playerColor);
      ui.updateStatus({ robotPos: newPos, statusMsg: `🤖 ${correct ? 'Correct' : 'Wrong'}! ${msg}` });
      if (state.positions.robot >= state.totalSquares) {
        setTimeout(() => ui.showGameOver(false), 800);
        return;
      }
    } catch (e) {
      ui.updateStatus({ statusMsg: '⚠️ Robot skipped question due to error.' });
    }
  }

  await delay(900);
  switchToPlayer();
}

function switchToRobot() {
  state.currentTurn = 'robot';
  ui.setActiveTurn('robot');
  robotTurn();
}

function switchToPlayer() {
  state.currentTurn = 'player';
  ui.setActiveTurn('player');
  ui.updateStatus({ turnLabel: 'YOUR TURN', diceDisplay: '🎲', statusMsg: 'Roll the dice!' });
  ui.setRollEnabled(true);
}

// ─────────────────────────────────────────────────────────────
// EVENT HANDLERS
// ─────────────────────────────────────────────────────────────

function setupHandlers() {
  ['rollDiceBtn', 'rollDiceBtnDesktop'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (state.currentTurn !== 'player' || state.isWaiting) return;
      const roll = rollDice();
      ui.animateDice();
      ui.updateStatus({ diceDisplay: `${roll}`, statusMsg: `You rolled ${roll}!` });
      playerTurn(roll);
    });
  });

  ui.el('submitAnswerBtn').addEventListener('click', () => {
    if (!state.isWaiting) return;
    const ans = ui.el('answerInput').value.trim();
    if (!ans) { ui.el('answerInput').style.boxShadow = '4px 4px 0 var(--red)'; return; }
    ui.el('answerInput').style.boxShadow = '';
    onPlayerAnswer(ans);
  });

  ui.el('answerInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') ui.el('submitAnswerBtn').click();
  });

  ui.el('reportBtn').addEventListener('click', () => {
    ui.el('reportZone').classList.toggle('hidden');
  });

  ui.el('submitReportBtn').addEventListener('click', async () => {
    const reason = ui.el('reportReason').value.trim();
    const msgEl  = ui.el('reportMsg');
    if (reason.length < 3) {
      msgEl.textContent = 'Please write at least a few words.';
      msgEl.className = 'report-feedback err';
      msgEl.classList.remove('hidden');
      return;
    }
    try {
      await api.submitReport({
        questionSetId: state.currentQuestion?.questionSetId,
        questionIndex: state.currentQuestion?.questionIndex,
        reason,
      });
      msgEl.textContent = '✅ Report sent. Thank you!';
      msgEl.className = 'report-feedback';
      msgEl.classList.remove('hidden');
      ui.el('reportReason').value = '';
    } catch (e) {
      msgEl.textContent = '❌ Failed to send report.';
      msgEl.className = 'report-feedback err';
      msgEl.classList.remove('hidden');
    }
  });

  document.getElementById('backToDash').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  ui.el('playAgainBtn').addEventListener('click', () => {
    window.location.href = 'index.html';
  });
}

// ─────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────

async function initGame() {
  const settings = JSON.parse(sessionStorage.getItem('gameSettings') || 'null');
  if (!settings?.questionSetId) { window.location.href = 'index.html'; return; }

  const cfg = BOARD_CONFIGS[settings.boardKey] || BOARD_CONFIGS['5x8'];
  state.cols          = cfg.cols;
  state.rows          = cfg.rows;
  state.totalSquares  = cfg.cols * cfg.rows;
  state.questionSetId = settings.questionSetId;
  state.playerColor   = settings.playerColor;

  ui.setPlayerColor(settings.playerColor);

  const specials = generateSpecialSquares(state.cols, state.rows);
  state.squares  = buildSquares(state.cols, state.rows, specials);

  ui.renderBoard(state.squares, state.cols, state.rows);

  state.positions = { player: 1, robot: 1 };
  ui.updateTokens(state.positions, state.playerColor);
  ui.updateStatus({ playerPos: 1, robotPos: 1, turnLabel: 'YOUR TURN', statusMsg: 'Roll the dice to start!', diceDisplay: '🎲' });
  ui.setActiveTurn('player');
  setupHandlers();
  ui.setRollEnabled(true);
}

window.addEventListener('DOMContentLoaded', initGame);
