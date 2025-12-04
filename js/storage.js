'use strict';

class StorageManager {
    constructor() {
        this.prefix = CONFIG.storage.prefix;
        this.keys = CONFIG.storage.keys;
        this.available = this._checkAvailability();
    }

    _checkAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('localStorage 不可用');
            return false;
        }
    }

    _getFullKey(key) {
        return this.prefix + key;
    }

    set(key, value) {
        if (!this.available) return false;
        try {
            localStorage.setItem(this._getFullKey(key), JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('存储失败:', e);
            return false;
        }
    }

    get(key, defaultValue = null) {
        if (!this.available) return defaultValue;
        try {
            const data = localStorage.getItem(this._getFullKey(key));
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('读取失败:', e);
            return defaultValue;
        }
    }

    remove(key) {
        if (!this.available) return;
        localStorage.removeItem(this._getFullKey(key));
    }

    clearAll() {
        if (!this.available) return;
        const toRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                toRemove.push(key);
            }
        }
        toRemove.forEach(k => localStorage.removeItem(k));
    }

    // 内容数据
    getStoryItems() {
        return this.get(this.keys.story, null);
    }

    setStoryItems(items) {
        return this.set(this.keys.story, items);
    }

    getMemoryItems() {
        return this.get(this.keys.memory, null);
    }

    setMemoryItems(items) {
        return this.set(this.keys.memory, items);
    }

    getJourneyText() {
        return this.get(this.keys.journey, null);
    }

    setJourneyText(text) {
        return this.set(this.keys.journey, text);
    }

    // 表白状态
    getConfessionStatus() {
        return this.get(this.keys.confession, {accepted: false, timestamp: null});
    }

    setConfessionAccepted() {
        return this.set(this.keys.confession, {accepted: true, timestamp: Date.now()});
    }

    resetConfessionOnly() {
        return this.set(this.keys.confession, {accepted: false, timestamp: null});
    }

    isConfessionAccepted() {
        const status = this.getConfessionStatus();
        return status && status.accepted === true;
    }

    // 导入导出
    exportData() {
        return {
            version: '3.0',
            exportTime: new Date().toISOString(),
            confession: this.getConfessionStatus(),
            story: this.getStoryItems(),
            memory: this.getMemoryItems(),
            journey: this.getJourneyText(),
            anniversaries: this.get(this.keys.anniversaries)
        };
    }

    downloadBackup() {
        const data = this.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `love_story_backup_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
    }

    importData(data, options = {includeConfession: false}) {
        try {
            if (!data || typeof data !== 'object') throw new Error('无效数据');
            if (data.story && Array.isArray(data.story)) this.setStoryItems(data.story);
            if (data.memory && Array.isArray(data.memory)) this.setMemoryItems(data.memory);
            if (data.journey && typeof data.journey === 'string') this.setJourneyText(data.journey);
            if (data.anniversaries && Array.isArray(data.anniversaries)) {
                this.set(this.keys.anniversaries, data.anniversaries);
            }
            if (options.includeConfession && data.confession) {
                this.set(this.keys.confession, data.confession);
            }
            return true;
        } catch (e) {
            console.error('导入失败:', e);
            return false;
        }
    }

    importFromFile() {
        return new Promise(resolve => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';

            input.onchange = e => {
                const file = e.target.files?.[0];
                if (!file) return resolve(false);

                const reader = new FileReader();
                reader.onload = event => {
                    try {
                        const result = event.target?.result;
                        if (typeof result !== 'string') throw new Error('文件读取结果无效');
                        const data = JSON.parse(result);
                        resolve(this.importData(data));
                    } catch (err) {
                        console.error('文件解析失败:', err);
                        resolve(false);
                    }
                };
                reader.onerror = () => resolve(false);
                reader.readAsText(file);
            };

            input.click();
        });
    }

    getStorageInfo() {
        if (!this.available) return {available: false};
        let totalBytes = 0;
        let count = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                totalBytes += key.length + (localStorage.getItem(key) || '').length;
                count++;
            }
        }
        return {
            available: true,
            itemCount: count,
            totalKB: (totalBytes / 1024).toFixed(2) + ' KB',
            usedPercent: ((totalBytes / (5 * 1024 * 1024)) * 100).toFixed(2) + '%'
        };
    }
}

const storage = new StorageManager();
window.storage = storage;
window.StorageManager = StorageManager;