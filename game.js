const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Optimized for iPhone 14 Pro Max display
canvas.width = 430;
canvas.height = 932;

// --- Game State ---
let gameState = 'waiting';
let playerChar = 'MOCHKIL'; 
let marketShare = 50; 
let mentalLevel = 0;
let boxes = [];
let thrownPuffs = [];
let isMuted = true;
let lastThrowTime = 0;

// --- Audio ---
let bgMusic = new Audio('cereal_wars.mp3'); 
bgMusic.loop = true;

// Mute Toggle Logic
document.getElementById('muteToggle').addEventListener('click', (e) => {
    e.stopPropagation(); 
    isMuted = !isMuted;
    document.getElementById('soundStatus').innerText = isMuted ? "OFF" : "ON";
    bgMusic.muted = isMuted;
    if (!isMuted) bgMusic.play().catch(() => {});
});

// --- Asset Registry ---
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

// --- Entities ---
const player = { x: 175, y: 750, width: 80, height: 100, state: 'FLYING' }; // User
const enemy = { x: 150, y: 100, width: 100, height: 100, state: 'FLYING', dir: 1 }; // AI

// --- Core Functions ---
function startGame(choice) {
    playerChar = choice;
    gameState = 'playing';
    marketShare = 50; 
    mentalLevel = 0;
    boxes = []; 
    thrownPuffs = [];

    // Swap positions based on character
    if (playerChar === 'AZUL') {
        player.y = 100; // Human Azul at top
        enemy.y = 750;  // AI Mochkil at bottom
    } else {
        player.y = 750; // Human Mochkil at bottom
        enemy.y = 100;  // AI Azul at top
    }
    requestAnimationFrame(gameLoop);
}

function update() {
    if (gameState !== 'playing') return;

    // 1. AI Movement Logic
    enemy.x += 3 * enemy.dir;
    if (enemy.x > canvas.width - enemy.width || enemy.x < 0) enemy.dir *= -1;

    // 2. AI Attacks (Mochkil AI fires at Azul Player)
    if (playerChar === 'AZUL' && Math.random() > 0.98) {
        thrownPuffs.push({ x: enemy.x + 20, y: enemy.y, width: 60, height: 80, speed: 12, active: true });
    }

    // 3. Projectile Physics
    thrownPuffs.forEach((puff, pIndex) => {
        puff.y -= puff.speed; // Always fly upward
        
        let target = (playerChar === 'AZUL') ? player : enemy; // Collision target is always the one at the top (Azul)
        if (puff.x < target.x + target.width && puff.x + puff.width > target.x &&
            puff.y < target.y + target.height && puff.y + puff.height > target.y && puff.active) {
            
            puff.active = false;
            marketShare += 5; 
            mentalLevel += 2;
            thrownPuffs.splice(pIndex, 1);
        }
        if (puff.y < -100) thrownPuffs.splice(pIndex, 1);
    });

    // 4. Box Spawning and Interaction
    boxes.forEach((box, index) => {
        box.y += box.speed;
        
        // MOCHKIL ROLE: Catch normal boxes to sabotage them
        if (playerChar === 'MOCHKIL' && !box.isSabotaged) {
            if (player.x < box.x + box.width && player.x + player.width > box.x &&
                player.y < box.y + box.height && player.y + player.height > box.y) {
                box.isSabotaged = true;
                marketShare += 2; 
                mentalLevel += 5;
                if (typeof triggerShake === "function") triggerShake(200);
            }
        }

        // AZUL ROLE: Catch corrupted boxes to fix them
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

    // 5. Win/Loss Logic
    marketShare = Math.max(0, Math.min(100, marketShare));
    if (marketShare >= 100 || mentalLevel >= 200) {
        endGame('puffs_commercial.MP4', "MOCHKIL WINS - REALITY CONVERTED");
    } else if (marketShare <= 0) {
        endGame('8bit_azulo.mp4', "AZUL WINS - QUANTUM ORDER RESTORED");
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Azul (Check if Player or AI)
    let azulObj = (playerChar === 'AZUL') ? player : enemy;
    let azulSprite = azulObj.state === 'PATCHING' ? assets.holdingAzulo : assets.flyAzulo;
    ctx.drawImage(azulSprite, azulObj.x, azulObj.y, azulObj.width, azulObj.height);

    // Draw Mochkil (Check if Player or AI)
    let mochObj = (playerChar === 'MOCHKIL') ? player : enemy;
    ctx.drawImage(assets.mochkil, mochObj.x, mochObj.y, mochObj.width, mochObj.height);
    
    // Draw Mochkil's Hat based on Mental Level
    let hat = mentalLevel > 50 ? assets.beanie : assets.chefHat;
    ctx.drawImage(hat, mochObj.x + 10, mochObj.y - 30, 60, 50);

    // Draw Thrown Puffs
    thrownPuffs.forEach(p => ctx.drawImage(assets.puffsCereal, p.x, p.y, p.width, p.height));
    
    // Draw Falling Boxes
    boxes.forEach(b => ctx.drawImage(b.isSabotaged ? assets.boxCorrupted : assets.boxNormal, b.x, b.y, b.width, b.height));

    // Update UI Stats
    document.getElementById('score').innerText = Math.floor(marketShare);
    document.getElementById('rage').innerText = Math.floor(mentalLevel);
}

// --- End Game & Video Logic ---
function endGame(videoFile, msg) {
    gameState = 'over';
    
    const video = document.getElementById('endVideo');
    const credits = document.getElementById('creditsScreen');
    const skipBtn = document.getElementById('skipVideo');
    const winMsg = document.getElementById('winMessage');

    if (winMsg) winMsg.innerText = msg;
    
    // Stop background music
    bgMusic.pause();

    // Setup Video for iOS Handshake
    video.src = videoFile;
    video.style.display = 'block';
    video.muted = true; 
    video.setAttribute('playsinline', ''); 
    video.load();
    
    video.play().then(() => {
        if (skipBtn) skipBtn.style.display = 'block';
        
        // The Audio Fix: Unmute after playback has definitively started
        setTimeout(() => {
            if (!isMuted) {
                video.muted = false;
                video.volume = 1.0;
            }
        }, 150); 
    }).catch((error) => {
        console.log("Video Playback Error:", error);
        transitionToCredits();
    });

    const transitionToCredits = () => {
        video.pause();
        video.style.display = 'none';
        if (skipBtn) skipBtn.style.display = 'none';
        credits.style.display = 'flex';
        // Resume looping music for credits
        if (!isMuted) bgMusic.play().catch(() => {});
    };

    video.onended = transitionToCredits;
    if (skipBtn) skipBtn.onclick = transitionToCredits;
}

// --- Input Controls ---
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
            if (window.navigator.vibrate) window.navigator.vibrate(15);
        }
    }
}, { passive: false });

// --- Loops ---
function gameLoop() { 
    if (gameState === 'playing') { 
        update(); 
        draw(); 
        requestAnimationFrame(gameLoop); 
    } 
}

setInterval(() => {
    if (gameState === 'playing') {
        // Azul needs corrupted boxes to appear so he can fix them
        let sabotaged = (playerChar === 'AZUL') ? (Math.random() > 0.4) : false;
        boxes.push({ 
            x: Math.random() * (canvas.width - 60), 
            y: -80, 
            width: 60, 
            height: 80, 
            isSabotaged: sabotaged, 
            speed: 4 + Math.random() * 3 
        });
    }
}, 1000);
