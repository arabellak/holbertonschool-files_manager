import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) return res.status(400).send({ error: 'Missing email' });

    if (!password) return res.status(400).send({ error: 'Missing password' });

    const findEmail = await dbClient.db.collection('users').findOne({ email });
    if (findEmail) return res.status(400).json({ error: 'Already exist' });

    const hashpass = sha1(password);
    await dbClient.db.collection('users').insertOne({ email, password: hashpass });

    const newUser = await dbClient.db.collection('users').findOne({ email });
    return res.status(201).send({ id: newUser._id, email });
  }

  // Should retrieve the user base on the token used
  static async getMe(req, res) {
    const token = req.header('X-Token');
    if (!token) return res.status(401).send({ error: 'Unauthorized' });

    const getToken = await redisClient.get(`auth_${token}`);
    if (!getToken) return res.status(401).send({ error: 'Unauthorized' });

    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(getToken) });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    return res.status(200).send({ email: user.email, id: user._id });
  }
}

export default UsersController;
