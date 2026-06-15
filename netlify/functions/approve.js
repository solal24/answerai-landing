const { getSession } = require('./utils/session');
const { getSupabase } = require('./utils/supabase');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: '' };

  const session = getSession(event);
  if (!session) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

  const { reviewId, response } = JSON.parse(event.body || '{}');
  if (!reviewId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing reviewId' }) };

  const supabase = getSupabase();

  // Récupère le token Google de l'utilisateur
  const { data: user } = await supabase
    .from('users')
    .select('access_token, place_id')
    .eq('id', session.userId)
    .single();

  const { data: review } = await supabase
    .from('reviews')
    .select('google_review_id')
    .eq('id', reviewId)
    .eq('user_id', session.userId)
    .single();

  if (!review) return { statusCode: 404, body: JSON.stringify({ error: 'Review not found' }) };

  // Si l'API Google Business Profile est disponible, on répond via l'API
  // Pour l'instant (accès en attente), on marque comme "approuvé" en base
  const finalResponse = response || (await supabase.from('reviews').select('ai_response').eq('id', reviewId).single()).data?.ai_response;

  let repliedViaApi = false;
  if (user?.access_token && review.google_review_id && !review.google_review_id.includes('_')) {
    // Format ID de l'API Business Profile : accounts/xxx/locations/xxx/reviews/xxx
    try {
      const apiRes = await fetch(
        `https://mybusiness.googleapis.com/v4/${review.google_review_id}/reply`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${user.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ comment: finalResponse }),
        }
      );
      repliedViaApi = apiRes.ok;
    } catch (e) {
      console.error('Business API reply failed:', e);
    }
  }

  // Met à jour la BDD
  await supabase
    .from('reviews')
    .update({
      ai_response: finalResponse,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .eq('id', reviewId);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, repliedViaApi }),
  };
};
