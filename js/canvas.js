// ===== canvas.js - Canvas Setup & Scaling =====
const GameCanvas = (() => {
    const canvas = document.getElementById('game-canvas');
    const c = canvas.getContext('2d');

    // Game world dimensions (9:16 aspect ratio)
    const GAME_W = 360;
    const GAME_H = 640;

    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;

    function resize() {
        const container = document.getElementById('game-container');
        const containerW = container.clientWidth;
        const containerH = container.clientHeight;

        // Scale to fit while maintaining 9:16
        const scaleX = containerW / GAME_W;
        const scaleY = containerH / GAME_H;
        scale = Math.min(scaleX, scaleY);

        canvas.width = GAME_W;
        canvas.height = GAME_H;
        canvas.style.width = (GAME_W * scale) + 'px';
        canvas.style.height = (GAME_H * scale) + 'px';

        // Center canvas
        offsetX = (containerW - GAME_W * scale) / 2;
        offsetY = (containerH - GAME_H * scale) / 2;
        canvas.style.marginLeft = offsetX + 'px';
        canvas.style.marginTop = offsetY + 'px';

        // Update overlay positions to match canvas
        const screens = document.querySelectorAll('.screen, .hud');
        screens.forEach(s => {
            s.style.width = (GAME_W * scale) + 'px';
            s.style.height = (GAME_H * scale) + 'px';
            s.style.left = offsetX + 'px';
            s.style.top = offsetY + 'px';
        });
    }

    // Convert screen coordinates to game coordinates
    function screenToGame(screenX, screenY) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (screenX - rect.left) / scale,
            y: (screenY - rect.top) / scale
        };
    }

    window.addEventListener('resize', resize);
    resize();

    return {
        canvas, ctx: c, GAME_W, GAME_H,
        resize, screenToGame,
        getScale: () => scale
    };
})();
