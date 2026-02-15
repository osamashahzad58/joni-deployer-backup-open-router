import bcrypt from 'bcryptjs';
import { getDb, USERS_COLLECTION } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body || {};
  if (!username?.trim() || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const user = username.trim().toLowerCase();

  try {
    const db = await getDb();
    const doc = await db.collection(USERS_COLLECTION).findOne({ username: user });
    if (!doc) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const ok = await bcrypt.compare(password, doc.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = signToken({ userId: doc._id.toString(), username: doc.username });
    setAuthCookie(res, token);

    return res.json({
      user: { id: doc._id.toString(), username: doc.username },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
}
