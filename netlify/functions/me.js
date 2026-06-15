const { getSession } = require('./utils/session');
const { getSupabase } = require('./utils/supabase');

exports.handler = async (event) => {
  const session = getSession(event);
  if (!session) {
    return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const supabase = getSupabase();
  const { data: user } = await supabase
    .from('users')
    .select('id, email, name, picture, establishment_name, place_id, google_review_url, tone, auto_send, custom_instructions')
    .eq('id', session.userId)
    .single();

  if (!user) {
    return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'User not found' }) };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  };
};
