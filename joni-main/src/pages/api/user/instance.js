import { ObjectId } from 'mongodb';
import { getDb, USER_INSTANCES_COLLECTION } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export default async function handler(req, res) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const uid = new ObjectId(userId);

  if (req.method === 'GET') {
    try {
      const db = await getDb();
      const doc = await db.collection(USER_INSTANCES_COLLECTION).findOne(
        { userId: uid },
        { sort: [['updatedAt', -1]] }
      );
      if (!doc) {
        return res.json({ instance: null });
      }
      return res.json({
        instance: {
          instanceId: doc.instanceId,
          ip: doc.ip,
          token: doc.token,
          status: doc.status,
          channelCompleted: doc.channelCompleted ?? false,
          updatedAt: doc.updatedAt,
        },
      });
    } catch (err) {
      console.error('Get instance error:', err);
      return res.status(500).json({ error: 'Failed to get instance' });
    }
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const { instanceId, ip, token, status, channelCompleted } = body;

    try {
      const db = await getDb();
      const col = db.collection(USER_INSTANCES_COLLECTION);
      const now = new Date();

      const update = {
        userId: uid,
        updatedAt: now,
      };
      if (instanceId !== undefined) update.instanceId = instanceId;
      if (ip !== undefined) update.ip = ip;
      if (token !== undefined) update.token = token;
      if (status !== undefined) update.status = status;
      if (channelCompleted !== undefined) update.channelCompleted = !!channelCompleted;

      const result = await col.findOneAndUpdate(
        { userId: uid },
        {
          $set: update,
          $setOnInsert: { createdAt: now },
        },
        { upsert: true, returnDocument: 'after' }
      );

      const doc = result.value || result;
      return res.json({
        instance: {
          instanceId: doc.instanceId,
          ip: doc.ip,
          token: doc.token,
          status: doc.status,
          channelCompleted: doc.channelCompleted ?? false,
          updatedAt: doc.updatedAt,
        },
      });
    } catch (err) {
      console.error('Save instance error:', err);
      return res.status(500).json({ error: 'Failed to save instance' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
