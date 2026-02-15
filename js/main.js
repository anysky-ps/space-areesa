// ===== main.js - Game Loop & State Machine =====
const Game = (() => {
    const W = GameCanvas.GAME_W;
    const H = GameCanvas.GAME_H;
    const ctx = GameCanvas.ctx;

    // Game states
    const STATE = {
        TITLE: 'TITLE',
        STAGE_INTRO: 'STAGE_INTRO',
        PLAYING: 'PLAYING',
        PAUSED: 'PAUSED',
        STAGE_CLEAR: 'STAGE_CLEAR',
        GAME_OVER: 'GAME_OVER',
        ALL_CLEAR: 'ALL_CLEAR'
    };

    let currentState = STATE.TITLE;
    let score = 0;
    let highScore = parseInt(localStorage.getItem('spaceAreesaHighScore') || '0');
    let currentStage = 1;
    let difficulty = 'normal';
    let stageTimer = 0;
    let waveIndex = 0;
    let bossDefeated = false;
    let introTimer = 0;
    let lastTime = 0;
    let gameTime = 0;

    // Difficulty multipliers
    const DIFF = {
        easy: { hp: 0.7, speed: 0.8, bulletSpeed: 0.7, shootRate: 0.7, spawnMult: 0.7 },
        normal: { hp: 1, speed: 1, bulletSpeed: 1, shootRate: 1, spawnMult: 1 },
        hard: { hp: 1.5, speed: 1.2, bulletSpeed: 1.4, shootRate: 1.3, spawnMult: 1.3 }
    };

    // Screen management
    function showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        if (id) document.getElementById(id).classList.add('active');
    }

    function togglePause() {
        if (currentState === STATE.PLAYING) {
            currentState = STATE.PAUSED;
            showScreen('pause-overlay');
            HUD.show();
            // Don't stop BGM, just pause game loop logic
        } else if (currentState === STATE.PAUSED) {
            currentState = STATE.PLAYING;
            document.getElementById('pause-overlay').classList.remove('active');
            HUD.show();
        }
    }

    // Initialize
    function init() {
        document.getElementById('title-highscore').textContent = highScore.toLocaleString();
        showScreen('title-screen');

        // BGM Unlock: Play title BGM on first interaction (anywhere on body)
        const unlockAudio = () => {
            GameAudio.init();
            if (currentState === STATE.TITLE) {
                GameAudio.startTitleBGM();
            }
            document.removeEventListener('mousedown', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };
        document.addEventListener('mousedown', unlockAudio);
        document.addEventListener('touchstart', unlockAudio);
        document.addEventListener('keydown', unlockAudio);

        // Difficulty buttons (starts game logic)
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                difficulty = e.currentTarget.dataset.difficulty;
                startGame();
            });
        });

        // Retry button
        document.getElementById('retry-btn').addEventListener('click', () => {
            startGame();
        });

        // Title buttons
        document.getElementById('to-title-btn').addEventListener('click', goToTitle);
        document.getElementById('allclear-title-btn').addEventListener('click', goToTitle);

        // Pause buttons
        document.getElementById('pause-btn').addEventListener('click', togglePause);
        document.getElementById('resume-btn').addEventListener('click', togglePause);
        document.getElementById('quit-btn').addEventListener('click', () => {
            document.getElementById('pause-overlay').style.display = 'none';
            goToTitle();
        });

        // Next stage button
        document.getElementById('next-stage-btn').addEventListener('click', () => {
            nextStage();
        });

        // Start animation loop
        requestAnimationFrame(loop);
    }

    function goToTitle() {
        currentState = STATE.TITLE;
        document.getElementById('title-highscore').textContent = highScore.toLocaleString();
        showScreen('title-screen');
        GameAudio.startTitleBGM();
        HUD.hide();
    }

    function startGame() {
        score = 0;
        currentStage = 1;
        currentState = STATE.STAGE_INTRO;

        Player.init();
        Bullets.clear();
        Enemies.clear();
        Items.clear();
        Effects.clear();
        Background.init();

        HUD.show();
        HUD.updateScore(0);
        HUD.updateLives(3);

        GameAudio.startBGM();
        startStageIntro();
    }

    function startStageIntro() {
        const stage = Stages.getStageData(currentStage);
        if (!stage) return;

        currentState = STATE.STAGE_INTRO;
        introTimer = 2.5;

        document.getElementById('stage-number').textContent = currentStage;
        document.getElementById('stage-name').textContent = stage.name;
        showScreen('stage-intro');

        HUD.updateStage(currentStage, stage.name);
    }

    function startPlaying() {
        currentState = STATE.PLAYING;
        stageTimer = 0;
        waveIndex = 0;
        bossDefeated = false;
        gameTime = 0;

        Bullets.clear();
        Enemies.clear();
        Items.clear();

        showScreen(null); // Hide all overlays
    }

    function nextStage() {
        console.log(`nextStage called. Current: ${currentStage}, Total: ${Stages.getTotalStages()}`);
        currentStage++;
        if (currentStage > Stages.getTotalStages()) {
            console.log("Triggering All Clear");
            allClear();
        } else {
            console.log("Starting Stage Intro");
            startStageIntro();
        }
    }

    function stageClear() {
        currentState = STATE.STAGE_CLEAR;

        const friends = Stages.getFriendsForStage(currentStage);
        const container = document.getElementById('rescue-friends');
        container.innerHTML = '';

        friends.forEach(f => {
            const card = document.createElement('div');
            card.className = 'friend-card';
            let imgHtml = '';
            if (f.image) {
                imgHtml = `<img src="${f.image}" class="friend-image-large" alt="${f.name}">`;
            } else {
                imgHtml = `<div class="friend-image-large" style="background:#444; height:100px; display:flex; align-items:center; justify-content:center;">NO IMAGE</div>`;
            }
            card.innerHTML = `
                ${imgHtml}
                <div class="friend-name">${f.name}</div>
                <div class="friend-comment">「${f.comment}」</div>
            `;
            container.appendChild(card);
        });

        const nextBtn = document.getElementById('next-stage-btn');
        if (currentStage >= Stages.getTotalStages()) {
            nextBtn.textContent = 'COMPLETE! →';
        } else {
            nextBtn.textContent = 'NEXT STAGE →';
        }

        showScreen('rescue-dialog');
        GameAudio.playRescue();

        score += 1000 * currentStage;
        HUD.updateScore(score);
        try { saveHighScore(); } catch (e) { console.error("High score save failed", e); }
    }

    function gameOver() {
        currentState = STATE.GAME_OVER;
        try { saveHighScore(); } catch (e) { console.error("High score save failed", e); }
        HUD.hide();

        document.getElementById('final-score').textContent = score.toLocaleString();
        document.getElementById('final-highscore').textContent = highScore.toLocaleString();
        document.getElementById('final-stage').textContent = currentStage;
        showScreen('gameover-screen');
        GameAudio.stopBGM();
    }

    async function allClear() {
        console.log("Executing allClear sequence");
        currentState = STATE.ALL_CLEAR;
        try { saveHighScore(); } catch (e) { console.error("High score save failed", e); }

        HUD.hide();
        showScreen('ending-screen');

        GameAudio.stopBGM();
        setTimeout(() => {
            console.log("Playing Ending BGM");
            GameAudio.startEndingBGM();
        }, 500);

        const container = document.querySelector('#ending-screen .ending-content');
        container.innerHTML = '';
        const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // 1. Slideshow
        const friends = Stages.friends;
        if (friends) {
            for (const f of friends) {
                if (!f.image) continue;
                const img = document.createElement('img');
                img.src = f.image;
                img.className = 'ending-slide-img';
                const name = document.createElement('div');
                name.className = 'ending-slide-name';
                name.textContent = f.name;
                container.appendChild(img);
                container.appendChild(name);
                await wait(4000);
                img.remove();
                name.remove();
                await wait(500);
            }
        }

        // Areesa at the end
        const areesaImg = document.createElement('img');
        areesaImg.src = 'assets/images/title.png';
        areesaImg.className = 'ending-slide-img';
        const areesaName = document.createElement('div');
        areesaName.className = 'ending-slide-name';
        areesaName.textContent = "SPACE AREESA";
        container.appendChild(areesaImg);
        container.appendChild(areesaName);
        await wait(5000);
        areesaImg.remove();
        areesaName.remove();

        // 2. Narration with Event Image
        const eventImg = document.createElement('img');
        eventImg.src = 'assets/images/event_ending.png';
        eventImg.className = 'ending-event-img';
        container.appendChild(eventImg);

        const narration = document.createElement('div');
        narration.className = 'ending-narration';
        narration.innerHTML = "こうして、スペース・アリーサは<br>7人の大切な友達を救い、<br>宇宙の平和を取り戻しました";
        container.appendChild(narration);

        // 3. NEXT Button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'ending-next-btn';
        nextBtn.textContent = 'NEXT';
        container.appendChild(nextBtn);

        // Wait for user to click NEXT
        await new Promise(resolve => {
            const handleInteract = (e) => {
                e.stopPropagation();
                nextBtn.removeEventListener('click', handleInteract);
                nextBtn.removeEventListener('touchstart', handleInteract);
                resolve();
            };
            nextBtn.addEventListener('click', handleInteract);
            nextBtn.addEventListener('touchstart', handleInteract);
        });

        // Cleanup narration/event image/next button
        eventImg.remove();
        narration.remove();
        nextBtn.remove();

        // 4. Birthday Message (Persistent)
        const bdayFrame = document.createElement('div');
        bdayFrame.className = 'birthday-frame';
        bdayFrame.innerHTML = '<div class="birthday-text">Happy Birthday<br>ARISA !!</div>';
        container.appendChild(bdayFrame);

        await wait(5000); // 5 seconds wait

        // 5. Staff Roll (Appears sequentially below the birthday frame)
        const rollDiv = document.createElement('div');
        rollDiv.className = 'staff-roll-container';
        container.appendChild(rollDiv);

        const credits = [
            { role: "GAME DESIGN", name: "えにすけ" },
            { role: "PROGRAMMING", name: "えにすけ with 反重力" },
            { role: "CHARACTER DESIGN", name: "ありさっさ" },
            { role: "MUSIC", name: "Suno" },
            { role: "SPECIAL THANKS", name: "ありさっさ" },
            { role: "AND YOU", name: "THANK YOU FOR PLAYING!" }
        ];

        for (const c of credits) {
            const section = document.createElement('div');
            section.className = 'staff-section';
            section.innerHTML = `
                <div class="staff-role">${c.role}</div>
                <div class="staff-name">${c.name}</div>
            `;
            rollDiv.appendChild(section);
        }

        // Add a giant spacer at the bottom so we can scroll past everything
        const spacer = document.createElement('div');
        spacer.style.height = '600px';
        container.appendChild(spacer);

        // --- Smooth Scrolling Loop ---
        let scrollSpeed = 0.8; // pixels per frame
        function startScrolling() {
            if (currentState !== STATE.ALL_CLEAR) return;

            // Detect if title button is in a good position and stop
            const btn = document.getElementById('ending-title-btn');
            if (btn) {
                const rect = btn.getBoundingClientRect();
                // Stop when the button is about 350px from the top (below the birthday frame)
                if (rect.top <= 350) {
                    return;
                }
            }

            container.scrollTop += scrollSpeed;

            // Limit scroll if we haven't reached the bottom
            if (container.scrollTop < container.scrollHeight - container.clientHeight) {
                requestAnimationFrame(startScrolling);
            }
        }

        // Add the button relatively early so the loop can detect it
        const titleBtn = document.createElement('button');
        titleBtn.id = 'ending-title-btn';
        titleBtn.className = 'title-btn visible';
        titleBtn.textContent = 'TITLE';
        titleBtn.style.position = 'relative';
        titleBtn.style.marginTop = '50px';
        titleBtn.style.opacity = '1';
        titleBtn.style.pointerEvents = 'auto';
        titleBtn.style.display = 'block'; // Ensure it's measurable

        titleBtn.onclick = (e) => { e.stopPropagation(); goToTitle(); };
        titleBtn.ontouchstart = (e) => { e.stopPropagation(); goToTitle(); };

        container.appendChild(titleBtn);

        // Start scrolling
        requestAnimationFrame(startScrolling);
    }

    function saveHighScore() {
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('spaceAreesaHighScore', highScore.toString());
        }
    }

    // Track BGM state for invincible mode
    let isInvincibleBGM = false;

    // Main game loop
    function loop(timestamp) {
        try {
            const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
            lastTime = timestamp;

            // Always update and draw background
            Background.update(dt);

            if (currentState === STATE.STAGE_INTRO) {
                introTimer -= dt;
                if (introTimer <= 0) {
                    startPlaying();
                }
            }

            if (currentState === STATE.PLAYING) {
                // Check for hit-stop
                if (!Effects.isHitStopped()) {
                    updateGame(dt);
                }
                Effects.update(dt);

                // BGM Management for Invincibility
                if (Player.state.mikanInvincible && !isInvincibleBGM) {
                    isInvincibleBGM = true;
                    GameAudio.startInvincibleBGM();
                } else if (!Player.state.mikanInvincible && isInvincibleBGM) {
                    isInvincibleBGM = false;
                    // Revert to normal BGM
                    GameAudio.stopBGM();
                    setTimeout(() => GameAudio.startBGM(), 100);
                }
            } else if (currentState === STATE.PAUSED) {
                // Do nothing (pause)
            } else {
                // If not playing (e.g. Game Over/Stage Clear), ensure invincible BGM flag resets if we were invincible
                isInvincibleBGM = false;
            }

            // Draw everything
            drawGame();
        } catch (e) {
            console.error("Game Loop Error:", e);
        }

        requestAnimationFrame(loop);
    }

    function updateGame(dt) {
        gameTime += dt;
        stageTimer += dt;

        const diffMult = DIFF[difficulty];
        const stage = Stages.getStageData(currentStage);

        // Spawn waves
        if (stage && waveIndex < stage.waves.length) {
            const wave = stage.waves[waveIndex];
            if (stageTimer >= wave.time) {
                spawnWave(wave, diffMult);
                waveIndex++;
            }
        }

        // Update game objects
        Player.update(dt);
        Bullets.update(dt);
        Enemies.update(dt, Player.state.x, Player.state.y, diffMult);
        Items.update(dt);

        // Collision: player bullets vs enemies
        for (let i = Bullets.playerBullets.length - 1; i >= 0; i--) {
            const b = Bullets.playerBullets[i];
            for (let j = Enemies.list.length - 1; j >= 0; j--) {
                const e = Enemies.list[j];
                if (Utils.rectCollision(
                    { x: b.x, y: b.y, w: b.w, h: b.h },
                    { x: e.x - e.w / 2, y: e.y - e.h / 2, w: e.w, h: e.h }
                )) {
                    Bullets.playerBullets.splice(i, 1);
                    Effects.spawnHitSpark(b.x + b.w / 2, b.y);

                    const result = Enemies.damageEnemy(j, b.damage);
                    if (result) {
                        // Enemy destroyed
                        score += result.score;
                        HUD.updateScore(score);
                        Effects.spawnExplosion(result.x, result.y,
                            (result.type === 'boss' || result.type === 'bigMan') ? '#ff44aa' : '#ff8844',
                            (result.type === 'boss' || result.type === 'bigMan') ? 30 : 15);
                        Effects.spawnScoreText(result.x, result.y - 20, result.score);
                        Effects.triggerHitStop(0.05);
                        GameAudio.playExplosion();
                        Items.tryDropItem(result.x, result.y);

                        if (result.type === 'boss' || result.type === 'bigMan') {
                            bossDefeated = true;
                            // Clear all enemy bullets on boss defeat
                            Bullets.enemyBullets.length = 0;
                            // Delay before stage clear
                            setTimeout(() => {
                                if (currentState === STATE.PLAYING) {
                                    stageClear();
                                }
                            }, 1500);
                        }
                    }
                    break;
                }
            }
        }

        // Collision: enemy bullets vs player
        if (Player.state.alive && !Player.state.invincible && !Player.state.mikanInvincible) {
            const ph = Player.getHitbox();
            for (let i = Bullets.enemyBullets.length - 1; i >= 0; i--) {
                const b = Bullets.enemyBullets[i];
                const bx = b.x + b.w / 2;
                const by = b.y + b.h / 2;
                if (Utils.circleCollision(ph.x, ph.y, ph.radius, bx, by, b.radius || 4)) {
                    Bullets.enemyBullets.splice(i, 1);
                    const dmgResult = Player.takeDamage();
                    HUD.updateLives(Player.state.lives);
                    if (dmgResult === 'gameover') {
                        setTimeout(() => gameOver(), 1000);
                    }
                    break;
                }
            }
        }

        // Collision: enemies vs player (body contact)
        if (Player.state.alive && !Player.state.invincible && !Player.state.mikanInvincible) {
            const ph = Player.getHitbox();
            for (let j = 0; j < Enemies.list.length; j++) {
                const e = Enemies.list[j];
                if (Utils.circleCollision(ph.x, ph.y, ph.radius, e.x, e.y, e.w / 2)) {
                    const dmgResult = Player.takeDamage();
                    HUD.updateLives(Player.state.lives);
                    if (dmgResult === 'gameover') {
                        setTimeout(() => gameOver(), 1000);
                    }
                    break;
                }
            }
        }

        // Item collection
        if (Player.state.alive) {
            const ph = Player.getHitbox();
            const collected = Items.checkCollision(ph.x, ph.y, ph.radius + 15);
            if (collected === 'mikan') {
                Player.collectMikan();
            } else if (collected === 'kamakiri') {
                Player.collectKamakiri();
                HUD.updateLives(Player.state.lives);
            }
        }
    }

    function spawnWave(wave, diffMult) {
        const count = Math.ceil(wave.count * (diffMult.spawnMult || 1));
        if (wave.type === 'boss') {
            const friends = Stages.getFriendsForStage(currentStage);
            const friendImgSrc = (friends && friends.length > 0) ? friends[0].image : null;
            const bossMultiplier = { ...diffMult, hp: diffMult.hp * (1 + (currentStage - 1) * 0.4), friendImgSrc: friendImgSrc };
            Enemies.spawn('boss', W / 2, -40, bossMultiplier);
        } else if (wave.type === 'bigMan') {
            const friends = Stages.getFriendsForStage(currentStage);
            const friendImgSrc = (friends && friends.length > 0) ? friends[0].image : null;
            const bossMultiplier = { ...diffMult, hp: diffMult.hp * (1 + (currentStage - 1) * 0.4), friendImgSrc: friendImgSrc };
            Enemies.spawn('bigMan', W / 2, -40, bossMultiplier);
        } else {
            for (let i = 0; i < count; i++) {
                const x = wave.spread ? Utils.rand(40, W - 40) : W / 2;
                const y = -30 - i * 40;
                const stageMult = { ...diffMult, hp: diffMult.hp * (1 + (currentStage - 1) * 0.2) };
                Enemies.spawn(wave.type, x, y, stageMult);
            }
        }
    }

    function drawGame() {
        const shake = Effects.getShake();
        ctx.save();
        ctx.translate(shake.x, shake.y);
        Background.draw(ctx);
        if (currentState === STATE.PLAYING || currentState === STATE.STAGE_CLEAR) {
            Items.draw(ctx);
            Bullets.draw(ctx);
            Enemies.draw(ctx);
            Player.draw(ctx);
            Effects.draw(ctx);
        }
        ctx.restore();
    }

    init();
    if (window.Debug) window.Debug.init();

    return {
        getState: () => currentState,
        getScore: () => score,
        debugNextStage: () => nextStage(),
        handleEnemyDeath: (result) => {
            if (!result) return;
            score += result.score;
            HUD.updateScore(score);
            Effects.spawnExplosion(result.x, result.y,
                (result.type === 'boss' || result.type === 'bigMan') ? '#ff44aa' : '#ff8844',
                (result.type === 'boss' || result.type === 'bigMan') ? 30 : 15);
            Effects.spawnScoreText(result.x, result.y - 20, result.score);
            GameAudio.playExplosion();
            if (result.type === 'boss' || result.type === 'bigMan') {
                bossDefeated = true;
                Bullets.enemyBullets.length = 0;
                setTimeout(() => {
                    if (currentState === STATE.PLAYING) stageClear();
                }, 1500);
            }
        }
    };
})();
window.Game = Game;
