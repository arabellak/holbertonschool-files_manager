import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });

    if (!password) return res.status(400).json({ error: 'Missing password' });

    const findEmail = await dbClient.db.collection('users').findOne({ email });
    if (findEmail) return res.status(400).json({ error: 'Already exist' });

    const hashpass = sha1(password);
    await dbClient.db.collection('users').insertOne({ email, password: hashpass });

    const newUser = await dbClient.db.collection('users').findOne({ email });
    return res.status(201).send({ id: newUser._id, email });
  }

  // Should retrieve the user base on the token used
  static async getMe(req, res) {
    const tok = req.header('X-Token');
    const getToken = await redisClient.get(`auth_${tok}`);
    if (!getToken) return res.status(401).json({ error: 'Unauthorized' });

    const userFind = await dbClient.db.collection('users').findOne({ _id: ObjectId(getToken) });
    return res.json({ email: userFind.email, id: userFind._id });
  }
}

export default UsersController;
