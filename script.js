// ---- Simple mini shooter (no external libs) ----
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// HUD and controls
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const overlay = document.getElementById('overlay');
const message = document.getElementById('message');
const restartBtn = document.getElementById('restart');

// Game settings
const GAME_TIME = 60;          // seconds
const PLAYER_SPEED = 400;      // pixels / second
const BULLET_SPEED = 800;      // pixels / second
const ENEMY_SPEED = 120;       // pixels / second
const ENEMY_SPAWN_INTERVAL = 0.8; // seconds
const SHOOT_COOLDOWN = 0.12;   // seconds

// Game state
let lastTime = 0;
let keys = {};
let bullets = [];
let enemies = [];
let score = 0;
let timeLeft = GAME_TIME;
let spawnTimer = 0;
let running = false; // Start as false to show start screen
let shootCooldown = 0;
let gameState = 'start'; // 'start', 'playing', 'ended'
let spacePressed = false; // Debounce spacebar

// Player object
// --- Load player image ---
const playerImg = new Image();
playerImg.src = 'imagecopy.png'; // make sure the image file is in same folder as this script
const player = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 60,
  w: 50,
  h: 50
};

// Ensure DOM is loaded before manipulating overlay
document.addEventListener('DOMContentLoaded', () => {
  if (overlay) {
    overlay.classList.add('hidden');
    console.log('Initial load: overlay hidden');
  } else {
    console.error('Overlay element not found');
  }
});

// --- Input handling ---
window.addEventListener('keydown', e => {
  e.preventDefault();
  keys[e.code] = true;
  if (e.code === 'Space' && !spacePressed && !running && (gameState === 'start' || gameState === 'ended')) {
    console.log('Starting game, state:', gameState);
    spacePressed = true;
    resetGame();
    overlay.classList.add('hidden');
    console.log('Overlay hidden on game start');
    gameState = 'playing';
  }
});

window.addEventListener('keyup', e => {
  e.preventDefault();
  keys[e.code] = false;
  if (e.code === 'Space') {
    spacePressed = false;
    console.log('Spacebar released');
  }
});

// Restart button
restartBtn.addEventListener('click', () => {
  console.log('Restart button clicked');
  resetGame();
  overlay.classList.add('hidden');
  console.log('Overlay hidden on restart');
  gameState = 'playing';
});

// --- Utility functions ---
function rectsIntersect(a, b) {
  // Add a small buffer to prevent overly sensitive collisions
  const buffer = 5;
  return (
    a.x + buffer < b.x + b.w &&
    a.x + a.w - buffer > b.x &&
    a.y + buffer < b.y + b.h &&
    a.y + a.h - buffer > b.y
  );
}

// --- Game actions ---
function spawnEnemy() {
  const size = 28 + Math.random() * 24;
  const x = Math.random() * (canvas.width - size);
  enemies.push({ x, y: -size, w: size, h: size, speed: ENEMY_SPEED + Math.random() * 40 });
}

function shoot() {
  if (shootCooldown <= 0 && running) {
    bullets.push({ x: player.x + player.w / 2 - 4, y: player.y - 10, w: 8, h: 12, speed: BULLET_SPEED });
    shootCooldown = SHOOT_COOLDOWN;
    console.log('Shooting');
  }
}
// --- Load background image ---
const bgImage = new Image();
let bgReady = false;

bgImage.onload = () => {
  bgReady = true;
  console.log('Background image loaded');
};

bgImage.src = 'background.jpg'; // make sure the file exists in your project folder

// --- Update / Draw loop ---
function update(dt) {
  if (!running) return;

  // Log timeLeft for debugging
  console.log('Time left:', timeLeft.toFixed(2), 'dt:', dt.toFixed(2));

  // Timer
  timeLeft -= dt;
  if (timeLeft <= 0) {
    timeLeft = 0;
    console.log('Timer ended, calling endGame(false)');
    endGame(false);
    return;
  }

  // Player movement
  if (keys['ArrowLeft'] || keys['KeyA']) player.x -= PLAYER_SPEED * dt;
  if (keys['ArrowRight'] || keys['KeyD']) player.x += PLAYER_SPEED * dt;
  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));

  // Shooting
  if ((keys['Space'] || keys['ArrowUp']) && shootCooldown <= 0) {
    shoot();
  }
  if (shootCooldown > 0) shootCooldown -= dt;

  // Update bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.y -= b.speed * dt;
    if (b.y + b.h < 0) bullets.splice(i, 1);
  }

  // Spawn enemies
  spawnTimer += dt;
  if (spawnTimer >= ENEMY_SPAWN_INTERVAL) {
    spawnTimer = 0;
    spawnEnemy();
  }

  // Update enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.y += e.speed * dt;
    if (e.y > canvas.height) {
      enemies.splice(i, 1);
    }
  }

  // Collisions: bullets vs enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    let hit = false;
    for (let j = bullets.length - 1; j >= 0; j--) {
      let b = bullets[j];
      if (rectsIntersect(e, b)) {
        enemies.splice(i, 1);
        bullets.splice(j, 1);
        score += 10;
        console.log('Score increased to:', score);
        hit = true;
        break;
      }
    }
    if (hit) continue;
    if (rectsIntersect(e, player)) {
      console.log('Enemy collision detected with player at:', e.y, 'Player y:', player.y);
      endGame(false);
      return;
    }
  }

  // Update HUD
  scoreEl.textContent = `Score: ${score}`;
  timerEl.textContent = `Time: ${Math.ceil(timeLeft)}`;

  // Win condition: Score >= 700
  if (score >= 700 && running) {
    console.log('Win condition met, score:', score);
    endGame(true);
    return;
  }
}

  function draw() {
     // Force overlay to stay hidden during gameplay
  if (running && !overlay.classList.contains('hidden')) {
    overlay.classList.add('hidden');
  }
  // --- Draw background ---
  if (bgReady) {
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

 

  // Draw start or end screen
  if (!running) {
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    if (gameState === 'start') {
      ctx.fillText('Press SPACE to Start', canvas.width / 2, canvas.height / 2);
    }
    return;
  }

  // --- Draw player (image) ---
  if (playerImg.complete) {
    ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
  } else {
    ctx.fillStyle = '#29a3ff';
    ctx.fillRect(player.x, player.y, player.w, player.h);
  }

  // --- Draw bullets ---
  ctx.fillStyle = '#8cd289';
  bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

  // --- Draw enemies ---
  ctx.fillStyle = '#e01616ff';
  enemies.forEach(e => {
    ctx.beginPath();
    ctx.arc(e.x + e.w / 2, e.y + e.h / 2, e.w / 2, 0, Math.PI * 2);
    ctx.fill();
  });
}
function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

// End game
function endGame(won) {
  if (!running) return; // Prevent multiple calls
  running = false;
  gameState = 'ended';
  console.log('Game ended, won:', won, 'Score:', score, 'Time left:', timeLeft);
  setTimeout(() => {
    message.textContent = won ? `You win! Score: ${score}` : `Game over! Score: ${score}`;
    overlay.classList.remove('hidden');
    console.log('Overlay shown');
  }, 500);
} 




// Reset
function resetGame() {
  console.log('Resetting game');
  bullets = [];
  enemies = [];
  score = 0;
  timeLeft = GAME_TIME;
  spawnTimer = 0;
  shootCooldown = 0;
  player.x = canvas.width / 2 - player.w / 2;
  running = true;
  gameState = 'playing';
  overlay.classList.add('hidden');
  console.log('Overlay hidden in resetGame');
}

// Handle canvas click for shooting
canvas.addEventListener('click', e => {
  e.preventDefault();
  if (running) {
    console.log('Canvas clicked, shooting');
    shoot();
  }
});

// Start the loop
requestAnimationFrame(loop); 

