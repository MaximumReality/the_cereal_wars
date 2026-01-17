const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 430; canvas.height = 932;

let gameState = 'waiting';
let playerChar = 'MOCHKIL'; 
let marketShare = 50; 
let mentalLevel = 0;
let boxes = [];
let thrownPuffs = [];
let isMuted = true;
let lastThrowTime = 0;

let bgMusic = new Audio('cereal_war_theme.mp3'); 
bgMusic.loop = true;

document.getElementById('muteToggle').addEventListener('click', (e) => {
    e.stopPropagation(); 
    isMuted = !isMuted;
    document.getElementById('soundStatus').innerText = isMuted ? "OFF" : "ON";
    bgMusic.muted = isMuted;
    if (!isMuted) bgMusic.play().catch(() => {});
});

const assets = {
    mochkil: new Image(), beanie: new Image(), chefHat: new Image(),
    flyAzulo: new Image(), holdingAzulo: new Image(),
    boxNormal: new Image(), boxCorrupted: new Image(), puffsCereal: new Image()
};

assets.mochkil.src = 'thief_no_cereal.png';
assets.beanie.src = 'beanie.png';
assets.chefHat.src = 'chef-hat.png';
assets.flyAzulo.src = 'flyazulo.png';
assets.holdingAzulo.src = 'holding_azulos.png';
assets.boxNormal.src = 'azulos_special.png';
assets.boxCorrupted.src = 'azulos_corrupted.png';
assets.puffsCereal.src = 'puffs_cereal.png';

const player = { x: 175, y: 750, width: 80, height: 100 }; // The human player
const enemy = { x: 150, y: 100, width: 100, height: 100, state: 'FLYING', dir: 1 }; // The AI

function startGame(choice) {
    playerChar = choice;
    gameState = 'playing';
    marketShare = 50; mentalLevel = 0;
    boxes = []; thrownPuffs = [];

    if (playerChar === 'AZUL') {
        player.y = 100; // You are at the top
        enemy.y = 750;  // AI Mochkil at bottom
    } else {
        player.y = 750; // You are at bottom
        enemy.y = 100;  // AI Azul at top
    }
    requestAnimationFrame(gameLoop);
}

function update() {
    if (gameState !== 'playing') return;

    // 1. AI MOVEMENT
    enemy.x += 3 * enemy.dir;
    if (enemy.x > canvas.width - enemy.width || enemy.x < 0) enemy.dir *= -1;

    // 2. PROJECTILE LOGIC
    if (playerChar === 'AZUL') {
        // AI Mochkil throws at you periodically
        if (Math.random() > 0.98) {
            thrownPuffs.push({ x: enemy.x + 20, y: enemy.y, width: 60, height: 80, speed: 12, active: true });
        }
    }

    thrownPuffs.forEach((puff, pIndex) => {
        puff.y += (playerChar === 'AZUL') ? -puff.speed : -puff.speed; // Adjust based on who is at bottom
        
        // Check collision with the TOP character (Always Azul)
        let target = (playerChar === 'AZUL') ? player : enemy;
        if (puff.x < target.x + target.width && puff.x + puff.width > target.x &&
            puff.y < target.y + target.height && puff.y + puff.height > target.y && puff.active) {
            puff.active = false;
            marketShare += 5; // Mochkil scores
            mentalLevel += 2;
            thrownPuffs.splice(pIndex, 1);
        }
        if (puff.y < -100 || puff.y > canvas.height) thrownPuffs.splice(pIndex, 1);
    });

    // 3. FALLING BOXES LOGIC
    boxes.forEach((box, index) => {
        box.y += box.speed;
        
        // MOCHKIL ROLE: Catch normal boxes to sabotage them
        if (playerChar === 'MOCHKIL' && !box.isSabotaged) {
            if (player.x < box.x + box.width && player.x + player.width > box.x &&
                player.y < box.y + box.height && player.y + player.height > box.y) {
                box.isSabotaged = true;
                marketShare += 2; mentalLevel += 5;
                triggerShake(200);
            }
        }

        // AZUL ROLE: Catch corrupted boxes to FIX them
        if (playerChar === 'AZUL' && box.isSabotaged) {
            if (player.x < box.x + box.width && player.x + player.width > box.x &&
                player.y < box.y + box.height && player.y + player.height > box.y) {
                box.isSabotaged = false; // Fixed!
                marketShare -= 4; // Market share drops (Azul win path)
                player.state = 'PATCHING';
                setTimeout(() => player.state = 'FLYING', 300);
            }
        }
        
        if (box.y > canvas.height) boxes.splice(index, 1);
    });

    // 4. WIN/LOSS DETECTION
    marketShare = Math.max(0, Math.min(100, marketShare));
    if (marketShare >= 100 || mentalLevel >= 200) {
        endGame('puffs_commercial.MP4', "MOCHKIL WINS");
    } else if (marketShare <= 0) {
        endGame('8bit_azulo.mp4', "AZUL WINS");
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Azul (Check if player or AI)
    let azulObj = (playerChar === 'AZUL') ? player : enemy;
    let azulSprite = azulObj.state === 'PATCHING' ? assets.holdingAzulo : assets.flyAzulo;
    ctx.drawImage(azulSprite, azulObj.x, azulObj.y, azulObj.width, azulObj.height);

    // Draw Mochkil (Check if player or AI)
    let mochObj = (playerChar === 'MOCHKIL') ? player : enemy;
    ctx.drawImage(assets.mochkil, mochObj.x, mochObj.y, mochObj.width, mochObj.height);
    let hat = mentalLevel > 50 ? assets.beanie : assets.chefHat;
    ctx.drawImage(hat, mochObj.x + 10, mochObj.y - 30, 60, 50);

    thrownPuffs.forEach(p => ctx.drawImage(assets.puffsCereal, p.x, p.y, p.width, p.height));
    boxes.forEach(b => ctx.drawImage(b.isSabotaged ? assets.boxCorrupted : assets.boxNormal, b.x, b.y, b.width, b.height));

    document.getElementById('score').innerText = Math.floor(marketShare);
    document.getElementById('rage').innerText = Math.floor(mentalLevel);
}

function endGame(videoFile, msg) {
    gameState = 'over';
    document.getElementById('winMessage').innerText = msg;
    const video = document.getElementById('endVideo');
    video.src = videoFile;
    video.style.display = 'block';
    video.muted = true;
    video.play().then(() => { if (!isMuted) video.muted = false; }).catch(() => {
        video.style.display = 'none';
        document.getElementById('creditsScreen').style.display = 'flex';
    });
    video.onended = () => {
        video.style.display = 'none';
        document.getElementById('creditsScreen').style.display = 'flex'; 
    };
}

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
            thrownPuffs.push({ x: player.x + 10, y: player.y, width: 60, height: 80, speed: 12, active: true });
            lastThrowTime = now;
        }
    }
}, { passive: false });

setInterval(() => {
    if (gameState === 'playing') {
        // Occasionally spawn boxes already sabotaged for Azul to fix
        let sabotaged = (playerChar === 'AZUL') ? (Math.random() > 0.5) : false;
        boxes.push({ x: Math.random() * (canvas.width - 60), y: -80, width: 60, height: 80, isSabotaged: sabotaged, speed: 4 + Math.random() * 3 });
    }
}, 1000);

function gameLoop() { if (gameState === 'playing') { update(); draw(); requestAnimationFrame(gameLoop); } }
