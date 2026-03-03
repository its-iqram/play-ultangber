// game.js — ULTANGBER Core Game Engine

const state = {
  size: 10,
  totalSquares: 100,
  questionSetId: null,
  playerColor: '#E74C3C',
  positions: { player: 1, robot: 1 },
  currentTurn: 'player',
  isWaiting: false,
  isFrozen: false,
  frozenTurns: 0,
  robotFrozen: false,
  robotFrozenTurns: 0,
  squares: [],
  currentQuestion: null,
  currentSquareType: null,
};

// ── Board generation ──────────────────────────────────────────

function generateSpecialSquares(size) {
  const total   = size * size;
  const used    = new Set([1, total]);
  const specials = {};

  function pickUnique() {
    let n;
    do { n = Math.floor(Math.random() * (total - 2)) + 2; } while (used.has(n));
    used.add(n);
    return n;
  }

  const count = size === 8 ? 3 : size === 10 ? 4 : 5;
  for (let i = 0; i < count; i++) {
    specials[pickUnique()] = { type: 'ladder',  value: +Math.floor(size * 0.6 + Math.random() * size * 0.4) };
    specials[pickUnique()] = { type: 'snake',   value: -Math.floor(size * 0.6 + Math.random() * size * 0.4) };
    specials[pickUnique()] = { type: 'int-pos', value: +Math.floor(Math.random() * 3 + 3) };
    specials[pickUnique()] = { type: 'int-neg', value: -Math.floor(Math.random() * 3 + 2) };
    specials[pickUnique()] = { type: 'freeze',  value: 0 };
  }
  return specials;
}

function buildSquares(size, specials) {
  const squares = [];
  for (let row = 0; row < size; row++) {
    const rowFromBottom = size - 1 - row;
    const leftToRight   = row % 2 === 0;
    for (let col = 0; col < size; col++) {
      const colInRow = leftToRight ? col : size - 1 - col;
      const number   = rowFromBottom * size + colInRow + 1;
      const sp       = specials[number];
      squares.push({ number, type: sp ? sp.type : 'normal', value: sp ? sp.value : 0 });
    }
  }
  return squares;
}

// ── Helpers ───────────────────────────────────────────────────

const rollDice  = ()  => Math.floor(Math.random() * 6) + 1;
const delay     = ms  => new Promise(r => setTimeout(r, ms));
const getSquare = n   => state.squares.find(s => s.number === n);
const moveToken = (cur, steps) => {
  const next = cur + steps;
  return next > state.totalSquares ? cur : Math.max(1, next);
};
const checkWin    = who  => state.positions[who] >= state.totalSquares;
const robotCorrect = ()  => Math.random() < 0.7;

// ── Effects ───────────────────────────────────────────────────

function applyEffect(who, sq) {
  const pos = state.positions[who];
  let newPos = pos, msg = '';

  switch (sq.type) {
    case 'ladder':
      newPos = Math.min(state.totalSquares, pos + sq.value);
      msg = `🪜 Ladder! +${sq.value} squares!`;
      break;
    case 'snake':
      newPos = Math.max(1, pos + sq.value);
      msg = `🐍 Snake! ${sq.value} squares!`;
      break;
    case 'int-pos':
      newPos = Math.min(state.totalSquares, pos + sq.value);
      msg = `➕ Bonus! +${sq.value} steps!`;
      break;
    case 'int-neg':
      newPos = Math.max(1, pos + sq.value);
      msg = `➖ Penalty! ${sq.value} steps.`;
      break;
    case 'freeze':
      if (who === 'player') { state.isFrozen = true; state.frozenTurns = 1; }
      else                  { state.robotFrozen = true; state.robotFrozenTurns = 1; }
      msg = '🧊 Frozen for 1 turn!';
      break;
  }

  state.positions[who] = newPos;
  if (newPos !== pos) {
    const diff = newPos - pos;
    ui.flashSquare(pos, (diff > 0 ? `+${diff}` : `${diff}`) + ' sq');
  }
  return msg;
}

function applyWrongEffect(who, sq) {
  const pos = state.positions[who];
  let msg = '';

  switch (sq.type) {
    case 'ladder':
      state.positions[who] = Math.max(1, pos - sq.value);
      ui.flashSquare(pos, `-${sq.value} sq`);
      msg = '❌ Wrong! Ladder collapsed.';
      break;
    case 'snake':
      msg = '❌ Wrong! No escape from the snake.';
      break;
    case 'int-pos':
      msg = '❌ Wrong! No bonus.';
      break;
    case 'int-neg':
      state.positions[who] = Math.max(1, pos + sq.value * 2);
      msg = '❌ Wrong! Double penalty!';
      break;
    case 'freeze':
      if (who === 'player') { state.isFrozen = true; state.frozenTurns = 2; }
      else                  { state.robotFrozen = true; state.robotFrozenTurns = 2; }
      msg = '❌ Wrong! Frozen for 2 turns!';
      break;
  }
  return msg;
}

// ── Turn flow ─────────────────────────────────────────────────

async function playerTurn(diceValue) {
  ui.setRollEnabled(false);

  // Check frozen
  if (state.isFrozen) {
    if (state.frozenTurns <= 1) { state.isFrozen = false; state.frozenTurns = 0; }
    else                         { state.frozenTurns--; }
    ui.updateStatus({ statusMsg: '🧊 You are frozen! Turn skipped.', diceDisplay: '❄️' });
    await delay(1500);
    switchToRobot();
    return;
  }

  // Move
  state.positions.player = moveToken(state.positions.player, diceValue);
  ui.updateTokens(state.positions, state.playerColor);
  ui.updateStatus({ playerPos: state.positions.player });

  if (checkWin('player')) { ui.showGameOver(true); return; }

  const sq = getSquare(state.positions.player);
  if (sq && sq.type !== 'normal') {
    try {
      const qData = await api.getRandomQuestion(state.questionSetId);
      state.currentQuestion   = qData;
      state.currentSquareType = sq.type;
      state.isWaiting         = true;
      ui.showQuestionModal(sq.type, qData);
    } catch (e) {
      ui.updateStatus({ statusMsg: '⚠️ Could not load question. Skipping.' });
      await delay(1400);
      switchToRobot();
    }
  } else {
    await delay(350);
    switchToRobot();
  }
}

function onPlayerAnswer(answer) {
  const sq = getSquare(state.positions.player);
  const correct = answer.trim().toLowerCase() === state.currentQuestion.answer.trim().toLowerCase();
  const msg     = correct ? '✅ Correct! ' + (applyEffect('player', sq) || '') : applyWrongEffect('player', sq);

  ui.hideQuestionModal();
  state.isWaiting = false;
  ui.updateTokens(state.positions, state.playerColor);
  ui.updateStatus({ playerPos: state.positions.player, statusMsg: msg });

  if (checkWin('player')) { setTimeout(() => ui.showGameOver(true), 900); return; }
  setTimeout(switchToRobot, 1400);
}

async function robotTurn() {
  ui.updateStatus({ turnLabel: "ROBOT'S TURN", diceDisplay: '🎲', statusMsg: 'Robot is thinking…' });
  await delay(900);

  // Check frozen
  if (state.robotFrozen) {
    if (state.robotFrozenTurns <= 1) { state.robotFrozen = false; state.robotFrozenTurns = 0; }
    else                              { state.robotFrozenTurns--; }
    ui.updateStatus({ statusMsg: '🧊 Robot is frozen! Turn skipped.', diceDisplay: '❄️' });
    await delay(1400);
    switchToPlayer();
    return;
  }

  const dv = rollDice();
  ui.animateDice();
  ui.updateStatus({ diceDisplay: `${dv}`, statusMsg: `Robot rolled ${dv}!` });
  await delay(700);

  state.positions.robot = moveToken(state.positions.robot, dv);
  ui.updateTokens(state.positions, state.playerColor);
  ui.updateStatus({ robotPos: state.positions.robot });

  if (checkWin('robot')) { ui.showGameOver(false); return; }

  const sq = getSquare(state.positions.robot);
  if (sq && sq.type !== 'normal') {
    ui.updateStatus({ statusMsg: `🤖 Robot on ${sq.type} square…` });
    await delay(700);
    try {
      const qData = await api.getRandomQuestion(state.questionSetId);
      ui.updateStatus({ statusMsg: `🤖 Answering question…` });
      await delay(1300);
      const correct = robotCorrect();
      const msg     = correct
        ? '🤖 Robot correct! ' + (applyEffect('robot', sq) || '')
        : '🤖 Robot wrong. ' + applyWrongEffect('robot', sq);
      ui.updateTokens(state.positions, state.playerColor);
      ui.updateStatus({ robotPos: state.positions.robot, statusMsg: msg });
      if (checkWin('robot')) { setTimeout(() => ui.showGameOver(false), 800); return; }
    } catch (e) {
      ui.updateStatus({ statusMsg: '⚠️ Robot skipped due to error.' });
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

// ── Event handlers ────────────────────────────────────────────

function setupHandlers() {
  // Both roll buttons (mobile + desktop)
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

  // Submit answer
  ui.el('submitAnswerBtn').addEventListener('click', () => {
    if (!state.isWaiting) return;
    const ans = ui.el('answerInput').value.trim();
    if (!ans) {
      ui.el('answerInput').style.boxShadow = '4px 4px 0 var(--red)';
      return;
    }
    ui.el('answerInput').style.boxShadow = '';
    onPlayerAnswer(ans);
  });

  // Enter key submits answer
  ui.el('answerInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') ui.el('submitAnswerBtn').click();
  });

  // Report button
  ui.el('reportBtn').addEventListener('click', () => {
    ui.el('reportZone').classList.toggle('hidden');
  });

  // Send report
  ui.el('submitReportBtn').addEventListener('click', async () => {
    const reason = ui.el('reportReason').value.trim();
    const msgEl  = ui.el('reportMsg');
    if (reason.length < 3) {
      msgEl.textContent = 'Please write at least a few words.';
      msgEl.className   = 'report-feedback err';
      msgEl.classList.remove('hidden');
      return;
    }
    try {
      await api.submitReport({
        questionSetId: state.currentQuestion.questionSetId,
        questionIndex: state.currentQuestion.questionIndex,
        reason,
      });
      msgEl.textContent = '✅ Report sent. Thank you!';
      msgEl.className   = 'report-feedback';
      msgEl.classList.remove('hidden');
      ui.el('reportReason').value = '';
    } catch (e) {
      msgEl.textContent = '❌ Failed to send report.';
      msgEl.className   = 'report-feedback err';
      msgEl.classList.remove('hidden');
    }
  });

  // Exit
  document.getElementById('backToDash').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  // Play again
  ui.el('playAgainBtn').addEventListener('click', () => {
    window.location.href = 'index.html';
  });
}

// ── Init ──────────────────────────────────────────────────────

async function initGame() {
  const settings = JSON.parse(sessionStorage.getItem('gameSettings') || 'null');
  if (!settings?.questionSetId) {
    window.location.href = 'index.html';
    return;
  }

  state.size          = settings.size;
  state.totalSquares  = settings.size * settings.size;
  state.questionSetId = settings.questionSetId;
  state.playerColor   = settings.playerColor;

  ui.setPlayerColor(settings.playerColor);

  const specials    = generateSpecialSquares(state.size);
  state.squares     = buildSquares(state.size, specials);

  ui.renderBoard(state.squares, state.size);

  state.positions = { player: 1, robot: 1 };
  ui.updateTokens(state.positions, state.playerColor);
  ui.updateStatus({
    playerPos:   1,
    robotPos:    1,
    turnLabel:   'YOUR TURN',
    statusMsg:   'Roll the dice to start!',
    diceDisplay: '🎲',
  });
  ui.setActiveTurn('player');
  setupHandlers();
  ui.setRollEnabled(true);
}

window.addEventListener('DOMContentLoaded', initGame);
