// MultipleFiles/utils/requestContext.js

class RequestContext {
    constructor(input, isImage, mimeType) {
        this.input = input;
        this.isImage = isImage;
        this.mimeType = mimeType;
        this.cache = new Map(); // Stores results for each step
    }

    // Method to get a cached result for a specific step
    get(stepName) {
        return this.cache.get(stepName);
    }

    // Method to set a result for a specific step in the cache
    set(stepName, result) {
        this.cache.set(stepName, result);
    }
}

module.exports = RequestContext;