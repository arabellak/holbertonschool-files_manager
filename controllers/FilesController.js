// import { v4 as uuid } from 'uuid';
// import fs from 'fs';
// import Bull from 'bull';
// import dbClient from '../utils/db';
// import redisClient from '../utils/redis';

// const { ObjectId } = require('mongodb');

// class FilesController {
//   static async postUpload(req, res) {
//     const fileQueue = new Bull('fileQueue');

//     const token = req.header('X-Token') || null;
//     if (!token) return res.status(401).send({ error: 'Unauthorized' });

//     // Obtain and verify an user in Redis
//     const userId = redisClient.get(`auth_${token}`);
//     if (!userId) return res.status(401).send({ error: 'Unauthorized' });

//     // Obtain and verify an user in MongoDb
//     const user = dbClient.db.collection('users').findOne({ id: ObjectId(userId) });
//     if (!user) return res.status(401).send({ error: 'Unauthorized' });

//     // Create a file

//     // Name
//     const fileName = req.body.name;
//     if (!fileName) return res.status(400).send({ error: 'Missing name' });

//     // Type
//     const fileType = req.body.type;
//     if (!fileType || !['folder', 'file', 'image'].includes(fileType)) return res.status(400).send({ error: 'Missing type' });

//     // Data
//     const fileData = req.body.data;
//     if (!fileData && ['file', 'image'].includes(fileType)) return res.status(400).send({ error: 'Missing data' });

//     const filePublic = req.body.isPublic || false;
//     let fileParentId = req.body.parentId || 0;
//     fileParentId = fileParentId === '0' ? 0 : fileParentId;

//     if (fileParentId !== 0) {
//       const parentFile = dbClient.db.collection('files').findOne({ _id: ObjectId(fileParentId) });
//       if (!parentFile) return res.status(400).send({ error: 'Parent not found' });
//       if (!['folder'].includes(parentFile.type)) return res.status(400).send({ error: 'Parent is not a folder' });
//     }

//     const fileDb = {
//       userId: user._id,
//       name: fileName,
//       type: fileType,
//       isPublic: filePublic,
//       parentId: fileParentId,
//     };
//     if (['folder'].includes(fileType)) {
//       await dbClient.db.collection('files').insertOne(fileDb);
//       return res.status(201).send({
//         id: fileDb._id,
//         userId: fileDb.userId,
//         name: fileDb.name,
//         type: fileDb.type,
//         isPublic: fileDb.isPublic,
//         parentId: fileDb.fileParentId,
//       });
//     }

//     const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
//     const localPath = uuid();

//     const buff = Buffer.from(fileData, 'base64');
//     const pathFile = `${folderPath}/${localPath}`;

//     await fs.mkdir(folderPath, { recursive: true }, (error) => {
//       if (error) return res.status(400).send({ error: error.message });
//       return true;
//     });

//     await fs.writeFile(pathFile, buff, (error) => {
//       if (error) return res.status(400).send({ error: error.message });
//       return true;
//     });

//     fileDb.localPath = pathFile;
//     await dbClient.db.collection('files').insertOne(fileDb);

//     fileQueue.add({
//       userId: fileDb.userId,
//       fileId: fileDb._id,
//     });

//     return res.status(201).send({
//       id: fileDb._id,
//       userId: fileDb.userId,
//       name: fileDb.name,
//       type: fileDb.type,
//       isPublic: fileDb.isPublic,
//       parentId: fileDb.parentId,
//     });
//   }
// }

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

    // get and validate id user  in set aut_token, in redis
    const idUser = await redisClient.get(`auth_${token}`);
    if (!idUser) return response.status(401).send({ error: 'Unauthorized' });

    // get and validate id user  in collection users, in mongo
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(idUser) });
    if (!user) return response.status(401).send({ error: 'Unauthorized' });

    // create a file, data in body, name, type, parentId, isPublic, data

    // name -> filename
    const fileName = request.body.name;
    if (!fileName) return response.status(400).send({ error: 'Missing name' });

    // type: either folder, file or image
    const fileType = request.body.type;
    if (!fileType || !['folder', 'file', 'image'].includes(fileType)) return response.status(400).send({ error: 'Missing type' });

    // data:(only for type=file|image) as Base64 of the file content
    const fileData = request.body.data;
    if (!fileData && ['file', 'image'].includes(fileType)) return response.status(400).send({ error: 'Missing data' });

    // if no file is present in DB for this parentId return an error "Parent not found"
    // whith status code 400 if the file present in DB for this parentId is not of type folder,
    // return an error "Parent is not a folder"  whith status code 400
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
}

export default FilesController;
