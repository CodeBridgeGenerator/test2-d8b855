const IORedis = require('ioredis');
const configRedis = require('./currentConfig');
const redisClient = new IORedis(configRedis);

redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
    console.error('Redis connection error:', err.message);
});

module.exports = redisClient;
