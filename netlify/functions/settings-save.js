const { getSession } = require('./utils/session');
const { getSupabase } = require('./utils/supabase');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: '' };

  const session = getSession(event);
  if (!session) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

  const { tone, auto_send, auto_send_delay_hours, custom_instructions, google_review_url, establishment_name } = JSON.parse(event.body || '{}');

  const supabase = getSupabase();
  await supabase
    .from('users')
    .update({
      ...(tone !== undefined && { tone }),
      ...(auto_send !== undefined && { auto_send }),
      ...(auto_send_delay_hours !== undefined && { auto_send_delay_hours }),
      ...(custom_instructions !== undefined && { custom_instructions }),
      ...(google_review_url !== undefined && { google_review_url }),
      ...(establishment_name !== undefined && { establishment_name }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.userId);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true }),
  };
};
