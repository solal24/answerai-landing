const { getSession } = require('./utils/session');
const { getSupabase } = require('./utils/supabase');
const { generateReply } = require('./utils/ai');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: '' };

  const session = getSession(event);
  if (!session) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

  const { reviewId, tone } = JSON.parse(event.body || '{}');
  if (!reviewId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing reviewId' }) };

  const supabase = getSupabase();

  const [{ data: review }, { data: user }] = await Promise.all([
    supabase.from('reviews').select('*').eq('id', reviewId).eq('user_id', session.userId).single(),
    supabase.from('users').select('establishment_name, tone, custom_instructions').eq('id', session.userId).single(),
  ]);

  if (!review) return { statusCode: 404, body: JSON.stringify({ error: 'Review not found' }) };

  const aiResponse = await generateReply({
    establishmentName: user?.establishment_name,
    tone: tone || user?.tone,
    customInstructions: user?.custom_instructions,
    rating: review.rating,
    reviewText: review.text,
  });

  await supabase
    .from('reviews')
    .update({ ai_response: aiResponse, status: 'pending' })
    .eq('id', reviewId);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ response: aiResponse }),
  };
};
