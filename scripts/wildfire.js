const canvas = document.getElementById('wildfireCanvas');
const ctx = canvas.getContext('2d');
const speedRange = document.getElementById('speedRange');
const gridSizeRange = document.getElementById('gridSize');
const speedValue = document.getElementById('speedValue');
const gridSizeValue = document.getElementById('gridSizeValue');
const igniteProb = document.getElementById('igniteProb');
const igniteRange = document.getElementById('igniteRange');
const growSpeedRange = document.getElementById('growSpeedRange');
const growSpeedValue = document.getElementById('growSpeedValue');
let growInterval = null;

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

growSpeedRange.addEventListener('input', () => {
    updateControlLabels();
    if (growInterval) {
        startSim();
    }
});

function updateControlLabels() {
    speedValue.textContent = `${speedRange.value} ms`; // Updated to reflect new range
    igniteProb.textContent = Number(igniteRange.value).toFixed(2);
    gridSizeValue.textContent = `${gridSizeRange.value} x ${gridSizeRange.value}`;
    growSpeedValue.textContent = `${growSpeedRange.value} ms`; // Updated to reflect new range
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
      if (cell === 2) ctx.fillStyle = "#f38b5e";   // burning
      if (cell === 3) ctx.fillStyle = "#ff4d00";   // burning
      if (cell === 4) ctx.fillStyle = "#9e2a13";   // burning
      if (cell === 5) ctx.fillStyle = "#50382e";   // burned

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
    // Prevent starting a new fire if one is already burning
    const hasActiveFire = grid.some(row => row.some(cell => cell === 2));
    if (hasActiveFire) return;
    // Pause tree growth while fire is active
    if (growInterval) {
        clearInterval(growInterval);
        growInterval = null;
    }
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
                newGrid[r][c] = 3;
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
                newGrid[r][c] = 4; // burned becomes empty

            } else if (cell === 4) {
                newGrid[r][c] = 5; // burned becomes empty
            } else if (cell === 5) {
                newGrid[r][c] = 0; // burned becomes empty
            }else if (cell === 1 && newGrid[r][c] !== 2) {
                newGrid[r][c] = 1; // keep as tree unless set to burning above
            } else if (cell === 0) {
                newGrid[r][c] = 0; // empty stays empty
            }
        }
    }

    grid = newGrid;
    drawGrid();
    // After spreading, check if fire is out and resume tree growth if so
    const hasActiveFire = grid.some(row => row.some(cell => cell === 2));
    if (!hasActiveFire && !growInterval) {
        // Resume tree growth
        growInterval = setInterval(() => {
            growTree();
        }, Number(growSpeedRange.value));
    }
}

function startSim() {
    if (simInterval) clearInterval(simInterval);
    if (growInterval) clearInterval(growInterval);

    drawGrid();

    const fireSpeed = Number(speedRange.value);
    const treeSpeed = Number(growSpeedRange.value);

    simInterval = setInterval(() => {
        spreadFire();
        // Adjust lightning probability per tick to keep rate per second consistent
        const baseLightningProb = Number(igniteRange.value); // per second
        const lightningProbPerTick = 1 - Math.pow(1 - baseLightningProb, fireSpeed / 1000);
        if (Math.random() < lightningProbPerTick) {
            startFire();
        }
    }, fireSpeed);

    // Only start tree growth if there is no active fire
    const hasActiveFire = grid.some(row => row.some(cell => cell === 2));
    if (!hasActiveFire) {
        growInterval = setInterval(() => {
            growTree();
        }, treeSpeed);
    }
}

function growTree(){
    // Grow multiple trees per interval, scaling with grid size
    const emptyCells = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < collumns; c++) {
            if (grid[r][c] === 0) {
                emptyCells.push([r, c]);
            }
        }
    }
    // Growth factor: percent of grid to fill per interval (tweakable)
    const growthFactor = 0.005; // 0.5% of grid per interval
    const numToGrow = Math.max(1, Math.floor(collumns * rows * growthFactor));
    for (let i = 0; i < numToGrow && emptyCells.length > 0; i++) {
        const idx = Math.floor(Math.random() * emptyCells.length);
        const [randomRow, randomCol] = emptyCells.splice(idx, 1)[0];
        grid[randomRow][randomCol] = 1;
    }
}

function stopSim() {
    if (growInterval) {
        clearInterval(growInterval);
        growInterval = null;
    }
    if (simInterval) {
        clearInterval(simInterval);
        simInterval = null;
    }
}

initializeGrid(gridSizeRange.value);
updateControlLabels();
drawGrid();
startSim();