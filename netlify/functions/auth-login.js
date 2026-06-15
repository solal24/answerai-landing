exports.handler = async () => {
  const baseUrl = process.env.URL || 'https://ephemeral-parfait-47018d.netlify.app';

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${baseUrl}/.netlify/functions/auth-callback`,
    response_type: 'code',
    scope: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/business.manage',
    ].join(' '),
    access_type: 'offline',
    prompt: 'consent',
  });

  return {
    statusCode: 302,
    headers: { Location: `https://accounts.google.com/o/oauth2/v2/auth?${params}` },
    body: '',
  };
};
