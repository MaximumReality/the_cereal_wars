const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 430; canvas.height = 932;

let gameState = 'waiting';
let playerChar = 'MOCHKIL'; 
let marketShare = 50; 
let mentalLevel = 0;
let boxes = [];
let thrownProjectiles = []; // These will be the flying boxes
let isMuted = true;
let lastThrowTime = 0;

let bgMusic = new Audio('cereal_wars.mp3'); 
bgMusic.loop = true;

// Sound Toggle
document.getElementById('muteToggle').onclick = (e) => {
    isMuted = !isMuted;
    document.getElementById('soundStatus').innerText = isMuted ? "OFF" : "ON";
    bgMusic.muted = isMuted;
    if (!isMuted) bgMusic.play().catch(() => {});
};

// --- Assets ---
const assets = {
    mochkil: new Image(), 
    mochkilNPC: new Image(), // The cat holding the box
    flyAzulo: new Image(), 
    holdingAzulo: new Image(),
    boxNormal: new Image(),   // Azulo's Special
    boxCorrupted: new Image(), // The sabotaged/Mochkil Puffs box
    beanie: new Image(), 
    chefHat: new Image()
};

assets.mochkil.src = 'thief_no_cereal.png';
assets.mochkilNPC.src = 'mochkil_puffs.PNG'; 
assets.flyAzulo.src = 'flyazulo.png';
assets.holdingAzulo.src = 'holding_azulos.png';
assets.boxNormal.src = 'azulos_special.png';
assets.boxCorrupted.src = 'azulos_corrupted.png';
assets.beanie.src = 'beanie.png';
assets.chefHat.src = 'chef-hat.png';

const player = { x: 175, y: 750, width: 80, height: 100, state: 'FLYING' };
const enemy = { x: 150, y: 100, width: 100, height: 100, state: 'FLYING', dir: 1 };

function startGame(choice) {
    playerChar = choice;
    gameState = 'playing';
    marketShare = 50; mentalLevel = 0;
    boxes = []; thrownProjectiles = [];

    if (playerChar === 'AZUL') {
        player.y = 100; enemy.y = 750;
    } else {
        player.y = 750; enemy.y = 100;
    }
    requestAnimationFrame(gameLoop);
}

function update() {
    if (gameState !== 'playing') return;

    enemy.x += 3 * enemy.dir;
    if (enemy.x > canvas.width - enemy.width || enemy.x < 0) enemy.dir *= -1;

    // AI MOCHKIL: Throws BOXES at Azul
    if (playerChar === 'AZUL' && Math.random() > 0.98) {
        thrownProjectiles.push({ x: enemy.x + 20, y: enemy.y, width: 60, height: 80, speed: 12, active: true });
    }

    thrownProjectiles.forEach((proj, pIndex) => {
        proj.y -= proj.speed; 
        let target = (playerChar === 'AZUL') ? player : enemy;
        if (proj.x < target.x + target.width && proj.x + proj.width > target.x &&
            proj.y < target.y + target.height && proj.y + proj.height > target.y && proj.active) {
            proj.active = false;
            marketShare += 5; mentalLevel += 2;
            thrownProjectiles.splice(pIndex, 1);
        }
        if (proj.y < -100) thrownProjectiles.splice(pIndex, 1);
    });

    boxes.forEach((box, index) => {
        box.y += box.speed;
        if (playerChar === 'MOCHKIL' && !box.isSabotaged) {
            if (player.x < box.x + box.width && player.x + player.width > box.x &&
                player.y < box.y + box.height && player.y + player.height > box.y) {
                box.isSabotaged = true;
                marketShare += 2; mentalLevel += 5;
            }
        }
        if (playerChar === 'AZUL' && box.isSabotaged) {
            if (player.x < box.x + box.width && player.x + player.width > box.x &&
                player.y < box.y + box.height && player.y + player.height > box.y) {
                box.isSabotaged = false; 
                marketShare -= 4; 
                player.state = 'PATCHING';
                setTimeout(() => player.state = 'FLYING', 300);
            }
        }
        if (box.y > canvas.height) boxes.splice(index, 1);
    });

    marketShare = Math.max(0, Math.min(100, marketShare));
    if (marketShare >= 100 || mentalLevel >= 200) {
        gameState = 'over';
        endGame('puffs_commercial.MP4', "MOCHKIL WINS");
    } else if (marketShare <= 0) {
        gameState = 'over';
        endGame('8bit_azulo.MP4', "AZUL WINS");
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Azul
    let azulObj = (playerChar === 'AZUL') ? player : enemy;
    let azulSprite = azulObj.state === 'PATCHING' ? assets.holdingAzulo : assets.flyAzulo;
    ctx.drawImage(azulSprite, azulObj.x, azulObj.y, azulObj.width, azulObj.height);

    // Draw Mochkil
    let mochObj = (playerChar === 'MOCHKIL') ? player : enemy;
    let mochSprite = (playerChar === 'AZUL') ? assets.mochkilNPC : assets.mochkil;
    ctx.drawImage(mochSprite, mochObj.x, mochObj.y, mochObj.width, mochObj.height);
    
    let hat = mentalLevel > 50 ? assets.beanie : assets.chefHat;
    ctx.drawImage(hat, mochObj.x + 10, mochObj.y - 30, 60, 50);

    // DRAW THE FLYING BOXES (The Projectiles)
    thrownProjectiles.forEach(p => {
        // Use the Corrupted/Mochkil Puffs box as the projectile
        ctx.drawImage(assets.boxCorrupted, p.x, p.y, p.width, p.height);
    });
    
    // Draw Falling Neutral Boxes
    boxes.forEach(b => ctx.drawImage(b.isSabotaged ? assets.boxCorrupted : assets.boxNormal, b.x, b.y, b.width, b.height));

    document.getElementById('score').innerText = Math.floor(marketShare);
    document.getElementById('rage').innerText = Math.floor(mentalLevel);
}

function gameLoop() { 
    if (gameState === 'playing') { update(); draw(); requestAnimationFrame(gameLoop); } 
}

// Controls
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    let touch = e.touches[0];
    let rect = canvas.getBoundingClientRect();
    player.x = Math.max(0, Math.min(canvas.width - player.width, (touch.clientX - rect.left) - (player.width / 2)));
}, { passive: false });

canvas.addEventListener('touchstart', (e) => {
    if (gameState === 'playing' && playerChar === 'MOCHKIL') {
        const now = Date.now();
        if (now - lastThrowTime > 300) {
            thrownProjectiles.push({ x: player.x + 10, y: player.y, width: 60, height: 80, speed: 12, active: true });
            lastThrowTime = now;
        }
    }
}, { passive: false });

setInterval(() => {
    if (gameState === 'playing') {
        let sabotaged = (playerChar === 'AZUL') ? (Math.random() > 0.4) : false;
        boxes.push({ x: Math.random() * (canvas.width - 60), y: -80, width: 60, height: 80, isSabotaged: sabotaged, speed: 4 + Math.random() * 3 });
    }
}, 1000);
