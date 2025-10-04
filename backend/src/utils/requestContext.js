const { globalCache, hashInput } = require('./globalCache');

class RequestContext {
    constructor(input, isImage, mimeType) {
        this.input = input;
        this.isImage = isImage;
        this.mimeType = mimeType;
        this.cache = new Map(); // per-request cache (still useful for within-request chaining)
        this.inputHash = hashInput(input || ''); // hash of input for global cache key
    }

    // Per-request cache get/set
    get(stepName) {
        return this.cache.get(stepName);
    }

    set(stepName, result) {
        this.cache.set(stepName, result);
    }

    async getGlobal(stepName) { // Make this async
        return await globalCache.get(this.inputHash, stepName);
    }

    async setGlobal(stepName, result) { // Make this async
        await globalCache.set(this.inputHash, stepName, result);
    }
}

module.exports = RequestContext;