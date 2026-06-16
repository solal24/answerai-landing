const TONES = {
  professionnel: 'professionnelle et soignée',
  chaleureux: 'chaleureuse et conviviale, comme si vous parliez à un ami',
  formel: 'sobre et formelle',
};

function buildPrompt({ establishmentName, toneDesc, customInstructions, rating, reviewText }) {
  return `Tu es le propriétaire de "${establishmentName}".

Rédige une réponse ${toneDesc} à cet avis Google en français.
La réponse doit :
- Être personnalisée selon le contenu exact de l'avis
- Mentionner naturellement les éléments spécifiques cités (plats, service, cadre…)
- Inclure le nom de l'établissement une fois, de façon naturelle (bon pour le SEO)
- Faire entre 3 et 5 phrases
- Ne pas commencer systématiquement par "Merci"
- Finir par une invitation à revenir
${customInstructions ? `\nInstructions spécifiques : ${customInstructions}` : ''}

Avis (${rating} étoiles) : "${reviewText}"

Réponds uniquement avec la réponse, sans introduction ni guillemets.`;
}

async function generateWithGemini(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Gemini error: ${data.error?.message || res.statusText}`);
  }
  return data.candidates[0].content.parts[0].text.trim();
}

async function generateWithClaude(prompt) {
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic();
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 350,
    messages: [{ role: 'user', content: prompt }],
  });
  return message.content[0].text.trim();
}

async function generateReply({ establishmentName, tone, customInstructions, rating, reviewText }) {
  const toneDesc = TONES[tone] || TONES.professionnel;
  const prompt = buildPrompt({
    establishmentName: establishmentName || "l'établissement",
    toneDesc,
    customInstructions,
    rating,
    reviewText,
  });

  const provider = process.env.AI_PROVIDER || 'gemini';
  return provider === 'claude' ? generateWithClaude(prompt) : generateWithGemini(prompt);
}

module.exports = { generateReply };
