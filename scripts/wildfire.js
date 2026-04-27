const canvas = document.getElementById('wildfireCanvas');
const ctx = canvas.getContext('2d');
const speedRange = document.getElementById('speedRange');
const gridSizeRange = document.getElementById('gridSize');
const speedValue = document.getElementById('speedValue');
const gridSizeValue = document.getElementById('gridSizeValue');
const igniteProb = document.getElementById('igniteProb');
const igniteRange = document.getElementById('igniteRange');

const cellSize = 10;
let drift = 0;
let collumns = Number(gridSizeRange.value);
let rows = Number(gridSizeRange.value);
    
let simInterval = null;

let grid = [];

speedRange.addEventListener('input', () => {
    updateControlLabels();
    if (simInterval) {
        startSim();
    }
});

gridSizeRange.addEventListener('input', () => {
    updateControlLabels();
    const wasRunning = simInterval !== null;
    stopSim();
    initializeGrid(gridSizeRange.value);
    drawGrid();

    if (wasRunning) {
        startSim();
    }
});

igniteRange.addEventListener('input', () => {
    updateControlLabels();
});

function updateControlLabels() {
    speedValue.textContent = `${speedRange.value} ms`;
    igniteProb.textContent = Number(igniteRange.value).toFixed(2);
    gridSizeValue.textContent = `${gridSizeRange.value} x ${gridSizeRange.value}`;
}

function initializeGrid(size) {
    const parsedSize = Number(size);
    collumns = parsedSize;
    rows = parsedSize;

    canvas.width = cellSize * collumns;
    canvas.height = cellSize * rows;

    grid = Array.from({ length: rows }, () => Array.from({ length: collumns }, () => 0));

    drawGrid();
}
 
function drawGrid() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < collumns; c++) {
      const cell = grid[r][c];

      if (cell === 0) ctx.fillStyle = "#000000";   // dead
      if (cell === 1) ctx.fillStyle = "#3f7a36";   // tree
      if (cell === 2) ctx.fillStyle = "#ff6b2d";   // burning
      if (cell === 3) ctx.fillStyle = "#50382e";   // burned

      ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
    }
  }
}

function resetSim() {
    initializeGrid(gridSizeRange.value);
    stopSim();
    drawGrid();
    startSim();
}

function startFire() {
    // Collect all tree cells
    const treeCells = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < collumns; c++) {
            if (grid[r][c] === 1) {
                treeCells.push([r, c]);
            }
        }
    }
    if (treeCells.length > 0) {
        const [randomRow, randomCol] = treeCells[Math.floor(Math.random() * treeCells.length)];
        grid[randomRow][randomCol] = 2;
    }
}

function spreadFire() {
    const newGrid = Array.from({ length: rows }, () => Array.from({ length: collumns }, () => 0));

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < collumns; c++) {
            const cell = grid[r][c];
            if (cell === 2) {
                newGrid[r][c] = 3; // burning becomes burned
                // Spread fire to all 8 neighbors if they are trees
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue; // skip self
                        const nr = r + dr;
                        const nc = c + dc;
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < collumns) {
                            if (grid[nr][nc] === 1) {
                                newGrid[nr][nc] = 2; // tree becomes burning
                            }
                        }
                    }
                }
            } else if (cell === 3) {
                newGrid[r][c] = 0; // burned becomes empty
            } else if (cell === 1 && newGrid[r][c] !== 2) {
                newGrid[r][c] = 1; // keep as tree unless set to burning above
            } else if (cell === 0) {
                newGrid[r][c] = 0; // empty stays empty
            }
        }
    }

    grid = newGrid;
    drawGrid();
}

function startSim() {
    if (simInterval) clearInterval(simInterval);

    drawGrid();

    const speed = Number(speedRange.value);
    simInterval = setInterval(() => {
        growTree();
        spreadFire();
        if (Math.random() < Number(igniteRange.value)) {
            startFire();
        }
    }, speed);
}

function growTree(){
     for (let r = 0; r < rows; r++) {
        for (let c = 0; c < collumns; c++) {
            if (grid[r][c] === 0 && Math.random() < speedRange.value / 1000) {
                grid[r][c] = 1;
            }
        }
     }
}

function stopSim() {
  if (simInterval) {
    clearInterval(simInterval);
    simInterval = null;
  }
}

initializeGrid(gridSizeRange.value);
updateControlLabels();
drawGrid();
startSim();