const { getSession } = require('./utils/session');
const { getSupabase } = require('./utils/supabase');

exports.handler = async (event) => {
  const session = getSession(event);
  if (!session) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

  const supabase = getSupabase();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const { data: contacts } = await supabase
    .from('gating_contacts')
    .select('id, name, phone, email, channel, status, created_at')
    .eq('user_id', session.userId)
    .gte('created_at', monthStart.toISOString())
    .order('created_at', { ascending: false });

  const total = contacts?.length || 0;
  const unsatisfied = contacts?.filter(c => c.status === 'unsatisfied').length || 0;
  // Le clic "satisfait" redirige directement vers Google et ne repasse jamais par notre backend :
  // on ne peut donc pas le confirmer, on suppose satisfait tout contact qui n'a pas signalé d'insatisfaction.
  const satisfied = total - unsatisfied;

  const unsatisfiedIds = (contacts || []).filter(c => c.status === 'unsatisfied').map(c => c.id);
  let feedbacks = [];
  if (unsatisfiedIds.length) {
    const { data } = await supabase
      .from('gating_responses')
      .select('id, contact_id, feedback, handled, created_at')
      .in('contact_id', unsatisfiedIds)
      .order('created_at', { ascending: false });
    feedbacks = data || [];
  }

  const contactsById = Object.fromEntries((contacts || []).map(c => [c.id, c]));
  const feedbackList = feedbacks.map(f => ({
    id: f.id,
    handled: f.handled,
    feedback: f.feedback,
    created_at: f.created_at,
    contact: contactsById[f.contact_id] || null,
  }));

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stats: { total, satisfied, unsatisfied },
      contacts: contacts || [],
      feedbacks: feedbackList,
    }),
  };
};
