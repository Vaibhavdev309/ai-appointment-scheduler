const crypto = require('crypto');

class GlobalCache {
    constructor(ttlMs = 10 * 60 * 1000) { // 10 minutes TTL by default
        this.cache = new Map();
        this.ttlMs = ttlMs;
    }

    _getKey(inputHash, stepName) {
        return `${inputHash}:${stepName}`;
    }

    set(inputHash, stepName, value) {
        const key = this._getKey(inputHash, stepName);
        const expiresAt = Date.now() + this.ttlMs;
        this.cache.set(key, { value, expiresAt });
    }

    get(inputHash, stepName) {
        const key = this._getKey(inputHash, stepName);
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.value;
    }
}

const globalCache = new GlobalCache();

function hashInput(input) {
    return crypto.createHash('sha256').update(input).digest('hex');
}

module.exports = { globalCache, hashInput };