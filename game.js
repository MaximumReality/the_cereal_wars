const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 430; canvas.height = 932;

// --- Game State ---const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 430; canvas.height = 932;

// --- Game State ---
let gameState = 'waiting';
let playerChar = 'MOCHKIL'; 
let marketShare = 50; 
let mentalLevel = 0;
let boxes = [];
let thrownBoxes = []; 
let isMuted = true;
let lastThrowTime = 0;

// --- Audio Logic ---
let bgMusic = new Audio('cereal_wars.mp3'); 
bgMusic.loop = true;

// Fix for the Sound Button not responding
const muteToggle = document.getElementById('muteToggle');
if (muteToggle) {
    muteToggle.onclick = (e) => {
        e.preventDefault();
        isMuted = !isMuted;
        document.getElementById('soundStatus').innerText = isMuted ? "OFF" : "ON";
        bgMusic.muted = isMuted;
        if (!isMuted) {
            bgMusic.play().catch(() => console.log("User must interact first"));
        } else {
            bgMusic.pause();
        }
    };
}

// --- Asset Registry ---
const assets = {
    mochkilPlayer: new Image(), 
    mochkilNPC: new Image(),
    flyAzulo: new Image(), 
    holdingAzulo: new Image(),
    boxNormal: new Image(), 
    boxCorrupted: new Image(),
    beanie: new Image(), 
    chefHat: new Image()
};

// Character Assets
assets.mochkilPlayer.src = 'thief_no_cereal.png';
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
    marketShare = 50; 
    mentalLevel = 0;
    boxes = []; 
    thrownBoxes = [];

    if (playerChar === 'AZUL') {
        player.y = 100;
        enemy.y = 750;
    } else {
        player.y = 750;
        enemy.y = 100;
    }
    
    // Ensure the theme music loops properly when started
    if (!isMuted) bgMusic.play().catch(() => {});
    
    gameLoop(); 
}

function update() {
    if (gameState !== 'playing') return;

    enemy.x += 3 * enemy.dir;
    if (enemy.x > canvas.width - enemy.width || enemy.x < 0) enemy.dir *= -1;

    // NPC Throwing Logic
    if (playerChar === 'AZUL' && Math.random() > 0.97) {
        thrownBoxes.push({ x: enemy.x + 20, y: enemy.y, width: 60, height: 80, speed: 10, active: true });
    }

    thrownBoxes.forEach((box, bIndex) => {
        box.y -= box.speed;
        let target = (playerChar === 'AZUL') ? player : enemy;
        if (box.x < target.x + target.width && box.x + box.width > target.x &&
            box.y < target.y + target.height && box.y + box.height > target.y && box.active) {
            box.active = false;
            marketShare += 5; 
            mentalLevel += 3;
            thrownBoxes.splice(bIndex, 1);
        }
        if (box.y < -100) thrownBoxes.splice(bIndex, 1);
    });

    boxes.forEach((box, index) => {
        box.y += box.speed;
        if (playerChar === 'MOCHKIL' && !box.isSabotaged) {
            if (player.x < box.x + box.width && player.x + player.width > box.x &&
                player.y < box.y + box.height && player.y + player.height > box.y) {
                box.isSabotaged = true;
                marketShare += 2; mentalLevel += 5;
                if (typeof triggerShake === "function") triggerShake(200);
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
    // Fill background so we know canvas is working
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Characters
    let azulObj = (playerChar === 'AZUL') ? player : enemy;
    let azulSprite = azulObj.state === 'PATCHING' ? assets.holdingAzulo : assets.flyAzulo;
    ctx.drawImage(azulSprite, azulObj.x, azulObj.y, azulObj.width, azulObj.height);

    let mochObj = (playerChar === 'MOCHKIL') ? player : enemy;
    let mochSprite = (playerChar === 'AZUL') ? assets.mochkilNPC : assets.mochkilPlayer;
    ctx.drawImage(mochSprite, mochObj.x, mochObj.y, mochObj.width, mochObj.height);
    
    let hat = mentalLevel > 50 ? assets.beanie : assets.chefHat;
    ctx.drawImage(hat, mochObj.x + 10, mochObj.y - 30, 60, 50);

    // Draw Items
    thrownBoxes.forEach(box => {
        ctx.drawImage(assets.mochkilNPC, box.x, box.y, box.width, box.height);
    });
    boxes.forEach(b => {
        let img = b.isSabotaged ? assets.boxCorrupted : assets.boxNormal;
        ctx.drawImage(img, b.x, b.y, b.width, b.height);
    });

    // Update UI Stats
    document.getElementById('score').innerText = Math.floor(marketShare);
    document.getElementById('rage').innerText = Math.floor(mentalLevel);
}

function gameLoop() { 
    if (gameState === 'playing') { 
        update(); 
        draw(); 
        requestAnimationFrame(gameLoop); 
    } 
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
            thrownBoxes.push({ x: player.x + 10, y: player.y, width: 60, height: 80, speed: 12, active: true });
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

let gameState = 'waiting';
let playerChar = 'MOCHKIL'; 
let marketShare = 50; 
let mentalLevel = 0;
let boxes = [];
let thrownBoxes = []; 
let isMuted = true;
let lastThrowTime = 0;

// --- Audio Logic ---
let bgMusic = new Audio('cereal_wars.mp3'); 
bgMusic.loop = true;

// Fix for the Sound Button not responding
const muteToggle = document.getElementById('muteToggle');
if (muteToggle) {
    muteToggle.onclick = (e) => {
        e.preventDefault();
        isMuted = !isMuted;
        document.getElementById('soundStatus').innerText = isMuted ? "OFF" : "ON";
        bgMusic.muted = isMuted;
        if (!isMuted) {
            bgMusic.play().catch(() => console.log("User must interact first"));
        } else {
            bgMusic.pause();
        }
    };
}

// --- Asset Registry ---
const assets = {
    mochkilPlayer: new Image(), 
    mochkilNPC: new Image(),
    flyAzulo: new Image(), 
    holdingAzulo: new Image(),
    boxNormal: new Image(), 
    boxCorrupted: new Image(),
    beanie: new Image(), 
    chefHat: new Image()
};

// Character Assets
assets.mochkilPlayer.src = 'thief_no_cereal.png';
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
    marketShare = 50; 
    mentalLevel = 0;
    boxes = []; 
    thrownBoxes = [];

    if (playerChar === 'AZUL') {
        player.y = 100;
        enemy.y = 750;
    } else {
        player.y = 750;
        enemy.y = 100;
    }
    
    // Ensure the theme music loops properly when started
    if (!isMuted) bgMusic.play().catch(() => {});
    
    gameLoop(); 
}

function update() {
    if (gameState !== 'playing') return;

    enemy.x += 3 * enemy.dir;
    if (enemy.x > canvas.width - enemy.width || enemy.x < 0) enemy.dir *= -1;

    // NPC Throwing Logic
    if (playerChar === 'AZUL' && Math.random() > 0.97) {
        thrownBoxes.push({ x: enemy.x + 20, y: enemy.y, width: 60, height: 80, speed: 10, active: true });
    }

    thrownBoxes.forEach((box, bIndex) => {
        box.y -= box.speed;
        let target = (playerChar === 'AZUL') ? player : enemy;
        if (box.x < target.x + target.width && box.x + box.width > target.x &&
            box.y < target.y + target.height && box.y + box.height > target.y && box.active) {
            box.active = false;
            marketShare += 5; 
            mentalLevel += 3;
            thrownBoxes.splice(bIndex, 1);
        }
        if (box.y < -100) thrownBoxes.splice(bIndex, 1);
    });

    boxes.forEach((box, index) => {
        box.y += box.speed;
        if (playerChar === 'MOCHKIL' && !box.isSabotaged) {
            if (player.x < box.x + box.width && player.x + player.width > box.x &&
                player.y < box.y + box.height && player.y + player.height > box.y) {
                box.isSabotaged = true;
                marketShare += 2; mentalLevel += 5;
                if (typeof triggerShake === "function") triggerShake(200);
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
    // Fill background so we know canvas is working
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Characters
    let azulObj = (playerChar === 'AZUL') ? player : enemy;
    let azulSprite = azulObj.state === 'PATCHING' ? assets.holdingAzulo : assets.flyAzulo;
    ctx.drawImage(azulSprite, azulObj.x, azulObj.y, azulObj.width, azulObj.height);

    let mochObj = (playerChar === 'MOCHKIL') ? player : enemy;
    let mochSprite = (playerChar === 'AZUL') ? assets.mochkilNPC : assets.mochkilPlayer;
    ctx.drawImage(mochSprite, mochObj.x, mochObj.y, mochObj.width, mochObj.height);
    
    let hat = mentalLevel > 50 ? assets.beanie : assets.chefHat;
    ctx.drawImage(hat, mochObj.x + 10, mochObj.y - 30, 60, 50);

    // Draw Items
    thrownBoxes.forEach(box => {
        ctx.drawImage(assets.mochkilNPC, box.x, box.y, box.width, box.height);
    });
    boxes.forEach(b => {
        let img = b.isSabotaged ? assets.boxCorrupted : assets.boxNormal;
        ctx.drawImage(img, b.x, b.y, b.width, b.height);
    });

    // Update UI Stats
    document.getElementById('score').innerText = Math.floor(marketShare);
    document.getElementById('rage').innerText = Math.floor(mentalLevel);
}

function gameLoop() { 
    if (gameState === 'playing') { 
        update(); 
        draw(); 
        requestAnimationFrame(gameLoop); 
    } 
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
            thrownBoxes.push({ x: player.x + 10, y: player.y, width: 60, height: 80, speed: 12, active: true });
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
