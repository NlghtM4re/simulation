const windDirectionSlider = document.getElementById('windDirection');
const windDirectionValue = document.getElementById('windDirectionValue');
const windFlickerStrengthRange = document.getElementById('windFlickerStrengthRange');
const windFlickerStrength = document.getElementById('windFlickerStrength');
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
const windRange = document.getElementById('windRange');
const windValue = document.getElementById('windValue');
const cellSize = 10;

let windDirection = 0;
let windDirectionDeg = 0;
let growInterval = null;
let lightningAccumulator = 0;
let drift = 0;
let collumns = Number(gridSizeRange.value);
let rows = Number(gridSizeRange.value);
let simInterval = null;
let grid = [];

Object.defineProperty(window, 'windStrength', {
    get() { return Number(windRange.value); },
    configurable: true
});

Object.defineProperty(window, 'windFlickerStrength', {
    get() { return Number(windFlickerStrengthRange.value); },
    configurable: true
});

function updateWindFlickerStrengthLabel() {
    windFlickerStrength.textContent = windFlickerStrengthRange.value + '°';
}
windFlickerStrengthRange.addEventListener('input', updateWindFlickerStrengthLabel);

updateWindFlickerStrengthLabel();

speedRange.addEventListener('input', () => {
    updateControlLabels();
    if (simInterval) {
        startSim();
    }
});

windRange.addEventListener('input', () => {
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

windDirectionSlider.addEventListener('input', () => {
    if (customWindToggle.checked) {
        setWindDirection(Number(windDirectionSlider.value));
    }
});

windDirectionSlider.addEventListener('input', () => {
    windDirectionValue.textContent = windDirectionSlider.value + '°';
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

function getWindVector() {
    const rad = windDirectionDeg * Math.PI / 180;
    return { x: Math.sin(rad), y: -Math.cos(rad) };
}

function setWindDirection(degrees) {
    windDirectionDeg = degrees;
    // Update compass needle
    const needle = document.getElementById('compassNeedle');
    if (needle) {
        needle.style.transform = `translate(-50%, -90%) rotate(${degrees}deg)`;
    }
}

function randomWindDirection() {
    const randomDeg = windDirectionDeg + (Math.random() * 360 - 45);
    setWindDirection(randomDeg);
}

function updateControlLabels() {
    speedValue.textContent = `${speedRange.value} ms`;
    igniteProb.textContent = Number(igniteRange.value).toFixed(2);
    gridSizeValue.textContent = `${gridSizeRange.value} x ${gridSizeRange.value}`;
    growSpeedValue.textContent = `${growSpeedRange.value} ms`; 
    windValue.textContent = Number(windRange.value).toFixed(2);
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
    const windStrength = Number(windRange.value); // 0 to 1
    const windVec = getWindVector();

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < collumns; c++) {
            const cell = grid[r][c];
            if (cell === 2) {
                newGrid[r][c] = 3;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue; // skip self
                        const nr = r + dr;
                        const nc = c + dc;
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < collumns) {
                            if (grid[nr][nc] === 1) {
                                // Wind bias: boost spread chance in wind direction
                                let spreadProb = 1;
                                if (windStrength > 0 && (dr !== 0 || dc !== 0)) {
                                    // Direction vector from fire to neighbor
                                    const dirLen = Math.sqrt(dr*dr + dc*dc);
                                    const dirX = dc / dirLen;
                                    const dirY = dr / dirLen;
                                    // Dot product with wind vector
                                    const dot = dirX * windVec.x + dirY * windVec.y;
                                    // If aligned with wind, boost probability
                                    if (dot > 0.7) spreadProb += windStrength * 2; // strong boost if close to wind
                                    else if (dot > 0.3) spreadProb += windStrength; // moderate boost
                                    else if (dot < -0.7) spreadProb -= windStrength * 0.7; // against wind, reduce
                                }
                                if (Math.random() < spreadProb) {
                                    newGrid[nr][nc] = 2;
                                }
                            }
                        }
                    }
                }
            } else if (cell === 3) {
                newGrid[r][c] = 4;
            } else if (cell === 4) {
                newGrid[r][c] = 5; 
            } else if (cell === 5) {
                newGrid[r][c] = 0; 
            }else if (cell === 1 && newGrid[r][c] !== 2) {
                newGrid[r][c] = 1;
            } else if (cell === 0) {
                newGrid[r][c] = 0;
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

    lightningAccumulator = 0;

    simInterval = setInterval(() => {
        spreadFire();
        if (flickeringWindToggle.checked) {
            const flicker = Number(windFlickerStrengthRange.value);
            setWindDirection(windDirectionDeg + (Math.random() * flicker - flicker / 2));
        }
        // Lightning accumulator method for consistent strikes per second
        const baseLightningProb = Number(igniteRange.value); // per second
        lightningAccumulator += baseLightningProb * (fireSpeed / 1000);
        while (lightningAccumulator >= 1) {
            startFire();
            lightningAccumulator -= 1;
        }
        // Small chance for fractional part
        if (Math.random() < lightningAccumulator) {
            startFire();
            lightningAccumulator = 0;
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
randomWindDirection();
drawGrid();
startSim();