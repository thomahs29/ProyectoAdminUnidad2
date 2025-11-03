const redis = require('ioredis');
const dotenv = require('dotenv');

dotenv.config();

const redisClient = new redis({
    host: process.env.REDIS_HOST || 'redis-cache',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null,
    db: 0,
    retryStrategy(times) {
    return Math.min(times * 50, 2000);
    },
});

redisClient.on('connect', () => {
    console.log('Connected to Redis server');
});

redisClient.on('error', (err) => {
    console.error('Redis error:', err);
});

module.exports = redisClient;