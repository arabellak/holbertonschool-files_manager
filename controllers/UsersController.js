import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';

const sha1 = require('sha1');

class UsersController {
  static postNew(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).send({ error: 'Missing email' });
      }

      const passwrd = req.body.password;
      if (!passwrd) {
        return res.status(400).send({ error: 'Missing password' });
      }

      const findEmail = dbClient.db.collection('users').findOne({ email });
      if (findEmail) {
        return res.status(400).send({ error: 'Already exist' });
      }

      let userId;
      const hashpass = sha1(passwrd);
      const newUser = {
        email,
        password: hashpass,
      };

      try {
        dbClient.db.collection('users').insertOne(newUser, (error) => {
          userId = newUser._id;
          return res.status(201).send({ email, id: userId });
        });
      } catch (error) {
        return res.status(error.status).send({ error });
      }
    } catch (err) {
      return res.status(500).send({ error: 'server not connected' });
    }
  }
}

export default UsersController;
