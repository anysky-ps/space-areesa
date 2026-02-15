// ===== input.js - Touch/Mouse Input with Offset =====
const Input = (() => {
    let touching = false;
    let gameX = 0;
    let gameY = 0;
    const TOUCH_OFFSET_Y = -60; // Ship appears above finger

    const canvas = document.getElementById('game-canvas');

    function handleStart(e) {
        e.preventDefault();
        touching = true;
        const pos = getPosition(e);
        gameX = pos.x;
        gameY = pos.y + TOUCH_OFFSET_Y;
    }

    function handleMove(e) {
        e.preventDefault();
        if (!touching) return;
        const pos = getPosition(e);
        gameX = pos.x;
        gameY = pos.y + TOUCH_OFFSET_Y;
    }

    function handleEnd(e) {
        e.preventDefault();
        // Keep the last position, don't reset
    }

    function getPosition(e) {
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        return GameCanvas.screenToGame(clientX, clientY);
    }

    // Touch events
    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    canvas.addEventListener('touchend', handleEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleEnd, { passive: false });

    // Mouse events (for desktop testing)
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);

    // Prevent default on the whole document for mobile
    document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    return {
        get x() { return gameX; },
        get y() { return gameY; },
        get active() { return touching; },
        setPosition(x, y) { gameX = x; gameY = y; },
        activate() { touching = true; }
    };
})();
