import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import Bull from 'bull';
const { ObjectId } = require('mongodb');


class FilesController {
  static async postUpload(req, res) {
    const fileQueue = new Bull('fileQueue');
    const token = req.header('X-Token') || null;

    if (!token) return res.status(401).send({ error: 'Unauthorized' });

    // Obtain and verify an user in Redis
    const userId = redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).send({ error: 'Unauthorized' });

    // Obtain and verify an user in MongoDb
    const user = dbClient.db.collection('users').findOne({ id: ObjectId(userId) });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    // Create a file
    // Name
    const fileName = req.body.name;
    if (!fileName) return res.status(400).send({ error: 'Missing name' });

    // Type
    const fileType = req.body.type;
    if (!fileType || !['folder', 'file', 'image'].includes(fileType)) return res.status(400).send({ error: 'Missing type' });

    // Data
    const fileData = req.body.data;
    if (!fileData && ['file', 'image'].includes(fileType)) return res.status(400).send({ error: 'Missing data' });

    const filePublic = req.body.isPublic || false;
    let fileParentId = req.body.parentId || 0;

    fileParentId = fileParentId === '0' ? 0 : fileParentId;
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
    };

    if (['folder'].includes(fileType)) {
      await dbClient.db.collection('files').insertOne(fileDb);
      return res.status(201).send({
        id: fileDb._id,
        userId: fileDb.userId,
        name: fileDb.name,
        type: fileDb.type,
        isPublic: fileDb.isPublic,
        parentId: fileDb.fileParentId,
      });
    }

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const pathUuid = uuid();
    const buff = Buffer.from(fileData, 'base64');
    const pathFile = `${folderPath}/${pathUuid}`;

    await fs.mkdir(folderPath, { recursive: true }, (error) => {
      if (error) return res.status(400).send({ error: error.message });
      return true;
    });

    await fs.writeFile(pathFile, buff, (error) => {
      if (error) return res.status(400).send({ error: error.message });
      return true;
    });

    fileDb.localPath = pathFile;
    await dbClient.db.collection('files').insertOne(fileDb);
    fileQueue.add({
      userId: fileDb.userId,
      fileId: fileDb._id,
    });

    return res.status(201).send({
      id: fileDb._id,
      userId: fileDb.userId,
      name: fileDb.name,
      type: fileDb.type,
      isPublic: fileDb.isPublic,
      parentId: fileDb.parentId,
    });
  }
}

export default FilesController;
