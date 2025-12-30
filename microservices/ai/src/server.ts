import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { transcribeWithWhisper } from './services/whisper';
import { extractNLU } from './services/nlu';
import { getNextDialog } from './services/dialog';

dotenv.config();

const app: Express = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * POST /stt/whisper
 * Transcribe audio using Whisper
 */
app.post('/stt/whisper', async (req: Request, res: Response) => {
  try {
    const { audioUrl } = req.body;
    
    if (!audioUrl) {
      return res.status(400).json({ error: 'audioUrl is required' });
    }
    
    const result = await transcribeWithWhisper(audioUrl);
    res.json(result);
  } catch (error: any) {
    console.error('STT error:', error);
    res.status(500).json({ error: error.message || 'Transcription failed' });
  }
});

/**
 * POST /nlu/extract
 * Extract structured information from text
 */
app.post('/nlu/extract', async (req: Request, res: Response) => {
  try {
    const { text, sessionContext, timezone } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }
    
    const result = await extractNLU(
      text,
      sessionContext || {},
      timezone || 'Europe/Paris'
    );
    
    res.json(result);
  } catch (error: any) {
    console.error('NLU error:', error);
    res.status(500).json({ error: error.message || 'Extraction failed' });
  }
});

/**
 * POST /dialog/next
 * Get next dialog response
 */
app.post('/dialog/next', async (req: Request, res: Response) => {
  try {
    const { text, sessionState } = req.body;
    
    if (!text || !sessionState) {
      return res.status(400).json({ error: 'text and sessionState are required' });
    }
    
    const result = await getNextDialog(text, sessionState);
    res.json(result);
  } catch (error: any) {
    console.error('Dialog error:', error);
    res.status(500).json({ error: error.message || 'Dialog generation failed' });
  }
});

/**
 * POST /tts/speak (optional)
 * Text-to-speech (not implemented, using Twilio <Say> instead)
 */
app.post('/tts/speak', async (req: Request, res: Response) => {
  res.status(501).json({ 
    message: 'TTS not implemented. Using Twilio <Say> for voice synthesis.',
    note: 'To implement TTS, integrate Amazon Polly or similar service.',
  });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    service: 'ai',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🤖 AI Microservice running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});

export default app;

