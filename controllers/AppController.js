import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  // Return if Redis and DB are alive by using
  // the two utils done previously with status code 200
  static getStatus(req, res) {
    try {
      const redis = redisClient.isAlive();
      const db = dbClient.isAlive();
      res.status(200).send({ redis, db });
    } catch (error) {
      console.log(error);
    }
  }

  static async getStats(req, res) {
    // Return the number of users and files in DB
    // with status code 200
    try {
      const users = await dbClient.nbUsers();
      const files = await dbClient.nbFiles();

      res.status(200).send({ users, files });
    } catch (error) {
      console.log(error);
    }
  }
}

export default AppController;
