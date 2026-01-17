const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State & Stats
let gameState = 'waiting';
let marketShare = 50; // Start at 50/50
let mentalLevel = 0;
let boxes = [];

// Image Assets
const sprites = {
    mochkil: new Image(),
    beanie: new Image(),
    chefHat: new Image(),
    azuloBox: new Image(),
    corruptedBox: new Image(),
    flyAzulo: new Image(),
    holdingAzulo: new Image(),
    badge: new Image()
};

// Map your filenames
sprites.mochkil.src = 'thief_no_cereal.png';
sprites.beanie.src = 'beanie.png';
sprites.chefHat.src = 'chef-hat.png';
sprites.azuloBox.src = 'azulos_special.png';
sprites.corruptedBox.src = 'azulos_corrupted.png';
sprites.flyAzulo.src = 'flyazulo.png';
sprites.holdingAzulo.src = 'holding_azulos.png';
sprites.badge.src = 'credibility_badge.png';

const player = { x: 150, y: 500, width: 80, height: 100, mode: 'NORMAL' };
const azul = { x: 100, y: 50, width: 90, height: 90, state: 'FLYING' };

// --- Game Logic ---

function spawnBox() {
    if (gameState !== 'playing') return;
    boxes.push({
        x: Math.random() * (canvas.width - 60),
        y: -50,
        isSabotaged: false,
        speed: 3 + (marketShare / 20)
    });
}
setInterval(spawnBox, 1200);

function update() {
    if (gameState !== 'playing') return;

    // Move Boxes
    boxes.forEach((box, index) => {
        box.y += box.speed;
        
        // Collision: Mochkil Sabotages the Box
        if (checkCollision(player, box) && !box.isSabotaged) {
            box.isSabotaged = true;
            marketShare += 5;
            mentalLevel += 15;
            triggerFlash('beanie'); // Quick beanie flash
        }
        
        // Remove off-screen boxes
        if (box.y > canvas.height) boxes.splice(index, 1);
    });

    // Azul's "Patching" AI
    if (Math.random() > 0.97) {
        azul.state = 'PATCHING';
        const target = boxes.find(b => b.isSabotaged);
        if (target) {
            target.isSabotaged = false;
            marketShare -= 10;
        }
        setTimeout(() => { azul.state = 'FLYING'; }, 600);
    }

    checkEndGame();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Azul
    const azulImg = azul.state === 'PATCHING' ? sprites.holdingAzulo : sprites.flyAzulo;
    ctx.drawImage(azulImg, azul.x, azul.y, azul.width, azul.height);

    // Draw Mochkil & Headwear
    ctx.drawImage(sprites.mochkil, player.x, player.y, player.width, player.height);
    if (mentalLevel > 70) {
        ctx.drawImage(sprites.beanie, player.x + 10, player.y - 20, 60, 40);
    } else {
        ctx.drawImage(sprites.chefHat, player.x + 10, player.y - 25, 60, 50);
    }

    // Draw Boxes
    boxes.forEach(box => {
        const img = box.isSabotaged ? sprites.corruptedBox : sprites.azuloBox;
        ctx.drawImage(img, box.x, box.y, 60, 80);
    });

    // UI Updates
    document.getElementById('score').innerText = marketShare;
    document.getElementById('rage').innerText = Math.min(mentalLevel, 100);
}

// Utility functions
function checkCollision(a, b) {
    return a.x < b.x + 60 && a.x + a.width > b.x && a.y < b.y + 80 && a.y + a.height > b.y;
}

function checkEndGame() {
    if (marketShare >= 100) playCommercial('puffs_commercial.mp4');
    if (marketShare <= 0) playCommercial('8bit_azulo.mp4');
}

// iPhone Touch Movement
canvas.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    player.x = touch.clientX - (player.width / 2);
}, { passive: false });

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}
gameLoop();
