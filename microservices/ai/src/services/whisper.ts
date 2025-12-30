import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { OpenAI } from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY not set. Whisper transcription will fail.');
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

/**
 * Transcribe audio using OpenAI Whisper API
 */
export async function transcribeWithWhisper(audioUrl: string): Promise<{ text: string; language: string }> {
  try {
    // Download audio file
    const response = await axios.get(audioUrl, {
      responseType: 'arraybuffer',
    });
    
    const audioBuffer = Buffer.from(response.data);
    
    // Create a temporary file
    const tempFile = `/tmp/audio_${Date.now()}.wav`;
    fs.writeFileSync(tempFile, audioBuffer);
    
    try {
      // Transcribe with Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFile),
        model: 'whisper-1',
        language: undefined, // Auto-detect
        response_format: 'verbose_json',
      });
      
      // Clean up temp file
      fs.unlinkSync(tempFile);
      
      return {
        text: transcription.text,
        language: (transcription as any).language === 'fr' ? 'FR' : 'EN',
      };
    } catch (error) {
      // Clean up temp file on error
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Whisper transcription error:', error);
    throw new Error(`Transcription failed: ${error.message}`);
  }
}

