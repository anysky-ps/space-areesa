// ===== background.js - Parallax Scrolling Starfield =====
const Background = (() => {
    const layers = [];
    const W = GameCanvas.GAME_W;
    const H = GameCanvas.GAME_H;

    // Layer 0: Distant stars (slow)
    // Layer 1: Medium stars
    // Layer 2: Near debris/particles (fast)
    function init() {
        layers.length = 0;

        // Distant small stars
        const far = [];
        for (let i = 0; i < 80; i++) {
            far.push({
                x: Math.random() * W,
                y: Math.random() * H,
                size: Utils.rand(0.5, 1.5),
                speed: Utils.rand(15, 30),
                brightness: Utils.rand(0.3, 0.7),
                twinkle: Math.random() * Math.PI * 2
            });
        }
        layers.push(far);

        // Medium stars
        const mid = [];
        for (let i = 0; i < 40; i++) {
            mid.push({
                x: Math.random() * W,
                y: Math.random() * H,
                size: Utils.rand(1, 2.5),
                speed: Utils.rand(40, 70),
                brightness: Utils.rand(0.4, 0.8),
                hue: Utils.randInt(180, 280),
                twinkle: Math.random() * Math.PI * 2
            });
        }
        layers.push(mid);

        // Near debris
        const near = [];
        for (let i = 0; i < 20; i++) {
            near.push({
                x: Math.random() * W,
                y: Math.random() * H,
                size: Utils.rand(1.5, 4),
                speed: Utils.rand(80, 140),
                brightness: Utils.rand(0.2, 0.5),
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: Utils.rand(-2, 2)
            });
        }
        layers.push(near);
    }

    function update(dt) {
        layers.forEach(layer => {
            layer.forEach(star => {
                star.y += star.speed * dt;
                if (star.y > H + 10) {
                    star.y = -10;
                    star.x = Math.random() * W;
                }
                star.twinkle = (star.twinkle || 0) + dt * 3;
                if (star.rotation !== undefined) {
                    star.rotation += star.rotSpeed * dt;
                }
            });
        });
    }

    function draw(ctx) {
        // Deep space gradient
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#05021a');
        grad.addColorStop(0.5, '#0a0525');
        grad.addColorStop(1, '#0f0830');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Distant stars
        layers[0].forEach(s => {
            const alpha = s.brightness * (0.6 + 0.4 * Math.sin(s.twinkle));
            ctx.fillStyle = `rgba(200, 210, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Medium stars with color
        layers[1].forEach(s => {
            const alpha = s.brightness * (0.7 + 0.3 * Math.sin(s.twinkle));
            ctx.fillStyle = Utils.hsl(s.hue, 60, 70, alpha);
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
            // Glow
            ctx.fillStyle = Utils.hsl(s.hue, 60, 70, alpha * 0.3);
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * 2.5, 0, Math.PI * 2);
            ctx.fill();
        });

        // Near debris
        layers[2].forEach(s => {
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(s.rotation);
            ctx.fillStyle = `rgba(100, 80, 120, ${s.brightness})`;
            ctx.fillRect(-s.size, -s.size * 0.5, s.size * 2, s.size);
            ctx.restore();
        });
    }

    init();

    return { init, update, draw };
})();
