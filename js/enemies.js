// ===== enemies.js - Enemy System =====
const Enemies = (() => {
    const list = [];
    const W = GameCanvas.GAME_W;
    const H = GameCanvas.GAME_H;

    const bigManImg = new Image();
    bigManImg.src = 'assets/images/big_man.png';

    const birdcageImg = new Image();
    // Use a data URI for now since generation failed, or a placeholder if I can't generate.
    // I'll use a simple placeholder visualization in code if image fails, but let's try to load it if I had it.
    // Since I couldn't generate it, I will draw it procedurally in drawBoss/drawBigMan or just a simple placeholder.
    // Actually, the plan said "birdcage graphic", so I'll implement a procedural drawing for now to ensure it works without external assets.


    // Enemy types
    const TYPES = {
        // Small straight-moving enemy
        basic: {
            w: 28, h: 28, hp: 1, score: 100, speed: 80,
            color: '#44cc44', shootInterval: 0,
            move: (e, dt) => { e.y += e.speed * dt; }
        },
        // Sine wave enemy
        sine: {
            w: 30, h: 30, hp: 2, score: 200, speed: 60,
            color: '#44aaff', shootInterval: 2.5,
            move: (e, dt) => {
                e.y += e.speed * dt;
                e.x = e.baseX + Math.sin(e.time * 2.5) * 60;
            }
        },
        // Swooping enemy
        swoop: {
            w: 32, h: 32, hp: 2, score: 250, speed: 100,
            color: '#ff8844', shootInterval: 2,
            move: (e, dt) => {
                e.y += e.speed * dt * 0.7;
                if (e.time < 1.5) {
                    e.x += e.dir * 120 * dt;
                }
            }
        },
        // Tank enemy - slow, tough
        tank: {
            w: 36, h: 36, hp: 5, score: 400, speed: 40,
            color: '#cc4444', shootInterval: 1.5,
            move: (e, dt) => { e.y += e.speed * dt; }
        },
        // Generic Boss
        boss: {
            w: 64, h: 64, hp: 30, score: 2000, speed: 30,
            color: '#ff44aa', shootInterval: 0.8,
            move: (e, dt) => {
                if (e.y < 80) e.y += 40 * dt;
                else e.x = e.baseX + Math.sin(e.time * 1.2) * 100;
            }
        },
        // Big Man (Final Boss)
        bigMan: {
            w: 120, h: 160, hp: 150, score: 10000, speed: 20,
            color: '#ffcc00', shootInterval: 0.2, // Base tick for logic, not actual shoot rate
            move: (e, dt) => {
                // Initialize State if not set
                if (!e.attackState) {
                    e.attackState = 'descend';
                    e.stateTimer = 0;
                    e.shotCount = 0;
                }

                e.stateTimer += dt;

                // Movement Logic
                if (e.attackState === 'descend') {
                    e.y += 30 * dt;
                    if (e.y >= 120) {
                        e.attackState = 'single'; // Start with easy single shots
                        e.stateTimer = 0;
                    }
                } else {
                    // Float movement
                    e.x = e.baseX + Math.sin(e.time * 0.5) * 80;
                    e.y = 120 + Math.sin(e.time * 1.0) * 20;

                    // State Switching Logic
                    // Cycle: Single Shots -> Cooldown -> Danmaku -> Cooldown -> Repeat

                    // 1. Single Shot Phase (Easier)
                    if (e.attackState === 'single') {
                        if (e.stateTimer > 4.0) { // 4 seconds of single shots
                            e.attackState = 'cooldown1';
                            e.stateTimer = 0;
                        }
                    }
                    // 2. Cooldown
                    else if (e.attackState === 'cooldown1') {
                        if (e.stateTimer > 1.5) {
                            e.attackState = 'danmaku';
                            e.stateTimer = 0;
                        }
                    }
                    // 3. Danmaku Phase (Harder)
                    else if (e.attackState === 'danmaku') {
                        if (e.stateTimer > 3.0) { // 3 seconds of barrage
                            e.attackState = 'cooldown2';
                            e.stateTimer = 0;
                        }
                    }
                    // 4. Cooldown
                    else if (e.attackState === 'cooldown2') {
                        if (e.stateTimer > 1.5) {
                            e.attackState = 'single';
                            e.stateTimer = 0;
                        }
                    }
                }
            }
        }
    };

    function spawn(type, x, y, diffMult = {}) {
        const def = TYPES[type];
        if (!def) return;
        const enemy = {
            type,
            x, y,
            baseX: x,
            w: def.w,
            h: def.h,
            hp: Math.ceil(def.hp * (diffMult.hp || 1)),
            maxHp: Math.ceil(def.hp * (diffMult.hp || 1)),
            speed: def.speed * (diffMult.speed || 1),
            score: def.score,
            color: def.color,
            shootInterval: def.shootInterval / (diffMult.shootRate || 1),
            shootTimer: Utils.rand(0.5, 2),
            time: 0,
            dir: Math.random() > 0.5 ? 1 : -1,
            move: def.move,
            flash: 0,
            friendImgSrc: diffMult.friendImgSrc || null // Store friend image source
        };
        // Preload image if exists
        if (enemy.friendImgSrc) {
            enemy.friendImg = new Image();
            enemy.friendImg.src = enemy.friendImgSrc;
        }
        list.push(enemy);
        return enemy;
    }

    function update(dt, playerX, playerY, diffMult = {}) {
        for (let i = list.length - 1; i >= 0; i--) {
            const e = list[i];
            e.time += dt;
            e.move(e, dt);

            // Keep in bounds horizontally
            e.x = Utils.clamp(e.x, e.w / 2, W - e.w / 2);

            // Flash timer
            if (e.flash > 0) e.flash -= dt;

            // Shoot logic
            if (e.shootInterval > 0) {
                e.shootTimer -= dt;
                if (e.shootTimer <= 0 && e.y > 0 && e.y < H * 0.9) {
                    e.shootTimer = e.shootInterval;

                    if (e.type === 'bigMan') {
                        // Big Man Logic
                        // Difficulty adjustment:
                        // Easy: shootRate 0.7 -> fireRate increases (slower).
                        // Normal: 1.0
                        // Hard: 1.3 -> fireRate decreases (faster).

                        if (e.attackState === 'danmaku') {
                            // Heavy attack
                            let shootMult = diffMult.shootRate || 1;
                            // Ensure it's not too slow for Easy
                            if (shootMult < 0.5) shootMult = 0.5;

                            const fireRate = 0.4 / shootMult;
                            // Force fire logic controlled by interval
                            // But wait, the outer checks reset e.shootTimer to 0.2 (BigMan interval).
                            // I must use a separate timer for shooting or ignore the loop timer.
                            // Actually, since this runs every 0.2s (shootInterval), I can just use a counter or random chance.
                            // OR, simpler: Fire every X ticks of the main loop.
                            // Let's use a separate property `fireTimer` or similar.
                            // Or just use the existing logic but knowing it runs every 0.2s.

                            if (!e.fireTimer) e.fireTimer = 0;
                            e.fireTimer -= e.shootInterval; // e.shootInterval is ~0.2
                            if (e.fireTimer <= 0) {
                                e.fireTimer = fireRate;
                                const bulletSpeed = 150 * (diffMult.bulletSpeed || 1);
                                const count = 5;
                                const spread = Math.PI / 1.5; // Wider spread
                                const startAngle = Math.PI / 2 - spread / 2;
                                for (let j = 0; j < count; j++) {
                                    const angle = startAngle + (spread / (count - 1)) * j;
                                    // Make bullets curve or spread
                                    Bullets.spawnAimedBullet(e.x, e.y + e.h / 3, playerX + (j - 2) * 60, playerY, bulletSpeed);
                                }
                                GameAudio.playShoot();
                            }
                        } else if (e.attackState === 'single') {
                            // Light attack
                            let shootMult = diffMult.shootRate || 1;
                            // Cap interval to ensure it fires at least once in 4s window
                            if (shootMult < 0.2) shootMult = 0.2; // 0.8 / 0.2 = 4s. Borderline.

                            const fireRate = 0.8 / shootMult;

                            if (!e.fireTimer) e.fireTimer = 0;
                            e.fireTimer -= e.shootInterval;

                            if (e.fireTimer <= 0) {
                                e.fireTimer = fireRate;
                                const bulletSpeed = 120 * (diffMult.bulletSpeed || 1);
                                Bullets.spawnAimedBullet(e.x, e.y + e.h / 2, playerX, playerY, bulletSpeed);
                                GameAudio.playShoot();
                            }
                        } else {
                            // Cooldown - do nothing
                            e.shootTimer = 0.1;
                        }
                    } else {
                        e.shootTimer = e.shootInterval;
                        const bulletSpeed = 120 * (diffMult.bulletSpeed || 1);
                        Bullets.spawnAimedBullet(e.x, e.y + e.h / 2, playerX, playerY, bulletSpeed);
                    }
                }
            }

            // Remove if off screen
            if (e.y > H + 60 || e.y < -100 || e.x < -60 || e.x > W + 60) {
                list.splice(i, 1);
            }
        }
    }

    function draw(ctx) {
        list.forEach(e => {
            ctx.save();
            const drawX = e.x - e.w / 2;
            const drawY = e.y - e.h / 2;

            // Flash white when hit
            if (e.flash > 0) {
                ctx.globalAlpha = 0.8;
                ctx.fillStyle = '#fff';
                ctx.fillRect(drawX, drawY, e.w, e.h);
                ctx.globalAlpha = 1;
                ctx.restore();
                return;
            }

            if (e.type === 'boss') {
                drawBoss(ctx, e);
            } else if (e.type === 'bigMan') {
                drawBigMan(ctx, e);
            } else {
                drawEnemy(ctx, e);
            }

            // HP bar for tough enemies
            if (e.maxHp > 2) {
                const barW = e.w;
                const barH = 5;
                const barX = drawX;
                const barY = drawY - 10;
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(barX, barY, barW, barH);
                ctx.fillStyle = e.hp > e.maxHp * 0.3 ? '#44ff44' : '#ff4444';
                ctx.fillRect(barX, barY, barW * (e.hp / e.maxHp), barH);
            }

            ctx.restore();
        });
    }

    function drawEnemy(ctx, e) {
        const cx = e.x;
        const cy = e.y;
        const r = e.w / 2;

        // Body
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Inner glow
        const grad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 0, cx, cy, r);
        grad.addColorStop(0, 'rgba(255,255,255,0.3)');
        grad.addColorStop(1, 'rgba(0,0,0,0.1)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx - r * 0.3, cy - r * 0.1, r * 0.2, 0, Math.PI * 2);
        ctx.arc(cx + r * 0.3, cy - r * 0.1, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(cx - r * 0.3, cy - r * 0.05, r * 0.1, 0, Math.PI * 2);
        ctx.arc(cx + r * 0.3, cy - r * 0.05, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawBoss(ctx, e) {
        const cx = e.x;
        const cy = e.y;
        const r = e.w / 2;

        // Main body
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Armor plates
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
        ctx.stroke();

        // Pulsing core
        const pulseR = r * 0.3 * (1 + Math.sin(e.time * 5) * 0.2);
        const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseR);
        coreGrad.addColorStop(0, '#fff');
        coreGrad.addColorStop(0.5, '#ff88aa');
        coreGrad.addColorStop(1, 'rgba(255,100,150,0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        const eyeY = cy - r * 0.15;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx - r * 0.3, eyeY, r * 0.15, 0, Math.PI * 2);
        ctx.arc(cx + r * 0.3, eyeY, r * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#660033';
        ctx.beginPath();
        ctx.arc(cx - r * 0.3, eyeY + 2, r * 0.08, 0, Math.PI * 2);
        ctx.arc(cx + r * 0.3, eyeY + 2, r * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Outer glow
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const outerGlow = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.5);
        outerGlow.addColorStop(0, 'rgba(255, 100, 180, 0.15)');
        outerGlow.addColorStop(1, 'rgba(255, 50, 100, 0)');
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw Birdcage (Friends trapped)
        drawBirdcage(ctx, e.x + 60, e.y + 10, e.friendImg);
    }

    function drawBirdcage(ctx, x, y, friendImg) {
        ctx.save();
        ctx.translate(x, y);
        // Cage bars
        ctx.strokeStyle = '#ffd700'; // Gold
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-15, -20);
        ctx.lineTo(-15, 20);
        ctx.moveTo(15, -20);
        ctx.lineTo(15, 20);
        ctx.moveTo(-15, -20);
        ctx.arc(0, -20, 15, Math.PI, 0); // Top arch
        ctx.stroke();

        ctx.strokeRect(-15, -20, 30, 40);

        // Base
        ctx.fillStyle = '#b8860b';
        ctx.fillRect(-18, 18, 36, 6);

        // "Friend" image inside
        if (friendImg && friendImg.complete) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(0, 5, 12, 0, Math.PI * 2);
            ctx.clip();
            try {
                ctx.drawImage(friendImg, -12, -7, 24, 24);
            } catch (e) { }
            ctx.restore();
        } else {
            // Silhouette fallback
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(0, 5, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        // Help bubble
        if (Math.floor(Date.now() / 500) % 2 === 0) {
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.fillText('HELP!', -12, -25);
        }

        ctx.restore();
    }


    function drawBigMan(ctx, e) {
        if (bigManImg.complete && bigManImg.naturalWidth > 0) {
            // Draw pixel art cleanly
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(bigManImg, e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
            ctx.imageSmoothingEnabled = true;
        } else {
            // Fallback: Yellow rectangle
            ctx.fillStyle = '#ccaa00';
            ctx.fillRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.strokeRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
            ctx.fillRect(e.x - 10, e.y + 20, 20, 5);
        }

        // Draw Birdcage for Big Man too
        drawBirdcage(ctx, e.x + 90, e.y, e.friendImg);
    }

    function damageEnemy(index, damage = 1) {
        const e = list[index];
        if (!e) return null;
        e.hp -= damage;
        e.flash = 0.08;

        if (e.hp <= 0) {
            const result = { x: e.x, y: e.y, score: e.score, type: e.type };
            list.splice(index, 1);
            return result;
        }
        return false;
    }

    function clear() {
        list.length = 0;
    }

    return {
        list, spawn, update, draw, damageEnemy, clear, TYPES
    };
})();

window.Enemies = Enemies;

window.Enemies = Enemies;
