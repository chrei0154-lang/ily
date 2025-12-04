/**
 * 主程序 v2.0
 * 应用逻辑与用户交互处理
 */

'use strict';

console.log('🚀 app.js 开始加载');

// ==================== 全局状态 ====================
const AppState = {
    currentStage: 1,
    currentSection: null,
    viewMode: 'main',      // 'main' | 'section'
    musicPlaying: false,
    editMode: null,
    storyPage: 1,
    memoryPage: 1,
    noClickCount: 0,
    dataLoaded: false
};

// ==================== 内容管理器 ====================
const ContentManager = {
    storyItems: [],
    memoryItems: [],
    journeyText: '',

    loadAll() {
        this.storyItems = storage.getStoryItems() || getDefaultDataCopy().storyItems;
        this.memoryItems = storage.getMemoryItems() || getDefaultDataCopy().memoryItems;
        this.journeyText = storage.getJourneyText() || DEFAULT_DATA.journeyText;
        AppState.dataLoaded = true;

        if (CONFIG.developer.debugLog) {
            console.log('📂 数据已加载', {
                stories: this.storyItems.length,
                memories: this.memoryItems.length
            });
        }
    },

    saveStory() {
        storage.setStoryItems(this.storyItems);
    },
    saveMemory() {
        storage.setMemoryItems(this.memoryItems);
    },
    saveJourney() {
        storage.setJourneyText(this.journeyText);
    },

    addStoryItem(item, atIndex = -1) {
        const newItem = {
            id: generateId('story'),
            date: item.date,
            content: item.content,
            timestamp: Date.now()
        };
        if (atIndex >= 0 && atIndex < this.storyItems.length) {
            this.storyItems.splice(atIndex, 0, newItem);
        } else {
            this.storyItems.push(newItem);
        }
        this.saveStory();
        return newItem;
    },

    removeStoryItem(index) {
        if (index >= 0 && index < this.storyItems.length) {
            this.storyItems.splice(index, 1);
            this.saveStory();
            return true;
        }
        return false;
    },

    moveStoryItem(from, to) {
        if (from < 0 || from >= this.storyItems.length) return false;
        if (to < 0 || to >= this.storyItems.length) return false;
        const [item] = this.storyItems.splice(from, 1);
        this.storyItems.splice(to, 0, item);
        this.saveStory();
        return true;
    },

    addMemoryItem(item, atIndex = -1) {
        const newItem = {
            id: generateId('memory'),
            caption: item.caption,
            date: item.date,
            icon: item.icon || '',
            imageUrl: item.imageUrl || '',
            timestamp: Date.now()
        };
        if (atIndex >= 0 && atIndex < this.memoryItems.length) {
            this.memoryItems.splice(atIndex, 0, newItem);
        } else {
            this.memoryItems.push(newItem);
        }
        this.saveMemory();
        return newItem;
    },

    removeMemoryItem(index) {
        if (index >= 0 && index < this.memoryItems.length) {
            this.memoryItems.splice(index, 1);
            this.saveMemory();
            return true;
        }
        return false;
    },

    moveMemoryItem(from, to) {
        if (from < 0 || from >= this.memoryItems.length) return false;
        if (to < 0 || to >= this.memoryItems.length) return false;
        const [item] = this.memoryItems.splice(from, 1);
        this.memoryItems.splice(to, 0, item);
        this.saveMemory();
        return true;
    },

    updateJourney(text) {
        this.journeyText = text;
        this.saveJourney();
    },

    resetToDefaults() {
        const defaults = getDefaultDataCopy();
        this.storyItems = defaults.storyItems;
        this.memoryItems = defaults.memoryItems;
        this.journeyText = DEFAULT_DATA.journeyText;
        this.saveStory();
        this.saveMemory();
        this.saveJourney();
    }
};

// ==================== 工具函数 ====================
function debugLog(msg, data) {
    if (CONFIG.developer.debugLog) {
        console.log(`[${new Date().toLocaleTimeString()}] ${msg}`, data || '');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'default', duration = null) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    duration = duration || CONFIG.ui.toast.duration;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    // 限制同时显示的toast数量
    while (container.children.length >= CONFIG.ui.toast.maxVisible) {
        container.removeChild(container.firstChild);
    }

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ==================== 阶段导航 ====================
function goToStage(num) {
    debugLog(`切换到阶段 ${num}`);

    document.querySelectorAll('.stage').forEach(s => s.classList.remove('active'));

    const target = document.getElementById(`stage${num}`);
    if (target) {
        target.classList.add('active');
        AppState.currentStage = num;
        window.scrollTo({top: 0, behavior: 'smooth'});

        // 进入阶段3时更新纪念日显示
        if (num === 3) {
            updateMainAnniversaryDisplay();
        }
    }
}

function startJourney() {
    debugLog('开始时光之旅');
    goToStage(2);
    if (CONFIG.music.autoPlay && !AppState.musicPlaying) {
        setTimeout(playMusic, 500);
    }
}

function goBack() {
    if (AppState.currentStage > 1) {
        goToStage(AppState.currentStage - 1);
    }
}

// Stage2返回按钮处理
function handleStage2Back() {
    if (AppState.viewMode === 'section') {
        backToMainView();
    } else {
        goToStage(1);
    }
}

// ==================== 视图切换 ====================
function showSection(name) {
    debugLog(`显示板块: ${name}`);

    const mainView = document.getElementById('mainView');
    const sectionView = document.getElementById('sectionView');

    // 隐藏主视图，显示板块视图
    if (mainView) mainView.style.display = 'none';
    if (sectionView) sectionView.classList.add('active');

    // 隐藏所有内容板块
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));

    // 显示目标板块
    const section = document.getElementById(`${name}Section`);
    if (section) {
        section.classList.add('active');
        AppState.currentSection = name;
        AppState.viewMode = 'section';

        // 渲染对应内容
        if (name === 'story') renderStory(1);
        else if (name === 'memory') renderMemory(1);
        else if (name === 'journey') renderJourney();
        else if (name === 'anniversary') renderAnniversaryCarousel();

        // 滚动到页面顶部
        window.scrollTo({top: 0, behavior: 'instant'});
    }
}

function backToMainView() {
    debugLog('返回主视图');

    const mainView = document.getElementById('mainView');
    const sectionView = document.getElementById('sectionView');

    // 隐藏所有板块
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    if (sectionView) sectionView.classList.remove('active');

    // 显示主视图
    if (mainView) mainView.style.display = '';

    AppState.currentSection = null;
    AppState.viewMode = 'main';

    window.scrollTo({top: 0, behavior: 'smooth'});
}

// ==================== 内容渲染 ====================
function renderStory(page = 1) {
    const timeline = document.getElementById('storyTimeline');
    if (!timeline) return;

    const perPage = CONFIG.ui.pagination.storyPerPage;
    const end = page * perPage;
    const items = ContentManager.storyItems.slice(0, end);

    timeline.innerHTML = items.map((item, i) => `
        <div class="timeline-item" style="animation-delay: ${i * 0.1}s">
                <div class="timeline-date">${escapeHtml(item.date)}</div>
                <div class="timeline-content">${escapeHtml(item.content)}</div>
            </div>
        `).join('');

    const loadMore = document.getElementById('storyLoadMore');
    if (loadMore) {
        loadMore.style.display = end < ContentManager.storyItems.length ? 'block' : 'none';
    }

    AppState.storyPage = page;
}

function loadMoreStory() {
    renderStory(AppState.storyPage + 1);
}

function renderMemory(page = 1) {
    const gallery = document.getElementById('memoryGallery');
    if (!gallery) return;

    const perPage = CONFIG.ui.pagination.memoryPerPage;
    const end = page * perPage;
    const items = ContentManager.memoryItems.slice(0, end);

    gallery.innerHTML = items.map((item, i) => `
        <div class="photo-card" style="animation-delay: ${i * 0.1}s">
                <div class="photo-inner">
                    <div class="photo-placeholder">
                    ${item.imageUrl
        ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.caption)}" loading="lazy">`
        : `<svg class="photo-icon" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>`
    }
                    </div>
                    <div class="photo-caption">${escapeHtml(item.caption)}</div>
                    <div class="photo-date">${escapeHtml(item.date)}</div>
                </div>
            </div>
        `).join('');

    const loadMore = document.getElementById('memoryLoadMore');
    if (loadMore) {
        loadMore.style.display = end < ContentManager.memoryItems.length ? 'block' : 'none';
    }

    AppState.memoryPage = page;
}

function loadMoreMemory() {
    renderMemory(AppState.memoryPage + 1);
}

function renderJourney() {
    const el = document.getElementById('journeyText');
    if (el) el.textContent = ContentManager.journeyText;
}

function renderAllContent() {
    renderStory(1);
    renderMemory(1);
    renderJourney();
}

// ==================== 表白功能 ====================
function showConfessionModal() {
    const modal = document.getElementById('confessionModal');
    if (modal) {
        modal.classList.add('active');
        AppState.noClickCount = 0;

        const noBtn = document.getElementById('noBtn');
        if (noBtn) {
            noBtn.textContent = '再想想...';
            noBtn.style.cssText = '';
        }
    }
}

function closeConfessionModal() {
    const modal = document.getElementById('confessionModal');
    if (modal) modal.classList.remove('active');
}

function handleYes() {
    debugLog('用户接受表白');
    storage.setConfessionAccepted();

    // 自动设置交往日期为今天
    AnniversaryManager.setTogetherDate();

    updateConfessionEntranceVisibility();
    updateNavCardsVisibility();
    closeConfessionModal();
    EffectsManager.triggerHeartRain();
    showToast('在此献上，我不变的爱与忠诚', 'success');
    setTimeout(() => goToStage(3), 2000);
}

function handleNo() {
    AppState.noClickCount++;
    const noBtn = document.getElementById('noBtn');
    if (!noBtn) return;

    const msgs = CONFIG.ui.noButtonTexts;

    if (AppState.noClickCount < msgs.length) {
        noBtn.textContent = msgs[AppState.noClickCount];

        // 按钮在安全区域内随机移动
        const buttonsContainer = document.querySelector('#confessionModal .modal-buttons');
        if (buttonsContainer) {
            const containerRect = buttonsContainer.getBoundingClientRect();
            const btnRect = noBtn.getBoundingClientRect();

            // 计算安全移动范围（不超出容器边界）
            const padding = 30;
            const maxX = Math.max(0, (containerRect.width - btnRect.width) / 2 - padding);
            const maxY = Math.max(0, containerRect.height - btnRect.height - padding * 2);

            // 随机位置（保持在容器内）
            const rx = (Math.random() - 0.5) * maxX * 1.6;
            const ry = Math.random() * maxY * 0.5;

            // 按钮逐渐变小
            const scale = Math.max(0.75, 1 - AppState.noClickCount * 0.04);
            noBtn.style.transform = `translate(${rx}px, ${ry}px) scale(${scale})`;
        }
    } else {
        noBtn.style.transform = 'scale(0)';
        noBtn.style.opacity = '0';
        setTimeout(() => {
            noBtn.style.display = 'none';
        }, 300);
        showToast('那就只能选"我愿意"啦～');
    }
}

function updateConfessionEntranceVisibility() {
    const entrance = document.getElementById('confessionEntrance');
    if (!entrance) return;

    const mode = CONFIG.features.confessionMode;
    const accepted = storage.isConfessionAccepted();
    const show = mode === 'show' || (mode !== 'hide' && !accepted);

    entrance.classList.toggle('hidden', !show);
}

// ==================== 纪念日功能 ====================

// 纪念日管理器
const AnniversaryManager = {
    items: [],
    currentIndex: 0,

    load() {
        const saved = storage.get(CONFIG.storage.keys.anniversaries);
        if (saved && Array.isArray(saved)) {
            this.items = saved;
        } else {
            this.items = getDefaultDataCopy().anniversaryItems || [];
        }
        return this.items;
    },

    save() {
        storage.set(CONFIG.storage.keys.anniversaries, this.items);
    },

    add(item) {
        const newItem = {
            id: generateId('anniversary'),
            name: item.name,
            date: item.date,
            icon: item.icon || 'calendar',
            isDefault: false,
            priority: this.items.length + 1
        };
        this.items.push(newItem);
        this.save();
        return newItem;
    },

    update(id, updates) {
        const idx = this.items.findIndex(i => i.id === id);
        if (idx > -1) {
            this.items[idx] = {...this.items[idx], ...updates};
            this.save();
            return true;
        }
        return false;
    },

    remove(id) {
        const idx = this.items.findIndex(i => i.id === id);
        if (idx > -1 && !this.items[idx].isDefault) {
            this.items.splice(idx, 1);
            this.save();
            return true;
        }
        return false;
    },

    setTogetherDate() {
        const togetherItem = this.items.find(i => i.id === 'anniversary_together');
        if (togetherItem) {
            togetherItem.date = new Date().toISOString().split('T')[0];
            this.save();
        }
    },

    getPrimaryItem() {
        const accepted = storage.isConfessionAccepted();
        const withDate = this.items.filter(i =>
            i.date && !(i.id === 'anniversary_together' && !accepted)
        );
        if (withDate.length === 0) return null;
        return withDate.sort((a, b) => a.priority - b.priority)[0];
    },

    resetToDefaults() {
        // 重置为默认数据，清除相识纪念日以外的默认日期
        this.items = getDefaultDataCopy().anniversaryItems || [];
        // 确保交往纪念日的日期为空（需要接受表白后才设置）
        this.items.forEach(item => {
            if (item.id === 'anniversary_together') {
                item.date = '';
            }
        });
        this.save();
    }
};

// 计算两个日期之间的天数
function calculateDaysBetween(dateStr) {
    if (!dateStr) return null;
    const startDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    const diffTime = today - startDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : null;
}

// 更新完成页面的主纪念日显示
function updateMainAnniversaryDisplay() {
    const display = document.getElementById('mainAnniversaryDisplay');
    const dayCount = document.getElementById('mainDayCount');
    const text = document.getElementById('mainAnniversaryText');

    if (!display || !dayCount || !text) return;

    const primary = AnniversaryManager.getPrimaryItem();
    if (primary && primary.date) {
        const days = calculateDaysBetween(primary.date);
        if (days !== null) {
            dayCount.textContent = days;
            text.textContent = primary.name;
            display.style.display = '';
            return;
        }
    }
    display.style.display = 'none';
}

// 渲染纪念日轮播
function renderAnniversaryCarousel() {
    const track = document.getElementById('anniversaryTrack');
    const dots = document.getElementById('anniversaryDots');
    if (!track || !dots) return;

    const items = AnniversaryManager.items;

    if (items.length === 0) {
        track.innerHTML = '<div class="anniversary-empty">暂无纪念日，点击编辑添加</div>';
        dots.innerHTML = '';
        return;
    }

    track.innerHTML = items.map((item, i) => {
        const days = item.date ? calculateDaysBetween(item.date) : null;
        const icon = getAnniversaryIcon(item.icon);

        return `
            <div class="anniversary-card ${i === AnniversaryManager.currentIndex ? 'active' : ''}" data-index="${i}">
                <div class="anniversary-icon">${icon}</div>
                <h3 class="anniversary-name">${escapeHtml(item.name)}</h3>
                ${item.date ? `
                    <div class="anniversary-date">${item.date.replace(/-/g, '.')}</div>
                    ${days !== null ? `<div class="anniversary-days"><span class="days-number">${days}</span> 天</div>` : ''}
                ` : `
                    <div class="anniversary-no-date">尚未设置日期</div>
                `}
            </div>
        `;
    }).join('');

    // 渲染指示点
    dots.innerHTML = items.map((_, i) =>
        `<button class="carousel-dot ${i === AnniversaryManager.currentIndex ? 'active' : ''}" onclick="goToAnniversary(${i})"></button>`
    ).join('');

    updateCarouselPosition();
}

function getAnniversaryIcon(type) {
    const icons = {
        meet: '<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>',
        heart: '<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
        calendar: '<svg viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z"/></svg>',
        star: '<svg viewBox="0 0 24 24"><path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61z"/></svg>',
        gift: '<svg viewBox="0 0 24 24"><path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z"/></svg>'
    };
    return icons[type] || icons.calendar;
}

function updateCarouselPosition() {
    const track = document.getElementById('anniversaryTrack');
    if (track) {
        track.style.transform = `translateX(-${AnniversaryManager.currentIndex * 100}%)`;
    }
}

function prevAnniversary() {
    const items = AnniversaryManager.items;
    if (items.length === 0) return;
    AnniversaryManager.currentIndex = (AnniversaryManager.currentIndex - 1 + items.length) % items.length;
    renderAnniversaryCarousel();
}

function nextAnniversary() {
    const items = AnniversaryManager.items;
    if (items.length === 0) return;
    AnniversaryManager.currentIndex = (AnniversaryManager.currentIndex + 1) % items.length;
    renderAnniversaryCarousel();
}

function goToAnniversary(index) {
    AnniversaryManager.currentIndex = index;
    renderAnniversaryCarousel();
}

// 更新导航卡片显示状态 - 表白后隐藏"重要的话"入口
function updateNavCardsVisibility() {
    const journeyCard = document.getElementById('journeyCard');
    const accepted = storage.isConfessionAccepted();

    if (journeyCard) {
        journeyCard.classList.toggle('hidden', accepted);
    }
}

// ==================== 编辑器 ====================
function toggleEditMode(type) {
    AppState.editMode = type;

    const modal = document.getElementById('editorModal');
    const title = document.getElementById('editorTitle');
    const body = document.getElementById('editorBody');
    if (!modal || !title || !body) return;

    const titles = {
        story: '编辑时光故事',
        memory: '编辑珍贵回忆',
        journey: '编辑心路历程',
        anniversary: '编辑重要日子'
    };
    title.textContent = titles[type] || '编辑';

    if (type === 'story') body.innerHTML = renderStoryEditor();
    else if (type === 'memory') body.innerHTML = renderMemoryEditor();
    else if (type === 'journey') body.innerHTML = renderJourneyEditor();
    else if (type === 'anniversary') body.innerHTML = renderAnniversaryEditor();

    modal.classList.add('active');
    // 重置滚动位置到顶部
    body.scrollTop = 0;
}

function renderStoryEditor() {
    const items = ContentManager.storyItems;
    return `
            <div class="form-group">
            <label class="form-label">日期/标题</label>
            <input type="text" class="form-input" id="newStoryDate" placeholder="例如：2024年春天">
            </div>
            <div class="form-group">
            <label class="form-label">故事内容</label>
                <textarea class="form-textarea" id="newStoryContent" placeholder="写下你们的故事..."></textarea>
            </div>
        <button class="primary-btn" onclick="addNewStory()" style="width:100%;margin-bottom:var(--space-md);">添加新故事</button>

        <div class="editor-divider"></div>
        <div class="editor-list">
            <div class="editor-list-title">已有故事 (${items.length})</div>
            <div class="editor-items">
                ${items.length === 0 ? '<div class="empty-hint">暂无故事</div>' : items.map((item, i) => `
                    <div class="editor-item">
                        <div class="editor-item-order">
                            <button class="order-btn" onclick="moveStoryUp(${i})" ${i === 0 ? 'disabled' : ''}>↑</button>
                            <button class="order-btn" onclick="moveStoryDown(${i})" ${i === items.length - 1 ? 'disabled' : ''}>↓</button>
                        </div>
                        <div class="editor-item-content">
                            <div class="editor-item-date">${escapeHtml(item.date)}</div>
                            <div class="editor-item-text">${escapeHtml(item.content)}</div>
                        </div>
                        <div class="editor-item-actions">
                            <button class="item-action-btn edit" onclick="editStory(${i})" title="编辑">
                                <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                            </button>
                            <button class="item-action-btn delete" onclick="deleteStory(${i})" title="删除">
                                <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="editor-hint">提示：点击 ✎ 编辑，使用箭头调整顺序，点击 × 删除</div>
    `;
}

function renderMemoryEditor() {
    const items = ContentManager.memoryItems;
    return `
            <div class="form-group">
            <label class="form-label">照片标题</label>
                <input type="text" class="form-input" id="newMemoryCaption" placeholder="例如：第一次见面">
            </div>
            <div class="form-group">
            <label class="form-label">日期</label>
            <input type="text" class="form-input" id="newMemoryDate" placeholder="例如：2024.03.15" value="${getCurrentDateString()}">
            </div>
            <div class="form-group">
            <label class="form-label">图片链接（可选）</label>
            <input type="text" class="form-input" id="newMemoryImage" placeholder="粘贴图片URL">
            </div>
        <button class="primary-btn" onclick="addNewMemory()" style="width:100%;margin-bottom:var(--space-md);">添加新照片</button>

        <div class="editor-divider"></div>
        <div class="editor-list">
            <div class="editor-list-title">已有照片 (${items.length})</div>
            <div class="editor-items editor-items-grid">
                ${items.length === 0 ? '<div class="empty-hint" style="grid-column:1/-1;">暂无照片</div>' : items.map((item, i) => `
                    <div class="editor-item editor-item-card">
                        <div class="editor-item-actions">
                            <button class="item-action-btn" onclick="moveMemoryUp(${i})" ${i === 0 ? 'disabled' : ''} title="左移">←</button>
                            <button class="item-action-btn" onclick="editMemory(${i})" title="编辑">✎</button>
                            <button class="item-action-btn" onclick="moveMemoryDown(${i})" ${i === items.length - 1 ? 'disabled' : ''} title="右移">→</button>
                            <button class="item-action-btn delete" onclick="deleteMemory(${i})" title="删除">×</button>
                        </div>
                        <div class="editor-item-icon">
                            ${item.imageUrl
        ? `<img src="${escapeHtml(item.imageUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-sm);">`
        : `<svg viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>`
    }
                        </div>
                        <div class="editor-item-caption">${escapeHtml(item.caption)}</div>
                        <div class="editor-item-date">${escapeHtml(item.date)}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="editor-hint">提示：点击 ✎ 编辑，推荐使用图床上传图片（如 imgbb.com）</div>
    `;
}

function renderJourneyEditor() {
    return `
        <div class="form-group">
            <label class="form-label">写下你想说的话</label>
            <textarea class="form-textarea form-textarea-large" id="journeyTextarea">${escapeHtml(ContentManager.journeyText)}</textarea>
        </div>
        <div class="editor-hint">提示：可以使用换行来分段</div>
    `;
}

function renderAnniversaryEditor() {
    const items = AnniversaryManager.items;
    const iconOptions = ['calendar', 'heart', 'star', 'gift', 'meet'].map(icon =>
        `<option value="${icon}">${icon === 'meet' ? '相遇' : icon === 'heart' ? '爱心' : icon === 'star' ? '星星' : icon === 'gift' ? '礼物' : '日历'}</option>`
    ).join('');

    return `
            <div class="form-group">
            <label class="form-label">纪念日名称</label>
            <input type="text" class="form-input" id="newAnniversaryName" placeholder="例如：第一次约会">
            </div>
        <div class="form-group">
            <label class="form-label">日期</label>
            <input type="date" class="form-input" id="newAnniversaryDate">
        </div>
        <div class="form-group">
            <label class="form-label">图标</label>
            <select class="form-input" id="newAnniversaryIcon">${iconOptions}</select>
        </div>
        <button class="primary-btn" onclick="addNewAnniversary()" style="width:100%;margin-bottom:var(--space-md);">添加纪念日</button>
        
        <div class="editor-divider"></div>
        <div class="editor-list">
            <div class="editor-list-title">已有纪念日 (${items.length})</div>
            <div class="editor-items">
                ${items.length === 0 ? '<div class="empty-hint">暂无纪念日</div>' : items.map(item => `
                    <div class="editor-item anniversary-editor-item">
                        <div class="editor-item-content">
                            <div class="editor-item-date">${escapeHtml(item.name)}</div>
                            <div class="editor-item-text">${item.date ? item.date.replace(/-/g, '.') : '未设置日期'}</div>
        </div>
                        <div class="editor-item-actions">
                            <input type="date" class="form-input-small" value="${item.date || ''}" 
                                onchange="updateAnniversaryDate('${item.id}', this.value)">
                            ${!item.isDefault ? `
                                <button class="item-action-btn delete" onclick="deleteAnniversary('${item.id}')">
                                    <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                                </button>
                            ` : '<span class="default-badge">默认</span>'}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function addNewAnniversary() {
    const name = document.getElementById('newAnniversaryName')?.value.trim();
    const date = document.getElementById('newAnniversaryDate')?.value;
    const icon = document.getElementById('newAnniversaryIcon')?.value || 'calendar';

    if (!name) {
        showToast('请填写纪念日名称', 'error');
        return;
    }

    AnniversaryManager.add({name, date, icon});
    showToast('添加成功');
    toggleEditMode('anniversary');
}

function updateAnniversaryDate(id, date) {
    AnniversaryManager.update(id, {date});
    showToast('日期已更新');
}

function deleteAnniversary(id) {
    if (confirm('确定删除这个纪念日吗？')) {
        if (AnniversaryManager.remove(id)) {
            showToast('已删除');
            toggleEditMode('anniversary');
        } else {
            showToast('默认纪念日不可删除', 'error');
        }
    }
}

function addNewStory() {
    const date = document.getElementById('newStoryDate')?.value.trim();
    const content = document.getElementById('newStoryContent')?.value.trim();
    if (!date || !content) {
        showToast('请填写完整信息', 'error');
        return;
    }
    ContentManager.addStoryItem({date, content});
    showToast('添加成功');
    toggleEditMode('story');
}

function editStory(index) {
    const item = ContentManager.storyItems[index];
    if (!item) return;

    const body = document.getElementById('editorBody');
    if (!body) return;

    body.innerHTML = `
        <div class="edit-form">
            <div class="form-group">
                <label class="form-label">日期/标题</label>
                <input type="text" class="form-input" id="editStoryDate" value="${escapeHtml(item.date)}">
            </div>
            <div class="form-group">
                <label class="form-label">故事内容</label>
                <textarea class="form-textarea" id="editStoryContent">${escapeHtml(item.content)}</textarea>
            </div>
            <div class="edit-form-actions">
                <button class="secondary-btn" onclick="toggleEditMode('story')">取消</button>
                <button class="primary-btn" onclick="saveStoryEdit(${index})">保存修改</button>
            </div>
        </div>
    `;
}

function saveStoryEdit(index) {
    const date = document.getElementById('editStoryDate')?.value.trim();
    const content = document.getElementById('editStoryContent')?.value.trim();
    if (!date || !content) {
        showToast('请填写完整信息', 'error');
        return;
    }
    ContentManager.storyItems[index] = {...ContentManager.storyItems[index], date, content};
    ContentManager.saveStory();
    showToast('修改成功');
    toggleEditMode('story');
}

function deleteStory(i) {
    if (confirm('确定删除这条故事吗？')) {
        ContentManager.removeStoryItem(i);
        showToast('已删除');
        toggleEditMode('story');
    }
}

function moveStoryUp(i) {
    if (ContentManager.moveStoryItem(i, i - 1)) toggleEditMode('story');
}

function moveStoryDown(i) {
    if (ContentManager.moveStoryItem(i, i + 1)) toggleEditMode('story');
}

function addNewMemory() {
    const caption = document.getElementById('newMemoryCaption')?.value.trim();
    const date = document.getElementById('newMemoryDate')?.value.trim();
    const imageUrl = document.getElementById('newMemoryImage')?.value.trim() || '';
    if (!caption || !date) {
        showToast('请填写标题和日期', 'error');
        return;
    }
    ContentManager.addMemoryItem({caption, date, imageUrl});
    showToast('添加成功');
    toggleEditMode('memory');
}

function editMemory(index) {
    const item = ContentManager.memoryItems[index];
    if (!item) return;

    const body = document.getElementById('editorBody');
    if (!body) return;

    body.innerHTML = `
        <div class="edit-form">
            <div class="form-group">
                <label class="form-label">照片标题</label>
                <input type="text" class="form-input" id="editMemoryCaption" value="${escapeHtml(item.caption)}">
            </div>
            <div class="form-group">
                <label class="form-label">日期</label>
                <input type="text" class="form-input" id="editMemoryDate" value="${escapeHtml(item.date)}">
            </div>
            <div class="form-group">
                <label class="form-label">图片链接（可选）</label>
                <input type="text" class="form-input" id="editMemoryImage" value="${escapeHtml(item.imageUrl || '')}">
            </div>
            ${item.imageUrl ? `<div class="image-preview"><img src="${escapeHtml(item.imageUrl)}" alt="预览" style="max-width:100%;max-height:150px;border-radius:var(--radius-sm);margin-bottom:var(--space-md);"></div>` : ''}
            <div class="edit-form-actions">
                <button class="secondary-btn" onclick="toggleEditMode('memory')">取消</button>
                <button class="primary-btn" onclick="saveMemoryEdit(${index})">保存修改</button>
            </div>
        </div>
    `;
}

function saveMemoryEdit(index) {
    const caption = document.getElementById('editMemoryCaption')?.value.trim();
    const date = document.getElementById('editMemoryDate')?.value.trim();
    const imageUrl = document.getElementById('editMemoryImage')?.value.trim() || '';
    if (!caption || !date) {
        showToast('请填写标题和日期', 'error');
        return;
    }
    ContentManager.memoryItems[index] = {...ContentManager.memoryItems[index], caption, date, imageUrl};
    ContentManager.saveMemory();
    showToast('修改成功');
    toggleEditMode('memory');
}

function deleteMemory(i) {
    if (confirm('确定删除这张照片吗？')) {
        ContentManager.removeMemoryItem(i);
        showToast('已删除');
        toggleEditMode('memory');
    }
}

function moveMemoryUp(i) {
    if (ContentManager.moveMemoryItem(i, i - 1)) toggleEditMode('memory');
}

function moveMemoryDown(i) {
    if (ContentManager.moveMemoryItem(i, i + 1)) toggleEditMode('memory');
}

function saveContent() {
    if (AppState.editMode === 'story') {
        renderStory(1);
    } else if (AppState.editMode === 'memory') {
        renderMemory(1);
    } else if (AppState.editMode === 'journey') {
        const text = document.getElementById('journeyTextarea')?.value.trim();
        if (text) {
            ContentManager.updateJourney(text);
            renderJourney();
        }
    }
    closeEditor();
    showToast('保存成功');
}

function closeEditor() {
    const modal = document.getElementById('editorModal');
    if (modal) modal.classList.remove('active');
    AppState.editMode = null;
}

// ==================== 设置 ====================
function openSettings() {
    const modal = document.getElementById('settingsModal');
    const devSection = document.getElementById('devSettings');
    const modalBody = modal?.querySelector('.settings-body');
    if (modal) {
        modal.classList.add('active');
        // 重置滚动位置到顶部
        if (modalBody) modalBody.scrollTop = 0;
        if (devSection) {
            devSection.classList.toggle('visible', CONFIG.developer.enabled && CONFIG.developer.showDevSettings);
        }
    }
}

function closeSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.remove('active');
}

function exportAllData() {
    storage.downloadBackup();
    showToast('数据已导出');
    closeSettings();
}

async function importAllData() {
    const success = await storage.importFromFile();
    if (success) {
        ContentManager.loadAll();
        renderAllContent();
        updateConfessionEntranceVisibility();
        showToast('导入成功');
        closeSettings();
    } else {
        showToast('导入失败', 'error');
    }
}

function resetConfessionOnly() {
    if (confirm('确定重置表白状态吗？不会影响其他内容。')) {
        storage.resetConfessionOnly();
        updateConfessionEntranceVisibility();
        updateNavCardsVisibility();
        showToast('表白状态已重置');
        closeSettings();
    }
}

function resetAllData() {
    if (confirm('确定重置所有数据吗？建议先导出备份。')) {
        storage.clearAll();
        ContentManager.resetToDefaults();
        storage.resetConfessionOnly();

        // 重置纪念日数据
        AnniversaryManager.resetToDefaults();

        // 重置视图状态
        backToMainView();
        AppState.currentStage = 1;
        AppState.currentSection = null;
        AppState.storyPage = 1;
        AppState.memoryPage = 1;

        renderAllContent();
        updateConfessionEntranceVisibility();
        updateNavCardsVisibility();
        goToStage(1);
        showToast('已重置所有数据');
        closeSettings();
    }
}

// ==================== 音乐控制 ====================
function playMusic() {
    const audio = document.getElementById('bgMusic');
    const btn = document.getElementById('musicBtn');
    if (!audio || !btn) return;

    audio.volume = CONFIG.music.volume;
    audio.play()
        .then(() => {
            AppState.musicPlaying = true;
            btn.classList.add('playing');
        })
        .catch(err => console.warn('音乐播放失败:', err.message));
}

function pauseMusic() {
    const audio = document.getElementById('bgMusic');
    const btn = document.getElementById('musicBtn');
    if (!audio || !btn) return;

    audio.pause();
    AppState.musicPlaying = false;
    btn.classList.remove('playing');
}

function toggleMusic() {
    AppState.musicPlaying ? pauseMusic() : playMusic();
}

// ==================== 开发者工具 ====================
const devTools = {
    viewState() {
        console.group('📊 应用状态');
        console.log('AppState:', AppState);
        console.log('Stories:', ContentManager.storyItems);
        console.log('Memories:', ContentManager.memoryItems);
        console.log('Journey:', ContentManager.journeyText);
        console.log('Confession:', storage.getConfessionStatus());
        console.log('Storage:', storage.getStorageInfo());
        console.groupEnd();
    },
    resetConfession() {
        storage.resetConfessionOnly();
        updateConfessionEntranceVisibility();
        showToast('表白状态已重置');
    },
    skipToFinal() {
        storage.setConfessionAccepted();
        goToStage(3);
    },
    testStars(n = 5) {
        EffectsManager.triggerShootingStars(n);
    },
    testHearts() {
        EffectsManager.triggerHeartRain();
    },
    help() {
        console.log(`
开发者工具：
  devTools.viewState()  - 查看状态
  devTools.resetConfession() - 重置表白
  devTools.skipToFinal() - 跳到完成页
  devTools.testStars(n) - 触发流星
  devTools.testHearts() - 触发爱心雨
        `);
    }
};

// ==================== 初始化 ====================
function initApp() {
    debugLog('初始化应用...');

    try {
        ContentManager.loadAll();
        AnniversaryManager.load();
        renderAllContent();
        updateConfessionEntranceVisibility();
        updateNavCardsVisibility();
        EffectsManager.init();
        updateMainAnniversaryDisplay();

        if (CONFIG.developer.enabled) {
            window.devTools = devTools;
            console.log('🛠️ 开发者工具已启用，输入 devTools.help() 查看命令');
        }

        debugLog('初始化完成');
    } catch (e) {
        console.error('初始化失败:', e);
        showToast('加载出错，请刷新页面', 'error');
    }
}

function hideLoading() {
    const el = document.getElementById('loadingScreen');
    if (el) el.classList.add('hidden');
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            hideLoading();
            initApp();
        }, 500);
    });
} else {
    setTimeout(() => {
        hideLoading();
        initApp();
    }, 500);
}

window.addEventListener('load', () => debugLog('页面资源加载完成'));
window.addEventListener('error', e => console.error('全局错误:', e.error));

// ==================== 导出全局函数 ====================
window.goToStage = goToStage;
window.startJourney = startJourney;
window.goBack = goBack;
window.handleStage2Back = handleStage2Back;
window.showSection = showSection;
window.backToMainView = backToMainView;
window.renderStory = renderStory;
window.loadMoreStory = loadMoreStory;
window.renderMemory = renderMemory;
window.loadMoreMemory = loadMoreMemory;
window.renderJourney = renderJourney;
window.showConfessionModal = showConfessionModal;
window.closeConfessionModal = closeConfessionModal;
window.handleYes = handleYes;
window.handleNo = handleNo;
window.toggleEditMode = toggleEditMode;
window.addNewStory = addNewStory;
window.editStory = editStory;
window.saveStoryEdit = saveStoryEdit;
window.deleteStory = deleteStory;
window.moveStoryUp = moveStoryUp;
window.moveStoryDown = moveStoryDown;
window.addNewMemory = addNewMemory;
window.editMemory = editMemory;
window.saveMemoryEdit = saveMemoryEdit;
window.deleteMemory = deleteMemory;
window.moveMemoryUp = moveMemoryUp;
window.moveMemoryDown = moveMemoryDown;
window.saveContent = saveContent;
window.closeEditor = closeEditor;
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.exportAllData = exportAllData;
window.importAllData = importAllData;
window.resetConfessionOnly = resetConfessionOnly;
window.resetAllData = resetAllData;
window.prevAnniversary = prevAnniversary;
window.nextAnniversary = nextAnniversary;
window.goToAnniversary = goToAnniversary;
window.addNewAnniversary = addNewAnniversary;
window.updateAnniversaryDate = updateAnniversaryDate;
window.deleteAnniversary = deleteAnniversary;
window.toggleMusic = toggleMusic;
window.showToast = showToast;
window.hideLoading = hideLoading;
window.AppState = AppState;
window.ContentManager = ContentManager;

console.log('✅ app.js 加载完成');