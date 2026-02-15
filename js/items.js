// ===== items.js - Item System =====
const Items = (() => {
    const list = [];
    const W = GameCanvas.GAME_W;
    const H = GameCanvas.GAME_H;

    // Item definitions
    const TYPES = {
        mikan: {
            w: 24, h: 24,
            color: '#ff8800',
            label: 'ミカン',
            dropRate: 0.08
        },
        kamakiri: {
            w: 24, h: 24,
            color: '#44cc44',
            label: 'カマキリ',
            dropRate: 0.05
        }
    };

    function spawn(type, x, y) {
        const def = TYPES[type];
        if (!def) return;
        list.push({
            type,
            x, y,
            w: def.w, h: def.h,
            speed: 50,
            time: 0,
            collected: false
        });
    }

    function tryDropItem(x, y) {
        const roll = Math.random();
        if (roll < TYPES.mikan.dropRate) {
            spawn('mikan', x, y);
        } else if (roll < TYPES.mikan.dropRate + TYPES.kamakiri.dropRate) {
            spawn('kamakiri', x, y);
        }
    }

    function update(dt) {
        for (let i = list.length - 1; i >= 0; i--) {
            const item = list[i];
            item.time += dt;
            item.y += item.speed * dt;
            // Float horizontally
            item.x += Math.sin(item.time * 3) * 0.5;

            if (item.y > H + 30) {
                list.splice(i, 1);
            }
        }
    }

    function draw(ctx) {
        list.forEach(item => {
            const cx = item.x;
            const cy = item.y;
            const r = item.w / 2;
            const bobY = Math.sin(item.time * 4) * 3;

            ctx.save();
            // Glow
            ctx.globalCompositeOperation = 'screen';
            const glow = ctx.createRadialGradient(cx, cy + bobY, 0, cx, cy + bobY, r * 2);
            if (item.type === 'mikan') {
                glow.addColorStop(0, 'rgba(255, 180, 0, 0.3)');
            } else {
                glow.addColorStop(0, 'rgba(50, 220, 50, 0.3)');
            }
            glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(cx, cy + bobY, r * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';

            if (item.type === 'mikan') {
                drawMikan(ctx, cx, cy + bobY, r);
            } else {
                drawKamakiri(ctx, cx, cy + bobY, r);
            }
            ctx.restore();
        });
    }

    function drawMikan(ctx, cx, cy, r) {
        // Orange fruit
        ctx.fillStyle = '#ff8800';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255, 220, 100, 0.5)';
        ctx.beginPath();
        ctx.arc(cx - r * 0.25, cy - r * 0.25, r * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Leaf
        ctx.fillStyle = '#44aa22';
        ctx.beginPath();
        ctx.ellipse(cx, cy - r - 2, 5, 3, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Segments (faint lines)
        ctx.strokeStyle = 'rgba(200, 100, 0, 0.3)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI;
            ctx.beginPath();
            ctx.moveTo(cx, cy - r);
            ctx.quadraticCurveTo(cx + Math.cos(angle) * r * 0.5, cy, cx, cy + r);
            ctx.stroke();
        }
    }

    function drawKamakiri(ctx, cx, cy, r) {
        // Mantis Head (Inverted Triangle shape)
        ctx.fillStyle = '#44cc44';
        ctx.beginPath();
        // Triangle pointing down
        ctx.moveTo(cx - r * 0.5, cy - r * 0.5);
        ctx.lineTo(cx + r * 0.5, cy - r * 0.5);
        ctx.lineTo(cx, cy + r * 0.4);
        ctx.closePath();
        ctx.fill();

        // Eyes (Big bug eyes on corners)
        ctx.fillStyle = '#aaffaa';
        ctx.beginPath();
        ctx.arc(cx - r * 0.5, cy - r * 0.6, r * 0.25, 0, Math.PI * 2);
        ctx.arc(cx + r * 0.5, cy - r * 0.6, r * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(cx - r * 0.5, cy - r * 0.65, r * 0.08, 0, Math.PI * 2);
        ctx.arc(cx + r * 0.5, cy - r * 0.65, r * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Antennae
        ctx.strokeStyle = '#44cc44';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.2, cy - r * 0.5);
        ctx.lineTo(cx - r * 0.4, cy - r * 1.2);
        ctx.moveTo(cx + r * 0.2, cy - r * 0.5);
        ctx.lineTo(cx + r * 0.4, cy - r * 1.2);
        ctx.stroke();

        // Scythes/Arms (Folded)
        ctx.strokeStyle = '#228822';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Left
        ctx.moveTo(cx - r * 0.2, cy + r * 0.2);
        ctx.lineTo(cx - r * 0.8, cy + r * 0.1);
        ctx.lineTo(cx - r * 0.6, cy - r * 0.4);
        // Right
        ctx.moveTo(cx + r * 0.2, cy + r * 0.2);
        ctx.lineTo(cx + r * 0.8, cy + r * 0.1);
        ctx.lineTo(cx + r * 0.6, cy - r * 0.4);
        ctx.stroke();
    }

    function checkCollision(playerX, playerY, playerR) {
        for (let i = list.length - 1; i >= 0; i--) {
            const item = list[i];
            if (Utils.circleCollision(playerX, playerY, playerR, item.x, item.y, item.w / 2 + 5)) {
                const type = item.type;
                list.splice(i, 1);
                return type;
            }
        }
        return null;
    }

    function clear() {
        list.length = 0;
    }

    return {
        list, spawn, tryDropItem, update, draw, checkCollision, clear
    };
})();
