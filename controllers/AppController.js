// Definition of the endpoints
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AppController {
  // Return if Redis and DB are alive by using
  // the two utils done previously with status code 200
  static getStatus(req, res) {
    const checker = { redis: redisClient.isAlive(), db: dbClient.isAlive() };
    res.status(200).send(checker);
  }

  // Return the number of users and files in DB with status code 200
  static getStats(req, res) {
    const stat = { users: dbClient.nbUsers(), files: dbClient.nbFiles() };
    res.status(200).send(stat);
  }
}

export default AppController;
