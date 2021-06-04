const redis = require('redis');
import { promisify } from 'util';

class RedisClient {
  constructor () {
    this.client = redis.createClient();
    this.getAsync = promisify(client.get).bind(client);

    //error
    this.client.on('error', function(error) {
      console.log(error);
    })
    //connected
    this.client.on('connect', function() {
      console.log('Redis client connected to the server');
    })
  };

  isAlive() {
    if (this.client.connected){
      return true
    } else {
      return false
    }
  };

  async get(key) {
    const getKey = await this.getAsync(key);
    return getKey;
  }

  async set(key, value, duration) {
    this.client.setex(key, duration, value)
  }

  async del(key) {
    this.client.del(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
