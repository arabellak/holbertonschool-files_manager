//Endpoints
import dbClient from '../utils/db';
import { uuid } from 'uuidv4';
import redisClient from '../utils/redis'
import { connect } from 'mongodb';

class AuthController {
  //Should sign-in the user by generating a new authentication token
  static connect(req, res) {
    try {
      const base64Credentials = (req.headers.authorization).split(' ')[1];
      const [email, passwrd] = Buffer.from(base64Credentials, 'base64').toString().split(':')

      const userEmail = dbClient.db.collection('users').findOne({ email });
      if (!userEmail) return res.status(401).json({ error: 'Unauthorized' });

      const hashpass = sha1(passwrd);
      if (!hashpass) return res.status(401).json({ error: 'Unauthorized' });

      const tok = uuid()
      const key = `auth_${tok}`

      redisClient.set(key, userEmail._id.toString(), 86400)
      return res.status(200).send({ tok })
    } catch (error){
      console.log(error)
    }
  }

  //Retrieve the user based on the token
  static disconnect(req, res) {
    const tok = req.header('X-Token')
    const key = `auth_${tok}`

    const getKey = redisClient.get(key)
    if (!getKey) res.status(401).json({ error: 'Unauthorized' })
    
    redisClient.del(key)
    return res.status(204).json({});
  }
}

export default AuthController;
