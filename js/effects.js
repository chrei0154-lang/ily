'use strict';

// 星空背景
const Starfield = {
    canvas: null,
    ctx: null,
    stars: [],
    animationId: null,
    lastTime: 0,

    init() {
        if (!CONFIG.features.starfield) return;
        this.canvas = document.getElementById('starsCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.createStars();
        this.lastTime = performance.now();
        this.animate();
        window.addEventListener('resize', () => {
            this.resize();
            this.createStars();
        });
    },

    resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
        this.ctx.scale(dpr, dpr);
    },

    createStars() {
        const config = CONFIG.visual.starfield;
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.stars = [];

        const baseCount = config.count;
        const screenFactor = Math.min(width * height / (1920 * 1080), 1.5);
        const count = Math.floor(baseCount * screenFactor);

        for (let i = 0; i < count; i++) {
            const layer = Math.random();
            let layerConfig;

            if (layer < config.layers.far.ratio) {
                layerConfig = config.layers.far;
            } else if (layer < config.layers.far.ratio + config.layers.mid.ratio) {
                layerConfig = config.layers.mid;
            } else {
                layerConfig = config.layers.near;
            }

            const [minSize, maxSize] = layerConfig.sizeRange;
            const [minOpacity, maxOpacity] = layerConfig.opacityRange;
            const size = Math.random() * (maxSize - minSize) + minSize;
            const opacity = Math.random() * (maxOpacity - minOpacity) + minOpacity;
            const twinkleSpeed = 0.005 + Math.random() * 0.02 * (1 + opacity);

            this.stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size,
                baseOpacity: opacity,
                opacity,
                twinkleSpeed,
                twinklePhase: Math.random() * Math.PI * 2,
                color: this.getStarColor()
            });
        }
    },

    getStarColor() {
        const rand = Math.random();
        if (rand > 0.92) return `hsl(${340 + Math.random() * 30}, 70%, 85%)`;
        if (rand > 0.85) return `hsl(${40 + Math.random() * 20}, 50%, 88%)`;
        if (rand > 0.80) return `hsl(${200 + Math.random() * 30}, 40%, 90%)`;
        return 'white';
    },

    animate(currentTime = 0) {
        if (!this.ctx) return;
        this.lastTime = currentTime;
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.ctx.clearRect(0, 0, width, height);

        this.stars.forEach(star => {
            star.twinklePhase += star.twinkleSpeed;
            const twinkleFactor = 0.6 + Math.sin(star.twinklePhase) * 0.4;
            star.opacity = star.baseOpacity * twinkleFactor;

            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);

            if (star.color === 'white') {
                this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            } else {
                this.ctx.fillStyle = star.color.replace(')', `, ${star.opacity})`).replace('hsl', 'hsla');
            }
            this.ctx.fill();

            if (star.size > 1.2) {
                const gradient = this.ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 5);
                gradient.addColorStop(0, `rgba(255, 220, 230, ${star.opacity * 0.4})`);
                gradient.addColorStop(0.5, `rgba(255, 200, 220, ${star.opacity * 0.15})`);
                gradient.addColorStop(1, 'transparent');
                this.ctx.beginPath();
                this.ctx.arc(star.x, star.y, star.size * 5, 0, Math.PI * 2);
                this.ctx.fillStyle = gradient;
                this.ctx.fill();
            }
        });

        this.animationId = requestAnimationFrame(t => this.animate(t));
    },

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
};

// 星尘粒子
const FloatingParticles = {
    container: null,
    particles: [],
    intervalId: null,

    init() {
        if (!CONFIG.features.particles) return;
        this.container = document.getElementById('floatingParticles');
        if (!this.container) return;
        this.maxParticles = CONFIG.visual.particles.count;
        this.start();
    },

    start() {
        for (let i = 0; i < Math.min(4, this.maxParticles); i++) {
            setTimeout(() => this.createParticle(), i * 600);
        }
        this.intervalId = setInterval(() => {
            if (this.particles.length < this.maxParticles) {
                this.createParticle();
            }
        }, 2000);
    },

    createParticle() {
        if (!this.container) return;
        const config = CONFIG.visual.particles;
        const particle = document.createElement('div');
        particle.className = 'floating-particle';

        const [minSize, maxSize] = config.sizeRange;
        const [minDur, maxDur] = config.durationRange;
        const [minDrift, maxDrift] = config.driftRange;

        const size = Math.random() * (maxSize - minSize) + minSize;
        const duration = Math.random() * (maxDur - minDur) + minDur;
        const delay = Math.random() * 5;
        const color = config.colors[Math.floor(Math.random() * config.colors.length)];
        const left = 5 + Math.random() * 90;
        const drift = Math.random() * (maxDrift - minDrift) + minDrift;

        particle.style.cssText = `
            left: ${left}%;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            box-shadow: 0 0 ${size * 3}px ${color};
            animation: particleFloat ${duration}s ease-in-out ${delay}s infinite;
            --drift: ${drift}px;
        `;

        this.container.appendChild(particle);
        this.particles.push(particle);

        const lifetime = (duration + delay) * 1000 + 2000;
        setTimeout(() => {
            particle.remove();
            const idx = this.particles.indexOf(particle);
            if (idx > -1) this.particles.splice(idx, 1);
        }, lifetime);
    },

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    clear() {
        this.particles.forEach(p => p.remove());
        this.particles = [];
    }
};

// 流星效果
const ShootingStars = {
    timeoutId: null,
    isRunning: false,

    init() {
        if (!CONFIG.features.shootingStars) return;
        this.isRunning = true;
        this.scheduleNext();
    },

    scheduleNext() {
        if (!this.isRunning) return;
        const [min, max] = CONFIG.visual.shootingStars.interval;
        const delay = Math.random() * (max - min) + min;
        this.timeoutId = setTimeout(() => {
            this.create();
            this.scheduleNext();
        }, delay);
    },

    create() {
        const config = CONFIG.visual.shootingStars;
        const star = document.createElement('div');
        star.className = 'shooting-star';

        const [minX, maxX] = config.startXRange;
        const [minY, maxY] = config.startYRange;
        const startX = Math.random() * (maxX - minX) + minX;
        const startY = Math.random() * (maxY - minY) + minY;

        star.style.left = `${startX}%`;
        star.style.top = `${startY}%`;

        const [minSize, maxSize] = config.sizeRange;
        const size = Math.random() * (maxSize - minSize) + minSize;
        star.style.setProperty('--star-size', `${size}px`);

        const [minTail, maxTail] = config.tailLengthRange;
        const tailLength = Math.random() * (maxTail - minTail) + minTail;
        star.style.setProperty('--tail-length', `${tailLength}px`);

        const [minDur, maxDur] = config.durationRange;
        const duration = Math.random() * (maxDur - minDur) + minDur;
        star.style.animationDuration = `${duration}s`;

        document.body.appendChild(star);
        setTimeout(() => star.remove(), duration * 1000 + 100);
    },

    stop() {
        this.isRunning = false;
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    },

    trigger(count = 5) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => this.create(), i * 200);
        }
    }
};

// 爱心雨
const HeartRain = {
    trigger() {
        if (!CONFIG.features.heartRain) return;
        const count = CONFIG.visual.heartRain.count;
        const [minDur, maxDur] = CONFIG.visual.heartRain.duration;

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.className = 'heart-rain';

                const size = Math.random() * 22 + 14;
                const duration = Math.random() * (maxDur - minDur) + minDur;
                const left = Math.random() * 100;
                const delay = Math.random() * 0.5;

                heart.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
                heart.style.left = `${left}%`;
                heart.style.animationDuration = `${duration}s`;
                heart.style.animationDelay = `${delay}s`;

                document.body.appendChild(heart);
                setTimeout(() => heart.remove(), (duration + delay) * 1000 + 100);
            }, i * 50);
        }
    }
};

// 特效管理器
const EffectsManager = {
    initialized: false,

    init() {
        if (this.initialized) return;
        Starfield.init();
        FloatingParticles.init();
        ShootingStars.init();

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.pause();
            else this.resume();
        });

        this.initialized = true;
    },

    pause() {
        Starfield.stop();
        FloatingParticles.stop();
        ShootingStars.stop();
    },

    resume() {
        if (CONFIG.features.starfield && !Starfield.animationId) Starfield.animate();
        if (CONFIG.features.particles && !FloatingParticles.intervalId) FloatingParticles.start();
        if (CONFIG.features.shootingStars && !ShootingStars.isRunning) {
            ShootingStars.isRunning = true;
            ShootingStars.scheduleNext();
        }
    },

    triggerHeartRain() {
        HeartRain.trigger();
    },
    triggerShootingStars(count = 5) {
        ShootingStars.trigger(count);
    }
};

// 导出到全局
window.EffectsManager = EffectsManager;
window.Starfield = Starfield;
window.FloatingParticles = FloatingParticles;
window.ShootingStars = ShootingStars;
window.HeartRain = HeartRain;