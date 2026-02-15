import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const COOKIE_NAME = 'joni_auth';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req) {
  const cookie = req.headers.cookie
    ?.split(';')
    .find((c) => c.trim().startsWith(`${COOKIE_NAME}=`));
  const token = cookie?.split('=')[1]?.trim();
  return token || null;
}

export function getUserIdFromRequest(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const decoded = verifyToken(token);
  return decoded?.userId || null;
}

export function setAuthCookie(res, token) {
  res.setHeader('Set-Cookie', [
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
  ]);
}

export function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', [`${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`]);
}

export { COOKIE_NAME };
