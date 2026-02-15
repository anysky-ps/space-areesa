
(async function () {
    // Debug Mode Module
    const Debug = (() => {
        let active = false;
        let menu = null;

        function init() {
            createMenu();
            // document.addEventListener('keydown', ...) handles Shift+D
            document.addEventListener('keydown', (e) => {
                if (e.key === 'D' && e.shiftKey) { // Shift+D to toggle
                    toggle();
                }
            });

            // Hidden mobile shortcut: 5 taps on the score display
            const scoreEl = document.getElementById('hud-score');
            if (scoreEl) {
                let tapCount = 0;
                let lastTap = 0;
                scoreEl.addEventListener('touchstart', (e) => {
                    const now = Date.now();
                    if (now - lastTap < 500) {
                        tapCount++;
                    } else {
                        tapCount = 1;
                    }
                    lastTap = now;
                    if (tapCount >= 5) {
                        toggle();
                        tapCount = 0;
                    }
                }, { passive: true });
            }

            console.log("Debug Mode Initialized. Press Shift+D or 5-tap score to open.");
        }

        function toggle() {
            active = !active;
            if (menu) menu.style.display = active ? 'block' : 'none';
        }

        function createMenu() {
            menu = document.createElement('div');
            menu.id = 'debug-menu';
            menu.style.cssText = `
                display: none;
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.8);
                color: #0f0;
                padding: 10px;
                border: 1px solid #0f0;
                font-family: monospace;
                z-index: 1000;
            `;

            const title = document.createElement('div');
            title.textContent = "DEBUG MENU";
            title.style.fontWeight = "bold";
            title.style.marginBottom = "5px";
            menu.appendChild(title);

            addButton("Next Stage", () => {
                // Accessing internal Game logic might be hard if not exposed.
                // We rely on Main exposing something or modifying state directly if possible.
                // Since Game is an IIFE, we might need to expose methods or use events.
                // HACK: Dispatch a custom key/event or call global if available.
                // Actually, Game IS exposed as global const.
                // But nextStage is distinct.
                // We will need to expose it in Main.js.
                if (window.Game && window.Game.debugNextStage) {
                    window.Game.debugNextStage();
                } else {
                    console.warn("debugNextStage not exposed");
                }
            });

            addButton("Trip Invincible (Mikan)", () => {
                if (window.Player) window.Player.collectMikan();
            });

            addButton("Trip 1UP", () => {
                if (window.Player) window.Player.collectKamakiri();
            });

            addButton("Kill All Enemies", () => {
                if (window.Enemies && window.Game && window.Game.handleEnemyDeath) {
                    const list = window.Enemies.list;
                    // Iterate backwards to safely remove
                    for (let i = list.length - 1; i >= 0; i--) {
                        // Deal massive damage to ensure death
                        const result = window.Enemies.damageEnemy(i, 99999);
                        if (result) {
                            window.Game.handleEnemyDeath(result);
                        }
                    }
                }
            });

            addButton("Toggle Mute", () => {
                if (window.GameAudio) window.GameAudio.toggleMute();
            });

            document.body.appendChild(menu);
        }

        function addButton(label, onClick) {
            const btn = document.createElement('button');
            btn.textContent = label;
            btn.style.cssText = `
                display: block;
                width: 100%;
                margin-bottom: 5px;
                background: #333;
                color: #fff;
                border: 1px solid #555;
                cursor: pointer;
            `;
            btn.onclick = onClick;
            menu.appendChild(btn);
        }

        return { init };
    })();

    // Expose to window
    window.Debug = Debug;
})();
