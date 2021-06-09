import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import { ObjectId } from 'mongodb';
import { v4 as uuid } from 'uuid';


class filesController {
    static postUpload(req, res) {
      const token = req.header('X-Token');
      if (!token) return res.status(401).send({ error: 'Unauthorized' })
      
      //Obtain and verify an user in Redis
      const userId = redisClient.get(`auth_${token}`)
      if (!userId) return res.status(401).send({ error: 'Unauthorized' })

      //Obtain and verify an user in MongoDb
      const user = dbClient.db.collection('users').findOne({ id: ObjectId(userId) });
      if (!user) return res.status(401).send({ error: 'Unauthorized' })

      //Create a file

      //Name
      const fileName = req.body.name
      if (!fileName) return res.status(400).send({ error: 'Missing name' })

      //Type
      const fileType = req.body.type
      if (!fileType || !['folder', 'file', 'image'].includes(fileType)) return res.status(400).send({ error: 'Missing type' })

      //Data
      const fileData = req.body.data
      if (!fileData && ['file', 'image'].includes(fileType)) return res.status(400).send({ error: 'Missing data' })

      const filePublic = req.body.isPublic || false
      const fileParentId = req.body.parentId || 0
      
      if (fileParentId !== 0) {
        const parentFile = dbClient.db.collection('files').findOne({ _id: ObjectId(fileParentId) });
        if (!parentFile) return res.status(400).send({ error: 'Parent not found' });
        if (!['folder'].includes(parentFile.type)) return res.status(400).send({ error: 'Parent is not a folder' });
      }

      const fileDb = {
        userId: user._id,
        name: fileName,
        type: fileType,
        isPublic: filePublic,
        parentId: fileParentId,
      }
      if (['folder'].includes(fileType)) {
        dbClient.db.collection('files').insertOne(fileDb)
        return res.status(201).send({
          id: fileDb._id,
          userId: fileDb.userId,
          name: fileDb.name,
          type: fileDb.type,
          isPublic: fileDb.isPublic,
          parentId: fileDb.fileParentId
        })
      }

      const allFiles = process.env.FOLDER_PATH || '/tmp/files_manager';
      
    }
}