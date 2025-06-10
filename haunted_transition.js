const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const jumpscareSound = document.getElementById('jumpscareSound');

// Set canvas to full screen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game variables
let score = 0;
let gameOver = false;
let gameStarted = false;
let spirits = [];
let obstacles = [];
let lastSpiritSpawn = 0;
let spiritSpawnRate = 3000;
let animationFrame = 0;

// Player object
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 40,
    baseSpeed: 5,
    speed: 5,
    color: '#fff',
    glowSize: 50,
    pulseSize: 1,
    depth: 0,
    rotation: 0,
    isBoosting: false,
    isSuperBoosting: false,
    isSlowing: false
};

// Spirit class
class Spirit {
    constructor() {
        this.size = Math.random() * 30 + 50;
        this.x = Math.random() * (canvas.width - this.size);
        this.y = Math.random() * (canvas.height - this.size);
        this.speed = Math.random() * 2 + 2;
        this.angle = Math.random() * Math.PI * 2;
        this.depth = Math.random() * 100 - 50;
        this.opacity = 0.7;
        this.rotation = Math.random() * 360;
        this.scale = 1;
        this.ghostlyTrail = [];
    }

    update() {
        // Move towards player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        this.angle = Math.atan2(dy, dx);

        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // Update effects
        this.rotation += 1;
        this.scale = 1 + Math.sin(Date.now() * 0.003) * 0.1;
        this.opacity = 0.7 + Math.sin(Date.now() * 0.002) * 0.3;
        this.depth += Math.sin(Date.now() * 0.001) * 0.5;

        // Update ghostly trail
        this.ghostlyTrail.unshift({ x: this.x, y: this.y, opacity: this.opacity });
        if (this.ghostlyTrail.length > 10) {
            this.ghostlyTrail.pop();
        }
    }

    draw() {
        // Draw ghostly trail
        this.ghostlyTrail.forEach((point, index) => {
            ctx.beginPath();
            ctx.arc(point.x + this.size / 2, point.y + this.size / 2,
                this.size / 2 * (1 - index * 0.1), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 0, 0, ${point.opacity * (1 - index * 0.1)})`;
            ctx.fill();
        });

        ctx.save();
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.scale(this.scale, this.scale);

        // Spirit glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        gradient.addColorStop(0, `rgba(255, 0, 0, ${this.opacity * 0.3})`);
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Spirit body
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 0, 0, ${this.opacity})`;
        ctx.shadowColor = '#f00';
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Spirit eyes
        ctx.beginPath();
        ctx.arc(-this.size / 6, -this.size / 8, this.size / 12, 0, Math.PI * 2);
        ctx.arc(this.size / 6, -this.size / 8, this.size / 12, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();

        ctx.restore();
    }
}

// Haunted House class
class HauntedHouse {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.size = 300;
        this.rotation = 0;
    }

    update() {
        this.rotation += 0.001;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // House glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        // House structure
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.lineWidth = 2;

        // Main building
        ctx.beginPath();
        ctx.rect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.stroke();

        // Roof
        ctx.beginPath();
        ctx.moveTo(-this.size / 2, -this.size / 2);
        ctx.lineTo(0, -this.size);
        ctx.lineTo(this.size / 2, -this.size / 2);
        ctx.stroke();

        // Windows
        for (let i = -1; i <= 1; i += 2) {
            for (let j = -1; j <= 1; j += 2) {
                ctx.beginPath();
                ctx.rect(i * this.size / 4, j * this.size / 4, this.size / 8, this.size / 8);
                ctx.stroke();
            }
        }

        ctx.restore();
    }
}

// Create haunted house
const hauntedHouse = new HauntedHouse();

// Handle keyboard input
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    ' ': false,
    'x': false,
    's': false,
    'a': false,
    'AltLeft': false
};

document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
    }
    if (e.key === 'Alt') {
        keys['AltLeft'] = true;
    }
    updatePlayerSpeed();
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
    if (e.key === 'Alt') {
        keys['AltLeft'] = false;
    }
    updatePlayerSpeed();
});

function updatePlayerSpeed() {
    player.speed = player.baseSpeed;
    player.isBoosting = false;
    player.isSuperBoosting = false;
    player.isSlowing = false;

    if (keys[' '] && keys['x']) {
        player.speed = player.baseSpeed * 2;
        player.isBoosting = true;
    }
    if (keys[' '] && keys['s']) {
        player.speed = player.baseSpeed * 3;
        player.isSuperBoosting = true;
    }
    if (keys['AltLeft'] && keys['a']) {
        player.speed = player.baseSpeed * 0.5;
        player.isSlowing = true;
    }
}

// Create spirit
function createSpirit() {
    spirits.push(new Spirit());
}

// Update game state
function update() {
    if (!gameStarted || gameOver) return;

    animationFrame++;
    player.pulseSize = 1 + Math.sin(animationFrame * 0.05) * 0.1;
    player.rotation = (animationFrame * 2) % 360;

    // Move player
    if (keys.ArrowUp && player.y > 0) {
        player.y -= player.speed;
        player.depth -= 0.5;
    }
    if (keys.ArrowDown && player.y < canvas.height - player.size) {
        player.y += player.speed;
        player.depth += 0.5;
    }
    if (keys.ArrowLeft && player.x > 0) {
        player.x -= player.speed;
        player.depth -= 0.5;
    }
    if (keys.ArrowRight && player.x < canvas.width - player.size) {
        player.x += player.speed;
        player.depth += 0.5;
    }

    // Spawn spirits
    const currentTime = Date.now();
    if (currentTime - lastSpiritSpawn > spiritSpawnRate) {
        createSpirit();
        lastSpiritSpawn = currentTime;
        spiritSpawnRate = Math.max(1000, spiritSpawnRate - 100);
    }

    // Update spirits
    spirits.forEach(spirit => {
        spirit.update();
        if (checkCollision(player, spirit)) {
            gameOver = true;
        }
    });

    // Update haunted house
    hauntedHouse.update();

    score += 1;
    scoreElement.textContent = score;
}

function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.size &&
        obj1.x + obj1.size > obj2.x &&
        obj1.y < obj2.y + obj2.size &&
        obj1.y + obj1.size > obj2.y;
}

// Draw game objects
function draw() {
    if (!gameStarted) return;

    // Draw dark background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw haunted house
    hauntedHouse.draw();

    // Draw floating spirits
    spirits.forEach(spirit => spirit.draw());

    // Draw player
    ctx.save();
    ctx.translate(player.x + player.size / 2, player.y + player.size / 2);
    ctx.rotate(player.rotation * Math.PI / 180);
    const size = player.size * player.pulseSize;

    // Player glow with speed effect
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    if (player.isSuperBoosting) {
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    } else if (player.isBoosting) {
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    } else if (player.isSlowing) {
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    } else {
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    }
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, size * (player.isSuperBoosting ? 2 : 1.5), 0, Math.PI * 2);
    ctx.fill();

    // Speed trail effect
    if (player.isBoosting || player.isSuperBoosting) {
        const trailLength = player.isSuperBoosting ? 3 : 2;
        for (let i = 1; i <= trailLength; i++) {
            ctx.beginPath();
            ctx.arc(-i * 10, 0, size / 2 * (1 - i * 0.2), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 - i * 0.1})`;
            ctx.fill();
        }
    }

    // Player body
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = player.isSuperBoosting ? 30 : 20;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Player details
    ctx.beginPath();
    ctx.arc(-size / 6, -size / 8, size / 12, 0, Math.PI * 2);
    ctx.arc(size / 6, -size / 8, size / 12, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();

    ctx.restore();

    // Add speed indicator
    if (player.isBoosting || player.isSuperBoosting || player.isSlowing) {
        ctx.fillStyle = '#f00';
        ctx.font = '16px monospace';
        ctx.textAlign = 'left';
        let speedText = '';
        if (player.isSuperBoosting) speedText = 'SUPER BOOST';
        else if (player.isBoosting) speedText = 'BOOST';
        else if (player.isSlowing) speedText = 'SLOW';
        ctx.fillText(speedText, 20, canvas.height - 20);
    }

    if (gameOver) {
        // Darken the screen
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Game over text
        ctx.fillStyle = '#f00';
        ctx.font = '48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SPIRIT CAUGHT', canvas.width / 2, canvas.height / 2);
        ctx.font = '24px monospace';
        ctx.fillText(`FINAL SCORE: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
        ctx.fillText('Press ENTER to continue...', canvas.width / 2, canvas.height / 2 + 80);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Start game
gameStarted = true;
gameLoop(); 