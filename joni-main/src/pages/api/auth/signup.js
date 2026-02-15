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
  if (user.length < 2) {
    return res.status(400).json({ error: 'Username too short' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const db = await getDb();
    const col = db.collection(USERS_COLLECTION);
    const existing = await col.findOne({ username: user });
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { insertedId } = await col.insertOne({
      username: user,
      passwordHash,
      createdAt: new Date(),
    });

    const token = signToken({ userId: insertedId.toString(), username: user });
    setAuthCookie(res, token);

    return res.status(201).json({
      user: { id: insertedId.toString(), username: user },
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Signup failed' });
  }
}
