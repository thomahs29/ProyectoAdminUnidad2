const Redis = require('ioredis');
const dotenv = require('dotenv');

dotenv.config();

const redisClient = new Redis({
    host: process.env.REDIS_HOST || 'redis-cache',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
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