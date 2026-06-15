const jwt = require('jsonwebtoken');
const { getSupabase } = require('./utils/supabase');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: '' };

  const { token, feedback } = JSON.parse(event.body || '{}');
  if (!token) return { statusCode: 400, body: JSON.stringify({ error: 'Missing token' }) };

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid or expired link' }) };
  }

  const supabase = getSupabase();

  // Marque le contact comme insatisfait
  await supabase
    .from('gating_contacts')
    .update({ status: 'unsatisfied' })
    .eq('id', decoded.contactId);

  // Sauvegarde le retour
  if (feedback) {
    await supabase
      .from('gating_responses')
      .insert({
        contact_id: decoded.contactId,
        feedback,
      });
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true }),
  };
};
