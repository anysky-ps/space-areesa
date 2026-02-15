// ===== player.js - Player Ship =====
const Player = (() => {
    const W = GameCanvas.GAME_W;
    const H = GameCanvas.GAME_H;
    const SHIP_W = 48;
    const SHIP_H = 48;

    let state = {};
    let shipImage = null;
    let imageLoaded = false;

    // Load the player ship image
    const img = new Image();
    img.onload = () => { shipImage = img; imageLoaded = true; };
    img.src = 'assets/images/title.png';

    function init() {
        state = {
            x: W / 2,
            y: H * 0.75,
            w: SHIP_W,
            h: SHIP_H,
            lives: 3,
            cracked: false,
            invincible: false,
            invincibleTimer: 0,
            mikanInvincible: false,
            mikanTimer: 0,
            blinkTimer: 0,
            shootTimer: 0,
            shootInterval: 0.15,
            hitboxRadius: 10, // Small hitbox
            alive: true,
            respawnTimer: 0,
            time: 0
        };
    }

    function update(dt) {
        state.time += dt;

        // Move to input position
        if (Input.active) {
            const targetX = Utils.clamp(Input.x, SHIP_W / 2, W - SHIP_W / 2);
            const targetY = Utils.clamp(Input.y, SHIP_H / 2, H - SHIP_H / 2);
            // Smooth follow
            state.x = Utils.lerp(state.x, targetX, 0.2);
            state.y = Utils.lerp(state.y, targetY, 0.2);
        }

        // Respawn timer
        if (!state.alive) {
            state.respawnTimer -= dt;
            if (state.respawnTimer <= 0 && state.lives > 0) {
                state.alive = true;
                state.invincible = true;
                state.invincibleTimer = 1.5;
                state.blinkTimer = 0;
                state.x = W / 2;
                state.y = H * 0.75;
                Input.setPosition(W / 2, H * 0.75 + 60);
                Input.activate();
            }
            return;
        }

        // Invincibility timer (post-death)
        if (state.invincible) {
            state.invincibleTimer -= dt;
            state.blinkTimer += dt;
            if (state.invincibleTimer <= 0) {
                state.invincible = false;
                state.blinkTimer = 0;
            }
        }

        // Mikan invincibility
        if (state.mikanInvincible) {
            state.mikanTimer -= dt;
            if (state.mikanTimer <= 0) {
                state.mikanInvincible = false;
            }
        }

        // Auto-fire
        state.shootTimer -= dt;
        if (state.shootTimer <= 0) {
            state.shootTimer = state.shootInterval;
            Bullets.spawnPlayerBullet(state.x, state.y - SHIP_H / 2);
            GameAudio.playShoot();
        }
    }

    function takeDamage() {
        if (state.invincible || state.mikanInvincible || !state.alive) return false;

        GameAudio.playDamage();
        Effects.triggerShake(5, 0.2);

        if (!state.cracked) {
            // First hit: crack the ship
            state.cracked = true;
            state.invincible = true;
            state.invincibleTimer = 0.5;
            return true;
        } else {
            // Second hit: lose a life
            state.cracked = false;
            state.lives--;
            state.alive = false;
            state.respawnTimer = 1.0;

            // Death explosion
            Effects.spawnExplosion(state.x, state.y, '#c070ff', 25);
            Effects.triggerShake(8, 0.3);

            if (state.lives <= 0) {
                return 'gameover';
            }
            return true;
        }
    }

    function collectMikan() {
        state.mikanInvincible = true;
        state.mikanTimer = 10;
        GameAudio.playItemPickup();
    }

    function collectKamakiri() {
        if (state.cracked) {
            state.cracked = false;
        } else {
            state.lives = Math.min(state.lives + 1, 5);
            GameAudio.play1UP();
        }
        GameAudio.playItemPickup();
    }

    function draw(ctx) {
        if (!state.alive) return;

        // Blink during invincibility
        if (state.invincible && Math.floor(state.blinkTimer * 10) % 2 === 0) {
            return;
        }

        ctx.save();
        const drawX = state.x - SHIP_W / 2;
        const drawY = state.y - SHIP_H / 2;

        // Mikan invincibility glow
        if (state.mikanInvincible) {
            Effects.drawInvincibleGlow(ctx, drawX, drawY, SHIP_W, SHIP_H, state.time);
        }

        // Draw the actual character image
        if (imageLoaded) {
            ctx.drawImage(shipImage, drawX, drawY, SHIP_W, SHIP_H);
        } else {
            drawFallbackShip(ctx, state.x, state.y);
        }

        // Damage Red Flash (Hit Blink)
        if (state.invincible && !state.mikanInvincible) {
            // Flash red/transparent
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = `rgba(255, 0, 0, ${0.5 + 0.5 * Math.sin(state.time * 30)})`;
            ctx.fillRect(drawX, drawY, SHIP_W, SHIP_H);
            ctx.globalCompositeOperation = 'source-over';
        }

        // Crack overlay
        if (state.cracked) {
            Effects.drawCrack(ctx, drawX, drawY, SHIP_W, SHIP_H);
        }

        // Engine particles
        if (!state.mikanInvincible) {
            ctx.fillStyle = `rgba(180, 100, 255, ${0.4 + 0.3 * Math.sin(state.time * 15)})`;
        } else {
            const hue = (state.time * 200) % 360;
            ctx.fillStyle = Utils.hsl(hue, 100, 60, 0.6);
        }
        ctx.beginPath();
        ctx.arc(state.x, state.y + SHIP_H / 2 + 3, 4 + Math.sin(state.time * 20) * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    function drawFallbackShip(ctx, cx, cy) {
        // UFO body
        ctx.fillStyle = '#b080e0';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 5, 22, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dome
        ctx.fillStyle = 'rgba(180, 160, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(cx, cy - 5, 16, Math.PI, 0);
        ctx.fill();

        // Character inside
        ctx.fillStyle = '#9040d0';
        ctx.beginPath();
        ctx.arc(cx, cy - 5, 10, 0, Math.PI * 2);
        ctx.fill();

        // Face
        ctx.fillStyle = '#fde0c8';
        ctx.beginPath();
        ctx.arc(cx, cy - 5, 6, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(cx - 2.5, cy - 6, 1.2, 0, Math.PI * 2);
        ctx.arc(cx + 2.5, cy - 6, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Antenna
        ctx.strokeStyle = '#9040d0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 15);
        ctx.lineTo(cx, cy - 22);
        ctx.stroke();
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(cx, cy - 23, 3, 0, Math.PI * 2);
        ctx.fill();

        // Lights on UFO
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI - Math.PI / 8;
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(cx + Math.cos(angle) * 18, cy + 5 + Math.sin(angle) * 4, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    return {
        init, update, takeDamage, collectMikan, collectKamakiri, draw,
        get state() { return state; },
        getHitbox() {
            return { x: state.x, y: state.y, radius: state.hitboxRadius };
        }
    };
})();

window.Player = Player;
