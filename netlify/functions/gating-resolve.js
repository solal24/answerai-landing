const { getSession } = require('./utils/session');
const { getSupabase } = require('./utils/supabase');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: '' };

  const session = getSession(event);
  if (!session) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

  const { feedbackId } = JSON.parse(event.body || '{}');
  if (!feedbackId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing feedbackId' }) };

  const supabase = getSupabase();

  // Vérifie que ce feedback appartient bien à un contact de l'utilisateur connecté
  const { data: feedback } = await supabase
    .from('gating_responses')
    .select('id, contact_id, gating_contacts!inner(user_id)')
    .eq('id', feedbackId)
    .eq('gating_contacts.user_id', session.userId)
    .single();

  if (!feedback) return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) };

  await supabase
    .from('gating_responses')
    .update({ handled: true })
    .eq('id', feedbackId);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true }),
  };
};
