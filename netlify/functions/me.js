const { getSession } = require('./utils/session');
const { getSupabase } = require('./utils/supabase');

exports.handler = async (event) => {
  const session = getSession(event);
  if (!session) {
    return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const supabase = getSupabase();
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, picture, establishment_name, place_id, google_review_url, rating, review_count, tone, auto_send, auto_send_delay_hours, custom_instructions')
    .eq('id', session.userId)
    .single();

  if (error) {
    console.error('me.js select error:', error);
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Database error' }) };
  }

  if (!user) {
    return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'User not found' }) };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  };
};
