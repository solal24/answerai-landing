const { getSession } = require('./utils/session');
const { getSupabase } = require('./utils/supabase');

const KEYWORDS = ['service', 'cadre', 'attente', 'accueil', 'cuisine', 'prix', 'qualité', 'propreté', 'personnel', 'ambiance'];

exports.handler = async (event) => {
  const session = getSession(event);
  if (!session) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

  const { type = 'weekly' } = event.queryStringParameters || {};

  const now = new Date();
  const start = new Date(now);
  if (type === 'weekly') {
    start.setDate(now.getDate() - 7);
  } else {
    start.setMonth(now.getMonth() - 1);
  }

  const supabase = getSupabase();

  const [{ data: reviews }, { data: contacts }, { data: user }] = await Promise.all([
    supabase
      .from('reviews')
      .select('*')
      .eq('user_id', session.userId)
      .gte('time', start.toISOString())
      .order('time', { ascending: false }),
    supabase
      .from('gating_contacts')
      .select('status, created_at')
      .eq('user_id', session.userId)
      .gte('created_at', start.toISOString()),
    supabase
      .from('users')
      .select('establishment_name, place_id')
      .eq('id', session.userId)
      .single(),
  ]);

  // Stats avis
  const totalReviews = reviews?.length || 0;
  const respondedReviews = reviews?.filter(r => r.status === 'sent').length || 0;
  const avgRating = totalReviews
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / totalReviews).toFixed(1)
    : null;

  // Stats gating
  const gatingTotal = contacts?.length || 0;
  const gatingUnsatisfied = contacts?.filter(c => c.status === 'unsatisfied').length || 0;
  const gatingSatisfied = contacts?.filter(c => c.status === 'satisfied').length || 0;

  // Mots-clés les plus fréquents dans les avis
  const allText = (reviews || []).map(r => r.text || '').join(' ').toLowerCase();
  const keywords = KEYWORDS
    .map(kw => ({ word: kw, count: (allText.match(new RegExp(kw, 'g')) || []).length }))
    .filter(k => k.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Avis par note pour la distribution
  const ratingDist = [1, 2, 3, 4, 5].map(n => ({
    stars: n,
    count: reviews?.filter(r => r.rating === n).length || 0,
  }));

  // Avis récents à afficher dans le rapport
  const topReviews = (reviews || []).slice(0, 3).map(r => ({
    author: r.author_name,
    rating: r.rating,
    text: r.text,
    responded: r.status === 'sent',
  }));

  // Actions recommandées
  const actions = [];
  if (respondedReviews < totalReviews) {
    actions.push(`${totalReviews - respondedReviews} avis n'ont pas encore reçu de réponse — utilisez la génération IA pour les traiter rapidement.`);
  }
  const lowRatings = reviews?.filter(r => r.rating <= 2).length || 0;
  if (lowRatings > 0) {
    actions.push(`${lowRatings} avis négatifs ce mois — consultez les retours pour identifier les problèmes récurrents.`);
  }
  if (gatingUnsatisfied > 0) {
    actions.push(`${gatingUnsatisfied} client(s) insatisfait(s) ont répondu en privé — traitez leurs retours dans la section Review Gating.`);
  }
  if (actions.length === 0) {
    actions.push('Excellent travail ! Continuez à répondre à tous vos avis pour maintenir votre référencement Google.');
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      period: { type, start: start.toISOString(), end: now.toISOString() },
      establishment: user?.establishment_name,
      reviews: { total: totalReviews, responded: respondedReviews, avgRating, ratingDist },
      gating: { total: gatingTotal, satisfied: gatingSatisfied, unsatisfied: gatingUnsatisfied },
      keywords,
      topReviews,
      actions,
    }),
  };
};
