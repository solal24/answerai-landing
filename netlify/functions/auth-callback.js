const jwt = require('jsonwebtoken');
const { getSupabase } = require('./utils/supabase');
const { makeSessionCookie } = require('./utils/session');

exports.handler = async (event) => {
  const baseUrl = process.env.URL || 'https://ephemeral-parfait-47018d.netlify.app';
  const { code, error } = event.queryStringParameters || {};

  if (error || !code) {
    return { statusCode: 302, headers: { Location: '/Auth.html?error=access_denied' }, body: '' };
  }

  // Échange du code contre les tokens Google
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${baseUrl}/.netlify/functions/auth-callback`,
      grant_type: 'authorization_code',
      code,
    }),
  });

  const tokens = await tokenRes.json();
  if (!tokens.access_token) {
    console.error('Token exchange failed:', tokens);
    return { statusCode: 302, headers: { Location: '/Auth.html?error=token_failed' }, body: '' };
  }

  // Infos utilisateur Google
  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const googleUser = await userRes.json();

  // Upsert en base
  const supabase = getSupabase();
  const { data: dbUser, error: dbError } = await supabase
    .from('users')
    .upsert({
      google_id: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
      access_token: tokens.access_token,
      ...(tokens.refresh_token && { refresh_token: tokens.refresh_token }),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'google_id' })
    .select('id, place_id')
    .single();

  if (dbError) {
    console.error('DB upsert error:', dbError);
    return { statusCode: 302, headers: { Location: '/Auth.html?error=db_error' }, body: '' };
  }

  // Session JWT (7 jours)
  const sessionToken = jwt.sign(
    { userId: dbUser.id, email: googleUser.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Si l'établissement n'est pas encore configuré → étape 2 de l'auth
  const destination = dbUser.place_id ? '/Dashboard.html' : '/Auth.html?step=2';

  return {
    statusCode: 302,
    headers: {
      'Set-Cookie': makeSessionCookie(sessionToken),
      Location: destination,
    },
    body: '',
  };
};
