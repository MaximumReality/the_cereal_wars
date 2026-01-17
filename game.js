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
                marketShare = Math.max(0, marketShare); // Ensure it stops at 0
            }
            azul.state = 'FLYING';
        }, 500);
    }

    marketShare = Math.max(0, Math.min(100, marketShare));
    mentalLevel = Math.min(200, mentalLevel);

    if (marketShare >= 100 || mentalLevel >= 200) {
        gameState = 'over';
        endGame('puffs_commercial.MP4');
    } else if (marketShare <= 0) {
        gameState = 'over';
        endGame('8bit_azulo.mp4');
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let azulSprite = azul.state === 'PATCHING' ? assets.holdingAzulo : assets.flyAzulo;
    ctx.drawImage(azulSprite, azul.x, azul.y, azul.width, azul.height);

    boxes.forEach(box => {
        let sprite = box.isSabotaged ? assets.boxCorrupted : assets.boxNormal;
        ctx.drawImage(sprite, box.x, box.y, box.width, box.height);
    });
    
    ctx.drawImage(assets.mochkil, player.x, player.y, player.width, player.height);
    
    let hat = mentalLevel > 50 ? assets.beanie : assets.chefHat;
    ctx.drawImage(hat, player.x + 10, player.y - 30, 60, 50);

    document.getElementById('score').innerText = Math.floor(marketShare);
    document.getElementById('rage').innerText = Math.floor(mentalLevel);
}

function endGame(videoFile) {
    const video = document.getElementById('endVideo');
    const credits = document.getElementById('creditsScreen');
    
    gameState = 'over'; // Ensure physics are stopped
    
    video.src = videoFile;
    video.style.display = 'block';
    
    // REQUIRED FOR IPHONE CHROME/SAFARI:
    video.muted = true;       // Allows the video to bypass autoplay blocks
    video.autoplay = true;    // Tells the browser to start immediately
    video.setAttribute('playsinline', ''); // Ensures it doesn't open in a separate player
    
    video.load(); 
    
    // Try to play
    let playPromise = video.play();

    if (playPromise !== undefined) {
        playPromise.then(_ => {
            // Video started! You can try to unmute here if you want sound:
            // video.muted = false; 
        }).catch(error => {
            console.log("Video blocked by browser policy, skipping to credits.");
            video.style.display = 'none';
            credits.style.display = 'flex';
        });
    }
    
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
    player.x = Math.max(0, Math.min(canvas.width - player.width, newX));
}, { passive: false });

function gameLoop() {
    if (gameState === 'playing') {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}
