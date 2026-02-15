// ===== stages.js - Stage Definitions & Friend Data =====
const Stages = (() => {
    const friends = [
        {
            stage: 1,
            name: 'フーフー・チャン & ミニ・モーナ',
            comment: 'ありがとう！これでビールが飲める！（フーフー）<br>助かったミ～ンゴ！（ミニ・モーナ）',
            image: 'assets/images/fufu_minimona.png'
        },
        /* Mini Mona removed as per request */
        // Stage 2
        // Stage 2
        {
            stage: 2,
            name: 'ナシナシ・ポー',
            comment: 'ずっと板見られなくて不安だった…私のポートフォリオどうなってる？！',
            image: 'assets/images/nashinashi.png'
        },
        // Stage 3
        {
            stage: 3,
            name: 'ハール・ピカピカ',
            comment: '助けてくだサイドチェスト…ふにゅっ',
            image: 'assets/images/pikapika.png'
        },
        // Stage 4
        {
            stage: 4,
            name: 'スライム・ナツーメ',
            comment: 'ありがとう、ミルクティー持ってない？',
            image: 'assets/images/natsume.png'
        },
        // Stage 5
        {
            stage: 5,
            name: 'ラ・メーナ',
            comment: '毎日自分と見つめあいながら…歩く',
            image: 'assets/images/ramena.png'
        },
        // Stage 6
        {
            stage: 6,
            name: 'ミ・グルグル',
            comment: 'アリーサちゃん、遅い！',
            image: 'assets/images/gugguru.png'
        }
    ];

    const stageData = [
        {
            id: 1,
            name: '陽光噴水',
            waves: [
                { time: 2, type: 'basic', count: 3, spread: true },
                { time: 5, type: 'basic', count: 4, spread: true },
                { time: 8, type: 'sine', count: 2, spread: true },
                { time: 11, type: 'basic', count: 5, spread: true },
                { time: 14, type: 'sine', count: 3, spread: true },
                { time: 18, type: 'boss', count: 1, spread: false }
            ],
            bgTint: { r: 20, g: 10, b: 40 }
        },
        {
            id: 2,
            name: '晴れ舞台',
            waves: [
                { time: 2, type: 'sine', count: 3, spread: true },
                { time: 5, type: 'swoop', count: 2, spread: true },
                { time: 8, type: 'basic', count: 5, spread: true },
                { time: 11, type: 'sine', count: 4, spread: true },
                { time: 14, type: 'swoop', count: 3, spread: true },
                { time: 17, type: 'tank', count: 1, spread: false },
                { time: 20, type: 'boss', count: 1, spread: false }
            ],
            bgTint: { r: 15, g: 15, b: 50 }
        },
        {
            id: 3,
            name: '地下歩道',
            waves: [
                { time: 2, type: 'swoop', count: 3, spread: true },
                { time: 5, type: 'tank', count: 1, spread: false },
                { time: 7, type: 'sine', count: 4, spread: true },
                { time: 10, type: 'swoop', count: 4, spread: true },
                { time: 13, type: 'basic', count: 6, spread: true },
                { time: 16, type: 'tank', count: 2, spread: true },
                { time: 20, type: 'boss', count: 1, spread: false }
            ],
            bgTint: { r: 10, g: 5, b: 25 }
        },
        {
            id: 4,
            name: '禁止の街',
            waves: [
                { time: 2, type: 'tank', count: 2, spread: true },
                { time: 5, type: 'swoop', count: 4, spread: true },
                { time: 8, type: 'sine', count: 5, spread: true },
                { time: 11, type: 'tank', count: 2, spread: true },
                { time: 13, type: 'swoop', count: 5, spread: true },
                { time: 16, type: 'basic', count: 8, spread: true },
                { time: 19, type: 'tank', count: 3, spread: true },
                { time: 23, type: 'boss', count: 1, spread: false }
            ],
            bgTint: { r: 30, g: 5, b: 15 }
        },
        {
            id: 5,
            name: '超新星爆発',
            waves: [
                { time: 2, type: 'swoop', count: 5, spread: true },
                { time: 5, type: 'tank', count: 3, spread: true },
                { time: 8, type: 'sine', count: 6, spread: true },
                { time: 11, type: 'swoop', count: 6, spread: true },
                { time: 14, type: 'tank', count: 2, spread: true },
                { time: 16, type: 'basic', count: 8, spread: true },
                { time: 19, type: 'sine', count: 5, spread: true },
                { time: 22, type: 'tank', count: 3, spread: true },
                { time: 26, type: 'boss', count: 1, spread: false }
            ],
            bgTint: { r: 40, g: 10, b: 20 }
        },
        {
            id: 6,
            name: '光栄帝国',
            waves: [
                { time: 2, type: 'tank', count: 3, spread: true },
                { time: 5, type: 'swoop', count: 6, spread: true },
                { time: 8, type: 'sine', count: 7, spread: true },
                { time: 11, type: 'tank', count: 4, spread: true },
                { time: 14, type: 'swoop', count: 5, spread: true },
                { time: 16, type: 'basic', count: 10, spread: true },
                { time: 19, type: 'sine', count: 6, spread: true },
                { time: 22, type: 'tank', count: 4, spread: true },
                { time: 25, type: 'swoop', count: 7, spread: true },
                { time: 29, type: 'bigMan', count: 1, spread: false }
            ],
            bgTint: { r: 50, g: 20, b: 50 }
        }
    ];

    function getFriendsForStage(stageNum) {
        return friends.filter(f => f.stage === stageNum);
    }

    function getStageData(stageNum) {
        return stageData[stageNum - 1] || null;
    }

    function getTotalStages() {
        return stageData.length;
    }

    return { getFriendsForStage, getStageData, getTotalStages, friends };
})();
