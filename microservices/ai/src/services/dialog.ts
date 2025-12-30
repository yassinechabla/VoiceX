import { OpenAI } from 'openai';
import { ExtractionResult } from './nlu';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY not set. Dialog management will fail.');
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export interface DialogResponse {
  assistantText: string;
  stateUpdates?: {
    state?: 'COLLECTING' | 'CONFIRMING' | 'DONE';
  };
  shouldConfirm: boolean;
  summaryText?: string;
}

/**
 * Generate next dialog response based on session state
 */
export async function getNextDialog(
  text: string,
  sessionState: {
    intent: string;
    missing: string[];
    draft: any;
    language: 'FR' | 'EN';
    state: 'COLLECTING' | 'CONFIRMING' | 'DONE';
  }
): Promise<DialogResponse> {
  const language = sessionState.language;
  
  const systemPrompt = language === 'FR'
    ? `Tu es un assistant vocal pour un restaurant. Tu dois être naturel, amical et concis.
Règles:
- Pose une question à la fois
- Si toutes les informations sont collectées (date, heure, nombre de personnes), propose un résumé et demande confirmation
- Si l'utilisateur confirme (YES), passe à l'état DONE
- Si l'utilisateur refuse (NO), retourne à COLLECTING
- Sois bref (max 2 phrases)`
    : `You are a voice assistant for a restaurant. Be natural, friendly, and concise.
Rules:
- Ask one question at a time
- If all information is collected (date, time, party size), propose a summary and ask for confirmation
- If user confirms (YES), move to DONE state
- If user refuses (NO), return to COLLECTING
- Be brief (max 2 sentences)`;

  const userPrompt = language === 'FR'
    ? `État actuel: ${sessionState.state}
Intent: ${sessionState.intent}
Informations manquantes: ${sessionState.missing.join(', ') || 'Aucune'}
Draft: ${JSON.stringify(sessionState.draft, null, 2)}

Dernière réponse utilisateur: "${text}"

Génère la prochaine réponse de l'assistant (en français, max 2 phrases).`
    : `Current state: ${sessionState.state}
Intent: ${sessionState.intent}
Missing information: ${sessionState.missing.join(', ') || 'None'}
Draft: ${JSON.stringify(sessionState.draft, null, 2)}

Last user response: "${text}"

Generate the next assistant response (in English, max 2 sentences).`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const assistantText = completion.choices[0]?.message?.content || 
      (language === 'FR' ? 'Pouvez-vous répéter ?' : 'Could you repeat?');

    // Determine if we should ask for confirmation
    const shouldConfirm = 
      sessionState.intent === 'RESERVE_TABLE' &&
      sessionState.missing.length === 0 &&
      sessionState.draft.startAt &&
      sessionState.draft.partySize;

    // Generate summary if confirming
    let summaryText: string | undefined;
    if (shouldConfirm && sessionState.draft.startAt) {
      const date = new Date(sessionState.draft.startAt);
      if (language === 'FR') {
        summaryText = `Réservation pour ${sessionState.draft.partySize} personne(s) le ${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}. Confirmez-vous ?`;
      } else {
        summaryText = `Reservation for ${sessionState.draft.partySize} person(s) on ${date.toLocaleDateString('en-US')} at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}. Do you confirm?`;
      }
    }

    return {
      assistantText,
      stateUpdates: {
        state: shouldConfirm ? 'CONFIRMING' : sessionState.state,
      },
      shouldConfirm,
      summaryText,
    };
  } catch (error: any) {
    console.error('Dialog generation error:', error);
    
    // Fallback response
    const fallback = language === 'FR'
      ? 'Pouvez-vous répéter votre demande ?'
      : 'Could you repeat your request?';
    
    return {
      assistantText: fallback,
      shouldConfirm: false,
    };
  }
}

