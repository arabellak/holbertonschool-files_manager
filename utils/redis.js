import { promisify } from 'util';

const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.getAsync = promisify(this.client.get).bind(this.client);

    // error
    this.client.on('error', (error) => {
      console.log(error);
    });
    // connected
    this.client.on('connect', () => {
      console.log('Redis client connected to the server');
    });
  }

  isAlive() {
    if (this.client.connected) {
      return true;
    }
    return false;
  }

  async get(key) {
    const getKey = await this.getAsync(key);
    return getKey;
  }

  async set(key, value, duration) {
    this.client.setex(key, duration, value);
  }

  async del(key) {
    this.client.del(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
