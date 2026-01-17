const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 430;
canvas.height = 932;

let gameState = 'waiting';
let marketShare = 50; 
let mentalLevel = 0;
let boxes = [];

const assets = {
    mochkil: new Image(),
    beanie: new Image(),
    chefHat: new Image(),
    badge: new Image(),
    flyAzulo: new Image(),
    holdingAzulo: new Image(),
    flailAzulo: new Image(),
    boxNormal: new Image(),
    boxCorrupted: new Image(),
    thiefMochkil: new Image()
};

assets.mochkil.src = 'thief_no_cereal.png';
assets.beanie.src = 'beanie.png';
assets.chefHat.src = 'chef-hat.png';
assets.badge.src = 'credibility_badge.png';
assets.flyAzulo.src = 'flyazulo.png';
assets.holdingAzulo.src = 'holding_azulos.png';
assets.flailAzulo.src = 'flail.png';
assets.boxNormal.src = 'azulos_special.png';
assets.boxCorrupted.src = 'azulos_corrupted.png';
assets.thiefMochkil.src = 'thief_no_cereal.png';

const player = { x: 175, y: 750, width: 80, height: 100 };
const azul = { x: 150, y: 100, width: 100, height: 100, state: 'FLYING' };

function startGame() {
    gameState = 'playing';
    marketShare = 50;
    mentalLevel = 0;
    boxes = [];
    requestAnimationFrame(gameLoop);
}

setInterval(() => {
    if (gameState === 'playing') {
        boxes.push({
            x: Math.random() * (canvas.width - 60),
            y: -80,
            width: 60,
            height: 80,
            isSabotaged: false,
            speed: 4 + Math.random() * 3
        });
    }
}, 1000);

function update() {
    if (gameState !== 'playing') return;

    boxes.forEach((box, index) => {
        box.y += box.speed;
        if (player.x < box.x + box.width && player.x + player.width > box.x &&
            player.y < box.y + box.height && player.y + player.height > box.y) {
            if (!box.isSabotaged) {
                box.isSabotaged = true;
                marketShare += 2;
                mentalLevel += 5;
                if (typeof triggerShake === "function") triggerShake(200);
            }
        }
        if (box.y > canvas.height) boxes.splice(index, 1);
    });

    if (Math.random() > 0.98 && boxes.some(b => b.isSabotaged)) {
        azul.state = 'PATCHING';
        let target = boxes.find(b => b.isSabotaged);
        setTimeout(() => {
            if (target) {
                target.isSabotaged = false;
                marketShare -= 5;
            }
            azul.state = 'FLYING';
        }, 500);
    }

    // CLAMPING & WIN/LOSS CHECKS
    marketShare = Math.max(0, Math.min(100, marketShare));
    mentalLevel = Math.min(200, mentalLevel);

    if (marketShare >= 100 || mentalLevel >= 200) {
        endGame('puffs_commercial.MP4');
    } else if (marketShare <= 0) {
        endGame('8bit_azulo.mp4');
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Azul
    let azulSprite = azul.state === 'PATCHING' ? assets.holdingAzulo : assets.flyAzulo;
    ctx.drawImage(azulSprite, azul.x, azul.y, azul.width, azul.height);

    // 2. Draw Boxes
    boxes.forEach(box => {
        let sprite = box.isSabotaged ? assets.boxCorrupted : assets.boxNormal;
        ctx.drawImage(sprite, box.x, box.y, box.width, box.height);
    });
    
    // 3. Draw Mochkil
    ctx.drawImage(assets.mochkil, player.x, player.y, player.width, player.height);
    
    // 4. Draw Hat
    let hat = mentalLevel > 50 ? assets.beanie : assets.chefHat;
    ctx.drawImage(hat, player.x + 10, player.y - 30, 60, 50);

    document.getElementById('score').innerText = Math.floor(marketShare);
    document.getElementById('rage').innerText = Math.floor(mentalLevel);
}

function endGame(videoFile) {
    gameState = 'over';
    const video = document.getElementById('endVideo');
    const credits = document.getElementById('creditsScreen');
    video.src = videoFile;
    video.style.display = 'block';
    video.play();
    video.onended = () => {
        video.style.display = 'none';
        credits.style.display = 'flex'; 
    };
}

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    let touch = e.touches[0];
    let rect = canvas.getBoundingClientRect();
    let newX = (touch.clientX - rect.left) - (player.width / 2);
    // Keep Mochkil inside the screen
    player.x = Math.max(0, Math.min(canvas.width - player.width, newX));
}, { passive: false });

function gameLoop() {
    if (gameState === 'playing') {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}
