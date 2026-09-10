import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const SYSTEM_PROMPT = `You are a clinical data extraction assistant for a pain medicine physician's personal patient records tool. Extract structured fields from the clinical capture provided (a photo of a prescription/handwritten note, or a dictated transcript). Never invent information. If a field is not stated or is illegible, set it to null and mark its confidence as "low". For pain_location, choose the single closest match from this fixed list only: cervical, lumbar, thoracic, shoulder, hip, knee, neuropathic, widespread, other. Respond with ONLY a raw JSON object (no markdown fences, no commentary) in exactly this shape:
{"encounter_type": "new" | "followup" | "procedure" | "other", "chief_complaint": string|null, "diagnosis": string|null, "pain_location": "cervical"|"lumbar"|"thoracic"|"shoulder"|"hip"|"knee"|"neuropathic"|"widespread"|"other"|null, "pain_score_nrs": number|null, "procedure": string|null, "plan": string|null, "notes": string|null, "confidence": {"chief_complaint":"high"|"medium"|"low", "diagnosis":"high"|"medium"|"low", "pain_location":"high"|"medium"|"low", "pain_score_nrs":"high"|"medium"|"low", "procedure":"high"|"medium"|"low", "plan":"high"|"medium"|"low"}}`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AI extraction is not configured yet (missing ANTHROPIC_API_KEY).' }, { status: 503 });
  }

  const body = await request.json();
  const { mode, transcript, imageBase64, mediaType } = body as {
    mode: 'photo' | 'voice';
    transcript?: string;
    imageBase64?: string;
    mediaType?: string;
  };

  const content = mode === 'photo' && imageBase64
    ? [
        { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 } },
        { type: 'text', text: 'Extract the structured fields from this clinical photo as instructed.' },
      ]
    : [
        { type: 'text', text: `Dictated encounter transcript:\n"""\n${transcript || ''}\n"""\n\nExtract the structured fields as instructed.` },
      ];

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content }],
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || 'AI extraction failed');

    const textBlock = (data.content || []).find((b: { type: string }) => b.type === 'text');
    let raw = textBlock ? textBlock.text : '';
    raw = raw.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(raw);

    return NextResponse.json(parsed);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Something went wrong during extraction.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
