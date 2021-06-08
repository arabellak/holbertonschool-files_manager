// Definition of the endpoints
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AppController {
  // Return if Redis and DB are alive by using
  // the two utils done previously with status code 200
  static getStatus(req, res) {
    try {
      const redis = redisClient.isAlive();
      const database = dbClient.isAlive();
      res.status(200).send({ redis, database });
    } catch (err) {
      console.log(err);
    }
  }

  // Return the number of users and files in DB
  // with status code 200
  static async getStats(req, res) {
    try {
      const user = await dbClient.nbUsers();
      const file = await dbClient.nbFiles();
      res.status(200).send({ user, file });
    } catch (err) {
      console.log(err);
    }
  }
}

export default AppController;
