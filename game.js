const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const ghostImg = document.getElementById('ghostImg');
const jumpscareSound = document.getElementById('jumpscareSound');
const startScreen = document.querySelector('.start-screen');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Game variables
let score = 0;
let gameOver = false;
let gameStarted = false;
let obstacles = [];
let portals = [];
let obstacleSpeed = 3;
let obstacleSpawnRate = 1500;
let lastObstacleSpawn = 0;
let animationFrame = 0;
let jumpscareShown = false;
let cubeRotation = 0;

// Super Power variables
let superPowerAvailable = false;
let superPowerActive = true;
let superPowerTimeout = null;

// Player object (hacker)
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 32,
    speed: 4,
    color: '#0f0',
    glowSize: 40,
    pulseSize: 1,
    depth: 0
};

// Handle keyboard input
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    ' ': false, // Space key
    Enter: false // Enter key
};

// Start game with spacebar
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !gameStarted) {
        startScreen.style.display = 'none';
        gameStarted = true;
        resetGame();
    }
    if (e.code === 'Enter' && gameOver) {
        // Transition to ghost escape level
        window.location.href = 'ghost_escape.html';
    }
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
    }
    // Super Power activation
    if (e.code === 'Space' && superPowerAvailable && !superPowerActive && gameStarted && !gameOver) {
        activateSuperPower();
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});

function resetGame() {
    score = 0;
    gameOver = false;
    obstacles = [];
    portals = [];
    obstacleSpeed = 3;
    obstacleSpawnRate = 1500;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    superPowerAvailable = false;
    superPowerActive = false;
    if (superPowerTimeout) clearTimeout(superPowerTimeout);
    createPortal();
}

// Create virus obstacle
function createObstacle() {
    const size = Math.random() * 30 + 30;
    const x = Math.random() * (canvas.width - size);
    const y = Math.random() * (canvas.height - size);
    const speedX = (Math.random() - 0.5) * 4;
    const speedY = (Math.random() - 0.5) * 4;
    const depth = Math.random() * 100 - 50;

    obstacles.push({
        x,
        y,
        size,
        speedX,
        speedY,
        rotation: Math.random() * 360,
        depth,
        scale: 1,
        opacity: 0.8,
        glitch: Math.random() > 0.5
    });
}

// Create escape portal
function createPortal() {
    const size = 60;
    const x = Math.random() * (canvas.width - size);
    const y = Math.random() * (canvas.height - size);

    portals.push({
        x,
        y,
        size,
        rotation: 0,
        scale: 1
    });
}

// Update game state
function update() {
    if (!gameStarted || gameOver) return;

    // Super Power availability check
    if (score > 500 && !superPowerActive && !superPowerAvailable) {
        superPowerAvailable = true;
        // Optionally, show a message or effect to indicate super power is ready
    }

    // Update animation frame
    animationFrame++;
    cubeRotation += 0.5;
    player.pulseSize = 1 + Math.sin(animationFrame * 0.05) * 0.1;

    // Move player with 3D effect
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

    // Spawn obstacles
    const currentTime = Date.now();
    if (currentTime - lastObstacleSpawn > obstacleSpawnRate) {
        createObstacle();
        lastObstacleSpawn = currentTime;
        obstacleSpawnRate = Math.max(500, obstacleSpawnRate - 30);
        obstacleSpeed += 0.1;
    }

    // Update obstacles
    obstacles.forEach((obstacle, index) => {
        obstacle.x += obstacle.speedX;
        obstacle.y += obstacle.speedY;
        obstacle.rotation += 2;
        obstacle.depth += Math.sin(animationFrame * 0.05) * 0.5;

        if (obstacle.x <= 0 || obstacle.x + obstacle.size >= canvas.width) {
            obstacle.speedX *= -1;
        }
        if (obstacle.y <= 0 || obstacle.y + obstacle.size >= canvas.height) {
            obstacle.speedY *= -1;
        }

        if (!superPowerActive && checkCollision(player, obstacle)) {
            gameOver = true;
        }
        // If superPowerActive, player is invincible (no game over)
    });

    // Update portals
    portals.forEach((portal, index) => {
        portal.rotation += 1;
        portal.scale = 1 + Math.sin(animationFrame * 0.05) * 0.1;

        if (checkCollision(player, portal)) {
            score += 1000;
            portals.splice(index, 1);
            createPortal();
            obstacleSpeed += 0.5;
            // Redirect to Level 2 after reaching a portal with high score
            if (score >= 2000) {
                setTimeout(() => {
                    window.location.href = 'fight_level.html';
                }, 1000);
            }
        }
    });

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

    // Draw dark background with matrix effect
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw 3D cube effect
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(cubeRotation * Math.PI / 180);
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-200, -200, 400, 400);
    ctx.restore();

    // Draw matrix rain effect
    for (let i = 0; i < 30; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 40 + 20, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,255,0,0.03)';
        ctx.fill();
    }

    // Draw player (hacker)
    ctx.save();
    ctx.translate(player.x + player.size / 2, player.y + player.size / 2);
    const size = player.size * player.pulseSize;

    // Hacker glow
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    gradient.addColorStop(0, 'rgba(0, 255, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Hacker body with 3D effect
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Hacker face (binary eyes)
    ctx.beginPath();
    ctx.arc(-size / 6, -size / 8, size / 12, 0, Math.PI * 2);
    ctx.arc(size / 6, -size / 8, size / 12, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();

    // Binary code around player
    ctx.font = '10px monospace';
    ctx.fillStyle = '#0f0';
    ctx.fillText('1010', -size / 2, -size / 2);
    ctx.fillText('0101', size / 2, size / 2);
    ctx.restore();

    // Draw virus obstacles
    obstacles.forEach(obstacle => {
        ctx.save();
        ctx.translate(obstacle.x + obstacle.size / 2, obstacle.y + obstacle.size / 2);
        ctx.rotate(obstacle.rotation * Math.PI / 180);
        ctx.scale(obstacle.scale, obstacle.scale);

        // Virus glow
        const virusGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, obstacle.size);
        virusGradient.addColorStop(0, 'rgba(255, 0, 0, 0.3)');
        virusGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = virusGradient;
        ctx.beginPath();
        ctx.arc(0, 0, obstacle.size * 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Virus body with 3D effect
        ctx.beginPath();
        ctx.arc(0, 0, obstacle.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 0, 0, ${obstacle.opacity})`;
        ctx.shadowColor = '#f00';
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Virus details
        if (obstacle.glitch) {
            ctx.beginPath();
            ctx.moveTo(-obstacle.size / 2, -obstacle.size / 2);
            ctx.lineTo(obstacle.size / 2, obstacle.size / 2);
            ctx.strokeStyle = '#0f0';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.restore();
    });

    // Draw portals
    portals.forEach(portal => {
        ctx.save();
        ctx.translate(portal.x + portal.size / 2, portal.y + portal.size / 2);
        ctx.rotate(portal.rotation * Math.PI / 180);
        ctx.scale(portal.scale, portal.scale);

        // Portal glow
        const portalGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, portal.size);
        portalGradient.addColorStop(0, 'rgba(0, 255, 0, 0.5)');
        portalGradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
        ctx.fillStyle = portalGradient;
        ctx.beginPath();
        ctx.arc(0, 0, portal.size, 0, Math.PI * 2);
        ctx.fill();

        // Portal ring
        ctx.beginPath();
        ctx.arc(0, 0, portal.size / 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.restore();
    });

    if (gameOver) {
        // Darken the screen with glitch effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Glitch effect
        ctx.fillStyle = '#0f0';
        ctx.font = '48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SYSTEM BREACH', canvas.width / 2, canvas.height / 2);
        ctx.font = '24px monospace';
        ctx.fillText(`FINAL SCORE: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
        ctx.fillText('Press ENTER to enter the ghost realm...', canvas.width / 2, canvas.height / 2 + 80);

        if (!jumpscareShown) {
            jumpscareShown = true;
            setTimeout(() => {
                if (ghostImg) {
                    ghostImg.style.display = 'block';
                    ghostImg.style.opacity = '1';
                    ghostImg.style.transform = 'scale(1.2)';
                    ghostImg.style.transition = 'all 0.2s ease-out';

                    jumpscareSound.currentTime = 0;
                    jumpscareSound.play().catch(e => console.log('Sound play failed:', e));

                    setTimeout(() => {
                        ghostImg.style.opacity = '0';
                        ghostImg.style.transform = 'scale(1)';
                        setTimeout(() => {
                            ghostImg.style.display = 'none';
                        }, 200);
                    }, 1200);
                }
            }, 700);
        }
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Super Power activation function
function activateSuperPower() {
    superPowerActive = true;
    superPowerAvailable = false;
    // Visual feedback: make player glow stronger
    player.color = '#ff0'; // Yellow glow
    player.glowSize = 80;
    // Optionally, show a message or effect
    superPowerTimeout = setTimeout(() => {
        superPowerActive = false;
        player.color = '#0f0'; // Restore original color
        player.glowSize = 40;
    }, 30000); // 30 seconds
}

gameLoop(); 