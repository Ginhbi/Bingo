// Utility to generate a bingo card
// Standard Bingo arrays B (1-15), I (16-30), N (31-45), G (46-60), O (61-75)

function getRandomSubset(arr: number[], size: number) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

export function generateBingoCard() {
  const b = getRandomSubset(Array.from({ length: 15 }, (_, i) => i + 1), 5);
  const i = getRandomSubset(Array.from({ length: 15 }, (_, i) => i + 16), 5);
  const n = getRandomSubset(Array.from({ length: 15 }, (_, i) => i + 31), 5);
  // Center is free space, typically represented as 0 or a special string. We'll use 0.
  n[2] = 0; 
  const g = getRandomSubset(Array.from({ length: 15 }, (_, i) => i + 46), 5);
  const o = getRandomSubset(Array.from({ length: 15 }, (_, i) => i + 61), 5);

  return { b, i, n, g, o };
}

export type BingoCard = {
  b: number[];
  i: number[];
  n: number[];
  g: number[];
  o: number[];
};

export function checkBingo(card: BingoCard, drawnNumbers: number[]): boolean {
  if (!drawnNumbers || drawnNumbers.length === 0) return false;
  
  const marked = new Set([0, ...drawnNumbers]); // 0 is always marked (free space)
  
  const grid = [
    card.b,
    card.i,
    card.n,
    card.g,
    card.o
  ]; // This is columns. Let's process it as a 5x5 grid (grid[col][row])

  // Check columns
  for (let c = 0; c < 5; c++) {
    let colBingo = true;
    for (let r = 0; r < 5; r++) {
      if (!marked.has(grid[c][r])) colBingo = false;
    }
    if (colBingo) return true;
  }

  // Check rows
  for (let r = 0; r < 5; r++) {
    let rowBingo = true;
    for (let c = 0; c < 5; c++) {
      if (!marked.has(grid[c][r])) rowBingo = false;
    }
    if (rowBingo) return true;
  }

  // Check diagonals
  let d1Bingo = true;
  for (let i = 0; i < 5; i++) {
    if (!marked.has(grid[i][i])) d1Bingo = false;
  }
  if (d1Bingo) return true;

  let d2Bingo = true;
  for (let i = 0; i < 5; i++) {
    if (!marked.has(grid[i][4 - i])) d2Bingo = false;
  }
  if (d2Bingo) return true;

  return false;
}

export function drawNextCombinations(drawnSoFar: number[]): number {
  const allNumbers = Array.from({ length: 75 }, (_, i) => i + 1);
  const remaining = allNumbers.filter(n => !drawnSoFar.includes(n));
  if(remaining.length === 0) return 0;
  return remaining[Math.floor(Math.random() * remaining.length)];
}
