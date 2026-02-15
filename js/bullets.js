// ===== bullets.js - Bullet System =====
const Bullets = (() => {
    const playerBullets = [];
    const enemyBullets = [];
    const W = GameCanvas.GAME_W;
    const H = GameCanvas.GAME_H;

    function spawnPlayerBullet(x, y) {
        playerBullets.push({
            x: x - 3,
            y: y - 10,
            w: 6,
            h: 14,
            speed: -500,
            damage: 1
        });
    }

    function spawnEnemyBullet(x, y, vx, vy, speed = 150) {
        // Normalize direction
        const len = Math.sqrt(vx * vx + vy * vy) || 1;
        enemyBullets.push({
            x: x - 3,
            y: y - 3,
            w: 6,
            h: 6,
            vx: (vx / len) * speed,
            vy: (vy / len) * speed,
            radius: 4
        });
    }

    function spawnAimedBullet(ex, ey, px, py, speed = 150) {
        const dx = px - ex;
        const dy = py - ey;
        spawnEnemyBullet(ex, ey, dx, dy, speed);
    }

    function update(dt) {
        // Player bullets
        for (let i = playerBullets.length - 1; i >= 0; i--) {
            const b = playerBullets[i];
            b.y += b.speed * dt;
            if (b.y + b.h < -10) {
                playerBullets.splice(i, 1);
            }
        }

        // Enemy bullets
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const b = enemyBullets[i];
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            if (b.y > H + 20 || b.y < -20 || b.x < -20 || b.x > W + 20) {
                enemyBullets.splice(i, 1);
            }
        }
    }

    function draw(ctx) {
        // Player bullets - bright energy beams
        playerBullets.forEach(b => {
            // Core
            ctx.fillStyle = '#ff99ff';
            ctx.fillRect(b.x + 1, b.y, b.w - 2, b.h);
            // Glow
            ctx.fillStyle = 'rgba(255, 150, 255, 0.4)';
            ctx.fillRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4);
            // Bright center
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(b.x + 2, b.y + 1, b.w - 4, b.h - 2);
        });

        // Enemy bullets - orange/red orbs
        enemyBullets.forEach(b => {
            const cx = b.x + b.w / 2;
            const cy = b.y + b.h / 2;
            // Glow
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 8);
            grad.addColorStop(0, '#ffff88');
            grad.addColorStop(0.3, '#ff6644');
            grad.addColorStop(1, 'rgba(255, 50, 20, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, 8, 0, Math.PI * 2);
            ctx.fill();
            // Core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function clear() {
        playerBullets.length = 0;
        enemyBullets.length = 0;
    }

    return {
        playerBullets, enemyBullets,
        spawnPlayerBullet, spawnEnemyBullet, spawnAimedBullet,
        update, draw, clear
    };
})();
