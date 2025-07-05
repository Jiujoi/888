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
    bombs: 0,
    bullets: []
};

let powerups = [];

let enemies = [];
let particles = [];
let score = 0;
let enemyBullets = [];
let stars = [];
let keys = {};

function initStars() {
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: 1 + Math.random() * 2
        });
    }
}

function updateStars() {
    stars.forEach(s => {
        s.y += s.speed;
        if (s.y > canvas.height) {
            s.y = 0;
            s.x = Math.random() * canvas.width;
        }
    });
}

function drawStarField() {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    stars.forEach(s => {
        ctx.fillRect(s.x, s.y, 2, 2);
    });
}

function createEnemy() {
    const type = Math.random() < 0.7 ? "small" : "medium";
    if (type === "small") {
        return {
            type,
            x: Math.random() * (canvas.width - 30),
            y: -40,
            width: 30,
            height: 30,
            speed: 3 + Math.random() * 2,
            hp: 1,
            cooldown: 60 + Math.random() * 120
        };
    } else {
        return {
            type,
            x: Math.random() * (canvas.width - 50),
            y: -60,
            width: 50,
            height: 50,
            speed: 1 + Math.random() * 2,
            hp: 3,
            cooldown: 80 + Math.random() * 160
        };
    }
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
        b.y += b.speed;
        if (b.y > canvas.height + 10) {
            enemyBullets.splice(i, 1);
        }
    });
}

function updateEnemies() {
    enemies.forEach((e, i) => {
        e.y += e.speed;
        e.cooldown--;
        if (e.cooldown <= 0) {
            enemyBullets.push({ x: e.x + e.width / 2 - 2, y: e.y + e.height, speed: 4 });
            e.cooldown = (e.type === 'small' ? 60 : 40) + Math.random() * 120;
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
                createExplosion(b.x, b.y);
                e.hp--;
                player.bullets.splice(bi, 1);
                if (e.hp <= 0) {
                    createExplosion(e.x + e.width / 2, e.y + e.height / 2);
                    score += 100;
                    enemies.splice(ei, 1);
                }
            }
        });
    });

    enemyBullets.forEach((b, bi) => {
        if (collision({x: b.x, y: b.y, width: 4, height: 10}, {x: player.x, y: player.y, width: player.width, height: player.height})) {
            enemyBullets.splice(bi, 1);
            if (player.shield > 0) {
                player.shield--;
            } else {
                alert('Game Over! Final Score: ' + score);
                document.location.reload();
            }
        }
    });

    scoreDiv.textContent = 'Score: ' + score + ' | Shield: ' + player.shield + ' | Bombs: ' + player.bombs;
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
    const types = ['rapid', 'triple', 'shield', 'bomb'];
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
            case 'bomb':
                ctx.fillStyle = 'orange';
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
            } else if (p.type === 'bomb') {
                player.bombs += 1;
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

function useBomb() {
    if (player.bombs > 0) {
        player.bombs--;
        enemies.forEach(e => {
            createExplosion(e.x + e.width / 2, e.y + e.height / 2);
        });
        enemies = [];
        enemyBullets = [];
    }
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

    // Draw enemy bullets
    ctx.fillStyle = 'orange';
    enemyBullets.forEach(b => {
        ctx.fillRect(b.x, b.y, 4, 10);
    });

    // Draw enemies
    ctx.fillStyle = 'red';
    enemies.forEach(e => {
        ctx.fillRect(e.x, e.y, e.width, e.height);
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
    movePlayer();
    updateStars();
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
    if (e.key.toLowerCase() === 'b') {
        useBomb();
    }
});
window.addEventListener('keyup', e => {
    keys[e.key] = false;
});

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left - player.width / 2;
});

initStars();
requestAnimationFrame(gameLoop);
