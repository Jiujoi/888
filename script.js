const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDiv = document.getElementById('score');

const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 80,
    width: 40,
    height: 60,
    speed: 5,
    bulletSpeed: 7,
    fireRate: 300, // milliseconds
    lastShot: 0,
    tripleShot: false,
    rapidTime: 0,
    tripleTime: 0,
    shield: 0,
    bullets: []
};

let powerups = [];

let enemies = [];
let enemyBullets = [];
let stars = [];
let particles = [];
let score = 0;
let keys = {};

function initStarField() {
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: 1 + Math.random() * 2,
            size: Math.random() * 2
        });
    }
}

function createEnemy() {
    const big = Math.random() < 0.3;
    return {
        x: Math.random() * (canvas.width - (big ? 60 : 40)),
        y: -60,
        width: big ? 60 : 40,
        height: big ? 60 : 40,
        speed: big ? 1 + Math.random() * 2 : 2 + Math.random() * 3,
        health: big ? 3 : 1,
        fireRate: big ? 1000 : 1500,
        lastShot: 0
    };
}

function shoot() {
    const baseBullet = { x: player.x + player.width / 2 - 2, y: player.y, speedX: 0, speedY: -player.bulletSpeed };
    if (player.tripleShot) {
        player.bullets.push({ ...baseBullet, speedX: -1 });
        player.bullets.push(baseBullet);
        player.bullets.push({ ...baseBullet, speedX: 1 });
    } else {
        player.bullets.push(baseBullet);
    }
}

function updateBullets() {
    player.bullets.forEach((b, i) => {
        b.x += b.speedX;
        b.y += b.speedY;
        if (b.y < -10 || b.x < -10 || b.x > canvas.width + 10) {
            player.bullets.splice(i, 1);
        }
    });
}

function updateEnemyBullets() {
    enemyBullets.forEach((b, i) => {
        b.y += b.speedY;
        if (b.y > canvas.height + 10) {
            enemyBullets.splice(i, 1);
        }
    });
}

function updateEnemies() {
    enemies.forEach((e, i) => {
        e.y += e.speed;
        if (Date.now() - e.lastShot > e.fireRate) {
            enemyBullets.push({ x: e.x + e.width / 2 - 2, y: e.y + e.height, speedY: 3 });
            e.lastShot = Date.now();
        }
        if (e.y > canvas.height + 40) {
            enemies.splice(i, 1);
        }
    });
}

function collision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

function updateCollisions() {
    enemies.forEach((e, ei) => {
        // Player vs enemy
        if (collision({x: player.x, y: player.y, width: player.width, height: player.height}, e)) {
            if (player.shield > 0) {
                player.shield--;
                createExplosion(e.x + e.width / 2, e.y + e.height / 2);
                enemies.splice(ei, 1);
                return;
            }
            alert('Game Over! Final Score: ' + score);
            document.location.reload();
        }
        // Bullets vs enemy
        player.bullets.forEach((b, bi) => {
            if (collision({x: b.x, y: b.y, width: 4, height: 10}, e)) {
                createExplosion(e.x + e.width / 2, e.y + e.height / 2);
                score += 100;
                e.health--;
                if (e.health <= 0) {
                    enemies.splice(ei, 1);
                }
                player.bullets.splice(bi, 1);
            }
        });
    });

    enemyBullets.forEach((b, bi) => {
        if (collision({x: player.x, y: player.y, width: player.width, height: player.height}, {x: b.x, y: b.y, width: 4, height: 10})) {
            if (player.shield > 0) {
                player.shield--;
                enemyBullets.splice(bi, 1);
            } else {
                alert('Game Over! Final Score: ' + score);
                document.location.reload();
            }
        }
    });
    scoreDiv.textContent = 'Score: ' + score + ' | Shield: ' + player.shield;
}

function createExplosion(x, y) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x,
            y,
            radius: 2 + Math.random() * 2,
            speedX: (Math.random() - 0.5) * 4,
            speedY: (Math.random() - 0.5) * 4,
            life: 30
        });
    }
}

function updateParticles() {
    particles.forEach((p, i) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.life--;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    });
}

function createPowerUp() {
    const types = ['rapid', 'triple', 'shield'];
    const type = types[Math.floor(Math.random() * types.length)];
    return {
        x: Math.random() * (canvas.width - 30),
        y: -30,
        width: 30,
        height: 30,
        speed: 2,
        type
    };
}

function updatePowerUps() {
    powerups.forEach((p, i) => {
        p.y += p.speed;
        if (p.y > canvas.height + 30) {
            powerups.splice(i, 1);
        }
    });
}

function drawPowerUps() {
    powerups.forEach(p => {
        switch (p.type) {
            case 'rapid':
                ctx.fillStyle = 'lime';
                break;
            case 'triple':
                ctx.fillStyle = 'magenta';
                break;
            case 'shield':
                ctx.fillStyle = 'skyblue';
                break;
        }
        ctx.fillRect(p.x, p.y, p.width, p.height);
    });
}

function handlePowerUpCollisions() {
    powerups.forEach((p, i) => {
        if (collision({x: player.x, y: player.y, width: player.width, height: player.height}, p)) {
            if (p.type === 'rapid') {
                player.rapidTime = 600; // frames
                player.fireRate = 100;
            } else if (p.type === 'triple') {
                player.tripleTime = 600;
                player.tripleShot = true;
            } else if (p.type === 'shield') {
                player.shield += 1;
            }
            powerups.splice(i, 1);
        }
    });
}

function updatePowerTimers() {
    if (player.rapidTime > 0) {
        player.rapidTime--;
        if (player.rapidTime === 0) {
            player.fireRate = 300;
        }
    }
    if (player.tripleTime > 0) {
        player.tripleTime--;
        if (player.tripleTime === 0) {
            player.tripleShot = false;
        }
    }
}

function updateStarField() {
    stars.forEach(s => {
        s.y += s.speed;
        if (s.y > canvas.height) {
            s.y = 0;
            s.x = Math.random() * canvas.width;
        }
    });
}

function drawStarField() {
    stars.forEach(s => {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(s.x, s.y, s.size, s.size);
    });
}

function draw() {
    ctx.fillStyle = 'rgba(0,0,20,0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawStarField();

    // Draw player
    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();

    // Draw bullets
    ctx.fillStyle = 'yellow';
    player.bullets.forEach(b => {
        ctx.fillRect(b.x, b.y, 4, 10);
    });

    // Draw enemies
    ctx.fillStyle = 'red';
    enemies.forEach(e => {
        ctx.fillRect(e.x, e.y, e.width, e.height);
    });

    // Draw enemy bullets
    ctx.fillStyle = 'orange';
    enemyBullets.forEach(b => {
        ctx.fillRect(b.x, b.y, 4, 10);
    });

    // Draw power-ups
    drawPowerUps();

    // Draw particles
    particles.forEach(p => {
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function movePlayer() {
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x + player.width < canvas.width) player.x += player.speed;
    if (keys['ArrowUp'] && player.y > 0) player.y -= player.speed;
    if (keys['ArrowDown'] && player.y + player.height < canvas.height) player.y += player.speed;
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateStarField();
    movePlayer();
    if (Date.now() - player.lastShot > player.fireRate) {
        shoot();
        player.lastShot = Date.now();
    }
    updateBullets();
    updateEnemyBullets();
    updateEnemies();
    updatePowerUps();
    updateParticles();
    handlePowerUpCollisions();
    updatePowerTimers();
    updateCollisions();
    draw();

    if (Math.random() < 0.03) {
        enemies.push(createEnemy());
    }
    if (Math.random() < 0.01) {
        powerups.push(createPowerUp());
    }

    requestAnimationFrame(gameLoop);
}

// Controls
window.addEventListener('keydown', e => {
    keys[e.key] = true;
});
window.addEventListener('keyup', e => {
    keys[e.key] = false;
});

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left - player.width / 2;
});

initStarField();
requestAnimationFrame(gameLoop);
