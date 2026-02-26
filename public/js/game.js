// ============================================================
// game.js — Core game engine for ULTANGBER
// Handles: board generation, dice rolls, movement, special
// squares, question flow, robot AI, win detection
// Depends on: api.js and ui.js (loaded before this in HTML)
// ============================================================

// ---- Game State Object ----
// This single object holds everything about the current game
const state = {
  size: 10,               // Board side length (8, 10, or 12)
  totalSquares: 100,      // size * size
  questionSetId: null,    // MongoDB ID of selected question set

  positions: {
    player: 0,            // 0 means "not yet started" (off-board)
    robot: 0,
  },

  playerColor: '#e74c3c', // Chosen token color
  currentTurn: 'player', // 'player' or 'robot'
  isWaiting: false,      // True when awaiting answer input
  isFrozen: false,       // True if current player's turn is skipped

  squares: [],           // Array of square objects (built at start)
  currentQuestion: null, // The question currently being shown
  currentSquareType: null, // What kind of special square triggered

  robotFrozen: false,    // Freeze state for robot's turn
};

// ---- Special Squares Configuration ----
// Defines which square numbers are special and what they do
// These are generated dynamically based on board size
function generateSpecialSquares(size) {
  const total = size * size;

  // Percentages-based placement so it scales with board size
  const specials = {};

  // Helper: pick a random square that isn't start, end, or already special
  const used = new Set([1, total]);
  function pick() {
    let n;
    do { n = Math.floor(Math.random() * (total - 2)) + 2; }
    while (used.has(n));
    used.add(n);
    return n;
  }

  const count = size === 8 ? 3 : size === 10 ? 4 : 5;

  for (let i = 0; i < count; i++) {
    specials[pick()] = { type: 'ladder',   value: +Math.floor(size * 0.6 + Math.random() * size * 0.4), icon: '🪜' };
    specials[pick()] = { type: 'snake',    value: -Math.floor(size * 0.6 + Math.random() * size * 0.4), icon: '🐍' };
    specials[pick()] = { type: 'int-pos',  value: +Math.floor(Math.random() * 3 + 2), icon: '⬆️' };
    specials[pick()] = { type: 'int-neg',  value: -Math.floor(Math.random() * 3 + 2), icon: '⬇️' };
    specials[pick()] = { type: 'freeze',   value: 0, icon: '🧊' };
  }

  return specials;
}

// ---- Board Builder ----
// Builds an array of square objects, in VISUAL ORDER (top-right to bottom-left)
// Snake-and-Ladder boards use a "boustrophedon" (zigzag) numbering
function buildSquares(size, specials) {
  const total = size * size;
  const squares = [];

  // Build rows from top to bottom, alternating direction
  for (let row = 0; row < size; row++) {
    const isEvenRow = row % 2 === 0;

    for (let col = 0; col < size; col++) {
      // The actual square NUMBER on this cell
      // Bottom-left = 1, top-right = total
      const rowFromBottom = size - 1 - row;
      const colInRow = isEvenRow ? col : size - 1 - col;
      const number = rowFromBottom * size + colInRow + 1;

      const special = specials[number];

      squares.push({
        number,
        type: special ? special.type : 'normal',
        value: special ? special.value : 0,
        icon: special ? special.icon : (number === 1 ? '🚀' : number === total ? '🏁' : ''),
      });
    }
  }

  return squares;
}

// ---- Dice Roll ----
// Returns a random number from 1 to 6
function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

// ---- Move Player/Robot ----
// Moves a player from their current position by `steps`
// Returns the new position (capped at totalSquares)
function moveToken(currentPos, steps) {
  const startPos = currentPos === 0 ? 0 : currentPos;
  let newPos = startPos + steps;

  // Can't go past the last square — must land exactly or wait
  if (newPos > state.totalSquares) {
    newPos = startPos; // Stay in place if overshoot
  }

  return Math.max(1, newPos);
}

// ---- Get special square data ----
function getSquare(number) {
  return state.squares.find((s) => s.number === number);
}

// ---- Apply the effect of a special square after correct answer ----
function applySquareEffect(who, squareData) {
  const pos = state.positions[who];
  let newPos = pos;

  if (squareData.type === 'ladder' || squareData.type === 'snake') {
    // Move by value (ladder = positive, snake = negative)
    newPos = Math.max(1, Math.min(state.totalSquares, pos + squareData.value));
  } else if (squareData.type === 'int-pos' || squareData.type === 'int-neg') {
    newPos = Math.max(1, Math.min(state.totalSquares, pos + squareData.value));
  } else if (squareData.type === 'freeze') {
    // Freeze means skip next turn — no movement
    if (who === 'player') state.isFrozen = true;
    if (who === 'robot')  state.robotFrozen = true;
    ui.updateStatus({ statusMsg: who === 'player' ? '🧊 You are frozen! Skip next turn.' : '🧊 Robot is frozen next turn.' });
  }

  if (squareData.type !== 'freeze') {
    const direction = newPos > pos ? `+${newPos - pos}` : `${newPos - pos}`;
    ui.flashSquare(pos, direction + ' sq');
  }

  state.positions[who] = newPos;
}

// ---- Apply WRONG answer effect ----
// If wrong: snake/freeze move you back, ladder/bonus does nothing extra
function applyWrongEffect(who, squareData) {
  const pos = state.positions[who];

  if (squareData.type === 'snake') {
    // Correct answer would have moved you back; wrong = stay in place
    ui.updateStatus({ statusMsg: '❌ Wrong! The snake spares you... for now.' });
  } else if (squareData.type === 'ladder') {
    // Ladder lost: move BACK by ladder value (penalty for wrong)
    const newPos = Math.max(1, pos + squareData.value * -1);
    state.positions[who] = newPos;
    ui.flashSquare(pos, `-${Math.abs(squareData.value)} sq`);
    ui.updateStatus({ statusMsg: '❌ Wrong! The ladder collapsed. Move back.' });
  } else if (squareData.type === 'int-pos') {
    ui.updateStatus({ statusMsg: '❌ Wrong! No bonus for you.' });
  } else if (squareData.type === 'int-neg') {
    // Extra penalty: double the negative
    const extra = Math.max(1, pos + squareData.value * 2);
    state.positions[who] = extra;
    ui.updateStatus({ statusMsg: '❌ Wrong! Double penalty applied.' });
  } else if (squareData.type === 'freeze') {
    // Wrong on freeze = frozen for 2 turns instead of 1
    if (who === 'player') { state.isFrozen = true; state.frozenTurns = 2; }
    if (who === 'robot')  { state.robotFrozen = true; state.robotFrozenTurns = 2; }
    ui.updateStatus({ statusMsg: '❌ Wrong! Frozen for 2 turns!' });
  }
}

// ---- Check for win condition ----
function checkWin(who) {
  return state.positions[who] >= state.totalSquares;
}

// ---- Robot AI: answer with 70% accuracy ----
function robotAnswersCorrectly() {
  return Math.random() < 0.7; // 70% chance correct
}

// ============================================================
// PLAYER TURN FLOW
// ============================================================

async function playerTurn(diceValue) {
  ui.setRollEnabled(false);

  // Handle frozen turn
  if (state.isFrozen) {
    const frozenTurns = state.frozenTurns || 1;
    if (frozenTurns <= 1) {
      state.isFrozen = false;
      state.frozenTurns = 0;
    } else {
      state.frozenTurns--;
    }
    ui.updateStatus({ statusMsg: '🧊 You are frozen! Turn skipped.', diceResult: '❄️' });
    setTimeout(switchToRobot, 1500);
    return;
  }

  // Move player
  state.positions.player = moveToken(state.positions.player, diceValue);
  ui.updateTokens(state.positions, state.playerColor);
  ui.updateStatus({ playerPos: state.positions.player });

  // Win check
  if (checkWin('player')) {
    ui.showGameOver(true);
    return;
  }

  // Check for special square
  const square = getSquare(state.positions.player);
  if (square && square.type !== 'normal') {
    // Show question modal
    try {
      const qData = await api.getRandomQuestion(state.questionSetId);
      state.currentQuestion = qData;
      state.currentSquareType = square.type;
      state.isWaiting = true;
      ui.showQuestionModal(square.type, qData);
      // The modal buttons handle the rest (see setupModalHandlers)
    } catch (err) {
      ui.updateStatus({ statusMsg: '⚠️ Could not load question. Skip.' });
      setTimeout(switchToRobot, 1500);
    }
  } else {
    // Normal square: just switch turns
    setTimeout(switchToRobot, 500);
  }
}

// ---- Called when player submits their answer ----
function onPlayerSubmitAnswer(answerGiven) {
  const correct = answerGiven.trim().toLowerCase() ===
                  state.currentQuestion.answer.trim().toLowerCase();

  const square = getSquare(state.positions.player);

  if (correct) {
    applySquareEffect('player', square);
    ui.updateStatus({ statusMsg: '✅ Correct! Square effect applied.' });
  } else {
    applyWrongEffect('player', square);
  }

  ui.hideQuestionModal();
  state.isWaiting = false;

  ui.updateTokens(state.positions, state.playerColor);
  ui.updateStatus({ playerPos: state.positions.player });

  // Win check after effect
  if (checkWin('player')) {
    setTimeout(() => ui.showGameOver(true), 800);
    return;
  }

  setTimeout(switchToRobot, 1200);
}

// ============================================================
// ROBOT TURN FLOW (automatic)
// ============================================================

async function robotTurn() {
  ui.updateStatus({ turnLabel: '🤖 Robot\'s turn...', diceResult: '🎲 —', statusMsg: '' });

  await delay(900); // Simulate "thinking"

  // Handle frozen turn
  if (state.robotFrozen) {
    const frozenTurns = state.robotFrozenTurns || 1;
    if (frozenTurns <= 1) {
      state.robotFrozen = false;
      state.robotFrozenTurns = 0;
    } else {
      state.robotFrozenTurns--;
    }
    ui.updateStatus({ statusMsg: '🧊 Robot is frozen! Turn skipped.', diceResult: '❄️' });
    setTimeout(switchToPlayer, 1500);
    return;
  }

  const diceValue = rollDice();
  ui.updateStatus({ diceResult: `🎲 ${diceValue}`, statusMsg: `Robot rolled a ${diceValue}!` });

  await delay(800);

  state.positions.robot = moveToken(state.positions.robot, diceValue);
  ui.updateTokens(state.positions, state.playerColor);
  ui.updateStatus({ robotPos: state.positions.robot });

  // Win check
  if (checkWin('robot')) {
    ui.showGameOver(false);
    return;
  }

  const square = getSquare(state.positions.robot);
  if (square && square.type !== 'normal') {
    ui.updateStatus({ statusMsg: `🤖 Robot landed on a ${square.type} square!` });
    await delay(700);

    try {
      const qData = await api.getRandomQuestion(state.questionSetId);
      const isCorrect = robotAnswersCorrectly();

      ui.updateStatus({ statusMsg: `🤖 Robot is answering: "${qData.question.substring(0, 40)}..."` });
      await delay(1200);

      if (isCorrect) {
        applySquareEffect('robot', square);
        ui.updateStatus({ statusMsg: '🤖 Robot answered correctly!' });
      } else {
        applyWrongEffect('robot', square);
      }

      ui.updateTokens(state.positions, state.playerColor);
      ui.updateStatus({ robotPos: state.positions.robot });

      if (checkWin('robot')) {
        setTimeout(() => ui.showGameOver(false), 800);
        return;
      }
    } catch (err) {
      ui.updateStatus({ statusMsg: '⚠️ Robot skipped due to error.' });
    }
  }

  await delay(800);
  switchToPlayer();
}

// ---- Turn switches ----
function switchToRobot() {
  state.currentTurn = 'robot';
  robotTurn();
}

function switchToPlayer() {
  state.currentTurn = 'player';
  ui.updateStatus({ turnLabel: '🎯 Your turn! Roll the dice.', diceResult: '🎲 —', statusMsg: '' });
  ui.setRollEnabled(true);
}

// ---- Utility: async delay ----
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// MODAL BUTTON HANDLERS
// ============================================================

function setupModalHandlers() {
  // Submit answer button
  ui.els.submitBtn().addEventListener('click', () => {
    if (!state.isWaiting) return;
    const answer = ui.els.answerInput().value;
    if (!answer.trim()) {
      ui.els.answerInput().style.borderColor = 'var(--danger)';
      return;
    }
    ui.els.answerInput().style.borderColor = '';
    onPlayerSubmitAnswer(answer);
  });

  // Allow Enter key to submit
  ui.els.answerInput().addEventListener('keydown', (e) => {
    if (e.key === 'Enter') ui.els.submitBtn().click();
  });

  // Report question button: toggle report form
  ui.els.reportBtn().addEventListener('click', () => {
    ui.els.reportForm().classList.toggle('hidden');
  });

  // Submit report
  ui.els.submitReport().addEventListener('click', async () => {
    const reason = ui.els.reportReason().value.trim();
    if (reason.length < 3) {
      ui.els.reportStatus().textContent = 'Please write a reason (min 3 characters).';
      ui.els.reportStatus().style.color = 'var(--danger)';
      return;
    }

    try {
      await api.submitReport({
        questionSetId: state.currentQuestion.questionSetId,
        questionIndex: state.currentQuestion.questionIndex,
        reason,
      });
      ui.els.reportStatus().textContent = '✅ Report submitted. Thank you!';
      ui.els.reportStatus().style.color = 'var(--success)';
      ui.els.reportReason().value = '';
    } catch (err) {
      ui.els.reportStatus().textContent = '❌ Failed to submit report.';
      ui.els.reportStatus().style.color = 'var(--danger)';
    }
  });

  // Roll dice button
  ui.els.rollBtn().addEventListener('click', () => {
    if (state.currentTurn !== 'player' || state.isWaiting) return;

    const diceValue = rollDice();
    ui.updateStatus({ diceResult: `🎲 ${diceValue}`, statusMsg: `You rolled a ${diceValue}!` });
    playerTurn(diceValue);
  });

  // Back to dashboard
  document.getElementById('backToDash').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  // Play again
  ui.els.playAgainBtn().addEventListener('click', () => {
    window.location.href = 'index.html';
  });
}

// ============================================================
// INIT — Called when game.html loads
// ============================================================

async function initGame() {
  // Read settings passed from dashboard via sessionStorage
  const settings = JSON.parse(sessionStorage.getItem('gameSettings') || 'null');

  if (!settings || !settings.questionSetId) {
    // No settings: redirect back to dashboard
    window.location.href = 'index.html';
    return;
  }

  // Apply settings to state
  state.size = settings.size;
  state.totalSquares = settings.size * settings.size;
  state.questionSetId = settings.questionSetId;
  state.playerColor = settings.playerColor;

  // Set token color in sidebar
  ui.setPlayerTokenColor(settings.playerColor);

  // Build and render the board
  const specials = generateSpecialSquares(state.size);
  state.squares = buildSquares(state.size, specials);
  ui.renderBoard(state.squares, state.size);

  // Place tokens off-board (position 0 = not started, display at square 1)
  state.positions.player = 1;
  state.positions.robot = 1;
  ui.updateTokens(state.positions, state.playerColor);
  ui.updateStatus({ playerPos: 1, robotPos: 1, turnLabel: '🎯 Your turn! Roll the dice.' });

  // Set up all button/event handlers
  setupModalHandlers();

  // Enable dice button
  ui.setRollEnabled(true);
}

// Start the game when the page finishes loading
window.addEventListener('DOMContentLoaded', initGame);
