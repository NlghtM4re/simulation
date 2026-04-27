const canvas = document.getElementById('wildfireCanvas');
const ctx = canvas.getContext('2d');
const speedRange = document.getElementById('speedRange');
const pRange = document.getElementById('pRange');
const gridSizeRange = document.getElementById('gridSize');
const denseTreeAmountRange = document.getElementById('denseTreeAmount');
const denseTreeDensityRange = document.getElementById('denseTreeDensity');
const riverWidthRange = document.getElementById('riverWidth');
const riverToggle = document.getElementById('riverToggle');
const speedValue = document.getElementById('speedValue');
const pValue = document.getElementById('pValue');
const gridSizeValue = document.getElementById('gridSizeValue');
const denseTreeAmountValue = document.getElementById('denseTreeAmountValue');
const denseTreeDensityValue = document.getElementById('denseTreeDensityValue');
const riverWidthValue = document.getElementById('riverWidthValue');

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

pRange.addEventListener('input', () => {
    updateControlLabels();
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

denseTreeAmountRange.addEventListener('input', () => {
    updateControlLabels();
});

denseTreeDensityRange.addEventListener('input', () => {
    updateControlLabels();
    const wasRunning = simInterval !== null;
    stopSim();
    initializeGrid(gridSizeRange.value);
    drawGrid();

    if (wasRunning) {
        startSim();
    }
});

riverWidthRange.addEventListener('input', () => {
    updateControlLabels();
    const wasRunning = simInterval !== null;
    stopSim();
    initializeGrid(gridSizeRange.value);
    drawGrid();

    if (wasRunning) {
        startSim();
    }
});

riverToggle.addEventListener('change', () => {
    const wasRunning = simInterval !== null;
    stopSim();
    initializeGrid(gridSizeRange.value);
    drawGrid();

    if (wasRunning) {
        startSim();
    }
});

function updateControlLabels() {
    speedValue.textContent = `${speedRange.value} ms`;
    pValue.textContent = Number(pRange.value).toFixed(2);
    gridSizeValue.textContent = `${gridSizeRange.value} x ${gridSizeRange.value}`;
    denseTreeAmountValue.textContent = denseTreeAmountRange.value;
    denseTreeDensityValue.textContent = denseTreeDensityRange.value;
    riverWidthValue.textContent = riverWidthRange.value;
}

function initializeGrid(size) {
    const parsedSize = Number(size);
    collumns = parsedSize;
    rows = parsedSize;

    canvas.width = cellSize * collumns;
    canvas.height = cellSize * rows;

    grid = Array.from({ length: rows }, () => Array.from({ length: collumns }, () => 1));

    const biomeCount = Number(denseTreeAmountRange.value);
    const density = Number(denseTreeDensityRange.value);
    const biomeSize = Math.floor((density / 100) * rows * collumns * 0.25) + Math.floor(rows * collumns * 0.04); // up to 25% of map per biome

    for (let b = 0; b < biomeCount; b++) {
        let seeds = [];
        let tries = 0;
        while (tries < 20) {
            const r = Math.floor(Math.random() * rows);
            const c = Math.floor(Math.random() * collumns);
            if (grid[r][c] === 1) {
                seeds.push([r, c]);
                grid[r][c] = 5;
                break;
            }
            tries++;
        }
        let filled = 1;
        while (filled < biomeSize && seeds.length > 0) {
            const [r, c] = seeds[Math.floor(Math.random() * seeds.length)];
            for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < collumns && grid[nr][nc] === 1) {
                    if (Math.random() < 0.15) {
                    } else {
                        grid[nr][nc] = 5;
                        seeds.push([nr, nc]);
                    }
                    filled++;
                    if (filled >= biomeSize) break;
                }
            }
            seeds = seeds.filter(([sr, sc]) => {
                for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                    const nr = sr + dr;
                    const nc = sc + dc;
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < collumns && grid[nr][nc] === 1) return true;
                }
                return false;
            });
        }
    }

    if (riverToggle.checked) {
        generateRiver();
    }
    drawGrid();
}

function generateRiver() {
    const directions = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1]
    ];

    function setWaterIfInBounds(r, c) {
        if (r >= 0 && r < rows && c >= 0 && c < collumns) {
            grid[r][c] = 4;
        }
    }

    function paintRiverWidth(r, c, width) {
        for (let dr = -width + 1; dr < width; dr++) {
            for (let dc = -width + 1; dc < width; dc++) {
                setWaterIfInBounds(r + dr, c + dc);
            }
        }
    }

    function getEdgePoint(side) {
        if (side === 0) {
            return { r: 0, c: Math.floor(Math.random() * collumns) };
        }
        if (side === 1) {
            return { r: Math.floor(Math.random() * rows), c: collumns - 1 };
        }
        if (side === 2) {
            return { r: rows - 1, c: Math.floor(Math.random() * collumns) };
        }
        return { r: Math.floor(Math.random() * rows), c: 0 };
    }

    let r;
    let c;

    function walkTo(targetR, targetC, width) {
        const maxSteps = rows * collumns;
        for (let step = 0; step < maxSteps; step++) {
            if (Math.abs(targetR - r) <= 1 && Math.abs(targetC - c) <= 1) {
                paintRiverWidth(targetR, targetC, width);
                r = targetR;
                c = targetC;
                break;
            }

            let dr = Math.sign(targetR - r);
            let dc = Math.sign(targetC - c);

            if (Math.random() < 0.35) {
                [dr, dc] = directions[Math.floor(Math.random() * directions.length)];
            }

            const nextR = Math.max(0, Math.min(rows - 1, r + dr));
            const nextC = Math.max(0, Math.min(collumns - 1, c + dc));

            r = nextR;
            c = nextC;
            paintRiverWidth(r, c, width);
        }
    }

    const startSide = Math.floor(Math.random() * 4);
    const endSide = Math.floor(Math.random() * 4);
    const start = getEdgePoint(startSide);
    const end = getEdgePoint(endSide);

    const riverWidth = Number(riverWidthRange.value);

    r = start.r;
    c = start.c;
    paintRiverWidth(r, c, riverWidth);

    if (startSide === endSide) {
        const waypointR = Math.floor(rows * 0.25 + Math.random() * rows * 0.5);
        const waypointC = Math.floor(collumns * 0.25 + Math.random() * collumns * 0.5);
        walkTo(waypointR, waypointC, riverWidth);
    }

    walkTo(end.r, end.c, riverWidth);

}
 
function drawGrid() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < collumns; c++) {
      const cell = grid[r][c];

      if (cell === 0) ctx.fillStyle = "#000000";   // dead
      if (cell === 1) ctx.fillStyle = "#3f7a36";   // tree
      if (cell === 2) ctx.fillStyle = "#ff6b2d";   // burning
      if (cell === 3) ctx.fillStyle = "#50382e";   // burned
      if (cell === 4) ctx.fillStyle = "#1e90ff";   // water
      if (cell === 5) ctx.fillStyle = "#174e0f";   // dense tree

      ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
    }
  }
}

function resetSim() {
    initializeGrid(gridSizeRange.value);
    stopSim();
    drawGrid();
}

function startFire() {
    const burnableCells = [];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < collumns; c++) {
            if (grid[r][c] === 1 || grid[r][c] === 5) {
                burnableCells.push([r, c]);
            }
        }
    }

    if (burnableCells.length === 0) {
        return;
    }

    const [randomRow, randomCol] = burnableCells[Math.floor(Math.random() * burnableCells.length)];
    grid[randomRow][randomCol] = 2;

}

function spreadFire() {
    const newGrid = Array.from({ length: rows }, () => Array.from({ length: collumns }, () => 0));

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < collumns; c++) {
            const cell = grid[r][c];
            const above = r > 0 && grid[r-1][c] === 2;
            const below = r < rows - 1 && grid[r+1][c] === 2;
            const left  = c > 0 && grid[r][c-1] === 2;
            const right = c < collumns - 1 && grid[r][c+1] === 2;

            if (cell === 2) {
                newGrid[r][c] = 3;
            } else if (cell === 3) {
                newGrid[r][c] = 0;
            } else if (cell === 1) {
                const spreadProbability = Number(pRange.value);
                const igniteFromAbove = above && Math.random() < spreadProbability;
                const igniteFromBelow = below && Math.random() < spreadProbability;
                const igniteFromLeft = left && Math.random() < spreadProbability;
                const igniteFromRight = right && Math.random() < spreadProbability;

                if (igniteFromAbove || igniteFromBelow || igniteFromLeft || igniteFromRight) {
                    newGrid[r][c] = 2;
                } else {
                    newGrid[r][c] = 1;
                }
            } else if (cell === 4) {
                newGrid[r][c] = 4;  
            } else if (cell === 5) {
                const spreadProbability = Number(pRange.value);
                const igniteFromAbove = above && Math.random() < spreadProbability;
                const igniteFromBelow = below && Math.random() < spreadProbability;
                const igniteFromLeft = left && Math.random() < spreadProbability;
                const igniteFromRight = right && Math.random() < spreadProbability;

                if (igniteFromAbove || igniteFromBelow || igniteFromLeft || igniteFromRight) {
                    // 50% chance to burn, 50% chance to downgrade to normal tree
                    if (Math.random() < 0.5) {
                        newGrid[r][c] = 2;  // Catches fire
                    } else {
                        newGrid[r][c] = 1;  // Becomes normal tree
                    }
                } else {
                    newGrid[r][c] = 5;
                }
            } else {
                newGrid[r][c] = 0;
            }
        }
    }

    grid = newGrid;
    drawGrid();

    const hasActiveFire = grid.some((row) => row.some((cell) => cell === 2));
}

function startSim() {
    if (simInterval) clearInterval(simInterval);

    drawGrid();
    const hasActiveFire = grid.some((row) => row.some((cell) => cell === 2));
    if (!hasActiveFire) {
        startFire();
        drawGrid();
    }

    const speed = Number(speedRange.value);
    simInterval = setInterval(() => {
        spreadFire();
    }, speed);
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