const jwt = require('jsonwebtoken');

function getSession(event) {
  const cookie = event.headers.cookie || '';
  const match = cookie.split(';').find(c => c.trim().startsWith('answerai_session='));
  if (!match) return null;
  const token = match.split('=').slice(1).join('=').trim();
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

function makeSessionCookie(token) {
  return `answerai_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 3600}`;
}

function clearSessionCookie() {
  return `answerai_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

module.exports = { getSession, makeSessionCookie, clearSessionCookie };
