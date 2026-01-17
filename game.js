const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 430;
canvas.height = 932;

let gameState = 'waiting';
let marketShare = 50; 
let mentalLevel = 0;
let boxes = [];
let thrownPuffs = []; // Mochkil's projectiles
let isMuted = true;
let bgMusic = new Audio('cereal_war_theme.mp3'); // Ensure file exists
bgMusic.loop = true;

// Mute Toggle Logic
document.getElementById('muteToggle').addEventListener('click', (e) => {
    e.stopPropagation(); // Prevents throwing a box when clicking the button
    isMuted = !isMuted;
    document.getElementById('soundStatus').innerText = isMuted ? "OFF" : "ON";
    bgMusic.muted = isMuted;
    if (!isMuted) bgMusic.play().catch(() => {});
});

const assets = {
    mochkil: new Image(),
    beanie: new Image(),
    chefHat: new Image(),
    badge: new Image(),
    flyAzulo: new Image(),
    holdingAzulo: new Image(),
    boxNormal: new Image(),     // Azulo's Box
    boxCorrupted: new Image()    // Mochkil's Puff Box
};

assets.mochkil.src = 'thief_no_cereal.png';
assets.beanie.src = 'beanie.png';
assets.chefHat.src = 'chef-hat.png';
assets.badge.src = 'credibility_badge.png';
assets.flyAzulo.src = 'flyazulo.png';
assets.holdingAzulo.src = 'holding_azulos.png';
assets.boxNormal.src = 'azulos_special.png';
assets.boxCorrupted.src = 'azulos_corrupted.png';

const player = { x: 175, y: 750, width: 80, height: 100 };
const azul = { x: 150, y: 100, width: 100, height: 100, state: 'FLYING', dir: 1 };

function startGame() {
    gameState = 'playing';
    marketShare = 50;
    mentalLevel = 0;
    boxes = [];
    thrownPuffs = [];
    requestAnimationFrame(gameLoop);
}

// Throwing Mechanic: Tap to launch
canvas.addEventListener('touchstart', (e) => {
    if (gameState !== 'playing') return;
    
    // Launch a Puff Box upward
    thrownPuffs.push({
        x: player.x + 10,
        y: player.y,
        width: 60,
        height: 80,
        speed: 10,
        active: true
    });
}, { passive: false });

function update() {
    if (gameState !== 'playing') return;

    // 1. Azul Movement (Side to side at top)
    azul.x += 2 * azul.dir;
    if (azul.x > canvas.width - azul.width || azul.x < 0) azul.dir *= -1;

    // 2. Update Thrown Puffs (Mochkil's Attack)
    thrownPuffs.forEach((puff, pIndex) => {
        puff.y -= puff.speed;
        
        // Check if Puff hits Azul
        if (puff.x < azul.x + azul.width && puff.x + puff.width > azul.x &&
            puff.y < azul.y + azul.height && puff.y + puff.height > azul.y && puff.active) {
            
            puff.active = false;
            marketShare += 5; // Direct Hit!
            mentalLevel += 2;
            azul.state = 'PATCHING';
            setTimeout(() => azul.state = 'FLYING', 500);
            thrownPuffs.splice(pIndex, 1);
        }
        if (puff.y < -100) thrownPuffs.splice(pIndex, 1);
    });

    // 3. Falling Azulo Boxes (Standard Sabotage)
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

    // Win/Loss
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

    // Azul
    let azulSprite = azul.state === 'PATCHING' ? assets.holdingAzulo : assets.flyAzulo;
    ctx.drawImage(azulSprite, azul.x, azul.y, azul.width, azul.height);

    // Thrown Puffs
    thrownPuffs.forEach(puff => {
        ctx.drawImage(assets.boxCorrupted, puff.x, puff.y, puff.width, puff.height);
    });

    // Falling Boxes
    boxes.forEach(box => {
        let sprite = box.isSabotaged ? assets.boxCorrupted : assets.boxNormal;
        ctx.drawImage(sprite, box.x, box.y, box.width, box.height);
    });
    
    // Mochkil & Hat
    ctx.drawImage(assets.mochkil, player.x, player.y, player.width, player.height);
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
    video.muted = isMuted; // Sync with your toggle
    video.setAttribute('playsinline', ''); 
    video.load();
    
    video.play().catch(() => {
        video.style.display = 'none';
        credits.style.display = 'flex';
    });
    
    video.onended = () => {
        video.style.display = 'none';
        credits.style.display = 'flex'; 
    };
}

// Logic for side-to-side movement
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    let touch = e.touches[0];
    let rect = canvas.getBoundingClientRect();
    let newX = (touch.clientX - rect.left) - (player.width / 2);
    player.x = Math.max(0, Math.min(canvas.width - player.width, newX));
}, { passive: false });

function gameLoop() {
    if (gameState === 'playing') {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

// Spawner for random falling boxes
setInterval(() => {
    if (gameState === 'playing') {
        boxes.push({
            x: Math.random() * (canvas.width - 60),
            y: -80,
            width: 60, height: 80,
            isSabotaged: false,
            speed: 4 + Math.random() * 3
        });
    }
}, 1000);
