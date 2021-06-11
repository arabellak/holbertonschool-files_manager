import { v4 as uuid } from 'uuid';
import fs from 'fs';
import Bull from 'bull';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const { ObjectId } = require('mongodb');

class FilesController {
  static async postUpload(request, response) {
    const fileQueue = new Bull('fileQueue');

    const token = request.header('X-Token') || null;
    if (!token) return response.status(401).send({ error: 'Unauthorized' });

    // Obtain and verify an user in redis
    const idUser = await redisClient.get(`auth_${token}`);
    if (!idUser) return response.status(401).send({ error: 'Unauthorized' });

    // Obtain and verify an user in mongo
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(idUser) });
    if (!user) return response.status(401).send({ error: 'Unauthorized' });

    // Create a file
    // Name
    const fileName = request.body.name;
    if (!fileName) return response.status(400).send({ error: 'Missing name' });

    // Type
    const fileType = request.body.type;
    if (!fileType || !['folder', 'file', 'image'].includes(fileType)) return response.status(400).send({ error: 'Missing type' });

    // Data
    const fileData = request.body.data;
    if (!fileData && ['file', 'image'].includes(fileType)) return response.status(400).send({ error: 'Missing data' });

    const fileIsPublic = request.body.isPublic || false;
    let fileParentId = request.body.parentId || 0;
    fileParentId = fileParentId === '0' ? 0 : fileParentId;

    if (fileParentId !== 0) {
      const parentFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileParentId) });
      if (!parentFile) return response.status(400).send({ error: 'Parent not found' });
      if (!['folder'].includes(parentFile.type)) return response.status(400).send({ error: 'Parent is not a folder' });
    }
    const fileDataDb = {
      userId: user._id,
      name: fileName,
      type: fileType,
      isPublic: fileIsPublic,
      parentId: fileParentId,
    };

    if (['folder'].includes(fileType)) {
      await dbClient.db.collection('files').insertOne(fileDataDb);
      return response.status(201).send({
        id: fileDataDb._id,
        userId: fileDataDb.userId,
        name: fileDataDb.name,
        type: fileDataDb.type,
        isPublic: fileDataDb.isPublic,
        parentId: fileDataDb.parentId,
      });
    }

    const pathDir = process.env.FOLDER_PATH || '/tmp/files_manager';
    const fileUuid = uuid();

    const buff = Buffer.from(fileData, 'base64');
    const pathFile = `${pathDir}/${fileUuid}`;

    await fs.mkdir(pathDir, { recursive: true }, (error) => {
      if (error) return response.status(400).send({ error: error.message });
      return true;
    });

    await fs.writeFile(pathFile, buff, (error) => {
      if (error) return response.status(400).send({ error: error.message });
      return true;
    });

    fileDataDb.localPath = pathFile;
    await dbClient.db.collection('files').insertOne(fileDataDb);

    fileQueue.add({
      userId: fileDataDb.userId,
      fileId: fileDataDb._id,
    });

    return response.status(201).send({
      id: fileDataDb._id,
      userId: fileDataDb.userId,
      name: fileDataDb.name,
      type: fileDataDb.type,
      isPublic: fileDataDb.isPublic,
      parentId: fileDataDb.parentId,
    });
  }

  // Retrieves the file document based on the ID
  static async getShow(req, res) {
    // Retrieve the user based on the token
    const token = req.header('X-Token') || null;
    if (!token) return res.status(401).send({ error: 'Unauthorized' });

    // Obtain and verify an user in redis
    const idUser = await redisClient.get(`auth_${token}`);
    if (!idUser) return res.status(401).send({ error: 'Unauthorized' });

    // Obtain and verify an user in mongo
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(idUser) });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const idFile = req.params.id;

    const findFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(idFile), userId: user._id });
    if (!findFile) return res.status(404).send({ error: 'Not found' });

    return res.send({
      id: findFile._id,
      userId: findFile.userId,
      name: findFile.name,
      type: findFile.type,
      isPublic: findFile.isPublic,
      parentId: findFile.parentId,
    });
  }

  // Retrieves all users file documents for a specific parentId and with pagination
  static async getIndex(req, res) {
    // Retrieve the user based on the token
    const token = req.header('X-Token') || null;
    if (!token) return res.status(401).send({ error: 'Unauthorized' });

    // Obtain and verify an user in redis
    const idUser = await redisClient.get(`auth_${token}`);
    if (!idUser) return res.status(401).send({ error: 'Unauthorized' });

    // Obtain and verify an user in mongo
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(idUser) });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const parentId = req.query.parentId || 0;
    if (!parentId) return [];

    const page = req.query.page || 0;
    return page;
  }

  static async putPublish(req, res) {
    const token = req.header('X-Token') || null;
    if (!token) return res.status(401).send({ error: 'Unauthorized' });

    const redisToken = await redisClient.get(`auth_${token}`);
    if (!redisToken) return res.status(401).send({ error: 'Unauthorized' });

    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(redisToken) });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const idFile = req.params.id || '';

    let fileDocument = await dbClient.db.collection('files').findOne({ _id: ObjectId(idFile), userId: user._id });
    if (!fileDocument) return res.status(404).send({ error: 'Not found' });

    await dbClient.db.collection('files').update({ _id: ObjectId(idFile) }, { $set: { isPublic: true } });
    fileDocument = await dbClient.db.collection('files').findOne({ _id: ObjectId(idFile), userId: user._id });

    return res.send({
      id: fileDocument._id,
      userId: fileDocument.userId,
      name: fileDocument.name,
      type: fileDocument.type,
      isPublic: fileDocument.isPublic,
      parentId: fileDocument.parentId,
    });
  }

  static async putUnpublish(req, res) {
    const token = req.header('X-Token') || null;
    if (!token) return res.status(401).send({ error: 'Unauthorized' });

    const redisToken = await redisClient.get(`auth_${token}`);
    if (!redisToken) return res.status(401).send({ error: 'Unauthorized' });

    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(redisToken) });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const idFile = req.params.id || '';

    let fileDocument = await dbClient.db.collection('files').findOne({ _id: ObjectId(idFile), userId: user._id });
    if (!fileDocument) return res.status(404).send({ error: 'Not found' });

    await dbClient.db.collection('files').update({ _id: ObjectId(idFile), userId: user._id }, { $set: { isPublic: false } });
    fileDocument = await dbClient.db.collection('files').findOne({ _id: ObjectId(idFile), userId: user._id });

    return res.send({
      id: fileDocument._id,
      userId: fileDocument.userId,
      name: fileDocument.name,
      type: fileDocument.type,
      isPublic: fileDocument.isPublic,
      parentId: fileDocument.parentId,
    });
  }

  static async getFile(req, res) {
    const idFile = req.params.id || '';

    let fileDocument = await dbClient.db.collection('files').findOne({ _id: ObjectId(idFile) });
    if (!fileDocument) return res.status(404).send({ error: 'Not found' });

    const iP = fileDocument.isPublic
    const type = fileDocument.type
    const userId = fileDocument.userId

    const owner = false;
    const user = null;

    const token = req.header('X-Token') || null;
    if (token) const redisToken = await redisClient.get(`auth_${token}`);

    user = await dbClient.db.collection('users').findOne({ _id: ObjectId(redisToken) });
    if (user) owner = user._id === userId

    if (!iP && (user != owner)) return res.status(404).send({ error: 'Not found' });
    
    if (['folder'].includes(type)) return res.status(400).send({ error: "A folder doesn't have content"});

    if (!fileDocument.localPath) return res.status(404).send({ error: 'Not found'});
  }
}

export default FilesController;
