// ===== hud.js - Heads Up Display =====
const HUD = (() => {
    const hudEl = document.getElementById('hud');
    const livesEl = document.getElementById('lives-display');
    const scoreEl = document.getElementById('hud-score');
    const stageEl = document.getElementById('hud-stage');

    function show() {
        hudEl.classList.remove('hidden');
    }

    function hide() {
        hudEl.classList.add('hidden');
    }

    function updateLives(count) {
        livesEl.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const icon = document.createElement('div');
            icon.className = 'life-icon' + (i >= count ? ' lost' : '');
            livesEl.appendChild(icon);
        }
    }

    function updateScore(score) {
        scoreEl.textContent = score.toLocaleString();
    }

    function updateStage(stageNum, stageName) {
        stageEl.textContent = `STAGE ${stageNum}`;
    }

    return { show, hide, updateLives, updateScore, updateStage };
})();
