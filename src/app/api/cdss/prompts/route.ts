import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const HISTORY_SYSTEM_PROMPT = `You are assisting a pain medicine physician during history-taking. Given the patient context and what's already recorded, suggest the most clinically important NEXT questions to ask — always screen for red flags first (progressive neurological deficit, cauda equina symptoms, unexplained weight loss, fever, anticoagulant/antiplatelet use, IV drug use, saddle anaesthesia, bladder/bowel dysfunction), then cover whatever's still missing from: onset/duration, character, aggravating/relieving factors, prior treatments tried and response, functional impact, sleep, mood, medication list, and cancer history if relevant.

Do not ask about anything already recorded in the "already known" section. Do not suggest a diagnosis. Do not suggest a treatment. This is a history-taking checklist only.

Respond with ONLY a raw JSON array (no markdown fences, no commentary), max 5 items, each: {"question": string, "reason": string}. Order by clinical priority — red flags first.`;

const EXAM_SYSTEM_PROMPT = `You are assisting a pain medicine physician in choosing physical examination maneuvers. Given the pain location, working diagnosis (if any), and dominant pain mechanism, suggest the most relevant exam maneuvers for this presentation — e.g. straight-leg raise, dermatomal sensory testing, reflexes, and motor power for suspected lumbar radiculopathy; Spurling's test and cervical range of motion for suspected cervical radiculopathy; trigger-point palpation for suspected myofascial pain; cranial nerve exam and trigger-zone mapping for suspected trigeminal neuralgia.

Do not suggest a diagnosis. Do not suggest a treatment. This is an examination checklist only.

Respond with ONLY a raw JSON array (no markdown fences, no commentary), max 5 items, each: {"maneuver": string, "reason": string}. Order by clinical priority.`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AI prompts are not configured yet (missing ANTHROPIC_API_KEY).' }, { status: 503 });
  }

  const body = await request.json();
  const {
    stage, chiefComplaint, diagnosis, painLocation, painMechanism,
    encounterType, age, sex, transcript, filledFields,
  } = body as {
    stage: 'history' | 'exam';
    chiefComplaint?: string; diagnosis?: string; painLocation?: string; painMechanism?: string;
    encounterType?: string; age?: number; sex?: string; transcript?: string; filledFields?: string[];
  };

  const systemPrompt = stage === 'exam' ? EXAM_SYSTEM_PROMPT : HISTORY_SYSTEM_PROMPT;

  const contextLines = [
    age || sex ? `Patient: ${[age && `${age}y`, sex].filter(Boolean).join(', ')}` : null,
    encounterType ? `Encounter type: ${encounterType}` : null,
    chiefComplaint ? `Chief complaint: ${chiefComplaint}` : null,
    diagnosis ? `Working diagnosis: ${diagnosis}` : null,
    painLocation ? `Pain location: ${painLocation}` : null,
    painMechanism ? `Pain mechanism: ${painMechanism}` : null,
    transcript ? `Dictated note so far: """${transcript}"""` : null,
    filledFields?.length ? `Already recorded fields: ${filledFields.join(', ')}` : null,
  ].filter(Boolean).join('\n');

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
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: contextLines || 'No context provided yet.' }],
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || 'AI prompt generation failed');

    const textBlock = (data.content || []).find((b: { type: string }) => b.type === 'text');
    let raw = textBlock ? textBlock.text : '';
    raw = raw.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
    const suggestions = JSON.parse(raw);

    return NextResponse.json({ suggestions });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Something went wrong generating suggestions.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
