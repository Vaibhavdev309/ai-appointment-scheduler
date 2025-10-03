const { globalCache, hashInput } = require('./globalCache');

class RequestContext {
    constructor(input, isImage, mimeType) {
        this.input = input;
        this.isImage = isImage;
        this.mimeType = mimeType;
        this.cache = new Map(); // per-request cache
        this.inputHash = hashInput(input || ''); // hash of input for global cache key
    }

    // Per-request cache get/set
    get(stepName) {
        return this.cache.get(stepName);
    }

    set(stepName, result) {
        this.cache.set(stepName, result);
    }

    // Global cache get/set
    getGlobal(stepName) {
        return globalCache.get(this.inputHash, stepName);
    }

    setGlobal(stepName, result) {
        globalCache.set(this.inputHash, stepName, result);
    }
}

module.exports = RequestContext;