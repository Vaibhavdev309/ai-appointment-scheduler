const crypto = require('crypto');
const Redis = require('ioredis'); // Import ioredis

// Initialize Redis client
// Get Redis URL from environment variable
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(REDIS_URL);

redis.on('connect', () => console.log('Connected to Redis!'));
redis.on('error', (err) => console.error('Redis Client Error', err));

class GlobalCache {
    constructor(ttlMs = 10 * 60 * 1000) { // default 10 minutes TTL
        this.ttlSeconds = Math.floor(ttlMs / 1000); // Redis TTL is in seconds
    }

    _getKey(inputHash, stepName) {
        return `${inputHash}:${stepName}`;
    }

    async set(inputHash, stepName, value) {
        const key = this._getKey(inputHash, stepName);
        try {
            // Store value as JSON string in Redis with a TTL
            await redis.setex(key, this.ttlSeconds, JSON.stringify(value));
        } catch (error) {
            console.error(`Failed to set cache for key ${key} in Redis:`, error);
            // Optionally, implement a fallback or just log the error
        }
    }

    async get(inputHash, stepName) {
        const key = this._getKey(inputHash, stepName);
        try {
            const cachedData = await redis.get(key);
            if (cachedData) {
                return JSON.parse(cachedData); // Parse the JSON string back to an object
            }
            return null;
        } catch (error) {
            console.error(`Failed to get cache for key ${key} from Redis:`, error);
            return null; // Treat as cache miss on error
        }
    }
}

const globalCache = new GlobalCache();

function hashInput(input) {
    return crypto.createHash('sha256').update(input).digest('hex');
}

module.exports = { globalCache, hashInput };