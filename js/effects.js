// ===== effects.js - VFX System =====
const Effects = (() => {
    const particles = [];
    let hitStopTimer = 0;
    let screenShake = { x: 0, y: 0, time: 0 };

    // Explosion particle
    function spawnExplosion(x, y, color = '#ff6644', count = 15) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Utils.rand(-0.3, 0.3);
            const speed = Utils.rand(60, 200);
            particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: Utils.rand(0.3, 0.7),
                maxLife: 0.7,
                size: Utils.rand(2, 5),
                color,
                type: 'circle'
            });
        }
        // Flash
        particles.push({
            x, y,
            vx: 0, vy: 0,
            life: 0.1, maxLife: 0.1,
            size: 30,
            color: '#fff',
            type: 'flash'
        });
    }

    // Small hit spark
    function spawnHitSpark(x, y) {
        for (let i = 0; i < 5; i++) {
            particles.push({
                x, y,
                vx: Utils.rand(-80, 80),
                vy: Utils.rand(-80, 80),
                life: Utils.rand(0.1, 0.25),
                maxLife: 0.25,
                size: Utils.rand(1, 3),
                color: '#ffff88',
                type: 'circle'
            });
        }
    }

    // Score popup
    function spawnScoreText(x, y, score) {
        particles.push({
            x, y,
            vx: 0, vy: -40,
            life: 0.8, maxLife: 0.8,
            text: '+' + score,
            type: 'text'
        });
    }

    // Hit stop effect
    function triggerHitStop(duration = 0.05) {
        hitStopTimer = duration;
    }

    function isHitStopped() {
        return hitStopTimer > 0;
    }

    // Screen shake
    function triggerShake(intensity = 3, duration = 0.15) {
        screenShake.time = duration;
        screenShake.intensity = intensity;
    }

    function update(dt) {
        if (hitStopTimer > 0) {
            hitStopTimer -= dt;
        }

        if (screenShake.time > 0) {
            screenShake.time -= dt;
            screenShake.x = Utils.rand(-1, 1) * screenShake.intensity;
            screenShake.y = Utils.rand(-1, 1) * screenShake.intensity;
        } else {
            screenShake.x = 0;
            screenShake.y = 0;
        }

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                particles.splice(i, 1);
                continue;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            // Slow down
            p.vx *= 0.98;
            p.vy *= 0.98;
        }
    }

    function draw(ctx) {
        particles.forEach(p => {
            const alpha = Math.max(0, p.life / p.maxLife);

            if (p.type === 'flash') {
                ctx.globalAlpha = alpha * 0.7;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * (1 + (1 - alpha) * 2), 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            } else if (p.type === 'circle') {
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            } else if (p.type === 'text') {
                ctx.globalAlpha = alpha;
                ctx.fillStyle = '#ffd700';
                ctx.font = 'bold 14px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(p.text, p.x, p.y);
                ctx.globalAlpha = 1;
            }
        });
    }

    // Draw crack overlay on player
    function drawCrack(ctx, x, y, w, h) {
        ctx.save();
        // More visible crack: Red/Orange core with White outline
        const cx = x + w * 0.5;
        const cy = y + h * 0.4;

        function traceCrack() {
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx - w * 0.3, cy - h * 0.3);
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + w * 0.35, cy - h * 0.15);
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx - w * 0.1, cy + h * 0.35);
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + w * 0.25, cy + h * 0.25);

            // Branches
            ctx.moveTo(cx - w * 0.3, cy - h * 0.3);
            ctx.lineTo(cx - w * 0.45, cy - h * 0.15);

            ctx.moveTo(cx + w * 0.35, cy - h * 0.15);
            ctx.lineTo(cx + w * 0.4, cy + h * 0.1);
        }

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Outer Glow/Outline
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        traceCrack();
        ctx.stroke();

        // Inner Red
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 1.5;
        traceCrack();
        ctx.stroke();

        ctx.restore();
    }

    // Draw invincibility glow (rainbow)
    function drawInvincibleGlow(ctx, x, y, w, h, time) {
        const hue = (time * 200) % 360;
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // Outer glow
        const gradient = ctx.createRadialGradient(
            x + w / 2, y + h / 2, w * 0.2,
            x + w / 2, y + h / 2, w * 0.8
        );
        gradient.addColorStop(0, Utils.hsl(hue, 100, 70, 0.5));
        gradient.addColorStop(0.5, Utils.hsl((hue + 60) % 360, 100, 60, 0.3));
        gradient.addColorStop(1, Utils.hsl((hue + 120) % 360, 100, 50, 0));
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w * 0.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
    }

    return {
        update, draw, spawnExplosion, spawnHitSpark, spawnScoreText,
        triggerHitStop, isHitStopped, triggerShake,
        drawCrack, drawInvincibleGlow,
        getShake: () => screenShake,
        clear() { particles.length = 0; }
    };
})();
