/// <reference types="@cloudflare/workers-types" />

interface Env {
  OPENAI_API_KEY?: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
};

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  if (request.method !== 'POST') {
    return json({ error: 'Use POST to generate a friendly audio review.' }, 405);
  }

  if (!env.OPENAI_API_KEY) {
    return json({ error: 'OPENAI_API_KEY is not configured for friendly audio generation.' }, 500);
  }

  let body: { templateType?: string; script?: string; voice?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid audio generation request.' }, 400);
  }

  const templateType = body.templateType;
  const script = (body.script || '').trim();
  const voice = body.voice === 'marin' ? 'marin' : 'cedar';

  if (templateType !== 'auto' && templateType !== 'home') {
    return json({ error: 'Friendly audio is only available for Auto and Home web page quotes.' }, 400);
  }
  if (script.length < 80) {
    return json({ error: 'The audio script is too short to generate.' }, 400);
  }
  if (script.length > 3800) {
    return json({ error: 'The audio script is too long. Shorten the quote review and try again.' }, 400);
  }

  const audioResponse = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      voice,
      input: script,
      instructions: 'Speak like a warm, friendly local male insurance agent. Use a clear North Carolina conversational tone, natural pacing, and gentle energy. Make the coverage explanation easy to understand and reassuring without sounding like an announcer.',
      response_format: 'mp3',
      speed: 0.96,
    }),
  });

  if (!audioResponse.ok) {
    const detail = await audioResponse.text().catch(() => '');
    return json({
      error: 'OpenAI could not generate the friendly audio review.',
      detail: detail.slice(0, 500),
    }, 502);
  }

  const audioBuffer = await audioResponse.arrayBuffer();
  const audioBase64 = arrayBufferToBase64(audioBuffer);

  return json({
    mimeType: 'audio/mpeg',
    audioDataUrl: `data:audio/mpeg;base64,${audioBase64}`,
    sizeBytes: audioBuffer.byteLength,
  });
};
