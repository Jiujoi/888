const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDiv = document.getElementById('score');

const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 80,
    width: 40,
    height: 60,
    speed: 5,
    bullets: []
};

let enemies = [];
let particles = [];
let score = 0;
let keys = {};

function createEnemy() {
    return {
        x: Math.random() * (canvas.width - 40),
        y: -60,
        width: 40,
        height: 40,
        speed: 2 + Math.random() * 3
    };
}

function shoot() {
    player.bullets.push({ x: player.x + player.width / 2 - 2, y: player.y, speed: 7 });
}

function updateBullets() {
    player.bullets.forEach((b, i) => {
        b.y -= b.speed;
        if (b.y < -10) {
            player.bullets.splice(i, 1);
        }
    });
}

function updateEnemies() {
    enemies.forEach((e, i) => {
        e.y += e.speed;
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
            // Game over
            alert('Game Over! Final Score: ' + score);
            document.location.reload();
        }
        // Bullets vs enemy
        player.bullets.forEach((b, bi) => {
            if (collision({x: b.x, y: b.y, width: 4, height: 10}, e)) {
                createExplosion(e.x + e.width / 2, e.y + e.height / 2);
                score += 100;
                enemies.splice(ei, 1);
                player.bullets.splice(bi, 1);
            }
        });
    });
    scoreDiv.textContent = 'Score: ' + score;
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

function drawStarField() {
    for (let i = 0; i < 100; i++) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.fillRect(x, y, 1, 1);
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

    // Draw enemies
    ctx.fillStyle = 'red';
    enemies.forEach(e => {
        ctx.fillRect(e.x, e.y, e.width, e.height);
    });

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
    updateBullets();
    updateEnemies();
    updateParticles();
    updateCollisions();
    draw();

    if (Math.random() < 0.03) {
        enemies.push(createEnemy());
    }

    requestAnimationFrame(gameLoop);
}

// Controls
window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === ' ') shoot();
});
window.addEventListener('keyup', e => {
    keys[e.key] = false;
});

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left - player.width / 2;
});

requestAnimationFrame(gameLoop);
