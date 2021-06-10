// Definition of the endpoints
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AppController {
  // Return if Redis and DB are alive by using
  // the two utils done previously with status code 200
  static getStatus(req, res) {
    const redis = redisClient.isAlive();
    const db = dbClient.isAlive();
    res.status(200).send({ redis, db });
  }

  // Return the number of users and files in DB
  // with status code 200
  static async getStats(req, res) {
    const users = await dbClient.nbUsers();
    const files = await dbClient.nbFiles();
    res.status(200).send({ users, files });
  }
}

export default AppController;
