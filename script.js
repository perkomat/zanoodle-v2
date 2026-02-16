// --- KONSTANTE IN NASTAVITVE ---
const PUBLIC_KEY = "5fa8af5feb371a09c4c51d17"; // <--- VPISI SVOJ KLJUČ
const PRIVATE_KEY = "cgpr101Ep0yMn0IZPhMAqwVghoK20BG06c_rPh-i1Npg"; // <--- VPISI SVOJ KLJUČ

const INITIAL_SPEED_MS = 550; 
const SPEED_INCREMENT_MS = 45; 
const SCORE_PER_FOOD = 1;      
const FOOD_COUNT = 3; 

const TILE_SIZE = 50; 
const RELIEF_MARKER_RADIUS = TILE_SIZE * 0.45; 
const RELIEF_MARKER_COLOR = '#FDFD96'; 
const INTERPOLATION_STEPS = 6; 
const SWIPE_THRESHOLD = 20; 

// --- DOM ELEMENTI ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const startMenu = document.getElementById('start-menu');
const gameContainer = document.getElementById('game-container');
const leaderboardScreen = document.getElementById('leaderboard-screen');
const playerInput = document.getElementById('global-player-name');

// --- GLOBALNE SPREMENLJIVKE ---
let TILE_COUNT_X, TILE_COUNT_Y, gameLoopInterval;
let isPaused = true;
let score = 0;
let snake = [];
let velocity = { x: 1, y: 0 };
let nextVelocity = { x: 1, y: 0 };
let food = [];
let playerName = ""; // Ime se shrani tukaj za celo sejo
let selectedHeadSrc = "toni.png";
let headImage = new Image();

// --- SLIKE ---
const foodImagesSrc = [
    'friedchicken.png', 'tatar.png', 'zan.png', 'por.png', 'harmonika.png', 
    'chilly.png', 'msg.png', 'nudli.png', 'potica.png', 'raznjic.png', 
    'gyoze.png', 'icetea.png', 'cebu.png', 'friedegg.png', 'ingver.png', 
    'gobe.png', 'musnica.png', 'biovino.png', 'chilioil.png', 'klobasa.png', 
    'burger2.png', 'hotdog.png', 'kraca.png', 'pivo.png'
];

const loadedFoodImages = [];
let imagesLoadedCount = 0;

function imageLoaded() {
    imagesLoadedCount++;
}

// Inicialno nalaganje slik
foodImagesSrc.forEach(src => {
    const img = new Image();
    img.onload = imageLoaded;
    img.src = src;
    loadedFoodImages.push(img);
});

// --- NAVIGACIJA IN MENI ---

// Izbira glave v meniju
document.querySelectorAll('.player-option').forEach(opt => {
    opt.onclick = () => {
        document.querySelectorAll('.player-option').forEach(i => i.classList.remove('selected'));
        opt.classList.add('selected');
        selectedHeadSrc = opt.dataset.image;
    };
});

// Gumb IGRAJ
document.getElementById('play-btn').onclick = () => {
    const input = playerInput.value.trim();
    if (!input) {
        alert("Najprej vnesi svoje ime!");
        return;
    }
    playerName = input;
    headImage.src = selectedHeadSrc;
    
    // Preklop zaslonov
    startMenu.classList.add('hidden');
    leaderboardScreen.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    
    document.getElementById('player-tag').innerText = "Igralec: " + playerName;
    resetGame();
};

// Gumb SCOREBOARD (iz menija)
document.getElementById('score-btn').onclick = showLeaderboard;

// --- LOGIKA IGRE ---

function resizeCanvas() {
    let width = window.innerWidth;
    let height = window.innerHeight;
    const isMobile = width < 768;

    if (isMobile) {
        canvas.width = Math.floor(Math.min(width - 20, 400) / TILE_SIZE) * TILE_SIZE;
        canvas.height = Math.floor(Math.min(height - 150, 600) / TILE_SIZE) * TILE_SIZE;
    } else {
        let size = Math.floor(Math.min(width - 50, height - 200) / TILE_SIZE) * TILE_SIZE;
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

    velocity = nextVelocity;
    const newHead = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };

    if (newHead.x < 0 || newHead.x >= TILE_COUNT_X || newHead.y < 0 || newHead.y >= TILE_COUNT_Y ||
        snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
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
    
    // Samodejna oddaja rezultata z imenom iz seje
    fetch(`https://www.dreamlo.com/lb/${PRIVATE_KEY}/add/${encodeURIComponent(playerName)}/${score}`)
        .then(() => showLeaderboard());
}

// --- RISANJE ---

function draw() {
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    food.forEach(f => {
        ctx.drawImage(f.image, f.x * TILE_SIZE, f.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    });

    if (snake.length === 0) return;

    for (let i = snake.length - 1; i > 0; i--) {
        const current = snake[i];
        const next = snake[i - 1];

        for (let j = 0; j < INTERPOLATION_STEPS; j++) {
            const factor = j / INTERPOLATION_STEPS;
            const x = (current.x + (next.x - current.x) * factor) * TILE_SIZE + TILE_SIZE / 2;
            const y = (current.y + (next.y - current.y) * factor) * TILE_SIZE + TILE_SIZE / 2;

            ctx.beginPath();
            ctx.arc(x, y, RELIEF_MARKER_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = RELIEF_MARKER_COLOR;
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }
    ctx.drawImage(headImage, snake[0].x * TILE_SIZE, snake[0].y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

// --- SCOREBOARD LOGIKA ---

function showLeaderboard() {
    isPaused = true;
    startMenu.classList.add('hidden');
    gameContainer.classList.add('hidden');
    leaderboardScreen.classList.remove('hidden');

    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = "<tr><td colspan='2'>Nalagam...</td></tr>";

    fetch(`https://www.dreamlo.com/lb/${PUBLIC_KEY}/json`)
        .then(res => res.json())
        .then(data => {
            tbody.innerHTML = "";
            let list = data.dreamlo.leaderboard.entry;
            if (!list) return;

            const entries = Array.isArray(list) ? list : [list];
            entries.forEach(e => {
                const row = `<tr><td>${e.name}</td><td>${e.score}</td></tr>`;
                tbody.innerHTML += row;
            });
        })
        .catch(() => {
            tbody.innerHTML = "<tr><td colspan='2'>Napaka pri nalaganju.</td></tr>";
        });
}

// --- KONTROLE ---

document.addEventListener('keydown', (e) => {
    if ((e.key === 'ArrowUp' || e.key === 'w') && velocity.y === 0) nextVelocity = { x: 0, y: -1 };
    if ((e.key === 'ArrowDown' || e.key === 's') && velocity.y === 0) nextVelocity = { x: 0, y: 1 };
    if ((e.key === 'ArrowLeft' || e.key === 'a') && velocity.x === 0) nextVelocity = { x: -1, y: 0 };
    if ((e.key === 'ArrowRight' || e.key === 'd') && velocity.x === 0) nextVelocity = { x: 1, y: 0 };
});

// Swipe logika
let tsX, tsY;
canvas.addEventListener('touchstart', e => {
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

window.addEventListener('resize', () => { if(isPaused && !gameContainer.classList.contains('hidden')) resizeCanvas(); });