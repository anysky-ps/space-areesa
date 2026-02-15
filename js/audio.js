
// ===== audio.js - Hybrid Audio System (MP3 BGM + Synth SE) =====
const GameAudio = (() => {
    // --- BGM System (HTML5 Audio) ---
    const tracks = {
        main: new Audio('assets/audio/bgm_main.mp3'),
        invincible: new Audio('assets/audio/bgm_invincible.mp3'),
        ending: new Audio('assets/audio/bgm_ending.mp3'),
        leader: new Audio('assets/audio/bgm_leader.mp3')
    };

    let currentTrack = null;
    let bgmPlaying = false;

    // Configure tracks
    Object.values(tracks).forEach(track => {
        track.loop = true;
        track.volume = 0.3;
    });
    // Ending might not loop or loop differently? Let's Loop for now.
    tracks.ending.loop = true;

    // --- SE System (Web Audio API) ---
    let ctx = null;
    let masterGain = null;
    let seGain = null;
    let muted = false;
    let initialized = false;

    function init() {
        if (initialized) return;
        initialized = true;

        // Initialize Web Audio for SE
        try {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = ctx.createGain();
            masterGain.gain.value = 0.5;
            masterGain.connect(ctx.destination);

            seGain = ctx.createGain();
            seGain.gain.value = 0.5;
            seGain.connect(masterGain);
        } catch (e) {
            console.error("Web Audio init failed:", e);
        }

        // Attempt to unlock audio contexts on first interaction
        if (ctx && ctx.state === 'suspended') {
            ctx.resume();
        }

        // Warm up HTML5 Audio tracks for mobile (once only)
        Object.values(tracks).forEach(track => {
            track.load();
            const p = track.play();
            if (p !== undefined) {
                p.then(() => {
                    // Only pause if this isn't the currently intended track
                    // (Actually, at init time usually nothing is playing yet, 
                    // but let's be safe and check currentTrack)
                    if (track !== currentTrack) {
                        track.pause();
                        track.currentTime = 0;
                    }
                }).catch(e => console.log("Audio unlock muted/prevented:", e));
            }
        });
    }

    function toggleMute() {
        muted = !muted;

        // Mute SE
        if (masterGain) masterGain.gain.value = muted ? 0 : 0.5;

        // Mute BGM
        Object.values(tracks).forEach(t => {
            t.muted = muted;
        });

        return muted;
    }

    // --- BGM Control ---

    function playTrack(name) {
        if (muted && currentTrack) currentTrack.muted = true;

        const nextTrack = tracks[name];
        if (!nextTrack) {
            console.error(`BGM Track not found: ${name}`);
            return;
        }

        // If we are already playing this track
        if (currentTrack === nextTrack) {
            if (currentTrack.paused && bgmPlaying) {
                currentTrack.play().catch(e => console.warn("BGM resume failed:", e));
            }
            return;
        }

        // Stop old track
        if (currentTrack) {
            currentTrack.pause();
            currentTrack.currentTime = 0;
        }

        // Start new track
        currentTrack = nextTrack;
        bgmPlaying = true;

        // specific volume adjustments if needed
        if (name === 'invincible') currentTrack.volume = 0.25;
        else if (name === 'leader') currentTrack.volume = 0.4;
        else currentTrack.volume = 0.3;

        currentTrack.play()
            .then(() => console.log(`BGM playing: ${name}`))
            .catch(e => console.warn(`BGM play failed for ${name}:`, e));
    }

    function stopBGM() {
        bgmPlaying = false;
        if (currentTrack) {
            currentTrack.pause();
            currentTrack.currentTime = 0;
        }
        currentTrack = null;
    }

    function startBGM() {
        playTrack('main');
    }

    function startInvincibleBGM() {
        playTrack('invincible');
    }

    function startEndingBGM() {
        playTrack('ending');
    }

    function startTitleBGM() {
        playTrack('leader');
    }

    // --- SE Synthesis Functions ---
    // (Kept from original logic)

    function playNote(freq, duration, type = 'square', gainNode = seGain, time = 0) {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        env.gain.setValueAtTime(0.3, ctx.currentTime + time);
        env.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + duration);
        osc.connect(env);
        env.connect(gainNode);
        osc.start(ctx.currentTime + time);
        osc.stop(ctx.currentTime + time + duration);
    }

    function playNoise(duration, gainNode, time = 0, vol = 0.1) {
        if (!ctx) return;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const env = ctx.createGain();
        env.gain.setValueAtTime(vol, ctx.currentTime + time);
        env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + duration);
        noise.connect(env);
        env.connect(gainNode);
        noise.start(ctx.currentTime + time);
    }

    // SE - Shoot
    function playShoot() {
        if (!ctx) return;
        playNote(880, 0.08, 'square', seGain);
        playNote(660, 0.06, 'square', seGain, 0.02);
    }

    // SE - Explosion
    function playExplosion() {
        if (!ctx) return;
        playNote(120, 0.3, 'sawtooth', seGain);
        playNoise(0.4, seGain, 0, 0.2);
        playNote(60, 0.5, 'sine', seGain, 0.1);
    }

    // SE - Item pickup
    function playItemPickup() {
        if (!ctx) return;
        // C E G C
        playNote(523.25, 0.1, 'square', seGain);
        playNote(659.25, 0.1, 'square', seGain, 0.08);
        playNote(783.99, 0.1, 'square', seGain, 0.16);
        playNote(1046.50, 0.2, 'square', seGain, 0.24);
    }

    // SE - Damage
    function playDamage() {
        if (!ctx) return;
        playNote(200, 0.15, 'sawtooth', seGain);
        playNote(100, 0.2, 'sawtooth', seGain, 0.05);
        playNoise(0.2, seGain, 0, 0.15);
    }

    // SE - Rescue jingle
    function playRescue() {
        if (!ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50, 659.25, 783.99, 1046.50];
        notes.forEach((n, i) => {
            playNote(n, 0.15, 'square', seGain, i * 0.12);
        });
    }

    // SE - 1UP
    function play1UP() {
        if (!ctx) return;
        const notes = [659.25, 783.99, 987.77, 659.25, 987.77, 783.99]; // E G B E B G
        notes.forEach((n, i) => {
            playNote(n, 0.12, 'triangle', seGain, i * 0.1);
        });
    }

    return {
        init, startTitleBGM, startBGM, startEndingBGM, startInvincibleBGM, stopBGM,
        playShoot, playExplosion, playItemPickup, playDamage, playRescue, play1UP,
        toggleMute
    };
})();
