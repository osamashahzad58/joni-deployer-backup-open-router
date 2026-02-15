import { ObjectId } from 'mongodb';
import { getDb, USERS_COLLECTION } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const db = await getDb();
    const doc = await db.collection(USERS_COLLECTION).findOne(
      { _id: new ObjectId(userId) },
      { projection: { passwordHash: 0 } }
    );
    if (!doc) {
      return res.status(401).json({ error: 'User not found' });
    }
    return res.json({
      user: { id: doc._id.toString(), username: doc.username },
    });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ error: 'Failed to get user' });
  }
}
