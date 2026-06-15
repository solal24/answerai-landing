const Anthropic = require('@anthropic-ai/sdk');
const { getSession } = require('./utils/session');
const { getSupabase } = require('./utils/supabase');

const TONES = {
  professionnel: 'professionnelle et soignée',
  chaleureux: 'chaleureuse et conviviale, comme si vous parliez à un ami',
  formel: 'sobre et formelle',
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: '' };

  const session = getSession(event);
  if (!session) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

  const { reviewId, tone } = JSON.parse(event.body || '{}');
  if (!reviewId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing reviewId' }) };

  const supabase = getSupabase();

  // Récupère l'avis et les paramètres utilisateur
  const [{ data: review }, { data: user }] = await Promise.all([
    supabase.from('reviews').select('*').eq('id', reviewId).eq('user_id', session.userId).single(),
    supabase.from('users').select('establishment_name, tone, custom_instructions').eq('id', session.userId).single(),
  ]);

  if (!review) return { statusCode: 404, body: JSON.stringify({ error: 'Review not found' }) };

  const selectedTone = tone || user?.tone || 'professionnel';
  const toneDesc = TONES[selectedTone] || TONES.professionnel;
  const customInstructions = user?.custom_instructions ? `\nInstructions spécifiques : ${user.custom_instructions}` : '';

  const client = new Anthropic();
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 350,
    messages: [{
      role: 'user',
      content: `Tu es le propriétaire de "${user?.establishment_name || 'l\'établissement'}".

Rédige une réponse ${toneDesc} à cet avis Google en français.
La réponse doit :
- Être personnalisée selon le contenu exact de l'avis
- Mentionner naturellement les éléments spécifiques cités (plats, service, cadre…)
- Inclure le nom de l'établissement une fois, de façon naturelle (bon pour le SEO)
- Faire entre 3 et 5 phrases
- Ne pas commencer systématiquement par "Merci"
- Finir par une invitation à revenir
${customInstructions}

Avis (${review.rating} étoiles) : "${review.text}"

Réponds uniquement avec la réponse, sans introduction ni guillemets.`,
    }],
  });

  const aiResponse = message.content[0].text.trim();

  // Sauvegarde la réponse générée
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
