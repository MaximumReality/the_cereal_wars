const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas resolution for iPhone 14 Pro Max
canvas.width = 430;
canvas.height = 932;

// Game State & Variables
let gameState = 'waiting';
let marketShare = 50; 
let mentalLevel = 0;
let boxes = [];
let score = 0;

// Asset Registry
const assets = {
    mochkil: new Image(),
    beanie: new Image(),
    chefHat: new Image(),
    badge: new Image(),
    // Enemies
    flyAzulo: new Image(),      // Blue eyes
    holdingAzulo: new Image(),  // Azul patching
    flailAzulo: new Image(),    // Green glow
    // Boxes
    boxNormal: new Image(),     // azulos_special
    boxCorrupted: new Image(),  // azulos_corrupted
    // Endings
    thiefMochkil: new Image()   // Defeat sprite
};

// Mapping filenames provided
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

// Spawner: Drops Azulo's boxes from the top
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

    // 1. Update Boxes
    boxes.forEach((box, index) => {
        box.y += box.speed;

        // Collision detection: Mochkil hits a box
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

    // 2. Azul's "Patching" AI
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

    // 3. Victory/Defeat Checks
    if (marketShare >= 100) endGame('puffs_commercial.MP4');
    if (marketShare <= 0) endGame('8bit_azulo.mp4');
}
// Mental overload ending (prevents freeze)
if (mentalLevel >= 200) {
    mentalLevel = 200;
    endGame('puffs_commercial.mp4'); // or a custom mental ending
    return;
}
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Azul (Flying vs Patching)
    let azulSprite = azul.state === 'PATCHING' ? assets.holdingAzulo : assets.flyAzulo;
    ctx.drawImage(azulSprite, azul.x, azul.y, azul.width, azul.height);

    boxes.forEach(box => {
    let sprite;

    if (box.isSabotaged) {
        sprite = assets.boxCorrupted;
    } else {
        sprite = assets.boxNormal;
    }

    ctx.drawImage(
        sprite,
        box.x,
        box.y,
        box.width,
        box.height
    );
});
    
    // Draw Mochkil
    ctx.drawImage(assets.mochkil, player.x, player.y, player.width, player.height);
    
    // Hat Logic: Beanie if Mental, Chef Hat if cooling down
    let hat = mentalLevel > 50 ? assets.beanie : assets.chefHat;
    ctx.drawImage(hat, player.x + 10, player.y - 30, 60, 50);

    // Update UI
    document.getElementById('score').innerText = Math.floor(marketShare);
    document.getElementById('rage').innerText = Math.floor(mentalLevel);
}

function endGame(videoFile) {
    gameState = 'over';
    if (bgMusic) bgMusic.pause();

    const video = document.getElementById('endVideo');
    const credits = document.getElementById('creditsScreen');
    
    video.src = videoFile;
    video.style.display = 'block';
    video.play();
    
    video.onended = () => {
        video.style.display = 'none';
        // Show the credits instead of a direct reload
        credits.style.display = 'flex'; 
    };
}

// Mobile Touch Control
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    let touch = e.touches[0];
    let rect = canvas.getBoundingClientRect();
    player.x = (touch.clientX - rect.left) - (player.width / 2);
}, { passive: false });

function gameLoop() {
    if (gameState === 'playing') {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}
