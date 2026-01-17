const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 430;
canvas.height = 932;

let gameState = 'waiting';
let playerChar = 'MOCHKIL'; 
let marketShare = 50; 
let mentalLevel = 0;
let boxes = [];
let thrownPuffs = [];
let isMuted = true;
let lastThrowTime = 0;

// Audio setup
let bgMusic = new Audio('cereal_wars.mp3'); 
bgMusic.loop = true;

document.getElementById('muteToggle').addEventListener('click', (e) => {
    e.stopPropagation(); 
    isMuted = !isMuted;
    document.getElementById('soundStatus').innerText = isMuted ? "OFF" : "ON";
    bgMusic.muted = isMuted;
    if (!isMuted) bgMusic.play().catch(() => {});
});

const assets = {
    mochkil: new Image(), 
    mochkilNPC: new Image(),
    beanie: new Image(), 
    chefHat: new Image(),
    flyAzulo: new Image(), 
    holdingAzulo: new Image(),
    boxNormal: new Image(), 
    boxCorrupted: new Image(), 
    puffsCereal: new Image()
};

assets.mochkil.src = 'thief_no_cereal.png';
assets.mochkilNPC.src = 'mochkil_puffs.PNG';
assets.beanie.src = 'beanie.png';
assets.chefHat.src = 'chef-hat.png';
assets.flyAzulo.src = 'flyazulo.png';
assets.holdingAzulo.src = 'holding_azulos.png';
assets.boxNormal.src = 'azulos_special.png';
assets.boxCorrupted.src = 'azulos_corrupted.png';
assets.puffsCereal.src = 'puffs_cereal.png';

const player = { x: 175, y: 750, width: 80, height: 100, state: 'FLYING' }; 
const enemy = { x: 150, y: 100, width: 100, height: 100, state: 'FLYING', dir: 1 };

function startGame(choice) {
    playerChar = choice;
    gameState = 'playing';
    marketShare = 50; 
    mentalLevel = 0;
    boxes = []; 
    thrownPuffs = [];

    if (playerChar === 'AZUL') {
        player.y = 100;
        enemy.y = 750;
    } else {
        player.y = 750;
        enemy.y = 100;
    }
    requestAnimationFrame(gameLoop);
}

function update() {
    if (gameState !== 'playing') return;

    // Enemy movement
    enemy.x += 3 * enemy.dir;
    if (enemy.x > canvas.width - enemy.width || enemy.x < 0) enemy.dir *= -1;

    // Enemy firing puffs if player is Azul
    if (playerChar === 'AZUL' && Math.random() > 0.98) {
        thrownPuffs.push({ x: enemy.x + 20, y: enemy.y, width: 60, height: 80, speed: 12, active: true });
    }

    // Update Projectiles
    for (let i = thrownPuffs.length - 1; i >= 0; i--) {
        let puff = thrownPuffs[i];
        // Puffs fly UP if Mochkil throws, DOWN if Azul's enemy throws
        puff.y += (playerChar === 'MOCHKIL') ? -puff.speed : puff.speed; 
        
        let target = (playerChar === 'AZUL') ? player : enemy;
        if (puff.x < target.x + target.width && puff.x + puff.width > target.x &&
            puff.y < target.y + target.height && puff.y + puff.height > target.y && puff.active) {
            puff.active = false;
            marketShare += 5; 
            mentalLevel += 2;
            thrownPuffs.splice(i, 1);
        } else if (puff.y < -100 || puff.y > canvas.height + 100) {
            thrownPuffs.splice(i, 1);
        }
    }

    // Update Boxes
    for (let i = boxes.length - 1; i >= 0; i--) {
        let box = boxes[i];
        box.y += box.speed;
        
        // Mochkil sabotages boxes
        if (playerChar === 'MOCHKIL' && !box.isSabotaged) {
            if (player.x < box.x + box.width && player.x + player.width > box.x &&
                player.y < box.y + box.height && player.y + player.height > box.y) {
                box.isSabotaged = true;
                marketShare += 2; 
                mentalLevel += 5;
            }
        }
        // Azul patches boxes
        if (playerChar === 'AZUL' && box.isSabotaged) {
            if (player.x < box.x + box.width && player.x + player.width > box.x &&
                player.y < box.y + box.height && player.y + player.height > box.y) {
                box.isSabotaged = false; 
                marketShare -= 4; 
                player.state = 'PATCHING';
                setTimeout(() => { if(gameState === 'playing') player.state = 'FLYING'; }, 300);
            }
        }
        if (box.y > canvas.height) boxes.splice(i, 1);
    }

    // Win/Loss Condition
    marketShare = Math.max(0, Math.min(100, marketShare));
    if (marketShare >= 100 || mentalLevel >= 200) {
        gameState = 'over';
        if (typeof endGame === "function") {
            endGame('puffs_commercial.MP4', "MOCHKIL WINS - REALITY CONVERTED");
        }
    } else if (marketShare <= 0) {
        gameState = 'over';
        if (typeof endGame === "function") {
            endGame('8bit_azulo.MP4', "AZUL WINS - QUANTUM ORDER RESTORED");
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let azulObj = (playerChar === 'AZUL') ? player : enemy;
    let azulSprite = azulObj.state === 'PATCHING' ? assets.holdingAzulo : assets.flyAzulo;
    ctx.drawImage(azulSprite, azulObj.x, azulObj.y, azulObj.width, azulObj.height);

    let mochObj = (playerChar === 'MOCHKIL') ? player : enemy;
    let mochSprite = (playerChar === 'AZUL') ? assets.mochkilNPC : assets.mochkil;
    ctx.drawImage(mochSprite, mochObj.x, mochObj.y, mochObj.width, mochObj.height);
    
    let hat = mentalLevel > 50 ? assets.beanie : assets.chefHat;
    ctx.drawImage(hat, mochObj.x + 10, mochObj.y - 30, 60, 50);

    thrownPuffs.forEach(p => ctx.drawImage(assets.puffsCereal, p.x, p.y, p.width, p.height));
    boxes.forEach(b => ctx.drawImage(b.isSabotaged ? assets.boxCorrupted : assets.boxNormal, b.x, b.y, b.width, b.height));

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
            thrownPuffs.push({ x: player.x + 10, y: player.y, width: 60, height: 80, speed: 12, active: true });
            lastThrowTime = now;
            if (window.navigator.vibrate) window.navigator.vibrate(15);
        }
    }
}, { passive: false });

// Spawning Boxes
setInterval(() => {
    if (gameState === 'playing') {
        let sabotaged = (playerChar === 'AZUL') ? (Math.random() > 0.4) : false;
        boxes.push({ x: Math.random() * (canvas.width - 60), y: -80, width: 60, height: 80, isSabotaged: sabotaged, speed: 4 + Math.random() * 3 });
    }
}, 1000);
