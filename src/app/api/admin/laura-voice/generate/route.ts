import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ELEVENLABS_API = "https://api.elevenlabs.io/v1";

// Laura's voice ID — the new, polished one
const LAURA_VOICE_ID = "aMSt68OGf4xUZAnLpTU8";

// Voice settings tuned for Laura's dry, sarcastic delivery
const VOICE_SETTINGS = {
  stability: 0.3,
  similarity_boost: 0.75,
  style: 0.65,
  use_speaker_boost: true,
};

const ELEVENLABS_MODEL = "eleven_multilingual_v2";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password = body?.password as string | undefined;
    const text = (body?.text as string | undefined)?.trim();

    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    if (!text) {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: "Text too long (max 5000 characters)" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 500 }
      );
    }

    const elevenRes = await fetch(
      `${ELEVENLABS_API}/text-to-speech/${LAURA_VOICE_ID}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: ELEVENLABS_MODEL,
          voice_settings: VOICE_SETTINGS,
        }),
      }
    );

    if (!elevenRes.ok) {
      const errorBody = await elevenRes.text();
      console.error("ElevenLabs failed:", elevenRes.status, errorBody);
      return NextResponse.json(
        {
          error: `ElevenLabs request failed: ${elevenRes.status}`,
          detail: errorBody.slice(0, 200),
        },
        { status: 502 }
      );
    }

    const audioBuffer = await elevenRes.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="laura-${Date.now()}.mp3"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Voice generation error:", error);
    return NextResponse.json(
      { error: "Voice generation failed" },
      { status: 500 }
    );
  }
}
