const express = require('express');
const { createClient } = require('redis');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
app.use(cors());

// Redis Client Setup
const redisClient = createClient({ url: 'redis://redis:6379' });
redisClient.connect().catch(console.error);

// Rate Limiting Config: 10 requests per 10 seconds
const WINDOW_SIZE_IN_SECONDS = 10;
const MAX_REQUESTS_PER_WINDOW = 10;

// Sliding Window Log Algorithm
async function rateLimiter(req, res, next) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const redisKey = `rate_limit:${ip}`;
    const currentTimestamp = Date.now();
    const windowStartTimestamp = currentTimestamp - (WINDOW_SIZE_IN_SECONDS * 1000);

    try {
        const multi = redisClient.multi();
        
        // Remove requests older than the window
        multi.zRemRangeByScore(redisKey, 0, windowStartTimestamp);
        // Add current request
        multi.zAdd(redisKey, { score: currentTimestamp, value: currentTimestamp.toString() });
        // Count total requests in window
        multi.zCard(redisKey);
        // Set TTL to auto-cleanup
        multi.expire(redisKey, WINDOW_SIZE_IN_SECONDS);

        const results = await multi.exec();
        const requestCount = results[2];

        if (requestCount > MAX_REQUESTS_PER_WINDOW) {
            return res.status(429).json({
                error: "Too Many Requests",
                message: "Rate limit exceeded. Please try again later."
            });
        }
        next();
    } catch (error) {
        console.error('Redis error:', error);
        next(); // Fail open if Redis is down
    }
}

app.use('/api', rateLimiter);

// Proxy to internal protected service
app.use('/api', createProxyMiddleware({ 
    target: 'http://protected-api:8080', 
    changeOrigin: true,
    pathRewrite: {'^/api' : ''}
}));

app.listen(3000, () => {
    console.log('Gateway running on port 3000');
});
