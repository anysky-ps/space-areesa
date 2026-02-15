// ===== utils.js - Utility Functions =====
const Utils = {
    // Collision detection (circle-circle)
    circleCollision(x1, y1, r1, x2, y2, r2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        return (dx * dx + dy * dy) < (r1 + r2) * (r1 + r2);
    },

    // Collision detection (rect-rect)
    rectCollision(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x &&
               a.y < b.y + b.h && a.y + a.h > b.y;
    },

    // Random number in range
    rand(min, max) {
        return Math.random() * (max - min) + min;
    },

    randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Clamp value
    clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    },

    // Lerp
    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    // Distance
    dist(x1, y1, x2, y2) {
        return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    },

    // HSL to RGB string
    hsl(h, s, l, a = 1) {
        return `hsla(${h}, ${s}%, ${l}%, ${a})`;
    }
};
