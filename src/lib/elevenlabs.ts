// ════════════════════════════════════════════════════════════════
// ElevenLabs — text-to-speech client
// ════════════════════════════════════════════════════════════════
// Wraps the ElevenLabs REST API. Set ELEVENLABS_API_KEY in .env.
// We use the multilingual v2 model so it handles Arabic well.

export function isElevenLabsConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

const BASE = "https://api.elevenlabs.io/v1";

// A small set of high-quality multilingual voices. The voice ids come
// straight from the public ElevenLabs catalogue and are stable.
//
// We map the simple Arabic-friendly labels we expose in the UI to
// real voice ids so the user picker doesn't change just because
// ElevenLabs adds a voice.
export const ELEVENLABS_VOICES: Record<string, { id: string; name: string }> = {
  adam:    { id: "pNInz6obpgDQGcFmaJgB", name: "Adam — وثائقي عميق"      },
  sarah:   { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah — قصصي ومرح"        },
  fahad:   { id: "JBFqnCBsd6RMkjVDRZzb", name: "Fahad — إخباري رسمي"      },
  yuki:    { id: "AZnzlk1XvdvUeBnXmlld", name: "Yuki — أنمي حماسي"        },
  james:   { id: "VR6AewLTigWG4xSOukaG", name: "James — هادئ ومحترف"      },
  lina:    { id: "MF3mGyEYCl7XYWbV9V6O", name: "Lina — ناعم ودافئ"          },
  marcus:  { id: "ErXwobaYiN019PkySvjV", name: "Marcus — درامي قوي"        },
  nour:    { id: "ThT5KcBeYPX3keUQqHPh", name: "Nour — شبابي وعصري"        },
};

export interface SynthesizeOpts {
  voice:    string;          // key in ELEVENLABS_VOICES, or raw voice id
  text:     string;
  format?:  "mp3" | "wav";   // wav = pcm_24000 wrapped client-side
  speed?:   number;          // 0.5 - 2.0 (we ignore — sent via SSML if needed)
  // ElevenLabs voice settings — sensible defaults for narration.
  stability?:        number; // 0..1
  similarityBoost?:  number; // 0..1
  style?:            number; // 0..1 (mood/expressiveness)
}

export interface SynthesizeResult {
  buffer:   ArrayBuffer;
  mimeType: string;
}

/** Render text → speech as raw audio bytes. */
export async function synthesize(opts: SynthesizeOpts): Promise<SynthesizeResult> {
  if (!isElevenLabsConfigured()) {
    throw new Error("ElevenLabs not configured (ELEVENLABS_API_KEY missing)");
  }

  const voiceId = ELEVENLABS_VOICES[opts.voice]?.id ?? opts.voice;
  const format  = opts.format ?? "mp3";
  // ElevenLabs format codes — see https://elevenlabs.io/docs/api-reference/text-to-speech
  const outputFormat = format === "wav" ? "pcm_24000" : "mp3_44100_128";

  const res = await fetch(
    `${BASE}/text-to-speech/${voiceId}?output_format=${outputFormat}`,
    {
      method: "POST",
      headers: {
        "xi-api-key":   process.env.ELEVENLABS_API_KEY!,
        "Content-Type": "application/json",
        Accept:         format === "wav" ? "audio/wav" : "audio/mpeg",
      },
      body: JSON.stringify({
        text:     opts.text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability:         opts.stability        ?? 0.55,
          similarity_boost:  opts.similarityBoost  ?? 0.75,
          style:             opts.style            ?? 0.30,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`ElevenLabs error ${res.status}: ${body || res.statusText}`);
  }

  const buffer   = await res.arrayBuffer();
  const mimeType = format === "wav" ? "audio/wav" : "audio/mpeg";
  return { buffer, mimeType };
}
