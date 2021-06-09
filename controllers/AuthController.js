// Endpoints
import sha1 from 'sha1';
import { v4 as uuid } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  // Should sign-in the user by generating a new authentication token
  static connect(req, res) {
    const autHeader = req.headers('Authorization');
    if(!autHeader) return res.status(401).json({ error: 'Unauthorized' });

    const authorize = Buffer.from(autHeader.split(' ')[1], 'base64').toString().split(':');
    const [email, password] = authorize

    const userEmail = dbClient.db.collection('users').findOne({ email });
    if (!userEmail) return res.status(401).json({ error: 'Unauthorized' });

    const hashpass = sha1(password);
    if (!hashpass) return res.status(401).json({ error: 'Unauthorized' });

    if(!user) return res.status(401).json({ error: 'Unauthorized' });

    const tok = uuid();
    const key = `auth_${tok}`;

    redisClient.set(key, userEmail._id.toString(), 86400);
    return res.status(200).send({ tok });
  }

  // Retrieve the user based on the token
  static disconnect(req, res) {
    const tok = req.headers('X-Token');
    const key = `auth_${tok}`;

    const getKey = redisClient.get(key);
    if (!getKey) res.status(401).json({ error: 'Unauthorized' });

    redisClient.del(key);
    return res.status(204).json({});
  }
}

export default AuthController;
