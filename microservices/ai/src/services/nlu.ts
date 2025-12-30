import { OpenAI } from 'openai';
import { z } from 'zod';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY not set. NLU extraction will fail.');
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const ExtractionSchema = z.object({
  intent: z.enum(['RESERVE_TABLE', 'CANCEL', 'HOURS', 'ADDRESS', 'OTHER']),
  datetimeISO: z.string().nullable(),
  partySize: z.number().nullable(),
  customerName: z.string().nullable(),
  customerPhone: z.string().nullable(),
  notes: z.string().nullable(),
  affirmation: z.enum(['YES', 'NO', 'UNKNOWN']),
  missing: z.array(z.string()),
  nextQuestion: z.string().nullable(),
  language: z.enum(['FR', 'EN']),
});

export type ExtractionResult = z.infer<typeof ExtractionSchema>;

/**
 * Extract structured information from user text using LLM
 */
export async function extractNLU(
  text: string,
  sessionContext: {
    restaurantId: string;
    fromPhone: string;
    language: 'FR' | 'EN' | 'UNKNOWN';
    draft: any;
  },
  timezone: string
): Promise<ExtractionResult> {
  const language = sessionContext.language === 'UNKNOWN' ? 'FR' : sessionContext.language;
  
  const systemPrompt = language === 'FR'
    ? `Tu es un assistant IA pour un système de réservation de restaurant. 
Extrais les informations de la demande de l'utilisateur et retourne UNIQUEMENT un JSON valide.
Ne devine JAMAIS les valeurs manquantes. Si une information n'est pas explicitement mentionnée, marque-la comme null et ajoute-la à "missing".

Format JSON strict:
{
  "intent": "RESERVE_TABLE" | "CANCEL" | "HOURS" | "ADDRESS" | "OTHER",
  "datetimeISO": "2025-11-15T19:00:00Z" ou null,
  "partySize": 4 ou null,
  "customerName": "Jean Dupont" ou null,
  "customerPhone": "+33123456789" ou null,
  "notes": "Anniversaire" ou null,
  "affirmation": "YES" | "NO" | "UNKNOWN",
  "missing": ["datetimeISO", "partySize"] (liste des champs manquants),
  "nextQuestion": "Pour combien de personnes ?" ou null,
  "language": "FR" | "EN"
}

Règles:
- Si l'utilisateur dit "oui", "d'accord", "correct", etc. -> affirmation: "YES"
- Si l'utilisateur dit "non", "pas ça", etc. -> affirmation: "NO"
- Si l'utilisateur confirme une réservation -> affirmation: "YES"
- Ne devine JAMAIS les valeurs. Si non mentionné, null + ajouter à missing.
- Timezone: ${timezone}`
    : `You are an AI assistant for a restaurant reservation system.
Extract information from the user's request and return ONLY valid JSON.
NEVER guess missing values. If information is not explicitly mentioned, mark it as null and add it to "missing".

Strict JSON format:
{
  "intent": "RESERVE_TABLE" | "CANCEL" | "HOURS" | "ADDRESS" | "OTHER",
  "datetimeISO": "2025-11-15T19:00:00Z" or null,
  "partySize": 4 or null,
  "customerName": "John Doe" or null,
  "customerPhone": "+1234567890" or null,
  "notes": "Birthday" or null,
  "affirmation": "YES" | "NO" | "UNKNOWN",
  "missing": ["datetimeISO", "partySize"] (list of missing fields),
  "nextQuestion": "For how many people?" or null,
  "language": "FR" | "EN"
}

Rules:
- If user says "yes", "okay", "correct", etc. -> affirmation: "YES"
- If user says "no", "not that", etc. -> affirmation: "NO"
- If user confirms a reservation -> affirmation: "YES"
- NEVER guess values. If not mentioned, null + add to missing.
- Timezone: ${timezone}`;

  const userPrompt = language === 'FR'
    ? `Contexte: Restaurant ID ${sessionContext.restaurantId}, Téléphone appelant: ${sessionContext.fromPhone}
Draft actuel: ${JSON.stringify(sessionContext.draft, null, 2)}

Texte utilisateur: "${text}"

Extrais les informations et retourne UNIQUEMENT le JSON (pas de markdown, pas de texte avant/après).`
    : `Context: Restaurant ID ${sessionContext.restaurantId}, Caller phone: ${sessionContext.fromPhone}
Current draft: ${JSON.stringify(sessionContext.draft, null, 2)}

User text: "${text}"

Extract information and return ONLY the JSON (no markdown, no text before/after).`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from LLM');
    }

    // Parse JSON (remove markdown code blocks if present)
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    // Validate with Zod
    const validated = ExtractionSchema.parse(parsed);

    return validated;
  } catch (error: any) {
    console.error('NLU extraction error:', error);
    
    // Fallback extraction
    return {
      intent: 'OTHER',
      datetimeISO: null,
      partySize: null,
      customerName: null,
      customerPhone: sessionContext.fromPhone,
      notes: null,
      affirmation: 'UNKNOWN',
      missing: ['datetimeISO', 'partySize', 'customerName'],
      nextQuestion: language === 'FR' ? 'Pouvez-vous répéter ?' : 'Could you repeat?',
      language: language as 'FR' | 'EN',
    };
  }
}

