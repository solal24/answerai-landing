const { clearSessionCookie } = require('./utils/session');

exports.handler = async () => {
  return {
    statusCode: 302,
    headers: {
      'Set-Cookie': clearSessionCookie(),
      Location: '/',
    },
    body: '',
  };
};
