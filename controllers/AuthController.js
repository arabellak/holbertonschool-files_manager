// Endpoints
import sha1 from 'sha1';
import { v4 as uuid } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  // Should sign-in the user by generating a new authentication token
  static async getConnect(req, res) {
    const autHeader = req.headers('Authorization');
    if (!autHeader) return res.status(401).json({ error: 'Use Autorization Header' });

    // Basic auth(base64), authorization header
    const authhead = req.header('Authorization').slice(6);

    // create a buffer with authhead token
    const buffer = Buffer.from(authhead, 'base64');
    const [email, password] = buffer.toString('utf8').split(':');

    // Find a user in a db collection
    const userEmail = await dbClient.db.collection('users').findOne({ email });
    if (!userEmail) return res.status(401).json({ error: 'Unauthorized' });

    const hashpass = sha1(password);
    if (!hashpass !== userEmail.password) return res.status(401).json({ error: 'Unauthorized' });

    const tok = uuid();
    const key = `auth_${tok}`;

    await redisClient.set(key, userEmail._id.toString(), 86400);
    return res.status(200).send({ tok });
  }

  // Retrieve the user based on the token
  static async getDisconnect(req, res) {
    const tok = req.headers('X-Token');
    const key = `auth_${tok}`;

    const getKey = await redisClient.get(key);
    if (!getKey) res.status(401).json({ error: 'Unauthorized' });

    await redisClient.del(key);
    return res.status(204).json({});
  }
}

export default AuthController;
