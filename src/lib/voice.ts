import { put } from "@vercel/blob";

const ELEVENLABS_API = "https://api.elevenlabs.io/v1";

// Voice settings tuned for Laura's dry, sarcastic delivery
const VOICE_SETTINGS = {
  stability: 0.3, // low = more tonal variation (sarcasm needs it)
  similarity_boost: 0.75,
  style: 0.65, // moderately expressive
  use_speaker_boost: true,
};

interface ElevenLabsPayload {
  text: string;
  model_id: string;
  voice_settings: typeof VOICE_SETTINGS;
}

/** Generate audio for a blog entry body using ElevenLabs. Returns MP3 ArrayBuffer. */
export async function generateVoice(text: string): Promise<ArrayBuffer | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !voiceId) return null;

  const payload: ElevenLabsPayload = {
    text,
    model_id: "eleven_multilingual_v2",
    voice_settings: VOICE_SETTINGS,
  };

  try {
    const res = await fetch(
      `${ELEVENLABS_API}/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error(`ElevenLabs failed: ${res.status}`, err.slice(0, 200));
      return null;
    }

    return await res.arrayBuffer();
  } catch (error) {
    console.error("ElevenLabs request error:", error);
    return null;
  }
}

/** Save an MP3 buffer to Vercel Blob under /audio/entry-{rideId}.mp3 */
export async function saveAudio(
  rideId: number,
  mp3: ArrayBuffer
): Promise<string | null> {
  try {
    const blob = await put(`audio/entry-${rideId}.mp3`, mp3, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "audio/mpeg",
    });
    return blob.url;
  } catch (error) {
    console.error(`Failed to save audio for ride ${rideId}:`, error);
    return null;
  }
}

/** One-shot: generate audio + save it + return the URL. */
export async function generateAndSaveAudio(
  rideId: number,
  text: string
): Promise<string | null> {
  const mp3 = await generateVoice(text);
  if (!mp3) return null;
  return await saveAudio(rideId, mp3);
}
