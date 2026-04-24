import Redis from 'ioredis';

let redisClient = null;

export const connectRedis = async () => {
  try {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      retryStrategy: (times) => {
        if (times > 0) {
          console.warn('⚠️  Redis disabled (no local server found). App will run fine without it.');
          return null; // Stop retrying to prevent terminal spam
        }
      },
      lazyConnect: true,
    });

    redisClient.on('connect', () => console.log('✅ Redis connected'));
    redisClient.on('error', (err) => console.error('❌ Redis error:', err.message));
    redisClient.on('reconnecting', () => console.warn('⚠️  Redis reconnecting...'));

    await redisClient.connect();
  } catch (err) {
    console.error('❌ Redis connection failed:', err.message);
    // Non-fatal – app can run without Redis (degraded caching)
    redisClient = null;
  }
};

export const getRedis = () => redisClient;

// Helper: get with JSON parse
export const redisGet = async (key) => {
  if (!redisClient) return null;
  const val = await redisClient.get(key);
  return val ? JSON.parse(val) : null;
};

// Helper: set with JSON stringify + optional TTL (seconds)
export const redisSet = async (key, value, ttl = null) => {
  if (!redisClient) return;
  const serialized = JSON.stringify(value);
  if (ttl) {
    await redisClient.setex(key, ttl, serialized);
  } else {
    await redisClient.set(key, serialized);
  }
};

export const redisDel = async (key) => {
  if (!redisClient) return;
  await redisClient.del(key);
};

export default { connectRedis, getRedis, redisGet, redisSet, redisDel };
