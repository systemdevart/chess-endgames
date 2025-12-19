import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Parse PGN database on startup
let positions = [];

function parsePGN(content) {
  const games = [];

  // Normalize line endings (CRLF -> LF)
  const normalizedContent = content.replace(/\r\n/g, '\n');

  // Split by double newline followed by [Event
  const gameBlocks = normalizedContent.split(/\n\n(?=\[Event)/);

  for (const block of gameBlocks) {
    if (!block.trim()) continue;

    const headers = {};
    const headerRegex = /\[(\w+)\s+"([^"]*)"\]/g;
    let match;

    while ((match = headerRegex.exec(block)) !== null) {
      headers[match[1]] = match[2];
    }

    if (headers.FEN && headers.Result) {
      games.push({
        event: headers.Event || 'Unknown',
        white: headers.White || 'Unknown',
        black: headers.Black || '',
        result: headers.Result,
        fen: headers.FEN,
        date: headers.Date || ''
      });
    }
  }

  return games;
}

function loadDatabase() {
  try {
    const pgnPath = join(__dirname, 'database', 'Harold_van_der_Heijden_Endgame_Study_Database_VI.pgn');
    const content = readFileSync(pgnPath, 'utf-8');
    positions = parsePGN(content);
    console.log(`Loaded ${positions.length} endgame positions`);
  } catch (err) {
    console.error('Failed to load PGN database:', err);
  }
}

// API endpoint to get a random position
app.get('/api/position', (req, res) => {
  if (positions.length === 0) {
    return res.status(500).json({ error: 'No positions loaded' });
  }

  const randomIndex = Math.floor(Math.random() * positions.length);
  const position = positions[randomIndex];

  // Parse FEN to get side to move
  const fenParts = position.fen.split(' ');
  const sideToMove = fenParts[1] === 'w' ? 'white' : 'black';

  // Determine the correct answer
  let correctAnswer;
  if (position.result === '1-0') {
    correctAnswer = 'white';
  } else if (position.result === '0-1') {
    correctAnswer = 'black';
  } else {
    correctAnswer = 'draw';
  }

  // Create Lichess analysis URL
  const lichessUrl = `https://lichess.org/analysis/${position.fen.replace(/ /g, '_')}`;

  res.json({
    fen: position.fen,
    sideToMove,
    correctAnswer,
    event: position.event,
    white: position.white,
    firstMove: position.firstMove,
    date: position.date,
    lichessUrl
  });
});

// API endpoint to get Lichess cloud evaluation
app.get('/api/eval', async (req, res) => {
  const { fen } = req.query;
  if (!fen) {
    return res.status(400).json({ error: 'FEN required' });
  }

  try {
    const response = await fetch(`https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(fen)}&multiPv=1`);
    if (response.ok) {
      const data = await response.json();
      res.json(data);
    } else {
      res.json({ error: 'No evaluation available' });
    }
  } catch (err) {
    res.json({ error: 'Failed to fetch evaluation' });
  }
});

// Load database and start server
loadDatabase();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
