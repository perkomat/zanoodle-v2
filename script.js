// --- KONSTANTE ---
const INITIAL_SPEED_MS = 550; 
const SPEED_INCREMENT_MS = 45; 
const SCORE_PER_FOOD = 1;      
const FOOD_COUNT = 3; 

const TILE_SIZE = 50; 
const BODY_WIDTH = TILE_SIZE * 0.95; 
const RELIEF_MARKER_RADIUS = TILE_SIZE * 0.45; 
const RELIEF_MARKER_COLOR = '#FDFD96'; 
const INTERPOLATION_STEPS = 6; 
const SWIPE_THRESHOLD = 20; 

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const gameOverMessage = document.getElementById('game-over-message');

let TILE_COUNT_X, TILE_COUNT_Y, gameLoopInterval;
let isPaused = true; // Začnemo pavzirano, dokler se ne naloži
let score = 0;
let snake = [];
let velocity = { x: 1, y: 0 };
let nextVelocity = { x: 1, y: 0 }; // DODANO: Preprečuje samomorilne obrate
let food = [];

// --- SLIKE ---
const headImage = new Image();
const foodImagesSrc = ['friedchicken.png', 'tatar.png', 'zan.png', 'por.png', 'harmonika.png', 'chilly.png', 'msg.png', 'nudli.png', 'potica.png', 'raznjic.png', 'gyoze.png', 'icetea.png', 'cebu.png', 'friedegg.png', 'ingver.png', 'gobe.png', 'musnica.png','biovino.png', 'chilioil.png', 'klobasa.png', 'burger2.png', 'hotdog.png', 'kraca.png', 'pivo.png',];

const loadedFoodImages = [];
let imagesLoadedCount = 0;

function imageLoaded() {
    imagesLoadedCount++;
    if (imagesLoadedCount === (1 + foodImagesSrc.length)) {
        isPaused = false;
        resetGame();
    }
}

headImage.onload = imageLoaded;
headImage.src = 'toni.png';
foodImagesSrc.forEach(src => {
    const img = new Image();
    img.onload = imageLoaded;
    img.src = src;
    loadedFoodImages.push(img);
});

// --- LOGIKA ---

function resizeCanvas() {
    let width = window.innerWidth;
    let height = window.innerHeight;
    const isMobile = width < 768;

    if (isMobile) {
        canvas.width = Math.floor(Math.min(width - 20, 400) / TILE_SIZE) * TILE_SIZE;
        canvas.height = Math.floor(Math.min(height - 120, 700) / TILE_SIZE) * TILE_SIZE;
    } else {
        let size = Math.floor(Math.min(width - 50, height - 150) / TILE_SIZE) * TILE_SIZE;
        canvas.width = size;
        canvas.height = size;
    }
    TILE_COUNT_X = canvas.width / TILE_SIZE;
    TILE_COUNT_Y = canvas.height / TILE_SIZE;
}

function resetGame() {
    resizeCanvas();
    snake = [{ x: Math.floor(TILE_COUNT_X / 2), y: Math.floor(TILE_COUNT_Y / 2) }];
    velocity = { x: 1, y: 0 };
    nextVelocity = { x: 1, y: 0 };
    score = 0;
    isPaused = false;
    scoreDisplay.textContent = `Točke: ${score}`;
    gameOverMessage.classList.add('hidden');
    food = [];
    placeFood();
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    gameLoopInterval = setInterval(gameLoop, INITIAL_SPEED_MS);
}

function placeFood() {
    while (food.length < FOOD_COUNT) {
        let newPos = {
            x: Math.floor(Math.random() * TILE_COUNT_X),
            y: Math.floor(Math.random() * TILE_COUNT_Y)
        };
        const collision = snake.some(s => s.x === newPos.x && s.y === newPos.y) || 
                          food.some(f => f.x === newPos.x && f.y === newPos.y);
        if (!collision) {
            food.push({ ...newPos, image: loadedFoodImages[Math.floor(Math.random() * loadedFoodImages.length)] });
        }
    }
}

function gameLoop() {
    if (isPaused) return;

    velocity = nextVelocity; // Dejansko posodobi smer šele ob premiku
    const newHead = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };

    // Trk z robom ali telesom
    if (newHead.x < 0 || newHead.x >= TILE_COUNT_X || newHead.y < 0 || newHead.y >= TILE_COUNT_Y ||
        snake.some((seg, index) => index !== 0 && seg.x === newHead.x && seg.y === newHead.y)) {
        endGame();
        return;
    }

    snake.unshift(newHead);
    const fIdx = food.findIndex(f => f.x === newHead.x && f.y === newHead.y);

    if (fIdx !== -1) {
        score += SCORE_PER_FOOD;
        scoreDisplay.textContent = `Točke: ${score}`;
        food.splice(fIdx, 1);
        placeFood();
        if (score % 10 === 0) adjustSpeed();
    } else {
        snake.pop();
    }
    draw();
}

function adjustSpeed() {
    const speedLevel = Math.floor(score / 10);
    const newInterval = Math.max(INITIAL_SPEED_MS - (speedLevel * SPEED_INCREMENT_MS), 60);
    clearInterval(gameLoopInterval);
    gameLoopInterval = setInterval(gameLoop, newInterval);
}

function endGame() {
    isPaused = true;
    clearInterval(gameLoopInterval);
    gameOverMessage.classList.remove('hidden');
}

// --- RISANJE ---

function draw() {
    // 1. Ozadje
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Hrana
    food.forEach(f => {
        ctx.drawImage(f.image, f.x * TILE_SIZE, f.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    });

    if (snake.length === 0) return;

    // 3. Risanje CEKINČKOV (od zadaj naprej)
    // Rišemo od zadnjega elementa (repa) proti prvemu (glavi)
    for (let i = snake.length - 1; i > 0; i--) {
        const current = snake[i];
        const next = snake[i - 1];

        // Interpolacija poskrbi, da so krogci gostejši in se lepo prekrivajo
        for (let j = 0; j < INTERPOLATION_STEPS; j++) {
            const factor = j / INTERPOLATION_STEPS;
            
            const x = (current.x + (next.x - current.x) * factor) * TILE_SIZE + TILE_SIZE / 2;
            const y = (current.y + (next.y - current.y) * factor) * TILE_SIZE + TILE_SIZE / 2;

            ctx.beginPath();
            ctx.arc(x, y, RELIEF_MARKER_RADIUS, 0, Math.PI * 2);
            
            // Polnilo (rumena barva)
            ctx.fillStyle = RELIEF_MARKER_COLOR; // #FDFD96
            ctx.fill();

            // ROB CEKINČKA (to ustvari videz prekrivanja)
            ctx.strokeStyle = '#000000'; // Črn rob
            ctx.lineWidth = 1.5;         // Debelina roba cekinčka
            ctx.stroke();
        }
    }

    // 4. Glava na koncu, da prekrije zadnji cekinček
    ctx.drawImage(headImage, snake[0].x * TILE_SIZE, snake[0].y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

// --- KONTROLE ---

document.addEventListener('keydown', (e) => {
    // Prepreči "back-tracking" (da se ne obrneš direktno v nasprotno smer)
    if ((e.key === 'ArrowUp' || e.key === 'w') && velocity.y === 0) nextVelocity = { x: 0, y: -1 };
    if ((e.key === 'ArrowDown' || e.key === 's') && velocity.y === 0) nextVelocity = { x: 0, y: 1 };
    if ((e.key === 'ArrowLeft' || e.key === 'a') && velocity.x === 0) nextVelocity = { x: -1, y: 0 };
    if ((e.key === 'ArrowRight' || e.key === 'd') && velocity.x === 0) nextVelocity = { x: 1, y: 0 };
    if (e.key === ' ' && isPaused) resetGame();
});

// Swipe logika (mobilni)
let tsX, tsY;
canvas.addEventListener('touchstart', e => {
    if(isPaused) resetGame();
    tsX = e.touches[0].clientX; tsY = e.touches[0].clientY;
}, {passive: false});

canvas.addEventListener('touchend', e => {
    let dx = e.changedTouches[0].clientX - tsX;
    let dy = e.changedTouches[0].clientY - tsY;
    if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > SWIPE_THRESHOLD && velocity.x === 0) nextVelocity = { x: dx > 0 ? 1 : -1, y: 0 };
    } else {
        if (Math.abs(dy) > SWIPE_THRESHOLD && velocity.y === 0) nextVelocity = { x: 0, y: dy > 0 ? 1 : -1 };
    }
});

// Namesto resetGame() na vsak resize, samo prilagodimo, če je nujno, ali pa ignoriramo med igro.
window.addEventListener('resize', () => { if(isPaused) resizeCanvas(); });