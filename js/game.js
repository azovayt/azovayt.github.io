// ================= SEED-BASED RANDOM =================
function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// ================= OYUN MANTIĞI =================
function scaleGame() {
  const wrapper = document.getElementById("game-wrapper");
  const scaleX = window.innerWidth / 1600;
  const scaleY = window.innerHeight / 1050;
  wrapper.style.transform = `scale(${Math.min(scaleX, scaleY) * 0.98})`;
}
window.addEventListener("resize", scaleGame);
window.addEventListener("load", scaleGame);
scaleGame();

const themes = {
  winter: { name: "Kış", seed: 1111, player: "⛷️", target: "🪙", obstacles: ["🧊"], boardBg: "#e3f2fd", cellBg: "#dcedc8", boardBorder: "#1976d2" },
  spring: { name: "İlkbahar", seed: 2222, player: "🐰", target: "🪙", obstacles: ["🌳"], boardBg: "#f1f8e9", cellBg: "#dcedc8", boardBorder: "#689f38" },
  summer: { name: "Yaz", seed: 3333, player: "🏃", target: "🪙", obstacles: ["🪨"], boardBg: "#fff8e1", cellBg: "#dcedc8", boardBorder: "#ffa000" },
  autumn: { name: "Sonbahar", seed: 4444, player: "🦊", target: "🪙", obstacles: ["🪵"], boardBg: "#fbe9e7", cellBg: "#dcedc8", boardBorder: "#e64a19" },
};

let currentTheme = null, currentLevel = 0, completedLevels = [];
const GRID_SIZE = 7;
const TOTAL_LEVELS = 10;

let player = { row: 6, col: 0 };
let targets = [];
let initialTargets = [];
let collectedCoins = 0;
let totalCoins = 0;
let obstacles = [], codeBlocks = [], isRunning = false, currentRepeat = 1;

function getCoinCount(lv) {
  if (lv < 3) return 1;
  if (lv < 6) return 2;
  return 3;
}

function setRepeat(num) {
  currentRepeat = num;
  document.querySelectorAll(".repeat-btn").forEach((btn) => {
    btn.classList.toggle("active", parseInt(btn.innerText) === num);
  });
}

function allTargetsReachable(startRow, startCol, targetsList, obs) {
  const visited = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));
  const queue = [[startRow, startCol]];
  visited[startRow][startCol] = true;
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const reached = new Set();

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    targetsList.forEach((t, idx) => {
      if (t.row === r && t.col === c) reached.add(idx);
    });
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE || visited[nr][nc]) continue;
      if (obs.some((o) => o.row === nr && o.col === nc)) continue;
      visited[nr][nc] = true;
      queue.push([nr, nc]);
    }
  }
  return reached.size === targetsList.length;
}

function getObstacleCount(lv) {
  if (lv < 3) return { min: 3, max: 5 };
  if (lv < 6) return { min: 5, max: 8 };
  if (lv < 9) return { min: 8, max: 12 };
  return { min: 12, max: 15 };
}

function generateSolvableLevel(theme) {
  const pp = { row: 6, col: 0 };
  const range = getObstacleCount(currentLevel);
  const coinCount = getCoinCount(currentLevel);

  for (let a = 0; a < 100; a++) {
    const seed = theme.seed * 10000 + (currentLevel + 1) * 100 + a;
    let rng = seed;
    const nextRandom = () => { rng++; return seededRandom(rng); };

    const newTargets = [];
    let targetAttempts = 0;
    while (newTargets.length < coinCount && targetAttempts < 200) {
      targetAttempts++;
      const tr = Math.floor(nextRandom() * GRID_SIZE);
      const tc = Math.floor(nextRandom() * GRID_SIZE);
      if (tr === pp.row && tc === pp.col) continue;
      if (newTargets.some((t) => t.row === tr && t.col === tc)) continue;
      newTargets.push({ row: tr, col: tc });
    }

    const num = Math.floor(nextRandom() * (range.max - range.min + 1)) + range.min;
    const obs = [];
    let oa = 0;
    while (obs.length < num && oa < 300) {
      oa++;
      const or2 = Math.floor(nextRandom() * GRID_SIZE);
      const oc = Math.floor(nextRandom() * GRID_SIZE);
      if (or2 === pp.row && oc === pp.col) continue;
      if (newTargets.some((t) => t.row === or2 && t.col === oc)) continue;
      if (obs.some((o) => o.row === or2 && o.col === oc)) continue;
      obs.push({ row: or2, col: oc, emoji: theme.obstacles[0] });
    }

    if (allTargetsReachable(pp.row, pp.col, newTargets, obs)) {
      return { player: pp, targets: newTargets, obstacles: obs };
    }
  }
  return { player: pp, targets: [{ row: 0, col: 6 }], obstacles: [] };
}

function startTheme(theme) {
  currentTheme = theme;
  currentLevel = 0;
  completedLevels = [];
  document.getElementById("homeScreen").style.display = "none";
  document.getElementById("gameScreen").classList.add("active");
  loadLevel();
}

function goHome() {
  document.getElementById("gameScreen").classList.remove("active");
  document.getElementById("homeScreen").style.display = "flex";
}

function goHomeFromComplete() {
  document.getElementById("gameCompleteModal").classList.remove("active");
  goHome();
}

function loadLevel() {
  const theme = themes[currentTheme], data = generateSolvableLevel(theme);
  player = { ...data.player };
  targets = data.targets.map((t) => ({ ...t }));
  initialTargets = data.targets.map((t) => ({ ...t }));
  obstacles = data.obstacles;
  collectedCoins = 0;
  totalCoins = targets.length;
  codeBlocks = [];
  currentRepeat = 1;
  setRepeat(1);
  document.getElementById("themeDisplay").innerText = theme.name;
  const board = document.getElementById("board");
  board.style.background = theme.boardBg;
  board.style.borderColor = theme.boardBorder;
  updateLevelIndicator();
  updateCoinCounter();
  renderWorkspace();
  drawBoard();
}

function updateCoinCounter() {
  document.getElementById("coinCount").innerText = `${collectedCoins}/${totalCoins}`;
}

function updateLevelIndicator() {
  const ind = document.getElementById("levelIndicator");
  ind.innerHTML = "";
  for (let i = 0; i < TOTAL_LEVELS; i++) {
    const d = document.createElement("div");
    d.className = "level-dot";
    if (completedLevels.includes(i)) d.classList.add("completed");
    else if (i === currentLevel) d.classList.add("current");
    ind.appendChild(d);
  }
  document.getElementById("levelText").innerText = `Seviye ${currentLevel + 1}/${TOTAL_LEVELS}`;
}

function nextLevel() {
  document.getElementById("levelCompleteModal").classList.remove("active");
  if (currentLevel < TOTAL_LEVELS - 1) {
    currentLevel++;
    loadLevel();
  } else {
    document.getElementById("gameCompleteModal").classList.add("active");
  }
}

function showLevelComplete() {
  if (!completedLevels.includes(currentLevel)) completedLevels.push(currentLevel);
  updateLevelIndicator();
  const m = document.getElementById("levelCompleteModal");
  document.getElementById("modalText").innerText =
    currentLevel < TOTAL_LEVELS - 1 ? `Seviye ${currentLevel + 1} tamamlandı!` : "Son seviyeyi tamamladın! 🏆";
  m.classList.add("active");
}

function showFailModal(icon, message) {
  document.getElementById("failIcon").innerText = icon;
  document.getElementById("failText").innerText = message;
  document.getElementById("failModal").classList.add("active");
}

function retryLevel() {
  document.getElementById("failModal").classList.remove("active");
  player = { row: 6, col: 0 };
  targets = initialTargets.map((t) => ({ ...t }));
  collectedCoins = 0;
  updateCoinCounter();
  codeBlocks = [];
  renderWorkspace();
  drawBoard();
}

function drawBoard() {
  const el = document.getElementById("board");
  el.innerHTML = "";
  const theme = themes[currentTheme];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.style.background = theme.cellBg;
      if (player.row === r && player.col === c) {
        cell.innerHTML = theme.player;
        cell.classList.add("start-pos");
      } else if (targets.some((t) => t.row === r && t.col === c)) {
        cell.innerHTML = theme.target;
        cell.classList.add("target");
      } else {
        const ob = obstacles.find((o) => o.row === r && o.col === c);
        if (ob) {
          cell.innerHTML = ob.emoji;
          cell.classList.add("obstacle");
        }
      }
      el.appendChild(cell);
    }
  }
}

function addBlock(dir) {
  if (isRunning) return;
  codeBlocks.push({ direction: dir, repeat: currentRepeat });
  renderWorkspace();
}

function renderWorkspace() {
  const strip = document.getElementById("codeStrip");
  strip.innerHTML = "";
  if (codeBlocks.length === 0) {
    strip.innerHTML = '<div class="code-strip-empty">Yukarıdaki oklara tıklayarak kod ekle 👆</div>';
    return;
  }
  const arrows = { up: "⬆️", down: "⬇️", left: "⬅️", right: "➡️" };
  codeBlocks.forEach((b, i) => {
    const el = document.createElement("div");
    el.className = "code-block";
    el.innerHTML = arrows[b.direction];
    if (b.repeat > 1) {
      const badge = document.createElement("div");
      badge.className = "repeat-badge";
      badge.innerText = b.repeat;
      el.appendChild(badge);
    }
    el.onclick = () => {
      if (!isRunning) {
        codeBlocks.splice(i, 1);
        renderWorkspace();
      }
    };
    strip.appendChild(el);
  });
}

async function runCode() {
  if (isRunning || codeBlocks.length === 0) return;
  isRunning = true;
  const blocks = document.getElementById("codeStrip").querySelectorAll(".code-block");
  let bi = 0;
  for (let i = 0; i < codeBlocks.length; i++) {
    const block = codeBlocks[i];
    if (blocks[bi]) {
      blocks[bi].classList.add("running");
      blocks[bi].scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    for (let r = 0; r < block.repeat; r++) {
      let nr = player.row, nc = player.col;
      if (block.direction === "up") nr--;
      if (block.direction === "down") nr++;
      if (block.direction === "left") nc--;
      if (block.direction === "right") nc++;

      if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) {
        await sleep(500);
        if (blocks[bi]) blocks[bi].classList.remove("running");
        isRunning = false;
        showFailModal("🙈", "Oy! Duvara çarptım!<br>Kodlarını düzelt ve tekrar dene.");
        return;
      }

      if (obstacles.some((o) => o.row === nr && o.col === nc)) {
        await sleep(500);
        if (blocks[bi]) blocks[bi].classList.remove("running");
        isRunning = false;
        showFailModal("🚧", "Engele çarptım!<br>Engellerin etrafından dolaş.");
        return;
      }

      player.row = nr;
      player.col = nc;

      const coinIndex = targets.findIndex((t) => t.row === nr && t.col === nc);
      if (coinIndex !== -1) {
        targets.splice(coinIndex, 1);
        collectedCoins++;
        updateCoinCounter();
      }

      drawBoard();

      if (targets.length === 0) {
        await sleep(500);
        if (blocks[bi]) blocks[bi].classList.remove("running");
        isRunning = false;
        showLevelComplete();
        return;
      }
      await sleep(300);
    }
    if (blocks[bi]) blocks[bi].classList.remove("running");
    bi++;
  }

  if (targets.length > 0) {
    isRunning = false;
    showFailModal("🤔", `Kodların bitti ama ${targets.length} altın kaldı!<br>Kodlarına devam et.`);
  } else {
    isRunning = false;
  }
}

function resetGame() {
  if (isRunning) return;
  player = { row: 6, col: 0 };
  targets = initialTargets.map((t) => ({ ...t }));
  collectedCoins = 0;
  codeBlocks = [];
  renderWorkspace();
  drawBoard();
  updateCoinCounter();
}

function clearWorkspace() {
  if (isRunning) return;
  codeBlocks = [];
  renderWorkspace();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
