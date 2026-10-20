import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const SYSTEM_PROMPT = `You are a clinical data extraction assistant for an Indian pain medicine hospital clinic / OPD registry. Extract structured fields from the clinical capture provided (a photo of a hospital OPD registration card, prescription slip, handwritten note, or dictated transcript).

Indian hospital OPD cards (such as from PGI Chandigarh, AIIMS, GMCH, civil hospitals, or private pain clinics) typically contain:
1. Patient Demographics & Hospital IDs:
   - CR No. / Reg No. / OPD No. / UHID / File No. (e.g., "CR No: 20240123456", "CR-9872", "OPD: 10452")
   - Patient Name (e.g. "Sunita Devi", "Rajesh Kumar")
   - Age (number, e.g. 45)
   - Sex ("M", "F", or "Other")
   - Phone / Mobile number (e.g. 10-digit Indian phone number)
2. Clinical Details:
   - Chief Complaint (e.g. "Low back pain with right leg radiation x 6 months")
   - Diagnosis (e.g. "L4-L5 Lumbar Disc Herniation with Radiculopathy", "Facet Arthropathy")
   - Pain Location: choose strictly from: cervical, lumbar, thoracic, shoulder, hip, knee, neuropathic, widespread, other
   - Pain Score NRS (0 to 10 number, if mentioned)
   - Procedure (e.g. "L4-L5 Transforaminal Epidural Steroid Injection", "Knee Genicular RFA")
   - Plan / Medications / Advice (e.g. "Pregabalin 75mg HS, Physiotherapy, Follow-up in 2 weeks")
   - Additional Notes

Never invent information. If a field is not stated or is illegible, set it to null and mark its confidence as "low".
Respond with ONLY a raw JSON object (no markdown fences, no commentary) in exactly this shape:
{
  "demographics": {
    "cr_no": string | null,
    "name": string | null,
    "age": number | null,
    "sex": "M" | "F" | "Other" | null,
    "phone": string | null
  },
  "encounter_type": "new" | "followup" | "procedure" | "other",
  "chief_complaint": string | null,
  "diagnosis": string | null,
  "pain_location": "cervical" | "lumbar" | "thoracic" | "shoulder" | "hip" | "knee" | "neuropathic" | "widespread" | "other" | null,
  "pain_score_nrs": number | null,
  "procedure": string | null,
  "plan": string | null,
  "notes": string | null,
  "confidence": {
    "demographics": "high" | "medium" | "low",
    "chief_complaint": "high" | "medium" | "low",
    "diagnosis": "high" | "medium" | "low",
    "pain_location": "high" | "medium" | "low",
    "pain_score_nrs": "high" | "medium" | "low",
    "procedure": "high" | "medium" | "low",
    "plan": "high" | "medium" | "low"
  }
}`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!anthropicKey && !geminiKey) {
    return NextResponse.json(
      { error: 'AI extraction is not configured yet. Please set ANTHROPIC_API_KEY or GEMINI_API_KEY in environment variables.' },
      { status: 503 },
    );
  }

  const body = await request.json();
  const { mode, transcript, imageBase64, mediaType } = body as {
    mode: 'photo' | 'voice';
    transcript?: string;
    imageBase64?: string;
    mediaType?: string;
  };

  try {
    let parsed: Record<string, unknown> | null = null;

    // 1. Try Google Gemini if available
    if (geminiKey) {
      try {
        const parts: Record<string, unknown>[] = [];
        if (mode === 'photo' && imageBase64) {
          parts.push({
            inlineData: {
              mimeType: mediaType || 'image/jpeg',
              data: imageBase64,
            },
          });
          parts.push({
            text: 'Extract all patient demographics (CR No, Name, Age, Sex, Phone) and clinical encounter details from this hospital OPD card or medical record as instructed.',
          });
        } else {
          parts.push({
            text: `Dictated encounter transcript:\n"""\n${transcript || ''}\n"""\n\nExtract all patient demographics and clinical fields as instructed.`,
          });
        }

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
              contents: [{ role: 'user', parts }],
              generationConfig: { responseMimeType: 'application/json' },
            }),
          },
        );

        if (geminiRes.ok) {
          const gData = await geminiRes.json();
          const candidateText = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            let clean = candidateText.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
            parsed = JSON.parse(clean);
          }
        }
      } catch (geminiErr) {
        // Fall back to Anthropic if Gemini call fails
        console.warn('Gemini extraction failed, attempting Anthropic fallback:', geminiErr);
      }
    }

    // 2. Try Anthropic Claude if Gemini didn't run or failed
    if (!parsed && anthropicKey) {
      const content = mode === 'photo' && imageBase64
        ? [
            { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 } },
            { type: 'text', text: 'Extract all patient demographics (CR No, Name, Age, Sex, Phone) and clinical fields from this hospital OPD card or clinical photo as instructed.' },
          ]
        : [
            { type: 'text', text: `Dictated encounter transcript:\n"""\n${transcript || ''}\n"""\n\nExtract the structured fields as instructed.` },
          ];

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1200,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content }],
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message || 'Anthropic extraction failed');

      const textBlock = (data.content || []).find((b: { type: string }) => b.type === 'text');
      let raw = textBlock ? textBlock.text : '';
      raw = raw.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
      parsed = JSON.parse(raw);
    }

    if (!parsed) {
      throw new Error('AI extraction failed to produce structured data.');
    }

    return NextResponse.json(parsed);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Something went wrong during extraction.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
