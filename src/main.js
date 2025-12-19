const API_URL = '';

let board = null;
let currentPosition = null;
let score = loadScore();

function loadScore() {
  const saved = localStorage.getItem('chess-endgames-score');
  return saved ? JSON.parse(saved) : { correct: 0, total: 0 };
}

function saveScore() {
  localStorage.setItem('chess-endgames-score', JSON.stringify(score));
}

function initBoard() {
  board = Chessboard('board', {
    draggable: false,
    pieceTheme: '/img/chesspieces/wikipedia/{piece}.png'
  });
}

async function fetchPosition() {
  try {
    const response = await fetch(`${API_URL}/api/position`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch position:', error);
    return null;
  }
}

function displayPosition(position) {
  currentPosition = position;
  board.position(position.fen, false);
  board.orientation(position.sideToMove);

  const turnIndicator = document.getElementById('turn-indicator');
  turnIndicator.textContent = `${position.sideToMove === 'white' ? 'White' : 'Black'} to move`;
  turnIndicator.className = `turn-indicator ${position.sideToMove}`;

  document.getElementById('result').style.display = 'none';
  document.getElementById('answer-buttons').style.display = 'flex';

  document.querySelectorAll('#answer-buttons .btn').forEach(btn => {
    btn.disabled = false;
    btn.classList.remove('correct', 'incorrect');
  });
}

function handleAnswer(selectedAnswer) {
  const correct = selectedAnswer === currentPosition.correctAnswer;

  score.total++;
  if (correct) score.correct++;
  saveScore();

  document.getElementById('correct').textContent = score.correct;
  document.getElementById('total').textContent = score.total;
  const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
  document.getElementById('percentage').textContent = `(${percentage}%)`;

  const resultDiv = document.getElementById('result');
  const resultText = document.getElementById('result-text');

  if (correct) {
    resultText.textContent = 'Correct!';
    resultText.className = 'correct-text';
  } else {
    const correctAnswerText = currentPosition.correctAnswer === 'draw' ? 'Draw' :
      `${currentPosition.correctAnswer.charAt(0).toUpperCase() + currentPosition.correctAnswer.slice(1)} wins`;
    resultText.textContent = `Incorrect. The answer is: ${correctAnswerText}`;
    resultText.className = 'incorrect-text';
  }

  document.getElementById('lichess-link').href = currentPosition.lichessUrl;
  document.getElementById('answer-buttons').style.display = 'none';
  resultDiv.style.display = 'block';
}

async function loadNextPosition() {
  const position = await fetchPosition();
  if (position) {
    displayPosition(position);
  } else {
    alert('Failed to load position. Please check if the server is running.');
  }
}

async function init() {
  initBoard();

  document.getElementById('correct').textContent = score.correct;
  document.getElementById('total').textContent = score.total;
  const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
  document.getElementById('percentage').textContent = `(${percentage}%)`;

  document.querySelectorAll('#answer-buttons .btn').forEach(btn => {
    btn.addEventListener('click', () => handleAnswer(btn.dataset.answer));
  });

  document.getElementById('next-btn').addEventListener('click', loadNextPosition);
  await loadNextPosition();
}

document.addEventListener('DOMContentLoaded', init);
