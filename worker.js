import fs from 'fs';
import Bull from 'bull';
import { ObjectId } from 'mongodb';
import dbClient from './utils/db';

const imageThumbnail = require('image-thumbnail');

const fileQueue = new Bull('fileQueue');
const userQueue = new Bull('userQueue');

const createImage = async (path, opt) => {
  try {
    const thumb = await imageThumbnail(path, opt);
    const pathN = `${path}_${opt.width}`;

    await fs.writeFileSync(pathN, thumb);
  } catch (error) {
    console.log(error);
  }
};

fileQueue.process(async (job) => {
  const { fileId } = job.data;
  if (!fileId) throw Error('Missing fileId');

  const { userId } = job.data;
  if (!userId) throw Error('Missing userId');

  const fileDocument = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId), userId: ObjectId(userId) });
  if (!fileDocument) throw Error('File not found');

  createImage(fileDocument.localPath, { width: 250 });
  createImage(fileDocument.localPath, { width: 100 });
  createImage(fileDocument.localPath, { width: 500 });
});

userQueue.process(async (jobs) => {
  const { userId } = jobs.data;
  if (!userId) throw Error('Missing userId');

  const userDocument = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
  if (!userDocument) throw Error('User not found');
});
