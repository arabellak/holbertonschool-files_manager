import sha1 from 'sha1';
import dbClient from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const findEmail = await dbClient.db.collection('users').findOne({ email });
    if (findEmail) {
      return res.status(400).json({ error: 'Already exist' });
    }

    const hashpass = sha1(password);
    await dbClient.db.collection('users').insertOne({ email, password: hashpass });

    const newUser = await dbClient.db.collection('users').findOne({ email });
    return res.status(201).send({ id: newUser._id, email });
  }
}

export default UsersController;
