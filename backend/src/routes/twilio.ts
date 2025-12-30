import { Router, Request, Response } from 'express';
import twilio from 'twilio';
import { Restaurant } from '../models/Restaurant';
import { CallSession } from '../models/CallSession';
import { Reservation } from '../models/Reservation';
import axios from 'axios';
import { checkAndHoldAvailability, confirmReservation, cancelReservation } from '../services/availability';
import { notifyReservationChange } from '../utils/socketEvents';

const router = Router();
const VoiceResponse = twilio.twiml.VoiceResponse;

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:4000';

/**
 * Process audio transcription and NLU extraction
 */
async function processCallAudio(callSid: string, audioUrl: string, session: any) {
  try {
    // Transcribe with Whisper
    const sttResponse = await axios.post(`${AI_SERVICE_URL}/stt/whisper`, {
      audioUrl,
    });
    
    const transcript = sttResponse.data.text;
    const detectedLanguage = sttResponse.data.language || 'UNKNOWN';
    
    // Update session language if still UNKNOWN
    if (session.language === 'UNKNOWN' && (detectedLanguage === 'FR' || detectedLanguage === 'EN')) {
      session.language = detectedLanguage;
      await session.save();
    }
    
    // Add to history
    session.history.push({
      role: 'user',
      text: transcript,
      at: new Date(),
    });
    
    // Extract intent and fields with NLU
    const nluResponse = await axios.post(`${AI_SERVICE_URL}/nlu/extract`, {
      text: transcript,
      sessionContext: {
        restaurantId: session.restaurantId.toString(),
        fromPhone: session.fromPhone,
        language: session.language,
        draft: session.draft,
      },
      timezone: 'Europe/Paris',
    });
    
    const extraction = nluResponse.data;
    
    // Update draft
    if (extraction.intent === 'RESERVE_TABLE') {
      session.draft = {
        ...session.draft,
        ...(extraction.datetimeISO && { startAt: new Date(extraction.datetimeISO) }),
        ...(extraction.partySize && { partySize: extraction.partySize }),
        ...(extraction.customerName && { customerName: extraction.customerName }),
        ...(extraction.customerPhone && { customerPhone: extraction.customerPhone }),
        ...(extraction.notes && { notes: extraction.notes }),
      };
    }
    
    // Get next dialog response
    const dialogResponse = await axios.post(`${AI_SERVICE_URL}/dialog/next`, {
      text: transcript,
      sessionState: {
        intent: extraction.intent,
        missing: extraction.missing,
        draft: session.draft,
        language: session.language,
        state: session.state,
      },
    });
    
    const assistantText = dialogResponse.data.assistantText;
    const shouldConfirm = dialogResponse.data.shouldConfirm || false;
    
    // Add assistant response to history
    session.history.push({
      role: 'assistant',
      text: assistantText,
      at: new Date(),
    });
    
    // Handle confirmation
    if (shouldConfirm && extraction.affirmation === 'YES') {
      session.state = 'CONFIRMING';
      
      // Check availability and create reservation
      if (session.draft.startAt && session.draft.partySize) {
        const result = await checkAndHoldAvailability(
          session.restaurantId,
          new Date(session.draft.startAt),
          session.draft.partySize,
          session.draft.customerName || 'Guest',
          session.draft.customerPhone || session.fromPhone,
          callSid,
          session.language as 'FR' | 'EN'
        );
        
        if (result.available && result.tables) {
          // Find the HOLD reservation and confirm it
          const holdReservation = await Reservation.findOne({
            callSid,
            status: 'HOLD',
          }).sort({ createdAt: -1 });
          
          if (holdReservation) {
            await confirmReservation(holdReservation._id);
            await notifyReservationChange(holdReservation._id.toString());
            session.state = 'DONE';
            session.draft = { ...session.draft, reservationId: holdReservation._id.toString() };
          }
        }
      }
    } else if (extraction.affirmation === 'NO') {
      // Cancel any HOLD reservation
      const holdReservation = await Reservation.findOne({
        callSid,
        status: 'HOLD',
      }).sort({ createdAt: -1 });
      
      if (holdReservation) {
        await cancelReservation(holdReservation._id);
        await notifyReservationChange(holdReservation._id.toString());
      }
      session.state = 'COLLECTING';
    }
    
    session.pendingJob = false;
    await session.save();
    
    return {
      assistantText,
      state: session.state,
      shouldConfirm,
    };
  } catch (error: any) {
    console.error('Error processing call audio:', error);
    session.pendingJob = false;
    session.lastError = error.message;
    await session.save();
    
    const errorMsg = session.language === 'FR' 
      ? 'Désolé, une erreur est survenue. Pouvez-vous répéter ?'
      : 'Sorry, an error occurred. Could you repeat?';
    
    return {
      assistantText: errorMsg,
      state: session.state,
      shouldConfirm: false,
    };
  }
}

/**
 * POST /twilio/voice/incoming
 * Initial webhook when call comes in
 */
router.post('/voice/incoming', async (req: Request, res: Response) => {
  const { From, To, CallSid } = req.body;
  
  try {
    // Find restaurant by phone number
    const restaurant = await Restaurant.findOne({ phoneNumber: To });
    if (!restaurant) {
      const twiml = new VoiceResponse();
      twiml.say('Sorry, restaurant not found.');
      res.type('text/xml');
      return res.send(twiml.toString());
    }
    
    // Create or get call session
    let session = await CallSession.findOne({ callSid: CallSid });
    if (!session) {
      session = new CallSession({
        callSid: CallSid,
        restaurantId: restaurant._id,
        fromPhone: From,
        language: 'UNKNOWN',
        state: 'COLLECTING',
        draft: {},
        history: [],
        pendingJob: false,
      });
      await session.save();
    }
    
    const twiml = new VoiceResponse();
    
    // Greeting based on language (default to French)
    const greeting = session.language === 'EN' 
      ? 'Hello, this is the restaurant. How can I help you?'
      : 'Bonjour, c\'est le restaurant. Comment puis-je vous aider ?';
    
    twiml.say({ voice: 'alice', language: session.language === 'EN' ? 'en-US' : 'fr-FR' }, greeting);
    
    // Record user response (max 10 seconds)
    twiml.record({
      maxLength: 10,
      action: '/twilio/voice/recording',
      method: 'POST',
      finishOnKey: '#',
    });
    
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error: any) {
    console.error('Error in incoming webhook:', error);
    const twiml = new VoiceResponse();
    twiml.say('Sorry, an error occurred.');
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

/**
 * POST /twilio/voice/recording
 * Called after recording is complete
 */
router.post('/voice/recording', async (req: Request, res: Response) => {
  const { CallSid, RecordingUrl } = req.body;
  
  try {
    const session = await CallSession.findOne({ callSid: CallSid });
    if (!session) {
      const twiml = new VoiceResponse();
      twiml.say('Session not found.');
      res.type('text/xml');
      return res.send(twiml.toString());
    }
    
    // Mark job as pending
    session.pendingJob = true;
    await session.save();
    
    // Start async processing (non-blocking)
    processCallAudio(CallSid, RecordingUrl, session).catch(err => {
      console.error('Background processing error:', err);
    });
    
    // Immediate response
    const twiml = new VoiceResponse();
    const waitMsg = session.language === 'EN' 
      ? 'One moment please.'
      : 'Un instant, s\'il vous plaît.';
    
    twiml.say({ voice: 'alice', language: session.language === 'EN' ? 'en-US' : 'fr-FR' }, waitMsg);
    twiml.pause({ length: 2 });
    twiml.redirect({ method: 'POST' }, '/twilio/voice/poll');
    
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error: any) {
    console.error('Error in recording webhook:', error);
    const twiml = new VoiceResponse();
    twiml.say('Sorry, an error occurred.');
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

/**
 * POST /twilio/voice/poll
 * Polling endpoint to check if processing is done
 */
router.post('/voice/poll', async (req: Request, res: Response) => {
  const { CallSid } = req.body;
  
  try {
    const session = await CallSession.findOne({ callSid: CallSid });
    if (!session) {
      const twiml = new VoiceResponse();
      twiml.say('Session not found.');
      twiml.hangup();
      res.type('text/xml');
      return res.send(twiml.toString());
    }
    
    const twiml = new VoiceResponse();
    
    // If still processing, wait and redirect again
    if (session.pendingJob) {
      twiml.pause({ length: 2 });
      twiml.redirect({ method: 'POST' }, '/twilio/voice/poll');
      res.type('text/xml');
      return res.send(twiml.toString());
    }
    
    // Processing done, get last assistant message
    const lastAssistant = session.history
      .filter((h: any) => h.role === 'assistant')
      .pop();
    
    if (lastAssistant) {
      twiml.say(
        { voice: 'alice', language: session.language === 'EN' ? 'en-US' : 'fr-FR' },
        lastAssistant.text
      );
    }
    
    // If done, hang up
    if (session.state === 'DONE') {
      const goodbye = session.language === 'EN' 
        ? 'Thank you for calling. Goodbye.'
        : 'Merci de votre appel. Au revoir.';
      twiml.say({ voice: 'alice', language: session.language === 'EN' ? 'en-US' : 'fr-FR' }, goodbye);
      twiml.hangup();
    } else {
      // Continue conversation
      twiml.record({
        maxLength: 10,
        action: '/twilio/voice/recording',
        method: 'POST',
        finishOnKey: '#',
      });
    }
    
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error: any) {
    console.error('Error in poll webhook:', error);
    const twiml = new VoiceResponse();
    twiml.say('Sorry, an error occurred.');
    twiml.hangup();
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

export default router;

