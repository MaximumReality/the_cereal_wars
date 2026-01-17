const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 430; canvas.height = 932;

let gameState = 'waiting';
let playerChar = 'MOCHKIL'; 
let marketShare = 50; 
let mentalLevel = 0;
let boxes = [];
let thrownPuffs = [];
let particles = [];
let combo = 0;
let lastHitTime = 0;
let isMuted = true;
let lastThrowTime = 0;
let startTime = 0;

let bgMusic = new Audio('cereal_wars.mp3'); 
bgMusic.loop = true;

document.getElementById('muteToggle').addEventListener('click', (e) => {
    e.stopPropagation(); 
    isMuted = !isMuted;
    document.getElementById('soundStatus').innerText = isMuted ? "OFF" : "ON";
    if (gameState === 'playing') {
        bgMusic.muted = isMuted;
        if (!isMuted) bgMusic.play().catch(() => {});
    } else if (gameState === 'over') {
        const video = document.getElementById('endVideo');
        if (video) video.muted = isMuted;
    }
});

const assets = {
    mochkil: new Image(), mochkilNPC: new Image(),
    beanie: new Image(), chefHat: new Image(),
    flyAzulo: new Image(), holdingAzulo: new Image(),
    boxNormal: new Image(), boxCorrupted: new Image(), puffsCereal: new Image()
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

function createExplosion(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            radius: Math.random() * 4 + 2,
            alpha: 1,
            color: color
        });
    }
}

function startGame(choice) {
    playerChar = choice; gameState = 'playing';
    marketShare = 50; mentalLevel = 0; boxes = []; thrownPuffs = []; particles = [];
    startTime = performance.now();
    playerChar === 'AZUL' ? (player.y = 100, enemy.y = 750) : (player.y = 750, enemy.y = 100);
    requestAnimationFrame(gameLoop);
}

function update() {
    if (gameState !== 'playing') return;
    let speedMultiplier = 1 + ((performance.now() - startTime) / 60000); 

    enemy.x += (3 * speedMultiplier) * enemy.dir;
    if (enemy.x > canvas.width - enemy.width || enemy.x < 0) enemy.dir *= -1;

    if (playerChar === 'AZUL' && Math.random() > 0.97) {
        thrownPuffs.push({ x: enemy.x + 20, y: enemy.y, width: 60, height: 80, speed: 12, active: true });
    }

    for (let i = thrownPuffs.length - 1; i >= 0; i--) {
        let puff = thrownPuffs[i];
        puff.y -= puff.speed; 
        let target = (playerChar === 'AZUL') ? player : enemy;
        if (puff.x < target.x + target.width && puff.x + puff.width > target.x &&
            puff.y < target.y + target.height && puff.y + puff.height > target.y && puff.active) {
            puff.active = false;
            createExplosion(puff.x + 30, puff.y + 40, '#ffffff');
            marketShare += (playerChar === 'MOCHKIL') ? 1.5 : -1.5;
            mentalLevel += 0.5;
            thrownPuffs.splice(i, 1);
        }
        if (puff.y < -100 || puff.y > canvas.height + 100) thrownPuffs.splice(i, 1);
    }

    boxes.forEach((box, index) => {
        box.y += box.speed * speedMultiplier;
        if (playerChar === 'MOCHKIL' && !box.isSabotaged) {
            if (player.x < box.x + box.width && player.x + player.width > box.x &&
                player.y < box.y + box.height && player.y + player.height > box.y) {
                box.isSabotaged = true;
                createExplosion(box.x + 30, box.y + 40, '#ff9900');
                marketShare += 0.5; mentalLevel += 1;
            }
        }
        if (playerChar === 'AZUL' && box.isSabotaged) {
            if (player.x < box.x + box.width && player.x + player.width > box.x &&
                player.y < box.y + box.height && player.y + player.height > box.y) {
                box.isSabotaged = false; marketShare -= 0.8; 
                createExplosion(box.x + 30, box.y + 40, '#00f2ff');
                player.state = 'PATCHING';
                setTimeout(() => { if (gameState === 'playing') player.state = 'FLYING'; }, 300);
            }
        }
        if (box.y > canvas.height) boxes.splice(index, 1); 
    });

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x += particles[i].vx;
        particles[i].y += particles[i].vy;
        particles[i].alpha -= 0.03;
        if (particles[i].alpha <= 0) particles.splice(i, 1);
    }

    marketShare = Math.max(0, Math.min(100, marketShare));
    if (marketShare >= 99.5 || mentalLevel >= 300) {
        gameState = 'over';
        endGame('puffs_commercial.MP4', "MOCHKIL WINS");
    } else if (marketShare <= 0.5) {
        gameState = 'over';
        endGame('8bit_azulo.mp4', "AZUL WINS");
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let speedMult = (1 + ((performance.now() - startTime) / 60000)).toFixed(2);
    ctx.fillStyle = "rgba(0, 242, 255, 0.5)"; ctx.font = "14px 'Courier New'";
    ctx.fillText(`SPEED: x${speedMult}`, 20, 30);

    let azulObj = (playerChar === 'AZUL') ? player : enemy;
    ctx.drawImage(azulObj.state === 'PATCHING' ? assets.holdingAzulo : assets.flyAzulo, azulObj.x, azulObj.y, azulObj.width, azulObj.height);

    let mochObj = (playerChar === 'MOCHKIL') ? player : enemy;
    ctx.drawImage((playerChar === 'AZUL') ? assets.mochkilNPC : assets.mochkil, mochObj.x, mochObj.y, mochObj.width, mochObj.height);
    ctx.drawImage(mentalLevel > 50 ? assets.beanie : assets.chefHat, mochObj.x + 10, mochObj.y - 30, 60, 50);

    thrownPuffs.forEach(p => ctx.drawImage(assets.puffsCereal, p.x, p.y, p.width, p.height));
    boxes.forEach(b => ctx.drawImage(b.isSabotaged ? assets.boxCorrupted : assets.boxNormal, b.x, b.y, b.width, b.height));

    particles.forEach(p => {
        ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    document.getElementById('score').innerText = Math.floor(marketShare);
    document.getElementById('rage').innerText = Math.floor(mentalLevel);
}

function gameLoop() { if (gameState === 'playing') { update(); draw(); requestAnimationFrame(gameLoop); } }

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); let touch = e.touches[0]; let rect = canvas.getBoundingClientRect();
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

setInterval(() => {
    if (gameState === 'playing') {
        let sabotaged = (playerChar === 'AZUL') ? (Math.random() > 0.4) : false;
        boxes.push({ x: Math.random() * (canvas.width - 60), y: -80, width: 60, height: 80, isSabotaged: sabotaged, speed: 4 + Math.random() * 3 });
    }
}, 1000);
