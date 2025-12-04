'use strict';

const CONFIG = {
    // 功能开关
    features: {
        confessionMode: 'auto',  // 'auto' | 'show' | 'hide'
        music: true,
        particles: true,
        shootingStars: true,
        starfield: true,
        editMode: true,
        heartRain: true
    },

    // 开发者选项
    developer: {
        enabled: true,
        debugLog: false,
        showDevSettings: true
    },

    // 视觉效果参数
    visual: {
        starfield: {
            count: 320,
            layers: {
                far: {ratio: 0.50, sizeRange: [0.3, 1.0], opacityRange: [0.12, 0.35]},
                mid: {ratio: 0.35, sizeRange: [0.6, 1.6], opacityRange: [0.25, 0.55]},
                near: {ratio: 0.15, sizeRange: [1.2, 2.8], opacityRange: [0.45, 0.85]}
            }
        },
        particles: {
            count: 12,
            colors: ['rgba(255,182,193,0.6)', 'rgba(255,218,185,0.5)', 'rgba(230,230,250,0.5)', 'rgba(176,224,230,0.4)'],
            sizeRange: [2, 5],
            durationRange: [15, 25],
            driftRange: [-40, 40]
        },
        shootingStars: {
            interval: [3000, 7000],
            durationRange: [0.8, 1.4],
            startXRange: [20, 85],
            startYRange: [0, 35],
            sizeRange: [3, 6],
            tailLengthRange: [100, 180]
        },
        heartRain: {
            count: 35,
            duration: [2.5, 4.5]
        }
    },

    // UI配置
    ui: {
        noButtonTexts: [
            '让我想想...',
            '真的不考虑一下吗？',
            '给我一次机会好不好？',
            '我会对你很好的！',
            '难道你不想试试看吗？',
            '最后一次机会哦～'
        ],
        pagination: {
            storyPerPage: 4,
            memoryPerPage: 6
        },
        toast: {
            duration: 2500,
            maxVisible: 3
        }
    },

    // 存储配置
    storage: {
        prefix: 'love_story_v3_',
        keys: {
            confession: 'confession_status',
            story: 'story_items',
            memory: 'memory_items',
            journey: 'journey_text',
            anniversaries: 'anniversary_items'
        }
    },

    // 音乐配置
    music: {
        src: 'assets/music/bgm.mp3',
        volume: 0.4,
        autoPlay: false
    }
};

// 配置验证
(function () {
    const required = ['features.confessionMode', 'storage.prefix', 'storage.keys'];
    required.forEach(path => {
        const keys = path.split('.');
        let val = CONFIG;
        for (const k of keys) {
            if (!val || val[k] === undefined) {
                console.error(`配置错误：缺少 ${path}`);
                return;
            }
            val = val[k];
        }
    });
    Object.freeze(CONFIG.features);
    Object.freeze(CONFIG.visual);
    Object.freeze(CONFIG.ui);
    Object.freeze(CONFIG.storage);
    Object.freeze(CONFIG.music);
})();
