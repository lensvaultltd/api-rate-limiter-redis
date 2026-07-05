const redis = require('redis');

const client = redis.createClient({ url: 'redis://localhost:6379' });
client.connect();

const rateLimiter = async (req, res, next) => {
    const ip = req.ip;
    const limit = 100;
    const windowSecs = 60;
    
    const current = await client.incr(ip);
    if (current === 1) {
        await client.expire(ip, windowSecs);
    }
    
    if (current > limit) {
        return res.status(429).json({ error: "Too many requests. Please try again later." });
    }
    
    next();
};

module.exports = rateLimiter;
